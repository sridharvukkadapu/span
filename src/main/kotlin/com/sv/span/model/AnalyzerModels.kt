package com.sv.span.model

import com.fasterxml.jackson.annotation.JsonInclude
import kotlin.math.abs

/**
 * Pre-computed historical metrics for the Stock Analyzer.
 *
 * Provides:
 *  1. Current fundamentals (price, market cap, shares, etc.)
 *  2. TTM financial aggregates (revenue, net income, FCF)
 *  3. Derived ratios (ROIC, margins, multiples)
 *  4. Pre-filled scenario defaults (Bear / Base / Bull)
 *
 * The fair-value DCF calculation is performed client-side in JavaScript
 * for instant interactivity as users adjust assumptions.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class AnalyzerData(
    val symbol: String,
    val companyName: String?,

    // Current market data
    val currentPrice: Double?,
    val marketCap: Double?,
    val sharesOutstanding: Double?,

    // TTM aggregates
    val ttmRevenue: Double?,
    val ttmNetIncome: Double?,
    val ttmFcf: Double?,
    val ttmOperatingIncome: Double?,

    // Derived historical metrics (used to pre-fill scenarios)
    val revenueGrowthPct: Double?,      // YoY revenue growth %
    val profitMarginPct: Double?,       // Net income / Revenue %
    val fcfMarginPct: Double?,          // FCF / Revenue %
    val roicPct: Double?,               // Net Income / Invested Capital %
    val currentPE: Double?,             // Price / EPS
    val currentPFCF: Double?,           // Market Cap / FCF

    // Pre-filled scenario defaults
    val scenarios: List<ScenarioDefaults>,

    // True when company is currently unprofitable — scenarios model path-to-profitability
    val turnaroundMode: Boolean = false,
) {
    // Formatted helpers for the HTML view
    val currentPriceFormatted: String? get() = currentPrice?.let { "$${aFmt2(it)}" }
    val marketCapFormatted: String? get() = marketCap?.let { "$${aFmtLarge(it)}" }
    val sharesFormatted: String? get() = sharesOutstanding?.let { aFmtLarge(it) }
    val ttmRevenueFormatted: String? get() = ttmRevenue?.let { "$${aFmtLarge(it)}" }
    val ttmNetIncomeFormatted: String? get() = ttmNetIncome?.let { "$${aFmtLarge(it)}" }
    val ttmFcfFormatted: String? get() = ttmFcf?.let { "$${aFmtLarge(it)}" }
    val revenueGrowthFormatted: String? get() = revenueGrowthPct?.let { "${aFmt2(it)}%" }
    val profitMarginFormatted: String? get() = profitMarginPct?.let { "${aFmt2(it)}%" }
    val fcfMarginFormatted: String? get() = fcfMarginPct?.let { "${aFmt2(it)}%" }
    val roicFormatted: String? get() = roicPct?.let { "${aFmt2(it)}%" }
    val currentPEFormatted: String? get() = currentPE?.let { "${aFmt2(it)}x" }
    val currentPFCFFormatted: String? get() = currentPFCF?.let { "${aFmt2(it)}x" }
}

/**
 * Pre-filled defaults for one scenario (Bear, Base, or Bull).
 * Users can override any of these in the UI.
 */
data class ScenarioDefaults(
    val label: String,             // "Bear", "Base", "Bull"
    val revenueGrowthPct: Double,
    val profitMarginPct: Double,
    val fcfMarginPct: Double,
    val peMultiple: Double,
    val pfcfMultiple: Double,
    val years: Int = 5,
    val desiredReturnPct: Double,
)

// ---- Formatting helpers (prefixed to avoid clash with ScreenerModels) ----

private fun aFmt2(v: Double): String = String.format("%.2f", v)

private fun aFmtLarge(v: Double): String {
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
