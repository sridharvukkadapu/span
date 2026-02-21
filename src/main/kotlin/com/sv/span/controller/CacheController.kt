package com.sv.span.controller

import com.sv.span.cache.TickerCacheService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Health check — returns instantly, used by external pingers (UptimeRobot)
 * to keep the Render free-tier instance alive.
 */
@RestController
class HealthController {
    @GetMapping("/health")
    fun health(): ResponseEntity<Map<String, Any>> =
        ResponseEntity.ok(mapOf("status" to "up", "ts" to System.currentTimeMillis()))
}

/**
 * Cache management API for diagnostics and manual refresh.
 */
@RestController
@RequestMapping("/api/v1/cache")
class CacheController(private val cacheService: TickerCacheService) {

    /** Cache statistics — hit rate, entries, etc. */
    @GetMapping("/stats")
    fun stats(): ResponseEntity<Map<String, Any>> =
        ResponseEntity.ok(cacheService.stats())

    /** Evict cached results for a specific ticker */
    @DeleteMapping("/{ticker}")
    fun evict(@PathVariable ticker: String): ResponseEntity<Map<String, Any>> {
        val count = cacheService.evict(ticker)
        return ResponseEntity.ok(mapOf("evicted" to count, "ticker" to ticker.uppercase()))
    }

    /** Evict all cached results */
    @DeleteMapping
    fun evictAll(): ResponseEntity<Map<String, Any>> {
        val count = cacheService.evictAll()
        return ResponseEntity.ok(mapOf("evicted" to count))
    }
}
