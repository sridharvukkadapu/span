package com.sv.span.model

import com.fasterxml.jackson.annotation.JsonInclude

enum class Signal { BUY, SELL, HOLD }
enum class CheckLight { GREEN, YELLOW, RED }

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ScreenerResult(
    val symbol: String,
    val companyName: String?,
    val signal: Signal,
    val confidence: String,
    val overview: Overview,
    val margins: Margins,
    val revenueAnalysis: RevenueAnalysis,
    val balanceSheet: BalanceSheetSummary,
    val technicals: Technicals?,
    val checks: List<CheckResult>,
    val summary: String,
)

data class Overview(
    val price: Double?,
    val marketCap: Double?,
    val sharesOutstanding: Double?,
    val epsTtm: Double?,
    val peRatio: Double?,
    val priceToSales: Double?,
)

data class Margins(
    val grossMargin: Double?,
    val operatingMargin: Double?,
    val profitMargin: Double?,
    val fcfMargin: Double?,
)

data class RevenueAnalysis(
    val revenueTtm: Double?,
    val netIncomeTtm: Double?,
    val revenueYears: List<AnnualRevenue>,
    val revenueGrowthYoY: Double?,
)

data class AnnualRevenue(
    val fiscalYear: String,
    val revenue: Double,
)

data class BalanceSheetSummary(
    val cashAndShortTermInvestments: Double?,
    val longTermDebt: Double?,
    val totalDebt: Double?,
    val cashToDebtRatio: Double?,
)

data class Technicals(
    val sma50: Double?,
    val rsi14: Double?,
    val priceVsSma50: String?,
)

data class CheckResult(
    val name: String,
    val light: CheckLight,
    val detail: String,
)
