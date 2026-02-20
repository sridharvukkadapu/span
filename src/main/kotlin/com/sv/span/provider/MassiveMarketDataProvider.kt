package com.sv.span.provider

import com.sv.span.client.MassiveApiClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.ZoneId

/**
 * MarketDataProvider backed by Massive.com (Polygon.io).
 *
 * Adapts the existing MassiveApiClient into the canonical provider interface,
 * mapping Polygon-specific DTOs and timestamp formats into provider-agnostic models.
 */
@Component
class MassiveMarketDataProvider(private val api: MassiveApiClient) : MarketDataProvider {

    private val log = LoggerFactory.getLogger(javaClass)

    override val providerName: String = "Massive"

    override fun getDailyBars(symbol: String, from: String, to: String): List<DailyBar> {
        log.info("[Massive Provider] Requesting daily bars for {} ({} → {})", symbol, from, to)
        val bars = api.getAggregateRange(symbol, from, to)

        val result = bars
            .filter { it.timestamp != null && it.close != null }
            .map { b ->
                DailyBar(
                    date = timestampToDate(b.timestamp!!),
                    open = b.open ?: b.close!!,
                    high = b.high ?: b.close!!,
                    low = b.low ?: b.close!!,
                    close = b.close!!,
                    volume = b.volume ?: 0.0,
                )
            }
            .sortedBy { it.date }

        log.info("[Massive Provider] Loaded {} daily bars for {}", result.size, symbol)
        return result
    }

    override fun getQuarterlyFinancials(symbol: String, limit: Int): List<QuarterlyFinancial> {
        log.info("[Massive Provider] Requesting quarterly financials for {} (limit={})", symbol, limit)

        val financials = api.getFinancials(symbol, "quarterly", limit)

        val result = financials
            .filter { it.endDate != null }
            .map { fin ->
                QuarterlyFinancial(
                    endDate = fin.endDate!!,
                    filingDate = fin.filingDate,
                    fiscalYear = fin.fiscalYear,
                    fiscalPeriod = fin.fiscalPeriod,

                    // Income statement
                    revenue = fin.financials?.incomeStatement?.get("revenues")?.value,
                    grossProfit = fin.financials?.incomeStatement?.get("gross_profit")?.value,
                    operatingIncome = fin.financials?.incomeStatement?.get("operating_income_loss")?.value,
                    netIncome = fin.financials?.incomeStatement?.get("net_income_loss")?.value,

                    // Balance sheet
                    cashAndEquivalents = fin.financials?.balanceSheet?.get("other_current_assets")?.value,
                    longTermDebt = fin.financials?.balanceSheet?.get("long_term_debt")?.value,
                    currentLiabilities = fin.financials?.balanceSheet?.get("current_liabilities")?.value,

                    // Cash flow
                    operatingCashFlow = fin.financials?.cashFlowStatement
                        ?.get("net_cash_flow_from_operating_activities")?.value,
                    capitalExpenditure = fin.financials?.cashFlowStatement
                        ?.get("net_cash_flow_from_investing_activities")?.value,
                )
            }

        log.info("[Massive Provider] Assembled {} quarterly financials for {}", result.size, symbol)
        return result
    }

    override fun getCompanyProfile(symbol: String): CompanyProfile? {
        log.info("[Massive Provider] Requesting company profile for {}", symbol)
        val details = api.getTickerDetails(symbol) ?: return null

        return CompanyProfile(
            symbol = details.ticker ?: symbol,
            name = details.name,
            sharesOutstanding = details.sharesOutstanding,
            marketCap = details.marketCap,
        )
    }

    private fun timestampToDate(ts: Long): String {
        return Instant.ofEpochMilli(ts)
            .atZone(ZoneId.of("America/New_York"))
            .toLocalDate()
            .toString()
    }
}
