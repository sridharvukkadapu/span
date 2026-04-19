package com.sv.span.cache

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.sv.span.model.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import java.time.Instant
import kotlin.test.assertEquals

/**
 * Unit tests for TickerCacheService cache behavior.
 * Uses mocked repository so no database is required.
 */
class TickerCacheServiceTest {

    private lateinit var repo: TickerCacheRepository
    private lateinit var service: TickerCacheService

    private val mapper = jacksonObjectMapper()
        .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)

    @BeforeEach
    fun setUp() {
        repo = mock()
        service = TickerCacheService(repo, mapper)
    }

    @Test
    fun `getOrCompute returns cached L1 value without calling loader on second call`() {
        var loaderCallCount = 0
        val loader = { loaderCallCount++; "computed-value" }

        // Stub repo to return nothing (force compute on first call)
        whenever(repo.findByNamespaceAndTicker(any(), any())).thenReturn(null)
        whenever(repo.save(any<TickerCacheEntity>())).thenAnswer { it.arguments[0] as TickerCacheEntity }

        val first = service.getOrCompute("test", "AAPL", loader)
        val second = service.getOrCompute("test", "AAPL", loader)

        assertEquals("computed-value", first)
        assertEquals("computed-value", second)
        assertEquals(1, loaderCallCount, "loader must be called exactly once — second call hits L1")
    }

    @Test
    fun `getOrCompute is case-insensitive for ticker keys`() {
        var loaderCallCount = 0
        val loader = { loaderCallCount++; "value" }

        whenever(repo.findByNamespaceAndTicker(any(), any())).thenReturn(null)
        whenever(repo.save(any<TickerCacheEntity>())).thenAnswer { it.arguments[0] as TickerCacheEntity }

        service.getOrCompute("ns", "aapl", loader)
        service.getOrCompute("ns", "AAPL", loader)
        service.getOrCompute("ns", "Aapl", loader)

        assertEquals(1, loaderCallCount, "all three variants must hit the same L1 entry")
    }

    @Test
    fun `getOrCompute calls loader when L1 and L2 are both empty`() {
        var loaderCalled = false
        whenever(repo.findByNamespaceAndTicker(any(), any())).thenReturn(null)
        whenever(repo.save(any<TickerCacheEntity>())).thenAnswer { it.arguments[0] as TickerCacheEntity }

        val result = service.getOrCompute("ns", "TSLA") {
            loaderCalled = true
            "fresh"
        }

        assertEquals("fresh", result)
        assert(loaderCalled)
    }

    @Test
    fun `getOrCompute reads from L2 when L1 is empty and warms L1`() {
        val screenerResult = minimalScreenerResult("MSFT")
        val json = mapper.writeValueAsString(screenerResult)
        val entity = TickerCacheEntity(
            id = 1L,
            namespace = "screener",
            ticker = "MSFT",
            typeName = ScreenerResult::class.java.name,
            payload = json,
            computedAt = Instant.now(),
            expiresAt = Instant.now().plusSeconds(3600),
            computeMs = 1000L,
        )
        whenever(repo.findByNamespaceAndTicker("screener", "MSFT")).thenReturn(entity)

        var loaderCalled = false
        val result = service.getOrCompute("screener", "MSFT") {
            loaderCalled = true
            screenerResult
        }

        assertEquals("MSFT", (result as ScreenerResult).symbol)
        assert(!loaderCalled) { "loader must not be called on L2 hit" }

        // Second call must hit L1 — no additional DB lookup
        service.getOrCompute("screener", "MSFT") { loaderCalled = true; screenerResult }
        assert(!loaderCalled) { "second call must hit L1 without calling loader" }
        verify(repo, times(1)).findByNamespaceAndTicker("screener", "MSFT") // only the first call checks L2
    }

    @Test
    fun `writeToL2 failure does not prevent getOrCompute from returning value`() {
        whenever(repo.findByNamespaceAndTicker(any(), any())).thenReturn(null)
        whenever(repo.save(any<TickerCacheEntity>())).thenThrow(RuntimeException("DB down"))

        // Must return the computed value even when DB write fails
        val result = service.getOrCompute("ns", "ERR") { "ok" }

        assertEquals("ok", result)
    }

    @Test
    fun `evict removes ticker from L1 and calls deleteAllByTicker`() {
        whenever(repo.findByNamespaceAndTicker(any(), any())).thenReturn(null)
        whenever(repo.save(any<TickerCacheEntity>())).thenAnswer { it.arguments[0] as TickerCacheEntity }
        whenever(repo.deleteAllByTicker("AAPL")).thenReturn(2)

        // Warm L1
        service.getOrCompute("screener", "AAPL") { "v1" }
        service.getOrCompute("analyzer", "AAPL") { "v2" }

        val evicted = service.evict("AAPL")

        assert(evicted >= 2) { "should evict at least the 2 L1 entries" }
        assert(!service.isCached("screener", "AAPL"))
        assert(!service.isCached("analyzer", "AAPL"))
    }

    private fun minimalScreenerResult(symbol: String) = ScreenerResult(
        symbol = symbol,
        companyName = "Test Co",
        signal = Signal.HOLD,
        confidence = "MEDIUM",
        overview = Overview(100.0, 1_000_000_000.0, 10_000_000.0, 5.0, 20.0, 2.0),
        margins = Margins(40.0, 20.0, 15.0, 18.0),
        revenueAnalysis = RevenueAnalysis(500_000_000.0, 75_000_000.0, emptyList(), 5.0),
        balanceSheet = BalanceSheetSummary(200_000_000.0, 100_000_000.0, 120_000_000.0, 2.0),
        technicals = null,
        checks = listOf(CheckResult("Test", CheckLight.GREEN, "ok")),
        projection = null,
        summary = "test",
    )
}
