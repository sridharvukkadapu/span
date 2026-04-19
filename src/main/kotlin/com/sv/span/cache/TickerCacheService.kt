package com.sv.span.cache

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

/**
 * Two-tier cache: in-memory (L1) + PostgreSQL JSONB (L2).
 *
 * Read path:  L1 hit → return immediately
 *             L1 miss → check L2 (DB); if valid, warm L1 and return
 *             L2 miss → compute, write to L1 + L2, return
 *
 * This ensures the cache survives backend restarts and deployments.
 * L2 uses the same 24-hour TTL so stale rows are never served.
 */
@Component
class TickerCacheService(
    private val repo: TickerCacheRepository,
    private val mapper: ObjectMapper,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    data class CacheEntry(
        val value: Any,
        val expiresAt: Long,
        val computedAt: Instant,
        val computeTimeMs: Long,
    )

    private val memory = ConcurrentHashMap<String, CacheEntry>()
    private val hits   = AtomicLong(0)
    private val misses = AtomicLong(0)

    companion object {
        private const val TTL_MS = 24 * 60 * 60 * 1000L
    }

    @Suppress("UNCHECKED_CAST")
    @Transactional
    fun <T : Any> getOrCompute(namespace: String, key: String, loader: () -> T): T {
        val cacheKey = "$namespace:${key.uppercase()}"
        val ticker   = key.uppercase()
        val now      = System.currentTimeMillis()

        // ── L1: in-memory ──────────────────────────────────────────────
        memory[cacheKey]?.let { entry ->
            if (entry.expiresAt > now) {
                hits.incrementAndGet()
                log.info("⚡ L1 HIT  [{}] — computed {} ({}ms)", cacheKey, entry.computedAt, entry.computeTimeMs)
                return entry.value as T
            }
        }

        // ── L2: database ───────────────────────────────────────────────
        repo.findByNamespaceAndTicker(namespace, ticker)?.let { row ->
            if (row.expiresAt.isAfter(Instant.now())) {
                try {
                    val type = Class.forName(row.typeName)
                    @Suppress("UNCHECKED_CAST")
                    val value = mapper.readValue(row.payload, type) as T
                    val expiresMs = row.expiresAt.toEpochMilli()
                    memory[cacheKey] = CacheEntry(value, expiresMs, row.computedAt, row.computeMs)
                    hits.incrementAndGet()
                    log.info("💾 L2 HIT  [{}] — computed {} ({}ms), warmed L1", cacheKey, row.computedAt, row.computeMs)
                    return value
                } catch (ex: Exception) {
                    log.warn("L2 deserialize failed [{}]: {}", cacheKey, ex.message)
                }
            }
        }

        // ── Compute + persist ──────────────────────────────────────────
        misses.incrementAndGet()
        log.info("Cache MISS [{}] — computing fresh…", cacheKey)
        val start   = System.currentTimeMillis()
        val value   = loader()
        val elapsed = System.currentTimeMillis() - start
        val expiresAt = Instant.ofEpochMilli(now + TTL_MS)
        val computedAt = Instant.now()

        // Write L1
        memory[cacheKey] = CacheEntry(value, now + TTL_MS, computedAt, elapsed)

        // Write L2
        try {
            val json     = mapper.writeValueAsString(value)
            val typeName = value::class.java.name
            val existing = repo.findByNamespaceAndTicker(namespace, ticker)
            if (existing != null) {
                repo.save(existing.copy(typeName = typeName, payload = json,
                    computedAt = computedAt, expiresAt = expiresAt, computeMs = elapsed))
            } else {
                repo.save(TickerCacheEntity(namespace = namespace, ticker = ticker,
                    typeName = typeName, payload = json,
                    computedAt = computedAt, expiresAt = expiresAt, computeMs = elapsed))
            }
            log.info("Cached [{}] to DB — {}ms, expires {}", cacheKey, elapsed, expiresAt)
        } catch (ex: Exception) {
            log.warn("Failed to persist cache [{}] to DB: {}", cacheKey, ex.message)
        }

        return value
    }

    fun isCached(namespace: String, key: String): Boolean {
        val entry = memory["$namespace:${key.uppercase()}"] ?: return false
        return entry.expiresAt > System.currentTimeMillis()
    }

    fun getEntry(namespace: String, key: String): CacheEntry? {
        val entry = memory["$namespace:${key.uppercase()}"] ?: return null
        return if (entry.expiresAt > System.currentTimeMillis()) entry else null
    }

    @Transactional
    fun evict(ticker: String): Int {
        val upper = ticker.uppercase()
        val keys = memory.keys.filter { it.endsWith(":$upper") }
        keys.forEach { memory.remove(it) }
        val dbRows = try { repo.deleteAllByTicker(upper) } catch (ex: Exception) { 0 }
        if (keys.isNotEmpty() || dbRows > 0)
            log.info("Evicted {} L1 + {} L2 entries for {}", keys.size, dbRows, upper)
        return keys.size + dbRows
    }

    @Transactional
    fun evictAll(): Int {
        val size = memory.size
        memory.clear()
        hits.set(0)
        misses.set(0)
        val dbRows = try { val n = repo.count().toInt(); repo.deleteAll(); n } catch (ex: Exception) { 0 }
        log.info("Evicted all {} L1 + {} L2 cache entries", size, dbRows)
        return size + dbRows
    }

    fun stats(): Map<String, Any> {
        val totalRequests = hits.get() + misses.get()
        val now = System.currentTimeMillis()
        return mapOf(
            "entries" to memory.size,
            "hits"    to hits.get(),
            "misses"  to misses.get(),
            "hitRate" to if (totalRequests > 0)
                "%.1f%%".format(hits.get() * 100.0 / totalRequests)
            else "N/A",
            "cached"  to memory.entries
                .filter { it.value.expiresAt > now }
                .map { (k, v) ->
                    mapOf(
                        "key"          to k,
                        "computedAt"   to v.computedAt.toString(),
                        "computeTimeMs" to v.computeTimeMs,
                    )
                },
        )
    }
}
