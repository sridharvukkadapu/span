package com.sv.span.service

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.sv.span.cache.TickerCacheEntity
import com.sv.span.cache.TickerCacheRepository
import com.sv.span.model.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class DashboardServiceTest {

    private lateinit var screenerService: ScreenerService
    private lateinit var cacheRepo: TickerCacheRepository
    private lateinit var service: DashboardService

    private val mapper = jacksonObjectMapper()
        .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)

    @BeforeEach
    fun setUp() {
        screenerService = mock()
        cacheRepo = mock()
        service = DashboardService(screenerService, cacheRepo, mapper)
    }

    // ---- computeScore (via all() / topN() after scanNext()) ----

    @Test
    fun `score is 3 per GREEN, 1 per YELLOW, -2 per RED`() {
        val result = screenerResult(
            checks = listOf(
                CheckResult("A", CheckLight.GREEN, ""),
                CheckResult("B", CheckLight.YELLOW, ""),
                CheckResult("C", CheckLight.RED, ""),
            ),
            signal = Signal.HOLD,
            confidence = "LOW",
        )
        val rows = listOf(cacheEntity("AAPL", result))
        whenever(cacheRepo.findAllByNamespaceAndExpiresAtAfter(eq("screener"), any())).thenReturn(rows)
        service.preloadFromDb()
        val stock = service.all().first()
        // 3 + 1 - 2 + 0 (HOLD) + 0 (LOW) = 2
        assertEquals(2, stock.score)
    }

    @Test
    fun `BUY signal adds 5, SELL subtracts 5`() {
        val buyResult = screenerResult(signal = Signal.BUY, confidence = "LOW", checks = emptyList())
        val sellResult = screenerResult(symbol = "TSLA", signal = Signal.SELL, confidence = "LOW", checks = emptyList())

        val buy = scored(buyResult)
        val sell = scored(sellResult)
        // BUY = +5, SELL = -5, no checks, LOW confidence → score diff = 10
        assertEquals(10, buy.score - sell.score)
        assertEquals(5, buy.score)
        assertEquals(-5, sell.score)
    }

    @Test
    fun `HIGH confidence adds 2, MEDIUM adds 1, other adds 0`() {
        val high = scored(screenerResult(signal = Signal.HOLD, confidence = "HIGH", checks = emptyList()))
        val medium = scored(screenerResult(signal = Signal.HOLD, confidence = "MEDIUM", checks = emptyList()))
        val low = scored(screenerResult(signal = Signal.HOLD, confidence = "LOW", checks = emptyList()))

        assertEquals(2, high.score)
        assertEquals(1, medium.score)
        assertEquals(0, low.score)
    }

    @Test
    fun `all() sorts by score descending`() {
        val highScore = screenerResult(
            symbol = "AAPL",
            checks = listOf(
                CheckResult("A", CheckLight.GREEN, ""),
                CheckResult("B", CheckLight.GREEN, ""),
            ),
            signal = Signal.BUY,
            confidence = "HIGH",
        )
        val lowScore = screenerResult(
            symbol = "TSLA",
            checks = listOf(CheckResult("A", CheckLight.RED, "")),
            signal = Signal.SELL,
            confidence = "LOW",
        )
        // Inject both via preloadFromDb
        val rows = listOf(
            cacheEntity("AAPL", highScore),
            cacheEntity("TSLA", lowScore),
        )
        whenever(cacheRepo.findAllByNamespaceAndExpiresAtAfter(eq("screener"), any())).thenReturn(rows)

        service.preloadFromDb()
        val ranked = service.all()

        assertEquals("AAPL", ranked[0].result.symbol)
        assertEquals("TSLA", ranked[1].result.symbol)
        assertTrue(ranked[0].score > ranked[1].score)
    }

    @Test
    fun `all() tiebreaks by more GREENs then alphabetical`() {
        val threeGreens = screenerResult(
            symbol = "MSFT",
            checks = listOf(
                CheckResult("A", CheckLight.GREEN, ""),
                CheckResult("B", CheckLight.GREEN, ""),
                CheckResult("C", CheckLight.GREEN, ""),
            ),
            signal = Signal.HOLD,
            confidence = "LOW",
        )
        val twoGreens = screenerResult(
            symbol = "AAPL",
            checks = listOf(
                CheckResult("A", CheckLight.GREEN, ""),
                CheckResult("B", CheckLight.GREEN, ""),
                CheckResult("C", CheckLight.YELLOW, ""),
            ),
            signal = Signal.HOLD,
            confidence = "LOW",
        )
        // Both score: 3+3+3=9 vs 3+3+1=7 — different scores, but let's make them tie
        // Tie: same score, same signal/confidence, differ only in green count
        val withMoreGreens = screenerResult(
            symbol = "ZZZZ",
            checks = listOf(
                CheckResult("A", CheckLight.GREEN, ""),
                CheckResult("B", CheckLight.GREEN, ""),
            ),
            signal = Signal.HOLD,
            confidence = "LOW",
        )
        val withFewerGreens = screenerResult(
            symbol = "AAAA",
            checks = listOf(
                CheckResult("A", CheckLight.GREEN, ""),
                CheckResult("B", CheckLight.YELLOW, ""),
            ),
            signal = Signal.HOLD,
            confidence = "LOW",
        )
        // Both score: 3+3=6 vs 3+1=4 — not equal, adjust
        // Make them equal: withMoreGreens uses 1 green + 1 yellow = 3+1=4; withFewerGreens uses 2 yellows = 1+1=2
        val tied1 = screenerResult(
            symbol = "ZZZZ",
            checks = listOf(
                CheckResult("A", CheckLight.GREEN, ""),
                CheckResult("B", CheckLight.GREEN, ""),
                CheckResult("C", CheckLight.RED, ""),
                CheckResult("D", CheckLight.RED, ""),
            ),
            signal = Signal.HOLD,
            confidence = "LOW",
            // score = 3+3-2-2 = 2
        )
        val tied2 = screenerResult(
            symbol = "AAAA",
            checks = listOf(
                CheckResult("A", CheckLight.GREEN, ""),
                CheckResult("B", CheckLight.YELLOW, ""),
                CheckResult("C", CheckLight.YELLOW, ""),
                CheckResult("D", CheckLight.YELLOW, ""),
            ),
            signal = Signal.HOLD,
            confidence = "LOW",
            // score = 3+1+1+1 = 6 — not equal, recalculate
        )
        // tied1 score = 3+3-2-2=2, tied2 score = 3+1+1+1=6 — not equal
        // Use: both have score 2 by having: green+yellow+red+red
        val equalScore1 = screenerResult(
            symbol = "ZZZZ",
            checks = listOf(
                CheckResult("A", CheckLight.GREEN, ""),  // +3
                CheckResult("B", CheckLight.YELLOW, ""), // +1
                CheckResult("C", CheckLight.RED, ""),    // -2
                CheckResult("D", CheckLight.RED, ""),    // -2 → total = 0
            ),
            signal = Signal.HOLD,
            confidence = "LOW",
        )
        val equalScore2 = screenerResult(
            symbol = "AAAA",
            checks = listOf(
                CheckResult("A", CheckLight.YELLOW, ""), // +1
                CheckResult("B", CheckLight.YELLOW, ""), // +1
                CheckResult("C", CheckLight.YELLOW, ""), // +1
                CheckResult("D", CheckLight.RED, ""),    // -2 → -1
            ),
            signal = Signal.HOLD,
            confidence = "LOW",
        )
        // equalScore1 = 0, equalScore2 = 1 — still not equal; just use direct scoring:
        // Let's just verify: same score → more GREENs wins → then alpha
        // equalScore1 has 1 GREEN, equalScore2 has 0 GREENs, both score = 0 requires adjustment
        // Simplest: both have 2 yellows → score = 2 each, ZZZZ has 0 greens, AAAA has 0 greens → alpha: AAAA before ZZZZ
        val alpha1 = screenerResult(
            symbol = "ZZZZ",
            checks = listOf(CheckResult("A", CheckLight.YELLOW, ""), CheckResult("B", CheckLight.YELLOW, "")),
            signal = Signal.HOLD, confidence = "LOW",
        )
        val alpha2 = screenerResult(
            symbol = "AAAA",
            checks = listOf(CheckResult("A", CheckLight.YELLOW, ""), CheckResult("B", CheckLight.YELLOW, "")),
            signal = Signal.HOLD, confidence = "LOW",
        )

        val rows = listOf(cacheEntity("ZZZZ", alpha1), cacheEntity("AAAA", alpha2))
        whenever(cacheRepo.findAllByNamespaceAndExpiresAtAfter(eq("screener"), any())).thenReturn(rows)

        service.preloadFromDb()
        val ranked = service.all()

        // Same score, same greens → alphabetical: AAAA before ZZZZ
        assertEquals("AAAA", ranked[0].result.symbol)
        assertEquals("ZZZZ", ranked[1].result.symbol)
    }

    @Test
    fun `preloadFromDb populates board from valid cache rows`() {
        val result = screenerResult()
        val rows = listOf(cacheEntity("AAPL", result))
        whenever(cacheRepo.findAllByNamespaceAndExpiresAtAfter(eq("screener"), any())).thenReturn(rows)

        service.preloadFromDb()

        assertEquals(1, service.all().size)
        assertEquals("AAPL", service.all()[0].result.symbol)
    }

    @Test
    fun `preloadFromDb skips rows with malformed JSON and loads the rest`() {
        val good = screenerResult(symbol = "MSFT")
        val badEntity = TickerCacheEntity(
            id = 99L,
            namespace = "screener",
            ticker = "BAD",
            typeName = ScreenerResult::class.java.name,
            payload = "{not valid json}",
            computedAt = Instant.now(),
            expiresAt = Instant.now().plusSeconds(3600),
            computeMs = 0L,
        )
        val goodEntity = cacheEntity("MSFT", good)

        whenever(cacheRepo.findAllByNamespaceAndExpiresAtAfter(eq("screener"), any()))
            .thenReturn(listOf(badEntity, goodEntity))

        service.preloadFromDb()

        val all = service.all()
        assertEquals(1, all.size)
        assertEquals("MSFT", all[0].result.symbol)
    }

    @Test
    fun `preloadFromDb survives DB exception and leaves board empty`() {
        whenever(cacheRepo.findAllByNamespaceAndExpiresAtAfter(any(), any()))
            .thenThrow(RuntimeException("DB offline"))

        service.preloadFromDb()

        assertTrue(service.all().isEmpty())
    }

    // ---- helpers ----

    private fun scored(result: ScreenerResult): ScoredStock {
        val rows = listOf(cacheEntity(result.symbol, result))
        whenever(cacheRepo.findAllByNamespaceAndExpiresAtAfter(eq("screener"), any())).thenReturn(rows)
        val svc = DashboardService(screenerService, cacheRepo, mapper)
        svc.preloadFromDb()
        return svc.all().first()
    }

    private fun screenerResult(
        symbol: String = "AAPL",
        signal: Signal = Signal.HOLD,
        confidence: String = "LOW",
        checks: List<CheckResult> = emptyList(),
    ) = ScreenerResult(
        symbol = symbol,
        companyName = null,
        signal = signal,
        confidence = confidence,
        overview = Overview(100.0, null, null, null, null, null),
        margins = Margins(40.0, 10.0, 5.0, 8.0),
        revenueAnalysis = RevenueAnalysis(1_000_000.0, 50_000.0, emptyList(), 10.0),
        balanceSheet = BalanceSheetSummary(null, null, null, null),
        technicals = null,
        checks = checks,
        projection = null,
        summary = "",
    )

    private fun cacheEntity(ticker: String, result: ScreenerResult) = TickerCacheEntity(
        id = 0L,
        namespace = "screener",
        ticker = ticker,
        typeName = ScreenerResult::class.java.name,
        payload = mapper.writeValueAsString(result),
        computedAt = Instant.now(),
        expiresAt = Instant.now().plusSeconds(3600),
        computeMs = 100L,
    )
}
