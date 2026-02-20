package com.sv.span.provider

/**
 * Strategy interface for market data providers.
 *
 * Abstracts all data fetching needed by the backtest engine so implementations
 * can be swapped (Massive / FMP / future providers) via configuration without
 * touching business logic.
 */
interface MarketDataProvider {

    /** Human-readable name used in logs and diagnostics. */
    val providerName: String

    /** Fetch daily OHLCV bars for [symbol] between [from] and [to] (ISO dates), sorted ascending. */
    fun getDailyBars(symbol: String, from: String, to: String): List<DailyBar>

    /** Fetch up to [limit] quarterly financial statements for [symbol], most recent first. */
    fun getQuarterlyFinancials(symbol: String, limit: Int = 20): List<QuarterlyFinancial>

    /** Fetch company profile: name, shares outstanding, etc. */
    fun getCompanyProfile(symbol: String): CompanyProfile?
}

/**
 * Canonical daily bar — provider-agnostic.
 */
data class DailyBar(
    val date: String,       // ISO date e.g. "2024-03-15"
    val open: Double,
    val high: Double,
    val low: Double,
    val close: Double,
    val volume: Double,
)

/**
 * Canonical quarterly financial — provider-agnostic.
 * All monetary values in USD.
 */
data class QuarterlyFinancial(
    val endDate: String,           // fiscal quarter end date (ISO)
    val filingDate: String?,       // SEC filing date (ISO), may be null
    val fiscalYear: String?,
    val fiscalPeriod: String?,     // "Q1", "Q2", "Q3", "Q4" / "FY"

    // Income statement
    val revenue: Double?,
    val grossProfit: Double?,
    val operatingIncome: Double?,
    val netIncome: Double?,

    // Balance sheet (from latest quarter snapshot)
    val cashAndEquivalents: Double?,
    val longTermDebt: Double?,
    val currentLiabilities: Double?,

    // Cash flow statement
    val operatingCashFlow: Double?,
    val capitalExpenditure: Double?,
)

/**
 * Canonical company profile — provider-agnostic.
 */
data class CompanyProfile(
    val symbol: String,
    val name: String?,
    val sharesOutstanding: Double?,
    val marketCap: Double?,
)
