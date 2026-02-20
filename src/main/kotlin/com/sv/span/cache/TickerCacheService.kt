package com.sv.span.cache

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

/**
 * Centralized, thread-safe, in-memory cache for end-of-day market data.
 *
 * EOD data doesn't change intraday, so we cache aggressively with a 24-hour TTL.
 * This eliminates redundant API calls and re-computation for repeat requests.
 *
 * Two-tier design:
 *  - **Service tier**: caches final [BacktestResult] / [ScreenerResult] (highest impact)
 *  - **Client tier**: each API client caches raw responses (secondary, handled independently)
 *
 * Cache is keyed as `namespace:TICKER` (e.g. `backtest:AAPL`, `screener:META`).
 */
@Component
class TickerCacheService {

    private val log = LoggerFactory.getLogger(javaClass)

    data class CacheEntry(
        val value: Any,
        val expiresAt: Long,
        val computedAt: Instant,
        val computeTimeMs: Long,
    )

    private val cache = ConcurrentHashMap<String, CacheEntry>()
    private val hits = AtomicLong(0)
    private val misses = AtomicLong(0)

    companion object {
        /** 24-hour TTL — EOD data is static until next market close */
        private const val TTL_MS = 24 * 60 * 60 * 1000L
    }

    /**
     * Returns a cached value if present and not expired, otherwise invokes [loader],
     * caches the result, and returns it.
     *
     * @param namespace logical group (e.g. "backtest", "screener")
     * @param key       ticker symbol
     * @param loader    expensive computation to cache
     * @return the cached or freshly-computed value
     */
    @Suppress("UNCHECKED_CAST")
    fun <T : Any> getOrCompute(namespace: String, key: String, loader: () -> T): T {
        val cacheKey = "$namespace:${key.uppercase()}"
        val now = System.currentTimeMillis()

        cache[cacheKey]?.let { entry ->
            if (entry.expiresAt > now) {
                hits.incrementAndGet()
                log.info("⚡ Cache HIT  [{}] — computed {} ({}ms), serving instantly",
                    cacheKey, entry.computedAt, entry.computeTimeMs)
                return entry.value as T
            }
        }

        misses.incrementAndGet()
        log.info("Cache MISS [{}] — computing fresh…", cacheKey)
        val start = System.currentTimeMillis()
        val value = loader()
        val elapsed = System.currentTimeMillis() - start
        cache[cacheKey] = CacheEntry(value, now + TTL_MS, Instant.now(), elapsed)
        log.info("Cached [{}] — computation took {}ms", cacheKey, elapsed)
        return value
    }

    /** True if a non-expired entry exists for this namespace + key */
    fun isCached(namespace: String, key: String): Boolean {
        val entry = cache["$namespace:${key.uppercase()}"] ?: return false
        return entry.expiresAt > System.currentTimeMillis()
    }

    /** Returns the timestamp when the cached value was computed, or null if not cached */
    fun getEntry(namespace: String, key: String): CacheEntry? {
        val entry = cache["$namespace:${key.uppercase()}"] ?: return null
        return if (entry.expiresAt > System.currentTimeMillis()) entry else null
    }

    /** Evict all cached entries for a specific ticker (across all namespaces) */
    fun evict(ticker: String): Int {
        val upper = ticker.uppercase()
        val keys = cache.keys.filter { it.endsWith(":$upper") }
        keys.forEach { cache.remove(it) }
        if (keys.isNotEmpty()) log.info("Evicted {} cache entries for {}", keys.size, upper)
        return keys.size
    }

    /** Evict everything and reset counters */
    fun evictAll(): Int {
        val size = cache.size
        cache.clear()
        hits.set(0)
        misses.set(0)
        log.info("Evicted all {} cache entries", size)
        return size
    }

    /** Diagnostic snapshot of cache state */
    fun stats(): Map<String, Any> {
        val totalRequests = hits.get() + misses.get()
        val now = System.currentTimeMillis()
        return mapOf(
            "entries" to cache.size,
            "hits" to hits.get(),
            "misses" to misses.get(),
            "hitRate" to if (totalRequests > 0)
                "%.1f%%".format(hits.get() * 100.0 / totalRequests)
            else "N/A",
            "cached" to cache.entries
                .filter { it.value.expiresAt > now }
                .map { (k, v) ->
                    mapOf(
                        "key" to k,
                        "computedAt" to v.computedAt.toString(),
                        "computeTimeMs" to v.computeTimeMs,
                    )
                },
        )
    }
}
