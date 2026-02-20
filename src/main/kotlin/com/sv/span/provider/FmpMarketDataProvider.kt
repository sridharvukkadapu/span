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

    /**
     * FMP free-tier restricts certain secondary share-class symbols.
     * Map them to the primary listing that is available.
     */
    private val symbolAliases = mapOf(
        "GOOG"  to "GOOGL",
        "BRK.A" to "BRK-B",
        "FOX"   to "FOXA",
        "NWSA"  to "NWS",
        "LSXMA" to "LSXMK",
    )

    /** Resolve to FMP-compatible symbol, logging if aliased */
    private fun resolve(symbol: String): String {
        val resolved = symbolAliases[symbol.uppercase()] ?: symbol.uppercase()
        if (resolved != symbol.uppercase()) {
            log.info("[FMP Provider] Symbol {} aliased to {} (FMP free-tier restriction)", symbol, resolved)
        }
        return resolved
    }

    override fun getDailyBars(symbol: String, from: String, to: String): List<DailyBar> {
        val sym = resolve(symbol)
        log.info("[FMP Provider] Requesting daily bars for {} ({} → {})", sym, from, to)
        val prices = fmpApi.getHistoricalPrices(sym, from, to)

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
        val sym = resolve(symbol)
        // FMP free tier caps limit at 5 per request with no pagination.
        // Use annual statements (5 years) for full backtest coverage.
        val effectiveLimit = 5
        val period = "annual"
        log.info("[FMP Provider] Requesting {} financials for {} (limit={})", period, sym, effectiveLimit)

        // FMP has separate endpoints for income, balance sheet, cash flow
        val incomeStatements = fmpApi.getIncomeStatements(sym, period, effectiveLimit)
        val balanceSheets = fmpApi.getBalanceSheets(sym, period, effectiveLimit)
        val cashFlows = fmpApi.getCashFlowStatements(sym, period, effectiveLimit)

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
                    filingDate = inc.filingDate ?: inc.fillingDate,  // handle both field names
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

        log.info("[FMP Provider] Assembled {} {} financials for {}", financials.size, period, symbol)
        return financials
    }

    override fun getCompanyProfile(symbol: String): CompanyProfile? {
        val sym = resolve(symbol)
        log.info("[FMP Provider] Requesting company profile for {}", sym)

        val profile = fmpApi.getProfile(sym)
        if (profile == null) {
            log.warn("[FMP Provider] No profile found for {}", symbol)
            return null
        }

        // FMP profile sometimes has shares outstanding = 0 or null.
        // Fall back to shares-float endpoint for more reliable data.
        var shares = profile.sharesOutstanding
        if (shares == null || shares <= 0) {
            log.info("[FMP Provider] Profile shares missing for {}, trying shares-float endpoint", symbol)
            val floatData = fmpApi.getSharesFloat(sym)
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
