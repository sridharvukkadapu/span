package com.sv.span.scheduler

import com.sv.span.service.DashboardService
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Component
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

/**
 * Scans one ticker per interval for the dashboard leaderboard.
 *
 * Interval is time-of-day aware (Central Time):
 *   - 11 PM – 9 AM CT  →  5 minutes  (off-peak, scan faster)
 *   - 9 AM  – 11 PM CT → 10 minutes  (peak hours, preserve API quota for users)
 *
 * Uses self-rescheduling via TaskScheduler so each run picks the correct
 * next-fire delay based on when it actually executes.
 */
@Component
class DashboardScanScheduler(
    private val dashboardService: DashboardService,
    private val taskScheduler: TaskScheduler,
) {

    private val log = LoggerFactory.getLogger(javaClass)
    private val consecutiveFailures = AtomicInteger(0)
    private val skipsRemaining = AtomicInteger(0)

    companion object {
        private val CT = ZoneId.of("America/Chicago")
        private const val OFF_PEAK_MS      = 5  * 60 * 1000L   // 5 min — 11 PM–9 AM CT
        private const val PEAK_MS          = 10 * 60 * 1000L   // 10 min — 9 AM–11 PM CT
        private const val INITIAL_DELAY_MS = 45_000L
        // On startup, scan this many tickers in parallel to populate the board fast.
        // Uses a bounded thread pool so we don't slam the API with 418 simultaneous requests.
        private const val BURST_TICKERS    = 50
        private const val BURST_THREADS    = 5
    }

    @PostConstruct
    fun start() {
        // Burst scan: fill the board immediately on startup using tickers not already in the board
        taskScheduler.schedule({ burstScan() }, java.time.Instant.now().plusMillis(INITIAL_DELAY_MS))
        // Normal rotation starts after the burst finishes (burst takes ~burst/threads × avg_scan_time)
        taskScheduler.schedule({ run() }, java.time.Instant.now().plusMillis(INITIAL_DELAY_MS + 10 * 60 * 1000L))
    }

    private fun burstScan() {
        val tickers = dashboardService.universe
        if (tickers.isEmpty()) return

        val alreadyCached = dashboardService.cachedSymbols()
        val toScan = tickers.filter { it !in alreadyCached }.take(BURST_TICKERS)
        if (toScan.isEmpty()) {
            log.info("Burst scan skipped — {} tickers already in board", alreadyCached.size)
            return
        }

        log.info("Burst scan starting: {} tickers ({} threads)", toScan.size, BURST_THREADS)
        val pool = Executors.newFixedThreadPool(BURST_THREADS)
        try {
            toScan.forEach { symbol ->
                pool.submit {
                    try {
                        dashboardService.scanTicker(symbol)
                    } catch (e: Exception) {
                        log.warn("Burst scan failed for {}: {}", symbol, e.message)
                    }
                }
            }
        } finally {
            pool.shutdown()
            pool.awaitTermination(9, java.util.concurrent.TimeUnit.MINUTES)
            log.info("Burst scan complete — board now has {} stocks", dashboardService.boardSize())
        }
    }

    private fun run() {
        val skips = skipsRemaining.get()
        if (skips > 0) {
            skipsRemaining.decrementAndGet()
            log.debug("Dashboard scan skipped — cooling down ({} skips remaining)", skips - 1)
        } else {
            try {
                val symbol = dashboardService.scanNext()
                if (symbol == null) {
                    log.debug("Dashboard scan skipped — empty universe")
                } else {
                    consecutiveFailures.set(0)
                }
            } catch (e: Exception) {
                val failures = consecutiveFailures.incrementAndGet()
                val backoffSkips = minOf(1 shl (failures - 1), 8)
                skipsRemaining.set(backoffSkips)
                log.warn("Dashboard scan error ({} consecutive failures, backing off {} cycles): {}",
                    failures, backoffSkips, e.message)
            }
        }

        // Schedule next run using interval appropriate for current CT time
        val nextDelayMs = nextIntervalMs()
        taskScheduler.schedule({ run() }, java.time.Instant.now().plusMillis(nextDelayMs))
    }

    private fun nextIntervalMs(): Long {
        val hour = ZonedDateTime.now(CT).hour
        // Off-peak: 11 PM (23:00) through 8:59 AM (< 9)
        val offPeak = hour >= 23 || hour < 9
        val intervalMs = if (offPeak) OFF_PEAK_MS else PEAK_MS
        log.debug("Next scan in {}min ({})", intervalMs / 60_000, if (offPeak) "off-peak" else "peak")
        return intervalMs
    }
}
