package com.sv.span.model

import com.fasterxml.jackson.annotation.JsonInclude
import kotlin.math.abs

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
) {
    val priceFormatted: String? get() = price?.let { "$${fmt2(it)}" }
    val marketCapFormatted: String? get() = marketCap?.let { "$${fmtLarge(it)}" }
    val sharesOutstandingFormatted: String? get() = sharesOutstanding?.let { fmtLarge(it) }
    val epsTtmFormatted: String? get() = epsTtm?.let { "$${fmt2(it)}" }
    val peRatioFormatted: String? get() = peRatio?.let { "${fmt2(it)}x" }
    val priceToSalesFormatted: String? get() = priceToSales?.let { "${fmt2(it)}x" }
}

data class Margins(
    val grossMargin: Double?,
    val operatingMargin: Double?,
    val profitMargin: Double?,
    val fcfMargin: Double?,
) {
    val grossMarginFormatted: String? get() = grossMargin?.let { "${fmt2(it)}%" }
    val operatingMarginFormatted: String? get() = operatingMargin?.let { "${fmt2(it)}%" }
    val profitMarginFormatted: String? get() = profitMargin?.let { "${fmt2(it)}%" }
    val fcfMarginFormatted: String? get() = fcfMargin?.let { "${fmt2(it)}%" }
}

data class RevenueAnalysis(
    val revenueTtm: Double?,
    val netIncomeTtm: Double?,
    val revenueYears: List<AnnualRevenue>,
    val revenueGrowthYoY: Double?,
) {
    val revenueTtmFormatted: String? get() = revenueTtm?.let { "$${fmtLarge(it)}" }
    val netIncomeTtmFormatted: String? get() = netIncomeTtm?.let { "$${fmtLarge(it)}" }
    val revenueGrowthFormatted: String? get() = revenueGrowthYoY?.let { "${fmt2(it)}%" }
}

data class AnnualRevenue(
    val fiscalYear: String,
    val revenue: Double,
) {
    val revenueFormatted: String get() = "$${fmtLarge(revenue)}"
}

data class BalanceSheetSummary(
    val cashAndShortTermInvestments: Double?,
    val longTermDebt: Double?,
    val totalDebt: Double?,
    val cashToDebtRatio: Double?,
) {
    val cashFormatted: String? get() = cashAndShortTermInvestments?.let { "$${fmtLarge(it)}" }
    val longTermDebtFormatted: String? get() = longTermDebt?.let { "$${fmtLarge(it)}" }
    val totalDebtFormatted: String? get() = totalDebt?.let { "$${fmtLarge(it)}" }
    val cashToDebtFormatted: String? get() = cashToDebtRatio?.let { "${fmt2(it)}x" }
}

data class Technicals(
    val sma50: Double?,
    val rsi14: Double?,
    val priceVsSma50: String?,
) {
    val sma50Formatted: String? get() = sma50?.let { "$${fmt2(it)}" }
    val rsi14Formatted: String? get() = rsi14?.let { fmt2(it) }
}

data class CheckResult(
    val name: String,
    val light: CheckLight,
    val detail: String,
)

// ---- Formatting helpers ----

private fun fmt2(v: Double): String = String.format("%.2f", v)

private fun fmtLarge(v: Double): String {
    val a = abs(v)
    val sign = if (v < 0) "-" else ""
    return when {
        a >= 1_000_000_000_000 -> "${sign}${String.format("%.2f", a / 1_000_000_000_000)}T"
        a >= 1_000_000_000 -> "${sign}${String.format("%.2f", a / 1_000_000_000)}B"
        a >= 1_000_000 -> "${sign}${String.format("%.2f", a / 1_000_000)}M"
        a >= 1_000 -> "${sign}${String.format("%.1f", a / 1_000)}K"
        else -> "${sign}${String.format("%.2f", a)}"
    }
}
