package com.sv.span.client.dto

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

// ---------- Generic wrapper ----------

@JsonIgnoreProperties(ignoreUnknown = true)
data class MassiveResponse<T>(
    val status: String? = null,
    val results: List<T> = emptyList(),
    @JsonProperty("request_id") val requestId: String? = null,
    @JsonProperty("next_url") val nextUrl: String? = null,
)

// ---------- Ticker Details ----------

@JsonIgnoreProperties(ignoreUnknown = true)
data class TickerDetailsWrapper(
    val status: String? = null,
    val results: TickerDetailsDto? = null,
    @JsonProperty("request_id") val requestId: String? = null,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class TickerDetailsDto(
    val ticker: String? = null,
    val name: String? = null,
    val market: String? = null,
    @JsonProperty("market_cap") val marketCap: Double? = null,
    @JsonProperty("weighted_shares_outstanding") val sharesOutstanding: Double? = null,
    @JsonProperty("sic_description") val sicDescription: String? = null,
    @JsonProperty("total_employees") val totalEmployees: Int? = null,
    @JsonProperty("homepage_url") val homepageUrl: String? = null,
    val description: String? = null,
)

// ---------- Previous Day Bar ----------

@JsonIgnoreProperties(ignoreUnknown = true)
data class AggResponse(
    val status: String? = null,
    val ticker: String? = null,
    val results: List<AggBarDto> = emptyList(),
    @JsonProperty("request_id") val requestId: String? = null,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class AggBarDto(
    @JsonProperty("T") val ticker: String? = null,
    @JsonProperty("o") val open: Double? = null,
    @JsonProperty("h") val high: Double? = null,
    @JsonProperty("l") val low: Double? = null,
    @JsonProperty("c") val close: Double? = null,
    @JsonProperty("v") val volume: Double? = null,
    @JsonProperty("vw") val vwap: Double? = null,
    @JsonProperty("t") val timestamp: Long? = null,
    @JsonProperty("n") val transactions: Long? = null,
)

// ---------- Deprecated Financials (vX) ----------

@JsonIgnoreProperties(ignoreUnknown = true)
data class FinancialsDto(
    @JsonProperty("start_date") val startDate: String? = null,
    @JsonProperty("end_date") val endDate: String? = null,
    @JsonProperty("filing_date") val filingDate: String? = null,
    val timeframe: String? = null,
    @JsonProperty("fiscal_period") val fiscalPeriod: String? = null,
    @JsonProperty("fiscal_year") val fiscalYear: String? = null,
    val tickers: List<String>? = null,
    @JsonProperty("company_name") val companyName: String? = null,
    val financials: FinancialSections? = null,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class FinancialSections(
    @JsonProperty("income_statement") val incomeStatement: Map<String, FinancialField>? = null,
    @JsonProperty("balance_sheet") val balanceSheet: Map<String, FinancialField>? = null,
    @JsonProperty("cash_flow_statement") val cashFlowStatement: Map<String, FinancialField>? = null,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class FinancialField(
    val value: Double? = null,
    val unit: String? = null,
    val label: String? = null,
)

// ---------- Technical Indicators ----------

@JsonIgnoreProperties(ignoreUnknown = true)
data class IndicatorResponse(
    val status: String? = null,
    val results: IndicatorResults? = null,
    @JsonProperty("request_id") val requestId: String? = null,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class IndicatorResults(
    val values: List<IndicatorValue> = emptyList(),
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class IndicatorValue(
    val timestamp: Long? = null,
    val value: Double? = null,
)
