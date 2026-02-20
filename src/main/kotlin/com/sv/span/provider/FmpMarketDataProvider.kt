package com.sv.span.provider

import com.sv.span.client.FmpApiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.time.LocalDate

/**
 * MarketDataProvider backed by Financial Modeling Prep (FMP).
 *
 * Maps FMP-specific DTOs into the canonical provider model so the backtest
 * engine remains provider-agnostic.
 */
@Component
class FmpMarketDataProvider(private val fmpApi: FmpApiClient) : MarketDataProvider {

    private val log = LoggerFactory.getLogger(javaClass)

    override val providerName: String = "FMP"

    override fun getDailyBars(symbol: String, from: String, to: String): List<DailyBar> {
        log.info("[FMP Provider] Requesting daily bars for {} ({} → {})", symbol, from, to)
        val prices = fmpApi.getHistoricalPrices(symbol, from, to)

        // FMP returns most-recent first; sort ascending by date
        val bars = prices
            .filter { it.date != null && it.close != null }
            .map { p ->
                DailyBar(
                    date = p.date!!,
                    open = p.open ?: p.close!!,
                    high = p.high ?: p.close!!,
                    low = p.low ?: p.close!!,
                    close = p.close!!,
                    volume = p.volume ?: 0.0,
                )
            }
            .sortedBy { it.date }

        log.info("[FMP Provider] Loaded {} daily bars for {} ({} → {})", bars.size, symbol, from, to)
        return bars
    }

    override fun getQuarterlyFinancials(symbol: String, limit: Int): List<QuarterlyFinancial> {
        log.info("[FMP Provider] Requesting quarterly financials for {} (limit={})", symbol, limit)

        // FMP has separate endpoints for income, balance sheet, cash flow
        val incomeStatements = fmpApi.getIncomeStatements(symbol, "quarter", limit)
        val balanceSheets = fmpApi.getBalanceSheets(symbol, "quarter", limit)
        val cashFlows = fmpApi.getCashFlowStatements(symbol, "quarter", limit)

        log.debug("[FMP Provider] Received {} income, {} balance, {} cashflow statements for {}",
            incomeStatements.size, balanceSheets.size, cashFlows.size, symbol)

        // Index balance sheets and cash flows by (date, period) for fast lookup
        val balanceByKey = balanceSheets.associateBy { "${it.date}|${it.period}" }
        val cashFlowByKey = cashFlows.associateBy { "${it.date}|${it.period}" }

        val financials = incomeStatements
            .filter { it.date != null }
            .map { inc ->
                val key = "${inc.date}|${inc.period}"
                val bal = balanceByKey[key]
                val cf = cashFlowByKey[key]

                QuarterlyFinancial(
                    endDate = inc.date!!,
                    filingDate = inc.fillingDate,   // FMP uses "fillingDate" (their typo)
                    fiscalYear = inc.calendarYear,
                    fiscalPeriod = inc.period,

                    // Income statement
                    revenue = inc.revenue,
                    grossProfit = inc.grossProfit,
                    operatingIncome = inc.operatingIncome,
                    netIncome = inc.netIncome,

                    // Balance sheet
                    cashAndEquivalents = bal?.cashAndShortTermInvestments
                        ?: bal?.cashAndCashEquivalents,
                    longTermDebt = bal?.longTermDebt,
                    currentLiabilities = bal?.totalCurrentLiabilities,

                    // Cash flow
                    operatingCashFlow = cf?.operatingCashFlow
                        ?: cf?.netCashProvidedByOperatingActivities,
                    capitalExpenditure = cf?.capitalExpenditure,
                )
            }

        log.info("[FMP Provider] Assembled {} quarterly financials for {}", financials.size, symbol)
        return financials
    }

    override fun getCompanyProfile(symbol: String): CompanyProfile? {
        log.info("[FMP Provider] Requesting company profile for {}", symbol)

        val profile = fmpApi.getProfile(symbol)
        if (profile == null) {
            log.warn("[FMP Provider] No profile found for {}", symbol)
            return null
        }

        // FMP profile sometimes has shares outstanding = 0 or null.
        // Fall back to shares-float endpoint for more reliable data.
        var shares = profile.sharesOutstanding
        if (shares == null || shares <= 0) {
            log.info("[FMP Provider] Profile shares missing for {}, trying shares-float endpoint", symbol)
            val floatData = fmpApi.getSharesFloat(symbol)
            shares = floatData?.outstandingShares
        }

        val result = CompanyProfile(
            symbol = profile.symbol ?: symbol,
            name = profile.companyName,
            sharesOutstanding = shares,
            marketCap = profile.mktCap,
        )

        log.info("[FMP Provider] Profile for {}: name={}, shares={}, mktCap={}",
            symbol, result.name, result.sharesOutstanding, result.marketCap)
        return result
    }
}
