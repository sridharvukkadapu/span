package com.sv.span.service

import com.sv.span.client.MassiveApiClient
import com.sv.span.client.dto.AggBarDto
import com.sv.span.client.dto.FinancialsDto
import com.sv.span.model.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.round

@Service
class BacktestService(private val api: MassiveApiClient) {

    private val log = LoggerFactory.getLogger(javaClass)
    private val dateFmt = DateTimeFormatter.ISO_LOCAL_DATE

    fun backtest(ticker: String, yearsBack: Int = 2): BacktestResult {
        val symbol = ticker.uppercase()
        val endDate = LocalDate.now()
        val startDate = endDate.minusYears(yearsBack.toLong())

        log.info("Backtesting {} from {} to {}", symbol, startDate, endDate)

        // 1. Fetch all daily bars for the period (free plan: max ~2 years)
        val bars = api.getAggregateRange(symbol, startDate.toString(), endDate.toString())
        if (bars.isEmpty()) throw RuntimeException("No price data available for $symbol")

        // 2. Fetch up to 20 quarters of financials
        //    Q4 (10-K) filings often have null filing_date — estimate as end_date + 60 days
        val allFinancials = api.getFinancials(symbol, "quarterly", 20)
            .map { fin ->
                val effectiveFiling = fin.filingDate
                    ?: fin.endDate?.let {
                        LocalDate.parse(it).plusDays(60).toString()
                    }
                fin to effectiveFiling
            }
            .filter { it.second != null }
            .sortedBy { it.second }

        // 3. Get company name
        val details = api.getTickerDetails(symbol)

        // Build a date-indexed price map (date string -> close price)
        val barsByDate = bars.associateBy { timestampToDate(it.timestamp!!) }
        val sortedDates = barsByDate.keys.sorted()

        // 4. At each filing date, run the screening algorithm with data available then
        val filingDates = allFinancials
            .mapNotNull { it.second }
            .distinct()
            .filter { it >= startDate.toString() }
            .sorted()

        // We need at least 4 quarters to start screening
        data class SignalEvent(val date: String, val signal: Signal, val checksSummary: String)

        val signalEvents = mutableListOf<SignalEvent>()

        for (filingDate in filingDates) {
            // Get all financials filed on or before this date
            val availableFinancials = allFinancials
                .filter { it.second != null && it.second!! <= filingDate }
                .map { it.first }
                .sortedByDescending { it.endDate }

            if (availableFinancials.size < 4) continue // need at least 4 quarters

            val recentQuarters = availableFinancials.take(4)
            val priorQuarters = availableFinancials.drop(4).take(4)

            // Find the closest trading day on or after the filing date
            val tradeDate = sortedDates.firstOrNull { it >= filingDate } ?: continue
            val closingPrice = barsByDate[tradeDate]?.close ?: continue

            // Compute shares outstanding from financials or details
            val shares = details?.sharesOutstanding ?: continue

            // Compute metrics using same logic as ScreenerService
            val ttmRevenue = sumField(recentQuarters, "revenues")
            val ttmNetIncome = sumField(recentQuarters, "net_income_loss")
            val ttmEps = if (ttmNetIncome != null && shares > 0) round2(ttmNetIncome / shares) else null
            val peRatio = if (ttmEps != null && ttmEps > 0) round2(closingPrice / ttmEps) else null
            val marketCap = closingPrice * shares
            val priceToSales = if (ttmRevenue != null && ttmRevenue > 0) round2(marketCap / ttmRevenue) else null

            // Margins
            val totalRevenue = recentQuarters.mapNotNull { incomeField(it, "revenues") }.sum().takeIf { it != 0.0 }
            val grossProfit = recentQuarters.mapNotNull { incomeField(it, "gross_profit") }.sum()
            val opIncome = recentQuarters.mapNotNull { incomeField(it, "operating_income_loss") }.sum()
            val netIncome = recentQuarters.mapNotNull { incomeField(it, "net_income_loss") }.sum()
            val opCF = recentQuarters.mapNotNull { cashFlowField(it, "net_cash_flow_from_operating_activities") }.sum()
            val capex = recentQuarters.mapNotNull { cashFlowField(it, "net_cash_flow_from_investing_activities") }.sum()
            val fcf = opCF + capex

            val grossMargin = safePercent(grossProfit, totalRevenue)
            val profitMargin = safePercent(netIncome, totalRevenue)
            val fcfMargin = if (totalRevenue != null) round2(fcf / totalRevenue * 100) else null

            // Revenue growth
            val priorRevenue = sumField(priorQuarters, "revenues")
            val growthYoY = if (ttmRevenue != null && priorRevenue != null && priorRevenue != 0.0) {
                round2((ttmRevenue - priorRevenue) / priorRevenue * 100)
            } else null

            // Balance sheet
            val latest = recentQuarters.firstOrNull()
            val cash = latest?.let { balanceField(it, "other_current_assets") } ?: 0.0
            val longTermDebt = latest?.let { balanceField(it, "long_term_debt") } ?: 0.0
            val currentLiabilities = latest?.let { balanceField(it, "current_liabilities") } ?: 0.0
            val totalDebt = longTermDebt + currentLiabilities
            val cashToDebt = if (totalDebt > 0) round2(cash / totalDebt) else null

            // Technicals: compute SMA50 and RSI14 from bars
            val barsUpToDate = bars.filter { timestampToDate(it.timestamp!!) <= tradeDate }
            val sma50 = computeSma(barsUpToDate, 50)
            val rsi14 = computeRsi(barsUpToDate, 14)

            // Run the 5 checks
            val checks = mutableListOf<Pair<String, CheckLight>>()

            // Check 1: Margins
            if (grossMargin != null) {
                val light = when {
                    grossMargin >= 50 -> CheckLight.GREEN
                    grossMargin > 30 && (profitMargin != null && profitMargin > 10) -> CheckLight.YELLOW
                    else -> CheckLight.RED
                }
                checks.add("Margins" to light)
            }

            // Check 2: Price/Sales
            if (priceToSales != null) {
                val revGrowth = growthYoY ?: 0.0
                val fcfM = fcfMargin ?: 0.0
                val combo = revGrowth + fcfM
                val light = when {
                    priceToSales <= 10 -> CheckLight.GREEN
                    priceToSales <= 20 && combo > 30 -> CheckLight.GREEN
                    priceToSales <= 20 -> CheckLight.YELLOW
                    else -> CheckLight.RED
                }
                checks.add("P/S" to light)
            }

            // Check 3: Revenue Growth
            if (growthYoY != null) {
                val light = when {
                    growthYoY >= 20 -> CheckLight.GREEN
                    growthYoY >= 10 -> CheckLight.YELLOW
                    else -> CheckLight.RED
                }
                checks.add("Growth" to light)
            }

            // Check 4: Cash/Debt
            if (cashToDebt != null) {
                val light = when {
                    cashToDebt >= 1.0 -> CheckLight.GREEN
                    cashToDebt > 0.5 -> CheckLight.YELLOW
                    else -> CheckLight.RED
                }
                checks.add("Cash/Debt" to light)
            }

            // Check 5: Technicals
            if (sma50 != null && rsi14 != null) {
                val aboveSma = closingPrice > sma50
                val light = when {
                    aboveSma && rsi14 in 30.0..70.0 -> CheckLight.GREEN
                    aboveSma && rsi14 > 70 -> CheckLight.YELLOW
                    !aboveSma && rsi14 < 30 -> CheckLight.RED
                    !aboveSma -> CheckLight.YELLOW
                    else -> CheckLight.YELLOW
                }
                checks.add("Technicals" to light)
            }

            if (checks.isEmpty()) continue

            val greens = checks.count { it.second == CheckLight.GREEN }
            val reds = checks.count { it.second == CheckLight.RED }
            val total = checks.size

            val signal = when {
                reds >= (total / 2.0) -> Signal.SELL
                greens >= (total / 2.0) -> Signal.BUY
                else -> Signal.HOLD
            }

            val summary = checks.joinToString(", ") { "${it.first}:${it.second}" }
            signalEvents.add(SignalEvent(tradeDate, signal, summary))
        }

        // Deduplicate: if multiple signals on the same date, keep only the last one
        val deduped = signalEvents.groupBy { it.date }.map { (_, events) -> events.last() }.sortedBy { it.date }

        // 5. Simulate trading
        val initialInvestment = 10000.0
        var cash = initialInvestment
        var sharesHeld = 0.0
        var entryPrice = 0.0
        val trades = mutableListOf<BacktestTrade>()
        val signalHistory = mutableListOf<SignalSnapshot>()
        var winCount = 0
        var lossCount = 0
        var prevPrice: Double? = null

        for (event in deduped) {
            val price = barsByDate[event.date]?.close ?: continue
            val inPosition = sharesHeld > 0.0

            val pChange = prevPrice?.let { round2(price - it) }
            val pChangePct = prevPrice?.let { round2((price - it) / it * 100) }

            when {
                event.signal == Signal.BUY && !inPosition -> {
                    sharesHeld = cash / price
                    entryPrice = price
                    cash = 0.0
                    trades.add(BacktestTrade("BUY", event.date, price, event.signal, event.checksSummary, sharesHeld, null))
                    signalHistory.add(SignalSnapshot(event.date, price, event.signal, event.checksSummary, "BUY", pChange, pChangePct))
                }
                event.signal == Signal.SELL && inPosition -> {
                    cash = sharesHeld * price
                    val tradeReturn = round2((price - entryPrice) / entryPrice * 100)
                    if (tradeReturn >= 0) winCount++ else lossCount++
                    trades.add(BacktestTrade("SELL", event.date, price, event.signal, event.checksSummary, null, tradeReturn))
                    signalHistory.add(SignalSnapshot(event.date, price, event.signal, event.checksSummary, "SELL", pChange, pChangePct))
                    sharesHeld = 0.0
                    entryPrice = 0.0
                }
                else -> {
                    val action = when {
                        event.signal == Signal.BUY && inPosition -> "HOLD (already in)"
                        event.signal == Signal.SELL && !inPosition -> "HOLD (no position)"
                        inPosition -> "HOLD (in position)"
                        else -> "HOLD (no position)"
                    }
                    signalHistory.add(SignalSnapshot(event.date, price, event.signal, event.checksSummary, action, pChange, pChangePct))
                }
            }

            prevPrice = price
        }

        // If still holding at end, mark-to-market
        val lastPrice = bars.lastOrNull()?.close ?: 0.0
        val lastDate = bars.lastOrNull()?.let { timestampToDate(it.timestamp!!) } ?: endDate.toString()

        val strategyFinal = if (sharesHeld > 0.0) {
            sharesHeld * lastPrice
        } else {
            cash
        }

        // Buy-and-hold: invest all on first bar
        val firstPrice = bars.firstOrNull()?.close ?: 1.0
        val bAndHShares = initialInvestment / firstPrice
        val buyAndHoldFinal = round2(bAndHShares * lastPrice)

        val strategyReturn = round2((strategyFinal - initialInvestment) / initialInvestment * 100)
        val buyAndHoldReturn = round2((buyAndHoldFinal - initialInvestment) / initialInvestment * 100)

        // Build equity curve (sample at each signal event + monthly)
        val equityCurve = mutableListOf<EquityPoint>()
        // Sample monthly for chart
        var simCash = initialInvestment
        var simShares = 0.0
        var tradeIdx = 0

        val monthlyDates = sortedDates.filterIndexed { i, _ -> i % 21 == 0 } // ~monthly
        for (d in monthlyDates) {
            val p = barsByDate[d]?.close ?: continue
            // Apply any trades that happened on or before this date
            while (tradeIdx < trades.size && trades[tradeIdx].date <= d) {
                val t = trades[tradeIdx]
                if (t.type == "BUY") {
                    simShares = simCash / t.price
                    simCash = 0.0
                } else {
                    simCash = simShares * t.price
                    simShares = 0.0
                }
                tradeIdx++
            }
            val stratVal = if (simShares > 0) round2(simShares * p) else round2(simCash)
            val bAndHVal = round2(bAndHShares * p)
            equityCurve.add(EquityPoint(d, stratVal, bAndHVal))
        }

        val totalTrades = trades.size
        val winRate = if (winCount + lossCount > 0) round2(winCount.toDouble() / (winCount + lossCount) * 100) else null

        val summary = buildString {
            append("$symbol backtest: ${startDate} to ${lastDate}. ")
            append("Strategy returned ${strategyReturn}% vs buy-and-hold ${buyAndHoldReturn}%. ")
            if (totalTrades == 0) {
                append("No trades executed — all signals were HOLD so capital stayed in cash.")
            } else {
                append("$totalTrades trades, ")
                if (winRate != null) append("${winRate}% win rate. ")
                if (strategyReturn > buyAndHoldReturn) append("Strategy OUTPERFORMED by ${round2(strategyReturn - buyAndHoldReturn)}%.")
                else append("Strategy UNDERPERFORMED by ${round2(buyAndHoldReturn - strategyReturn)}%.")
            }
        }

        return BacktestResult(
            symbol = symbol,
            companyName = details?.name,
            periodStart = startDate.toString(),
            periodEnd = lastDate,
            initialInvestment = initialInvestment,
            strategyFinalValue = round2(strategyFinal),
            buyAndHoldFinalValue = buyAndHoldFinal,
            strategyReturn = strategyReturn,
            buyAndHoldReturn = buyAndHoldReturn,
            outperformance = round2(strategyReturn - buyAndHoldReturn),
            totalTrades = totalTrades,
            winningTrades = winCount,
            losingTrades = lossCount,
            winRate = winRate,
            signalHistory = signalHistory,
            trades = trades,
            equityCurve = equityCurve,
            summary = summary,
        )
    }

    // ---- Compute SMA from bars ----
    private fun computeSma(bars: List<AggBarDto>, window: Int): Double? {
        if (bars.size < window) return null
        val closes = bars.takeLast(window).mapNotNull { it.close }
        if (closes.size < window) return null
        return round2(closes.average())
    }

    // ---- Compute RSI from bars ----
    private fun computeRsi(bars: List<AggBarDto>, period: Int): Double? {
        if (bars.size < period + 1) return null
        val closes = bars.mapNotNull { it.close }
        if (closes.size < period + 1) return null

        val changes = (1 until closes.size).map { closes[it] - closes[it - 1] }
        val recentChanges = changes.takeLast(period)

        var avgGain = recentChanges.filter { it > 0 }.average().takeIf { !it.isNaN() } ?: 0.0
        var avgLoss = recentChanges.filter { it < 0 }.map { abs(it) }.average().takeIf { !it.isNaN() } ?: 0.0

        if (avgLoss == 0.0) return 100.0
        val rs = avgGain / avgLoss
        return round2(100 - (100 / (1 + rs)))
    }

    // ---- Field extractors (same as ScreenerService) ----

    private fun incomeField(fin: FinancialsDto, field: String): Double? =
        fin.financials?.incomeStatement?.get(field)?.value

    private fun balanceField(fin: FinancialsDto, field: String): Double? =
        fin.financials?.balanceSheet?.get(field)?.value

    private fun cashFlowField(fin: FinancialsDto, field: String): Double? =
        fin.financials?.cashFlowStatement?.get(field)?.value

    private fun sumField(quarters: List<FinancialsDto>, field: String): Double? {
        val values = quarters.mapNotNull { incomeField(it, field) }
        return if (values.isNotEmpty()) values.sum() else null
    }

    private fun safePercent(num: Double?, denom: Double?): Double? =
        if (num != null && denom != null && denom != 0.0) round2(num / denom * 100) else null

    private fun round2(v: Double): Double = round(v * 100) / 100

    private fun timestampToDate(ts: Long): String {
        return java.time.Instant.ofEpochMilli(ts)
            .atZone(java.time.ZoneId.of("America/New_York"))
            .toLocalDate()
            .toString()
    }
}
