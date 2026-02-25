package com.sv.span.scheduler

import com.sv.span.service.DashboardService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

/**
 * Scans one ticker per minute for the dashboard leaderboard.
 *
 * At ~1 ticker/min (Massive free tier = 5 API calls, screener uses 5),
 * a universe of 100 tickers completes a full rotation every ~100 minutes.
 * Results are cached 24h in ScreenerService, so repeat scans are cheap
 * until the cache expires.
 */
@Component
class DashboardScanScheduler(
    private val dashboardService: DashboardService,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    /**
     * Scan the next ticker every 60 seconds. Initial delay of 45s to let
     * application fully boot and warmup scheduler get a head start.
     */
    @Scheduled(fixedRateString = "\${dashboard.scan.interval-ms:60000}", initialDelay = 45_000)
    fun scanNext() {
        try {
            val symbol = dashboardService.scanNext()
            if (symbol == null) {
                log.debug("Dashboard scan skipped — empty universe")
            }
        } catch (e: Exception) {
            log.error("Dashboard scan scheduler error: {}", e.message, e)
        }
    }
}
