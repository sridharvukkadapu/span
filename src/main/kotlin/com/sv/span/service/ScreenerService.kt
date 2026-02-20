package com.sv.span.service

import com.sv.span.cache.TickerCacheService
import com.sv.span.client.MassiveApiClient
import com.sv.span.client.dto.FinancialsDto
import com.sv.span.model.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import kotlin.math.abs
import kotlin.math.round

@Service
class ScreenerService(
    private val api: MassiveApiClient,
    private val cacheService: TickerCacheService,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun analyze(ticker: String): ScreenerResult =
        cacheService.getOrCompute("screener", ticker.uppercase()) {
            computeAnalysis(ticker)
        }

    private fun computeAnalysis(ticker: String): ScreenerResult {
        val symbol = ticker.uppercase()

        // Fetch data from 5 API calls (was 6 — merged annual into quarterly)
        val details = api.getTickerDetails(symbol)
        val prevBar = api.getPreviousDayBar(symbol)
        val allQuarters = api.getFinancials(symbol, "quarterly", 8) // 8 quarters for YoY
        val sma50 = api.getSma(symbol, 50)
        val rsi14 = api.getRsi(symbol, 14)

        val recentQuarters = allQuarters.take(4)  // latest 4 for TTM / margins
        val priorQuarters = allQuarters.drop(4)    // prior 4 for YoY comparison

        val price = prevBar?.close
        val marketCap = details?.marketCap
        val sharesOut = details?.sharesOutstanding

        // Build overview
        val ttmRevenue = sumQuarterlyField(recentQuarters, "revenues")
        val ttmNetIncome = sumQuarterlyField(recentQuarters, "net_income_loss")
        val ttmEps = if (ttmNetIncome != null && sharesOut != null && sharesOut > 0) {
            round2(ttmNetIncome / sharesOut)
        } else null
        val peRatio = if (price != null && ttmEps != null && ttmEps > 0) round2(price / ttmEps) else null
        val priceToSales = if (marketCap != null && ttmRevenue != null && ttmRevenue > 0) {
            round2(marketCap / ttmRevenue)
        } else null

        val overview = Overview(
            price = price,
            marketCap = marketCap,
            sharesOutstanding = sharesOut,
            epsTtm = ttmEps,
            peRatio = peRatio,
            priceToSales = priceToSales,
        )

        // Build margins from latest 4 quarters
        val margins = computeMargins(recentQuarters)

        // Revenue analysis: YoY growth from 8 quarters (recent 4 vs prior 4)
        val revenueAnalysis = buildRevenueAnalysis(recentQuarters, priorQuarters, ttmRevenue, ttmNetIncome)

        // Balance sheet from most recent quarter
        val balanceSummary = buildBalanceSummary(recentQuarters.firstOrNull())

        // Technicals
        val technicals = Technicals(
            sma50 = sma50?.let { round2(it) },
            rsi14 = rsi14?.let { round2(it) },
            priceVsSma50 = if (price != null && sma50 != null) {
                if (price > sma50) "ABOVE (bullish)" else "BELOW (bearish)"
            } else null,
        )

        // Run screening checks
        val checks = runChecks(margins, overview, revenueAnalysis, balanceSummary, technicals)

        val greens = checks.count { it.light == CheckLight.GREEN }
        val reds = checks.count { it.light == CheckLight.RED }
        val total = checks.size

        val signal = when {
            reds >= (total / 2.0) -> Signal.SELL
            greens >= (total / 2.0) -> Signal.BUY
            else -> Signal.HOLD
        }

        val confidence = when {
            greens == total -> "HIGH"
            reds == total -> "HIGH"
            greens >= total - 1 || reds >= total - 1 -> "MEDIUM"
            else -> "LOW"
        }

        // Build 3-year price projection
        val projection = buildProjection(overview, margins, revenueAnalysis)

        val summary = buildString {
            append("${details?.name ?: symbol}: $signal ($confidence confidence). ")
            append("$greens/$total checks GREEN. ")
            checks.forEach { append("${it.name}: ${it.light}. ") }
        }

        return ScreenerResult(
            symbol = symbol,
            companyName = details?.name,
            signal = signal,
            confidence = confidence,
            overview = overview,
            margins = margins,
            revenueAnalysis = revenueAnalysis,
            balanceSheet = balanceSummary,
            technicals = technicals,
            checks = checks,
            projection = projection,
            summary = summary.trim(),
        )
    }

    // ---- Extract a numeric field from the income statement section ----

    private fun incomeField(fin: FinancialsDto, field: String): Double? =
        fin.financials?.incomeStatement?.get(field)?.value

    private fun balanceField(fin: FinancialsDto, field: String): Double? =
        fin.financials?.balanceSheet?.get(field)?.value

    private fun cashFlowField(fin: FinancialsDto, field: String): Double? =
        fin.financials?.cashFlowStatement?.get(field)?.value

    private fun sumQuarterlyField(quarters: List<FinancialsDto>, field: String): Double? {
        val values = quarters.mapNotNull { incomeField(it, field) }
        return if (values.isNotEmpty()) values.sum() else null
    }

    // ---- Compute margins from latest 4 quarters ----

    private fun computeMargins(quarters: List<FinancialsDto>): Margins {
        val totalRevenue = quarters.mapNotNull { incomeField(it, "revenues") }.sum().takeIf { it != 0.0 }
        val totalGrossProfit = quarters.mapNotNull { incomeField(it, "gross_profit") }.sum()
        val totalOpIncome = quarters.mapNotNull { incomeField(it, "operating_income_loss") }.sum()
        val totalNetIncome = quarters.mapNotNull { incomeField(it, "net_income_loss") }.sum()
        val totalOpCF = quarters.mapNotNull { cashFlowField(it, "net_cash_flow_from_operating_activities") }.sum()
        val totalCapex = quarters.mapNotNull { cashFlowField(it, "net_cash_flow_from_investing_activities") }.sum()
        val fcf = totalOpCF + totalCapex // investing is typically negative

        return Margins(
            grossMargin = safePercent(totalGrossProfit, totalRevenue),
            operatingMargin = safePercent(totalOpIncome, totalRevenue),
            profitMargin = safePercent(totalNetIncome, totalRevenue),
            fcfMargin = if (totalRevenue != null) round2(fcf / totalRevenue * 100) else null,
        )
    }

    // ---- Revenue analysis from quarterly data (YoY: recent 4Q vs prior 4Q) ----

    private fun buildRevenueAnalysis(
        recentQuarters: List<FinancialsDto>,
        priorQuarters: List<FinancialsDto>,
        ttmRevenue: Double?,
        ttmNetIncome: Double?,
    ): RevenueAnalysis {
        // Build per-fiscal-year revenue from all 8 quarters
        val allQuarters = recentQuarters + priorQuarters
        val byYear = allQuarters
            .filter { it.fiscalYear != null && incomeField(it, "revenues") != null }
            .groupBy { it.fiscalYear!! }
            .mapValues { (_, quarters) -> quarters.sumOf { incomeField(it, "revenues") ?: 0.0 } }
            .entries.sortedBy { it.key }
            .map { AnnualRevenue(it.key, it.value) }

        // YoY growth: compare TTM (recent 4Q) vs prior 4Q
        val priorRevenue = sumQuarterlyField(priorQuarters, "revenues")
        val growthYoY = if (ttmRevenue != null && priorRevenue != null && priorRevenue != 0.0) {
            round2((ttmRevenue - priorRevenue) / priorRevenue * 100)
        } else null

        return RevenueAnalysis(
            revenueTtm = ttmRevenue,
            netIncomeTtm = ttmNetIncome,
            revenueYears = byYear,
            revenueGrowthYoY = growthYoY,
        )
    }

    // ---- Balance sheet summary ----

    private fun buildBalanceSummary(latest: FinancialsDto?): BalanceSheetSummary {
        if (latest == null) return BalanceSheetSummary(null, null, null, null)

        val currentAssets = balanceField(latest, "other_current_assets") ?: 0.0
        val cash = currentAssets // includes cash & short-term investments in this schema
        val longTermDebt = balanceField(latest, "long_term_debt")
        val currentLiabilities = balanceField(latest, "current_liabilities") ?: 0.0
        // Total debt approximation: long-term debt + current liabilities (includes short-term debt)
        val totalDebt = (longTermDebt ?: 0.0) + currentLiabilities
        val cashToDebt = if (totalDebt > 0) round2(cash / totalDebt) else null

        return BalanceSheetSummary(
            cashAndShortTermInvestments = cash.takeIf { it != 0.0 },
            longTermDebt = longTermDebt,
            totalDebt = totalDebt.takeIf { it != 0.0 },
            cashToDebtRatio = cashToDebt,
        )
    }

    // ---- Screening Checks (from PPT slides 6-9) ----

    private fun runChecks(
        margins: Margins,
        overview: Overview,
        revenue: RevenueAnalysis,
        balance: BalanceSheetSummary,
        technicals: Technicals?,
    ): List<CheckResult> = listOfNotNull(
        checkMargins(margins),
        checkPriceToSales(overview, revenue, margins),
        checkRevenueGrowth(revenue),
        checkCashDebtRatio(balance),
        checkTechnicals(technicals, overview.price),
    )

    private fun checkMargins(m: Margins): CheckResult? {
        val gm = m.grossMargin ?: return null
        val pm = m.profitMargin
        val (light, detail) = when {
            gm >= 50 -> CheckLight.GREEN to "Gross margin ${gm}% >= 50%"
            gm > 30 && (pm != null && pm > 10) -> CheckLight.YELLOW to "Gross margin ${gm}% (30-50%), profit margin ${pm}%"
            else -> CheckLight.RED to "Gross margin ${gm}% <= 30%"
        }
        return CheckResult("Margins", light, detail)
    }

    private fun checkPriceToSales(overview: Overview, revenue: RevenueAnalysis, margins: Margins): CheckResult? {
        val ps = overview.priceToSales ?: return null
        val revGrowth = revenue.revenueGrowthYoY ?: 0.0
        val fcfMargin = margins.fcfMargin ?: 0.0
        val combo = revGrowth + fcfMargin
        val (light, detail) = when {
            ps <= 10 -> CheckLight.GREEN to "P/S ${ps} <= 10"
            ps <= 20 && combo > 30 -> CheckLight.GREEN to "P/S ${ps}, Rev Growth + FCF% = ${round2(combo)}% > 30%"
            ps <= 20 -> CheckLight.YELLOW to "P/S ${ps}, Rev Growth + FCF% = ${round2(combo)}% < 30%"
            else -> CheckLight.RED to "P/S ${ps} >= 20"
        }
        return CheckResult("Price/Sales", light, detail)
    }

    private fun checkRevenueGrowth(revenue: RevenueAnalysis): CheckResult? {
        val growth = revenue.revenueGrowthYoY ?: return null
        val (light, detail) = when {
            growth >= 20 -> CheckLight.GREEN to "Revenue growth ${growth}% >= 20%"
            growth >= 10 -> CheckLight.YELLOW to "Revenue growth ${growth}% (10-20%)"
            else -> CheckLight.RED to "Revenue growth ${growth}% < 10%"
        }
        return CheckResult("Revenue Growth", light, detail)
    }

    private fun checkCashDebtRatio(balance: BalanceSheetSummary): CheckResult? {
        val ratio = balance.cashToDebtRatio ?: return null
        val (light, detail) = when {
            ratio >= 1.0 -> CheckLight.GREEN to "Cash/Debt ratio ${ratio} >= 1.0"
            ratio > 0.5 -> CheckLight.YELLOW to "Cash/Debt ratio ${ratio} (0.5-1.0)"
            else -> CheckLight.RED to "Cash/Debt ratio ${ratio} <= 0.5"
        }
        return CheckResult("Cash/Debt Ratio", light, detail)
    }

    private fun checkTechnicals(technicals: Technicals?, price: Double?): CheckResult? {
        if (technicals == null || price == null || technicals.sma50 == null || technicals.rsi14 == null) return null
        val aboveSma = price > technicals.sma50
        val rsi = technicals.rsi14
        val (light, detail) = when {
            aboveSma && rsi in 30.0..70.0 -> CheckLight.GREEN to "Price above SMA50, RSI ${rsi} in neutral zone"
            aboveSma && rsi > 70 -> CheckLight.YELLOW to "Price above SMA50 but RSI ${rsi} overbought"
            !aboveSma && rsi < 30 -> CheckLight.RED to "Price below SMA50, RSI ${rsi} oversold"
            !aboveSma -> CheckLight.YELLOW to "Price below SMA50, RSI ${rsi}"
            else -> CheckLight.YELLOW to "RSI ${rsi}"
        }
        return CheckResult("Technicals", light, detail)
    }

    // ---- 3-Year Price Projection ----

    private fun buildProjection(
        overview: Overview,
        margins: Margins,
        revenue: RevenueAnalysis,
    ): Projection? {
        val ttmRevenue = revenue.revenueTtm ?: return null
        val profitMargin = margins.profitMargin ?: return null
        val pe = overview.peRatio ?: return null
        val shares = overview.sharesOutstanding ?: return null
        if (pe <= 0 || shares <= 0) return null

        // Use actual YoY growth if available; fallback to 5%
        val baseGrowth = revenue.revenueGrowthYoY ?: 5.0
        // Cap extreme growth rates to +/- 80% for sanity
        val cappedGrowth = baseGrowth.coerceIn(-80.0, 80.0)
        val decayRate = 0.20 // growth decays 20% each year (conservative)

        val currentYear = java.time.Year.now().value
        val years = mutableListOf<YearProjection>()
        var projRevenue = ttmRevenue
        var growthRate = cappedGrowth

        for (i in 1..3) {
            projRevenue *= (1 + growthRate / 100)
            val projNetIncome = projRevenue * (profitMargin / 100)
            val projEps = projNetIncome / shares
            val projPrice = projEps * pe

            years.add(YearProjection(
                year = currentYear + i,
                projectedRevenue = round2(projRevenue),
                projectedNetIncome = round2(projNetIncome),
                projectedEps = round2(projEps),
                projectedPrice = round2(projPrice),
            ))

            // Decay the growth rate for next year
            growthRate *= (1 - decayRate)
        }

        val assumptions = ProjectionAssumptions(
            baseRevenueGrowth = round2(cappedGrowth),
            growthDecayRate = decayRate,
            profitMarginUsed = round2(profitMargin),
            peMultipleUsed = round2(pe),
            sharesOutstanding = shares,
            note = if (revenue.revenueGrowthYoY != null)
                "Growth based on trailing YoY revenue growth with ${round2(decayRate * 100)}% annual decay. P/E and margin held constant."
            else
                "Insufficient historical data for YoY growth; using conservative 5% default with ${round2(decayRate * 100)}% annual decay.",
        )

        return Projection(years = years, assumptions = assumptions)
    }

    // ---- Util ----

    private fun safePercent(num: Double?, denom: Double?): Double? =
        if (num != null && denom != null && denom != 0.0) round2(num / denom * 100) else null

    private fun round2(v: Double): Double = round(v * 100) / 100
}
