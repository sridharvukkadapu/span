package com.sv.span.service

import com.sv.span.client.FmpApiClient
import com.sv.span.client.MassiveApiClient
import com.sv.span.client.dto.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

/**
 * Unified financial data service that tries Massive (Polygon) first,
 * then falls back to FMP when Massive returns no data.
 *
 * Converts FMP's typed DTOs into Massive's FinancialsDto format so that
 * ScreenerService and AnalyzerService can work with a single data model.
 */
@Service
class FinancialDataService(
    private val massiveApi: MassiveApiClient,
    private val fmpApi: FmpApiClient,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    /**
     * Get quarterly financial data: tries Massive first, falls back to FMP.
     * Returns data in Massive FinancialsDto format regardless of source.
     */
    fun getQuarterlyFinancials(symbol: String, limit: Int = 8): List<FinancialsDto> {
        // Try Massive first (free, no rate limit issues with our limiter)
        val massiveData = try {
            massiveApi.getFinancials(symbol, "quarterly", limit)
        } catch (e: Exception) {
            log.warn("Massive financials failed for {}: {}", symbol, e.message)
            emptyList()
        }

        if (massiveData.isNotEmpty()) {
            log.debug("Using Massive financials for {} ({} quarters)", symbol, massiveData.size)
            return massiveData
        }

        // Fallback to FMP
        log.info("Massive has no financials for {}. Falling back to FMP.", symbol)
        return try {
            val incomeStmts = fmpApi.getIncomeStatements(symbol, "quarter", limit)
            val balanceSheets = fmpApi.getBalanceSheets(symbol, "quarter", limit)
            val cashFlows = fmpApi.getCashFlowStatements(symbol, "quarter", limit)

            if (incomeStmts.isEmpty()) {
                log.warn("FMP also has no income statements for {}", symbol)
                return emptyList()
            }

            val converted = convertFmpToMassiveFormat(symbol, incomeStmts, balanceSheets, cashFlows)
            log.info("FMP fallback for {}: converted {} quarters", symbol, converted.size)
            converted
        } catch (e: Exception) {
            log.warn("FMP financials fallback failed for {}: {}", symbol, e.message)
            emptyList()
        }
    }

    /**
     * Convert FMP's separate income/balance/cash flow DTOs into the unified
     * Massive FinancialsDto format keyed by period end date.
     */
    private fun convertFmpToMassiveFormat(
        symbol: String,
        incomeStmts: List<FmpIncomeStatementDto>,
        balanceSheets: List<FmpBalanceSheetDto>,
        cashFlows: List<FmpCashFlowDto>,
    ): List<FinancialsDto> {
        // Index balance sheets and cash flows by date for quick lookup
        val balanceByDate = balanceSheets.associateBy { it.date }
        val cashFlowByDate = cashFlows.associateBy { it.date }

        return incomeStmts.map { income ->
            val balance = balanceByDate[income.date]
            val cashFlow = cashFlowByDate[income.date]

            FinancialsDto(
                startDate = null, // FMP doesn't provide period start date
                endDate = income.date,
                filingDate = income.filingDate ?: income.fillingDate,
                timeframe = "quarterly",
                fiscalPeriod = income.period,
                fiscalYear = income.calendarYear,
                tickers = listOf(symbol),
                companyName = null,
                financials = FinancialSections(
                    incomeStatement = buildIncomeMap(income),
                    balanceSheet = buildBalanceMap(balance),
                    cashFlowStatement = buildCashFlowMap(cashFlow),
                ),
            )
        }
    }

    private fun buildIncomeMap(inc: FmpIncomeStatementDto): Map<String, FinancialField> {
        val map = mutableMapOf<String, FinancialField>()
        inc.revenue?.let { map["revenues"] = FinancialField(value = it, unit = "USD", label = "Revenues") }
        inc.grossProfit?.let { map["gross_profit"] = FinancialField(value = it, unit = "USD", label = "Gross Profit") }
        inc.operatingIncome?.let { map["operating_income_loss"] = FinancialField(value = it, unit = "USD", label = "Operating Income/Loss") }
        inc.netIncome?.let { map["net_income_loss"] = FinancialField(value = it, unit = "USD", label = "Net Income/Loss") }
        inc.costOfRevenue?.let { map["cost_of_revenue"] = FinancialField(value = it, unit = "USD", label = "Cost of Revenue") }
        inc.operatingExpenses?.let { map["operating_expenses"] = FinancialField(value = it, unit = "USD", label = "Operating Expenses") }
        return map
    }

    private fun buildBalanceMap(bal: FmpBalanceSheetDto?): Map<String, FinancialField> {
        if (bal == null) return emptyMap()
        val map = mutableMapOf<String, FinancialField>()
        // Cash: map to the keys the screener uses
        val cash = bal.cashAndShortTermInvestments ?: bal.cashAndCashEquivalents
        cash?.let {
            map["other_current_assets"] = FinancialField(value = it, unit = "USD", label = "Cash & Short Term Investments")
            map["current_assets"] = FinancialField(value = it, unit = "USD", label = "Current Assets")
        }
        bal.longTermDebt?.let { map["long_term_debt"] = FinancialField(value = it, unit = "USD", label = "Long Term Debt") }
        bal.totalCurrentLiabilities?.let { map["current_liabilities"] = FinancialField(value = it, unit = "USD", label = "Current Liabilities") }
        bal.totalLiabilities?.let {
            map["noncurrent_liabilities"] = FinancialField(value = it - (bal.totalCurrentLiabilities ?: 0.0), unit = "USD", label = "Non-Current Liabilities")
            map["liabilities"] = FinancialField(value = it, unit = "USD", label = "Total Liabilities")
        }
        bal.totalDebt?.let { map["total_debt"] = FinancialField(value = it, unit = "USD", label = "Total Debt") }
        bal.totalAssets?.let { map["assets"] = FinancialField(value = it, unit = "USD", label = "Total Assets") }
        bal.totalEquity?.let { map["equity"] = FinancialField(value = it, unit = "USD", label = "Total Equity") }
        return map
    }

    private fun buildCashFlowMap(cf: FmpCashFlowDto?): Map<String, FinancialField> {
        if (cf == null) return emptyMap()
        val map = mutableMapOf<String, FinancialField>()
        val opCF = cf.operatingCashFlow ?: cf.netCashProvidedByOperatingActivities
        opCF?.let { map["net_cash_flow_from_operating_activities"] = FinancialField(value = it, unit = "USD", label = "Operating Cash Flow") }
        // Capex is reported as positive in FMP but the screener expects investing CF (negative)
        // FCF = OpCF + InvestingCF, so investing CF ≈ -capex
        cf.capitalExpenditure?.let {
            // FMP capex is usually negative already, but just in case
            val investingCF = if (it > 0) -it else it
            map["net_cash_flow_from_investing_activities"] = FinancialField(value = investingCF, unit = "USD", label = "Investing Cash Flow")
        }
        return map
    }
}
