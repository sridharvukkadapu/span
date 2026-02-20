package com.sv.span.service

import com.sv.span.cache.TickerCacheService
import com.sv.span.client.MassiveApiClient
import com.sv.span.client.dto.FinancialsDto
import com.sv.span.model.AnalyzerData
import com.sv.span.model.ScenarioDefaults
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import kotlin.math.round

/**
 * Computes historical financial metrics and pre-fills Bear/Base/Bull
 * scenario defaults for the Stock Analyzer.
 *
 * The actual DCF fair-value calculation is performed client-side in
 * JavaScript for instant interactivity.
 */
@Service
class AnalyzerService(
    private val api: MassiveApiClient,
    private val cacheService: TickerCacheService,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun analyze(ticker: String): AnalyzerData =
        cacheService.getOrCompute("analyzer", ticker.uppercase()) {
            computeAnalyzerData(ticker)
        }

    private fun computeAnalyzerData(ticker: String): AnalyzerData {
        val symbol = ticker.uppercase()
        log.info("Computing analyzer data for {}", symbol)

        // Fetch from Massive (same pattern as ScreenerService)
        val details = api.getTickerDetails(symbol)
        val prevBar = api.getPreviousDayBar(symbol)
        val allQuarters = api.getFinancials(symbol, "quarterly", 8)

        val recentQuarters = allQuarters.take(4)    // latest 4 for TTM
        val priorQuarters = allQuarters.drop(4)      // prior 4 for YoY

        val price = prevBar?.close
        val marketCap = details?.marketCap
        val sharesOut = details?.sharesOutstanding

        // ---- TTM aggregates ----
        val ttmRevenue = sumField(recentQuarters, "revenues")
        val ttmNetIncome = sumField(recentQuarters, "net_income_loss")
        val ttmOpIncome = sumField(recentQuarters, "operating_income_loss")
        val ttmOpCF = sumCashFlowField(recentQuarters, "net_cash_flow_from_operating_activities")
        val ttmCapex = sumCashFlowField(recentQuarters, "net_cash_flow_from_investing_activities")
        val ttmFcf = if (ttmOpCF != null) (ttmOpCF + (ttmCapex ?: 0.0)) else null

        // ---- Derived metrics ----
        val revenueGrowth = run {
            val priorRevenue = sumField(priorQuarters, "revenues")
            if (ttmRevenue != null && priorRevenue != null && priorRevenue > 0)
                round2((ttmRevenue - priorRevenue) / priorRevenue * 100)
            else null
        }

        val profitMargin = if (ttmNetIncome != null && ttmRevenue != null && ttmRevenue > 0)
            round2(ttmNetIncome / ttmRevenue * 100) else null

        val fcfMargin = if (ttmFcf != null && ttmRevenue != null && ttmRevenue > 0)
            round2(ttmFcf / ttmRevenue * 100) else null

        // ROIC = Net Income / Invested Capital, where Invested Capital = Total Assets - Current Liabilities
        val roic = run {
            val latest = recentQuarters.firstOrNull()
            val totalAssets = latest?.let { balanceField(it, "assets") }
            val currentLiabilities = latest?.let { balanceField(it, "current_liabilities") }
            if (ttmNetIncome != null && totalAssets != null && currentLiabilities != null) {
                val investedCapital = totalAssets - currentLiabilities
                if (investedCapital > 0) round2(ttmNetIncome / investedCapital * 100) else null
            } else null
        }

        val currentPE = if (price != null && ttmNetIncome != null && sharesOut != null && sharesOut > 0) {
            val eps = ttmNetIncome / sharesOut
            if (eps > 0) round2(price / eps) else null
        } else null

        val currentPFCF = if (marketCap != null && ttmFcf != null && ttmFcf > 0)
            round2(marketCap / ttmFcf) else null

        // ---- Pre-fill scenario defaults ----
        val scenarios = buildScenarios(
            revenueGrowth = revenueGrowth,
            profitMargin = profitMargin,
            fcfMargin = fcfMargin,
            currentPE = currentPE,
            currentPFCF = currentPFCF,
        )

        log.info("Analyzer for {}: growth={}%, margin={}%, fcfMargin={}%, ROIC={}%, P/E={}, P/FCF={}",
            symbol, revenueGrowth, profitMargin, fcfMargin, roic, currentPE, currentPFCF)

        return AnalyzerData(
            symbol = symbol,
            companyName = details?.name,
            currentPrice = price,
            marketCap = marketCap,
            sharesOutstanding = sharesOut,
            ttmRevenue = ttmRevenue,
            ttmNetIncome = ttmNetIncome,
            ttmFcf = ttmFcf,
            ttmOperatingIncome = ttmOpIncome,
            revenueGrowthPct = revenueGrowth,
            profitMarginPct = profitMargin,
            fcfMarginPct = fcfMargin,
            roicPct = roic,
            currentPE = currentPE,
            currentPFCF = currentPFCF,
            scenarios = scenarios,
        )
    }

    /**
     * Build Bear / Base / Bull scenario defaults from historical metrics.
     *
     * Base uses actual TTM values. Bear reduces growth/margins, Bull
     * increases them. Multiples compress in Bear and expand in Bull.
     */
    private fun buildScenarios(
        revenueGrowth: Double?,
        profitMargin: Double?,
        fcfMargin: Double?,
        currentPE: Double?,
        currentPFCF: Double?,
    ): List<ScenarioDefaults> {
        val g = revenueGrowth ?: 5.0
        val pm = profitMargin ?: 15.0
        val fm = fcfMargin ?: 12.0
        val pe = currentPE ?: 20.0
        val pfcf = currentPFCF ?: 18.0

        return listOf(
            ScenarioDefaults(
                label = "Bear",
                revenueGrowthPct = round2(g * 0.5).coerceAtLeast(0.0),
                profitMarginPct = round2(pm * 0.85),
                fcfMarginPct = round2(fm * 0.85),
                peMultiple = round2(pe * 0.7),
                pfcfMultiple = round2(pfcf * 0.7),
                years = 5,
                desiredReturnPct = 15.0,
            ),
            ScenarioDefaults(
                label = "Base",
                revenueGrowthPct = round2(g),
                profitMarginPct = round2(pm),
                fcfMarginPct = round2(fm),
                peMultiple = round2(pe),
                pfcfMultiple = round2(pfcf),
                years = 5,
                desiredReturnPct = 10.0,
            ),
            ScenarioDefaults(
                label = "Bull",
                revenueGrowthPct = round2(g * 1.4),
                profitMarginPct = round2(pm * 1.1),
                fcfMarginPct = round2(fm * 1.1),
                peMultiple = round2(pe * 1.3),
                pfcfMultiple = round2(pfcf * 1.3),
                years = 5,
                desiredReturnPct = 8.0,
            ),
        )
    }

    // ---- Field extraction helpers (same Polygon schema as ScreenerService) ----

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

    private fun sumCashFlowField(quarters: List<FinancialsDto>, field: String): Double? {
        val values = quarters.mapNotNull { cashFlowField(it, field) }
        return if (values.isNotEmpty()) values.sum() else null
    }

    private fun round2(v: Double): Double = round(v * 100) / 100
}
