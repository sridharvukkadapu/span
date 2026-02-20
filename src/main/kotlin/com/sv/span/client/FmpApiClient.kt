package com.sv.span.client

import com.sv.span.client.dto.*
import org.slf4j.LoggerFactory
import org.springframework.core.ParameterizedTypeReference
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.util.concurrent.ConcurrentHashMap

/**
 * Low-level HTTP client for Financial Modeling Prep (FMP) API.
 *
 * Handles authentication (apikey query param), caching, and response mapping.
 * All public methods are safe to call concurrently.
 */
@Component
class FmpApiClient(private val fmpRestClient: RestClient) {

    private val log = LoggerFactory.getLogger(javaClass)

    // Simple in-memory TTL cache (same pattern as MassiveApiClient)
    private val cache = ConcurrentHashMap<String, Pair<Any?, Long>>()
    private val cacheTtlMs = 5 * 60 * 1000L // 5 minutes

    // ---- Company Profile ----

    fun getProfile(symbol: String): FmpProfileDto? = cached("fmp:profile:$symbol") {
        log.info("[FMP] Fetching company profile for {}", symbol)
        val list = fmpRestClient.get()
            .uri("/stable/profile?symbol={symbol}", symbol)
            .retrieve()
            .body(object : ParameterizedTypeReference<List<FmpProfileDto>>() {})
        list?.firstOrNull()
    }

    // ---- Shares Outstanding (fallback) ----

    fun getSharesFloat(symbol: String): FmpSharesFloatDto? = cached("fmp:float:$symbol") {
        log.info("[FMP] Fetching shares float for {}", symbol)
        val list = fmpRestClient.get()
            .uri("/stable/shares-float?symbol={symbol}", symbol)
            .retrieve()
            .body(object : ParameterizedTypeReference<List<FmpSharesFloatDto>>() {})
        list?.firstOrNull()
    }

    // ---- Historical Daily Prices ----

    fun getHistoricalPrices(symbol: String, from: String, to: String): List<FmpHistoricalPrice> {
        return cached("fmp:hist:$symbol:$from:$to") {
            log.info("[FMP] Fetching daily prices for {} from {} to {}", symbol, from, to)
            val response = fmpRestClient.get()
                .uri("/stable/historical-price-eod/full?symbol={symbol}&from={from}&to={to}",
                    symbol, from, to)
                .retrieve()
                .body(FmpHistoricalPriceResponse::class.java)
            val prices = response?.historical.orEmpty()
            log.info("[FMP] Received {} daily bars for {}", prices.size, symbol)
            prices
        } ?: emptyList()
    }

    // ---- Income Statements (quarterly) ----

    fun getIncomeStatements(symbol: String, period: String = "quarter", limit: Int = 20): List<FmpIncomeStatementDto> {
        return cached("fmp:income:$symbol:$period:$limit") {
            log.info("[FMP] Fetching {} income statements for {} (limit={})", period, symbol, limit)
            fmpRestClient.get()
                .uri("/stable/income-statement?symbol={symbol}&period={period}&limit={limit}",
                    symbol, period, limit)
                .retrieve()
                .body(object : ParameterizedTypeReference<List<FmpIncomeStatementDto>>() {})
                .orEmpty()
        } ?: emptyList()
    }

    // ---- Balance Sheets (quarterly) ----

    fun getBalanceSheets(symbol: String, period: String = "quarter", limit: Int = 20): List<FmpBalanceSheetDto> {
        return cached("fmp:balance:$symbol:$period:$limit") {
            log.info("[FMP] Fetching {} balance sheets for {} (limit={})", period, symbol, limit)
            fmpRestClient.get()
                .uri("/stable/balance-sheet-statement?symbol={symbol}&period={period}&limit={limit}",
                    symbol, period, limit)
                .retrieve()
                .body(object : ParameterizedTypeReference<List<FmpBalanceSheetDto>>() {})
                .orEmpty()
        } ?: emptyList()
    }

    // ---- Cash Flow Statements (quarterly) ----

    fun getCashFlowStatements(symbol: String, period: String = "quarter", limit: Int = 20): List<FmpCashFlowDto> {
        return cached("fmp:cashflow:$symbol:$period:$limit") {
            log.info("[FMP] Fetching {} cash flow statements for {} (limit={})", period, symbol, limit)
            fmpRestClient.get()
                .uri("/stable/cash-flow-statement?symbol={symbol}&period={period}&limit={limit}",
                    symbol, period, limit)
                .retrieve()
                .body(object : ParameterizedTypeReference<List<FmpCashFlowDto>>() {})
                .orEmpty()
        } ?: emptyList()
    }

    // ---- Cache helper ----

    @Suppress("UNCHECKED_CAST")
    private fun <T> cached(key: String, loader: () -> T?): T? {
        val now = System.currentTimeMillis()
        val entry = cache[key]
        if (entry != null && entry.second > now) {
            log.debug("[FMP] Cache hit: {}", key)
            return entry.first as? T
        }
        return try {
            val value = loader()
            cache[key] = (value as Any?) to (now + cacheTtlMs)
            value
        } catch (e: Exception) {
            log.error("[FMP] API call failed for key={}: {}", key, e.message, e)
            throw e
        }
    }
}
