package com.sv.span.scheduler

import com.sv.span.service.DashboardService
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Component
import java.time.ZoneId
import java.time.ZonedDateTime
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
        private const val OFF_PEAK_MS  = 5  * 60 * 1000L   // 5 min — 11 PM–9 AM CT
        private const val PEAK_MS      = 10 * 60 * 1000L   // 10 min — 9 AM–11 PM CT
        private const val INITIAL_DELAY_MS = 45_000L
    }

    @PostConstruct
    fun start() {
        taskScheduler.schedule({ run() }, java.time.Instant.now().plusMillis(INITIAL_DELAY_MS))
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
