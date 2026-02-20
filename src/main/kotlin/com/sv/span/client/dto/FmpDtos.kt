package com.sv.span.client.dto

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

// ---------- Company Profile ----------

@JsonIgnoreProperties(ignoreUnknown = true)
data class FmpProfileDto(
    val symbol: String? = null,
    val companyName: String? = null,
    val mktCap: Double? = null,
    @JsonProperty("sharesOutstanding") val sharesOutstanding: Double? = null,    // sometimes missing
    val price: Double? = null,
    val sector: String? = null,
    val industry: String? = null,
    val exchange: String? = null,
    val currency: String? = null,
)

// ---------- Income Statement ----------

@JsonIgnoreProperties(ignoreUnknown = true)
data class FmpIncomeStatementDto(
    val date: String? = null,                  // fiscal period end date
    val symbol: String? = null,
    val period: String? = null,                // "Q1","Q2","Q3","Q4","FY"
    val calendarYear: String? = null,
    val filingDate: String? = null,            // correct field name in /stable/ API
    @JsonProperty("fillingDate")
    val fillingDate: String? = null,           // legacy typo variant
    val acceptedDate: String? = null,
    val revenue: Double? = null,
    val grossProfit: Double? = null,
    val operatingIncome: Double? = null,
    val netIncome: Double? = null,
    val costOfRevenue: Double? = null,
    val operatingExpenses: Double? = null,
    val eps: Double? = null,
    val epsdiluted: Double? = null,
)

// ---------- Balance Sheet ----------

@JsonIgnoreProperties(ignoreUnknown = true)
data class FmpBalanceSheetDto(
    val date: String? = null,
    val symbol: String? = null,
    val period: String? = null,
    val calendarYear: String? = null,
    val filingDate: String? = null,
    @JsonProperty("fillingDate")
    val fillingDate: String? = null,
    val cashAndCashEquivalents: Double? = null,
    val shortTermInvestments: Double? = null,
    val cashAndShortTermInvestments: Double? = null,
    val longTermDebt: Double? = null,
    val totalCurrentLiabilities: Double? = null,
    val totalDebt: Double? = null,
    val totalAssets: Double? = null,
    val totalLiabilities: Double? = null,
    @JsonProperty("totalStockholdersEquity") val totalEquity: Double? = null,
)

// ---------- Cash Flow Statement ----------

@JsonIgnoreProperties(ignoreUnknown = true)
data class FmpCashFlowDto(
    val date: String? = null,
    val symbol: String? = null,
    val period: String? = null,
    val calendarYear: String? = null,
    val filingDate: String? = null,
    @JsonProperty("fillingDate")
    val fillingDate: String? = null,
    val operatingCashFlow: Double? = null,
    val capitalExpenditure: Double? = null,
    val freeCashFlow: Double? = null,
    val netCashProvidedByOperatingActivities: Double? = null,
)

// ---------- Historical Price (EOD) ----------

@JsonIgnoreProperties(ignoreUnknown = true)
data class FmpHistoricalPriceResponse(
    val symbol: String? = null,
    val historical: List<FmpHistoricalPrice> = emptyList(),
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class FmpHistoricalPrice(
    val date: String? = null,
    val open: Double? = null,
    val high: Double? = null,
    val low: Double? = null,
    val close: Double? = null,
    val adjClose: Double? = null,
    val volume: Double? = null,
    val changePercent: Double? = null,
)

// ---------- Shares Float (for accurate shares outstanding) ----------

@JsonIgnoreProperties(ignoreUnknown = true)
data class FmpSharesFloatDto(
    val symbol: String? = null,
    val freeFloat: Double? = null,
    val floatShares: Double? = null,
    val outstandingShares: Double? = null,
)
