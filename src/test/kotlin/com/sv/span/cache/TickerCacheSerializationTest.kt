package com.sv.span.cache

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.sv.span.model.*
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

/**
 * Verifies that ScreenerResult survives a Jackson round-trip through the L2 cache.
 *
 * Root cause this tests: computed Kotlin get() properties (e.g. fcfMarginFormatted)
 * are serialized as JSON fields but are not constructor parameters, so deserialization
 * throws UnrecognizedFieldException unless FAIL_ON_UNKNOWN_PROPERTIES is disabled.
 */
class TickerCacheSerializationTest {

    private val mapper = jacksonObjectMapper()
        .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)

    private fun minimalResult(symbol: String = "AAPL") = ScreenerResult(
        symbol = symbol,
        companyName = "Apple Inc.",
        signal = Signal.BUY,
        confidence = "HIGH",
        overview = Overview(
            price = 189.0,
            marketCap = 3_000_000_000_000.0,
            sharesOutstanding = 15_500_000_000.0,
            epsTtm = 6.5,
            peRatio = 29.0,
            priceToSales = 7.8,
        ),
        margins = Margins(
            grossMargin = 44.5,
            operatingMargin = 29.8,
            profitMargin = 25.3,
            fcfMargin = 27.1,
        ),
        revenueAnalysis = RevenueAnalysis(
            revenueTtm = 394_000_000_000.0,
            netIncomeTtm = 100_000_000_000.0,
            revenueYears = listOf(AnnualRevenue("2023", 383_000_000_000.0)),
            revenueGrowthYoY = 3.2,
        ),
        balanceSheet = BalanceSheetSummary(
            cashAndShortTermInvestments = 65_000_000_000.0,
            longTermDebt = 95_000_000_000.0,
            totalDebt = 108_000_000_000.0,
            cashToDebtRatio = 0.68,
        ),
        technicals = Technicals(sma50 = 185.0, rsi14 = 58.3, priceVsSma50 = "ABOVE"),
        checks = listOf(
            CheckResult("Revenue Growth", CheckLight.GREEN, "Growing steadily"),
            CheckResult("Debt Level", CheckLight.YELLOW, "Moderate debt"),
        ),
        projection = null,
        summary = "Strong fundamentals with consistent cash generation.",
    )

    @Test
    fun `ScreenerResult round-trips through Jackson without losing data`() {
        val original = minimalResult()

        val json = mapper.writeValueAsString(original)
        val restored = mapper.readValue(json, ScreenerResult::class.java)

        assertEquals(original.symbol, restored.symbol)
        assertEquals(original.signal, restored.signal)
        assertEquals(original.margins.fcfMargin, restored.margins.fcfMargin)
        assertEquals(original.checks.size, restored.checks.size)
    }

    @Test
    fun `ScreenerResult deserializes from JSON that contains stale computed fields`() {
        // Simulate a row written by an older version that serialized computed get() properties.
        // These fields don't exist as constructor params — they must be silently ignored.
        val staleJson = mapper.writeValueAsString(minimalResult()).let { json ->
            // Inject stale fields that old code may have written
            json.replace(
                "\"grossMargin\"",
                "\"fcfMarginFormatted\":\"\$27.10%\",\"roicFormatted\":\"14.50%\",\"grossMargin\""
            )
        }

        // This must not throw UnrecognizedFieldException
        val restored = mapper.readValue(staleJson, ScreenerResult::class.java)

        assertNotNull(restored)
        assertEquals("AAPL", restored.symbol)
        assertEquals(27.1, restored.margins.fcfMargin)
    }

    @Test
    fun `ScreenerResult computed formatted properties are derived correctly after round-trip`() {
        val original = minimalResult()
        val json = mapper.writeValueAsString(original)
        val restored = mapper.readValue(json, ScreenerResult::class.java)

        // Computed properties must still work after deserialization
        assertEquals("27.10%", restored.margins.fcfMarginFormatted)
        assertEquals("\$189.00", restored.overview.priceFormatted)
    }
}
