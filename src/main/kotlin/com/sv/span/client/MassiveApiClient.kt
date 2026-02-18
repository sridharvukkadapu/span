package com.sv.span.client

import com.sv.span.client.dto.*
import org.slf4j.LoggerFactory
import org.springframework.core.ParameterizedTypeReference
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.util.concurrent.ConcurrentHashMap

@Component
class MassiveApiClient(private val massiveRestClient: RestClient) {

    private val log = LoggerFactory.getLogger(javaClass)

    // Simple in-memory cache: key -> (value, expiresAtMillis)
    private val cache = ConcurrentHashMap<String, Pair<Any?, Long>>()
    private val cacheTtlMs = 5 * 60 * 1000L // 5 minutes

    fun getTickerDetails(ticker: String): TickerDetailsDto? = cached("details:$ticker") {
        log.info("Fetching ticker details for {}", ticker)
        massiveRestClient.get()
            .uri("/v3/reference/tickers/{ticker}", ticker)
            .retrieve()
            .body(TickerDetailsWrapper::class.java)
            ?.results
    }

    fun getPreviousDayBar(ticker: String): AggBarDto? = cached("prevBar:$ticker") {
        log.info("Fetching previous day bar for {}", ticker)
        massiveRestClient.get()
            .uri("/v2/aggs/ticker/{ticker}/prev", ticker)
            .retrieve()
            .body(AggResponse::class.java)
            ?.results?.firstOrNull()
    }

    fun getFinancials(ticker: String, timeframe: String = "quarterly", limit: Int = 4): List<FinancialsDto> {
        return cached("financials:$ticker:$timeframe:$limit") {
            log.info("Fetching {} financials for {} (limit={})", timeframe, ticker, limit)
            massiveRestClient.get()
                .uri("/vX/reference/financials?ticker={ticker}&timeframe={timeframe}&limit={limit}", ticker, timeframe, limit)
                .retrieve()
                .body(object : ParameterizedTypeReference<MassiveResponse<FinancialsDto>>() {})
                ?.results.orEmpty()
        } ?: emptyList()
    }

    fun getSma(ticker: String, window: Int = 50): Double? = cached("sma:$ticker:$window") {
        log.info("Fetching SMA({}) for {}", window, ticker)
        massiveRestClient.get()
            .uri("/v1/indicators/sma/{ticker}?timespan=day&window={window}&limit=1", ticker, window)
            .retrieve()
            .body(IndicatorResponse::class.java)
            ?.results?.values?.firstOrNull()?.value
    }

    fun getRsi(ticker: String, window: Int = 14): Double? = cached("rsi:$ticker:$window") {
        log.info("Fetching RSI({}) for {}", window, ticker)
        massiveRestClient.get()
            .uri("/v1/indicators/rsi/{ticker}?timespan=day&window={window}&limit=1", ticker, window)
            .retrieve()
            .body(IndicatorResponse::class.java)
            ?.results?.values?.firstOrNull()?.value
    }

    // ---- Simple TTL cache ----

    @Suppress("UNCHECKED_CAST")
    private fun <T> cached(key: String, loader: () -> T?): T? {
        val now = System.currentTimeMillis()
        val entry = cache[key]
        if (entry != null && entry.second > now) {
            log.debug("Cache hit: {}", key)
            return entry.first as? T
        }
        val value = loader()
        cache[key] = (value as Any?) to (now + cacheTtlMs)
        return value
    }
}
