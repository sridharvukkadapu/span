package com.sv.span.scheduler

import com.sv.span.service.DashboardService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.util.concurrent.atomic.AtomicInteger

/**
 * Scans one ticker per interval for the dashboard leaderboard.
 *
 * Runs every 90 seconds (leaves ~30s/cycle free for user requests, since a
 * screener scan takes 5 API calls and Massive allows 5/min).
 *
 * If consecutive failures occur (usually 429 rate-limits), the scheduler
 * doubles its backoff skips before retrying.
 */
@Component
class DashboardScanScheduler(
    private val dashboardService: DashboardService,
) {

    private val log = LoggerFactory.getLogger(javaClass)
    private val consecutiveFailures = AtomicInteger(0)
    private val skipsRemaining = AtomicInteger(0)

    /**
     * Scan the next ticker every 90 seconds. Initial delay of 45s to let
     * application fully boot and warmup scheduler get a head start.
     */
    @Scheduled(fixedRateString = "\${dashboard.scan.interval-ms:90000}", initialDelay = 45_000)
    fun scanNext() {
        // Backoff: skip this cycle if we're in a cooldown from previous failures
        val skips = skipsRemaining.get()
        if (skips > 0) {
            skipsRemaining.decrementAndGet()
            log.debug("Dashboard scan skipped — cooling down ({} skips remaining)", skips - 1)
            return
        }

        try {
            val symbol = dashboardService.scanNext()
            if (symbol == null) {
                log.debug("Dashboard scan skipped — empty universe")
            } else {
                // Success: reset failure counter
                consecutiveFailures.set(0)
            }
        } catch (e: Exception) {
            val failures = consecutiveFailures.incrementAndGet()
            // Exponential backoff: skip 1, 2, 4, 8… cycles (capped at 8 = ~12 min)
            val backoffSkips = minOf(1 shl (failures - 1), 8)
            skipsRemaining.set(backoffSkips)
            log.warn("Dashboard scan error ({} consecutive failures, backing off {} cycles): {}",
                failures, backoffSkips, e.message)
        }
    }
}
