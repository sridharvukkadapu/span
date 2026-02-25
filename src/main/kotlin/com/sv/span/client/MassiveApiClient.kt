package com.sv.span.client

import com.sv.span.client.dto.*
import org.slf4j.LoggerFactory
import org.springframework.core.ParameterizedTypeReference
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientResponseException
import java.util.concurrent.ConcurrentHashMap
import java.util.LinkedList

@Component
class MassiveApiClient(private val massiveRestClient: RestClient) {

    private val log = LoggerFactory.getLogger(javaClass)

    // Simple in-memory cache: key -> (value, expiresAtMillis)
    private val cache = ConcurrentHashMap<String, Pair<Any?, Long>>()
    private val cacheTtlMs = 24 * 60 * 60 * 1000L // 24 hours — EOD data is static intraday

    // ---- Global rate limiter: 5 requests per 61 seconds (1s buffer) ----
    private val rateLimitMax = 5
    private val rateLimitWindowMs = 61_000L
    private val requestTimestamps = LinkedList<Long>()

    /**
     * Block until a rate-limit slot is available, ensuring we never exceed
     * 5 API calls per 61-second window.
     */
    @Synchronized
    private fun acquireSlot() {
        val now = System.currentTimeMillis()
        // Purge timestamps outside the window
        while (requestTimestamps.isNotEmpty() && requestTimestamps.peek() <= now - rateLimitWindowMs) {
            requestTimestamps.poll()
        }
        // If at capacity, sleep until the oldest timestamp falls out of the window
        if (requestTimestamps.size >= rateLimitMax) {
            val sleepMs = requestTimestamps.peek() + rateLimitWindowMs - now
            if (sleepMs > 0) {
                log.info("Rate limiter: waiting {}ms for slot ({} calls in window)", sleepMs, requestTimestamps.size)
                Thread.sleep(sleepMs)
                // Purge again after sleeping
                val afterSleep = System.currentTimeMillis()
                while (requestTimestamps.isNotEmpty() && requestTimestamps.peek() <= afterSleep - rateLimitWindowMs) {
                    requestTimestamps.poll()
                }
            }
        }
        requestTimestamps.add(System.currentTimeMillis())
    }

    /** Max retries on 429 */
    private val maxRetries = 2
    private val retryDelayMs = 13_000L // ~13 seconds between retries

    /**
     * Execute an API call with rate limiting and 429 retry.
     */
    private fun <T> rateLimitedCall(description: String, block: () -> T): T {
        for (attempt in 0..maxRetries) {
            acquireSlot()
            try {
                return block()
            } catch (e: RestClientResponseException) {
                if (e.statusCode.value() == 429 && attempt < maxRetries) {
                    log.warn("429 rate limited on {} (attempt {}/{}), retrying in {}ms",
                        description, attempt + 1, maxRetries + 1, retryDelayMs)
                    Thread.sleep(retryDelayMs)
                } else {
                    throw e
                }
            }
        }
        throw IllegalStateException("Exhausted retries for $description") // unreachable
    }

    fun getTickerDetails(ticker: String): TickerDetailsDto? = cached("details:$ticker") {
        log.info("Fetching ticker details for {}", ticker)
        rateLimitedCall("details:$ticker") {
            massiveRestClient.get()
                .uri("/v3/reference/tickers/{ticker}", ticker)
                .retrieve()
                .body(TickerDetailsWrapper::class.java)
                ?.results
        }
    }

    fun getPreviousDayBar(ticker: String): AggBarDto? = cached("prevBar:$ticker") {
        log.info("Fetching previous day bar for {}", ticker)
        rateLimitedCall("prevBar:$ticker") {
            massiveRestClient.get()
                .uri("/v2/aggs/ticker/{ticker}/prev", ticker)
                .retrieve()
                .body(AggResponse::class.java)
                ?.results?.firstOrNull()
        }
    }

    fun getFinancials(ticker: String, timeframe: String = "quarterly", limit: Int = 4): List<FinancialsDto> {
        return cached("financials:$ticker:$timeframe:$limit") {
            log.info("Fetching {} financials for {} (limit={})", timeframe, ticker, limit)
            rateLimitedCall("financials:$ticker:$timeframe") {
                massiveRestClient.get()
                    .uri("/vX/reference/financials?ticker={ticker}&timeframe={timeframe}&limit={limit}", ticker, timeframe, limit)
                    .retrieve()
                    .body(object : ParameterizedTypeReference<MassiveResponse<FinancialsDto>>() {})
                    ?.results.orEmpty()
            }
        } ?: emptyList()
    }

    fun getSma(ticker: String, window: Int = 50): Double? = cached("sma:$ticker:$window") {
        log.info("Fetching SMA({}) for {}", window, ticker)
        rateLimitedCall("sma:$ticker:$window") {
            massiveRestClient.get()
                .uri("/v1/indicators/sma/{ticker}?timespan=day&window={window}&limit=1", ticker, window)
                .retrieve()
                .body(IndicatorResponse::class.java)
                ?.results?.values?.firstOrNull()?.value
        }
    }

    fun getRsi(ticker: String, window: Int = 14): Double? = cached("rsi:$ticker:$window") {
        log.info("Fetching RSI({}) for {}", window, ticker)
        rateLimitedCall("rsi:$ticker:$window") {
            massiveRestClient.get()
                .uri("/v1/indicators/rsi/{ticker}?timespan=day&window={window}&limit=1", ticker, window)
                .retrieve()
                .body(IndicatorResponse::class.java)
                ?.results?.values?.firstOrNull()?.value
        }
    }

    fun getAggregateRange(ticker: String, from: String, to: String): List<AggBarDto> {
        return cached("aggs:$ticker:$from:$to") {
            log.info("Fetching aggregate bars for {} from {} to {}", ticker, from, to)
            rateLimitedCall("aggs:$ticker") {
                massiveRestClient.get()
                    .uri("/v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}?adjusted=true&sort=asc&limit=50000",
                        ticker, from, to)
                    .retrieve()
                    .body(AggResponse::class.java)
                    ?.results.orEmpty()
            }
        } ?: emptyList()
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
