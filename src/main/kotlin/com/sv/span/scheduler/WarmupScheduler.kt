package com.sv.span.scheduler

import com.sv.span.service.AnalyzerService
import com.sv.span.service.ScreenerService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

/**
 * Periodically pre-warms the cache for popular tickers so users
 * always get instant responses. Runs every 6 hours by default.
 *
 * To keep the Render free-tier instance alive (it sleeps after 15 min idle),
 * pair this with an external pinger like UptimeRobot hitting GET /health
 * every 5 minutes.
 */
@Component
class WarmupScheduler(
    private val screenerService: ScreenerService,
    private val analyzerService: AnalyzerService,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    @Value("\${warmup.tickers:AAPL,MSFT,GOOGL,AMZN,META,NVDA,TSLA}")
    private lateinit var tickersCsv: String

    /**
     * Pre-warm screener + analyzer caches for popular tickers.
     * Runs every 6 hours (offset 30s after startup to avoid boot contention).
     */
    @Scheduled(fixedRate = 6 * 60 * 60 * 1000, initialDelay = 30_000)
    fun warmCache() {
        val tickers = tickersCsv.split(",").map { it.trim().uppercase() }.filter { it.isNotBlank() }
        log.info("Cache warmup starting for {} tickers: {}", tickers.size, tickers)

        var success = 0
        var failed = 0
        for (ticker in tickers) {
            try {
                screenerService.analyze(ticker)
                analyzerService.analyze(ticker)
                success++
                log.info("Warmed {} ({}/{})", ticker, success + failed, tickers.size)
            } catch (e: Exception) {
                failed++
                log.warn("Warmup failed for {}: {}", ticker, e.message)
            }
        }
        log.info("Cache warmup complete: {} succeeded, {} failed", success, failed)
    }
}
