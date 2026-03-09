package com.sv.span.service

import com.sv.span.cache.TickerCacheService
import com.sv.span.client.MassiveApiClient
import com.sv.span.client.dto.FinancialsDto
import com.sv.span.model.BasicAnalyzerData
import com.sv.span.model.BasicScenarioDefaults
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import kotlin.math.round

/**
 * Computes pre-filled defaults for the Basic Stock Analyzer.
 *
 * The basic analyzer models a simple forward-looking valuation:
 *   Future Revenue  = TTM Revenue  × (1 + growth)^years
 *   Future Earnings = Future Revenue × net profit margin
 *   Future Mkt Cap  = Future Earnings × P/E multiple
 *   Future Price    = Future Mkt Cap / (shares × (1 + dilution)^years)
 *
 * Two scenarios are provided — Reasonable Assumptions and Great Execution —
 * pre-filled from historical TTM metrics. All calculation is done client-side.
 */
@Service
class BasicAnalyzerService(
    private val api: MassiveApiClient,
    private val cacheService: TickerCacheService,
    private val financialDataService: FinancialDataService,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun analyze(ticker: String): BasicAnalyzerData =
        cacheService.getOrCompute("basic-analyzer", ticker.uppercase()) {
            computeData(ticker)
        }

    private fun computeData(ticker: String): BasicAnalyzerData {
        val symbol = ticker.uppercase()
        log.info("Computing basic analyzer data for {}", symbol)

        val details = api.getTickerDetails(symbol)
        val prevBar = api.getPreviousDayBar(symbol)
        val quarters = financialDataService.getQuarterlyFinancials(symbol, 8)

        val recentQuarters = quarters.take(4)
        val priorQuarters = quarters.drop(4)

        val price = prevBar?.close
        val sharesOut = details?.sharesOutstanding

        val ttmRevenue = sumField(recentQuarters, "revenues")
        val ttmNetIncome = sumField(recentQuarters, "net_income_loss")

        val revenueGrowth = run {
            val prior = sumField(priorQuarters, "revenues")
            if (ttmRevenue != null && prior != null && prior > 0)
                round2((ttmRevenue - prior) / prior * 100)
            else null
        }

        val profitMargin = if (ttmNetIncome != null && ttmRevenue != null && ttmRevenue > 0)
            round2(ttmNetIncome / ttmRevenue * 100) else null

        val currentPE = if (price != null && ttmNetIncome != null && sharesOut != null && sharesOut > 0) {
            val eps = ttmNetIncome / sharesOut
            if (eps > 0) round2(price / eps) else null
        } else null

        // Clamp defaults to sensible ranges for pre-fill
        val g = (revenueGrowth ?: 10.0).coerceAtLeast(0.0)
        val pm = if ((profitMargin ?: 15.0) < 0) 10.0 else (profitMargin ?: 15.0)
        val pe = (currentPE ?: 20.0).coerceIn(5.0, 80.0)

        log.info("Basic analyzer for {}: growth={}%, margin={}%, P/E={}", symbol, g, pm, pe)

        return BasicAnalyzerData(
            symbol = symbol,
            companyName = details?.name,
            currentPrice = price,
            ttmRevenue = ttmRevenue,
            sharesOutstanding = sharesOut,
            reasonable = BasicScenarioDefaults(
                label = "Reasonable Assumptions",
                growthRatePct = round2(g),
                netProfitPct = round2(pm),
                peMultiple = round2(pe),
            ),
            greatExecution = BasicScenarioDefaults(
                label = "Great Execution",
                growthRatePct = round2(g * 1.25),
                netProfitPct = round2(pm * 1.2),
                peMultiple = round2(pe * 1.25),
            ),
        )
    }

    private fun incomeField(fin: FinancialsDto, field: String): Double? =
        fin.financials?.incomeStatement?.get(field)?.value

    private fun sumField(quarters: List<FinancialsDto>, field: String): Double? {
        val values = quarters.mapNotNull { incomeField(it, field) }
        return if (values.isNotEmpty()) values.sum() else null
    }

    private fun round2(v: Double): Double = round(v * 100) / 100
}
