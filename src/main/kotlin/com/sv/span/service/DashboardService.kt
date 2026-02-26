package com.sv.span.service

import com.sv.span.model.CheckLight
import com.sv.span.model.ScreenerResult
import com.sv.span.model.Signal
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * Maintains a slowly-built leaderboard of top stocks by scanning one ticker
 * per minute through the ScreenerService.
 *
 * The scanner rotates through the configured universe. Each successful scan
 * caches the result and computes a composite score. The dashboard serves
 * the top 25 ranked by score at any time — even if only partially populated.
 *
 * Score formula:
 *   +3 per GREEN check, +1 per YELLOW, -2 per RED
 *   +5 bonus for BUY signal, -5 for SELL
 *   +2 for HIGH confidence, +1 for MEDIUM
 *   Tiebreaker: more greens → better, then alphabetical
 */
@Service
class DashboardService(
    private val screenerService: ScreenerService,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    @Value("\${dashboard.tickers:}")
    private lateinit var tickersCsv: String

    /** Scored results keyed by symbol */
    private val board = ConcurrentHashMap<String, ScoredStock>()

    /** Round-robin index into the ticker universe */
    private val cursor = AtomicInteger(0)

    /** When scanning started */
    @Volatile
    private var _scanStartedAt: Instant? = null
    val scanStartedAt: Instant? get() = _scanStartedAt

    /** Total scans completed */
    private val scansCompleted = AtomicInteger(0)

    /** Total scan failures */
    private val scansFailed = AtomicInteger(0)

    val universe: List<String>
        get() = tickersCsv.split(",")
            .map { it.trim().uppercase() }
            .filter { it.isNotBlank() }

    /**
     * Scan the next ticker in the rotation. Called by the scheduler every minute.
     * Returns the symbol scanned (or null if universe is empty).
     */
    fun scanNext(): String? {
        val tickers = universe
        if (tickers.isEmpty()) return null

        if (_scanStartedAt == null) _scanStartedAt = Instant.now()

        val idx = cursor.getAndUpdate { (it + 1) % tickers.size }
        val symbol = tickers[idx]

        try {
            log.info("Dashboard scan [{}/{}]: {}", idx + 1, tickers.size, symbol)
            val result = screenerService.analyze(symbol)
            val score = computeScore(result)
            board[symbol] = ScoredStock(
                result = result,
                score = score,
                scannedAt = Instant.now(),
            )
            scansCompleted.incrementAndGet()
            log.info("Dashboard scan {} complete: score={}, signal={}", symbol, score, result.signal)
        } catch (e: Exception) {
            scansFailed.incrementAndGet()
            log.warn("Dashboard scan failed for {}: {}", symbol, e.message)
        }
        return symbol
    }

    /**
     * Get the top N stocks ranked by composite score (descending).
     */
    fun topN(n: Int = 25): List<ScoredStock> =
        board.values
            .sortedWith(compareByDescending<ScoredStock> { it.score }
                .thenByDescending { it.result.checks.count { c -> c.light == CheckLight.GREEN } }
                .thenBy { it.result.symbol })
            .take(n)

    /**
     * Current scan progress.
     */
    fun status(): DashboardStatus {
        val tickers = universe
        return DashboardStatus(
            universeSize = tickers.size,
            scannedCount = board.size,
            scansCompleted = scansCompleted.get(),
            scansFailed = scansFailed.get(),
            currentIndex = cursor.get() % maxOf(tickers.size, 1),
            nextTicker = tickers.getOrNull(cursor.get() % maxOf(tickers.size, 1)),
            scanStartedAt = scanStartedAt,
            lastScanAt = board.values.maxByOrNull { it.scannedAt }?.scannedAt,
            fullCycleMinutes = tickers.size * 10, // 1 ticker per 10 min
        )
    }

    private fun computeScore(r: ScreenerResult): Int {
        var score = 0

        // Check-based scoring
        for (check in r.checks) {
            score += when (check.light) {
                CheckLight.GREEN -> 3
                CheckLight.YELLOW -> 1
                CheckLight.RED -> -2
            }
        }

        // Signal bonus
        score += when (r.signal) {
            Signal.BUY -> 5
            Signal.SELL -> -5
            Signal.HOLD -> 0
        }

        // Confidence bonus
        score += when (r.confidence) {
            "HIGH" -> 2
            "MEDIUM" -> 1
            else -> 0
        }

        return score
    }
}

data class ScoredStock(
    val result: ScreenerResult,
    val score: Int,
    val scannedAt: Instant,
)

data class DashboardStatus(
    val universeSize: Int,
    val scannedCount: Int,
    val scansCompleted: Int,
    val scansFailed: Int,
    val currentIndex: Int,
    val nextTicker: String?,
    val scanStartedAt: Instant?,
    val lastScanAt: Instant?,
    val fullCycleMinutes: Int,
)
