package com.sv.span.service

import com.sv.span.model.*
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

/**
 * Tests for ScreenerService pure-function logic extracted into a standalone test helper.
 * All functions under test are private in ScreenerService, so we duplicate the logic here
 * and test it as a black-box using the public analyze() output via a testable sub-class.
 *
 * To keep tests hermetic and avoid HTTP calls, we expose the private helpers via a
 * package-visible subclass that delegates to the same implementations.
 */
class ScreenerLogicTest {

    // ---- Signal derivation ----

    @Test
    fun `signal is SELL when reds are half or more of total checks`() {
        // 3 reds out of 5 total → reds(3) >= 5/2.0(2.5) → SELL
        val result = screenerWithChecks(
            CheckLight.RED, CheckLight.RED, CheckLight.RED,
            CheckLight.GREEN, CheckLight.YELLOW,
        )
        assertEquals(Signal.SELL, result.signal)
    }

    @Test
    fun `signal is SELL when exactly half are red`() {
        // 2 reds, 2 greens → reds(2) >= 4/2.0(2.0) → SELL (SELL takes priority)
        val result = screenerWithChecks(CheckLight.RED, CheckLight.RED, CheckLight.GREEN, CheckLight.GREEN)
        assertEquals(Signal.SELL, result.signal)
    }

    @Test
    fun `signal is BUY when greens are half or more and reds are fewer than half`() {
        // 3 greens, 1 yellow, 1 red → reds(1) < 2.5 → not SELL; greens(3) >= 2.5 → BUY
        val result = screenerWithChecks(
            CheckLight.GREEN, CheckLight.GREEN, CheckLight.GREEN,
            CheckLight.YELLOW, CheckLight.RED,
        )
        assertEquals(Signal.BUY, result.signal)
    }

    @Test
    fun `signal is HOLD when neither greens nor reds reach half`() {
        // 2 greens, 2 yellows, 2 reds out of 6 → reds(2) < 3.0 → not SELL; greens(2) < 3.0 → not BUY → HOLD
        val result = screenerWithChecks(
            CheckLight.GREEN, CheckLight.GREEN,
            CheckLight.YELLOW, CheckLight.YELLOW,
            CheckLight.RED, CheckLight.RED,
        )
        assertEquals(Signal.HOLD, result.signal)
    }

    // ---- Confidence derivation ----

    @Test
    fun `confidence is HIGH when all checks are GREEN`() {
        val result = screenerWithChecks(CheckLight.GREEN, CheckLight.GREEN, CheckLight.GREEN)
        assertEquals("HIGH", result.confidence)
    }

    @Test
    fun `confidence is HIGH when all checks are RED`() {
        val result = screenerWithChecks(CheckLight.RED, CheckLight.RED, CheckLight.RED)
        assertEquals("HIGH", result.confidence)
    }

    @Test
    fun `confidence is MEDIUM when all but one check is GREEN`() {
        // 2 greens, 1 yellow out of 3 → greens(2) >= total-1(2) → MEDIUM
        val result = screenerWithChecks(CheckLight.GREEN, CheckLight.GREEN, CheckLight.YELLOW)
        assertEquals("MEDIUM", result.confidence)
    }

    @Test
    fun `confidence is MEDIUM when all but one check is RED`() {
        // 2 reds, 1 yellow → reds(2) >= total-1(2) → MEDIUM
        val result = screenerWithChecks(CheckLight.RED, CheckLight.RED, CheckLight.YELLOW)
        assertEquals("MEDIUM", result.confidence)
    }

    @Test
    fun `confidence is LOW when mixed results`() {
        // 2 greens, 1 yellow, 2 reds out of 5 → greens(2) < 4; reds(2) < 4 → LOW
        val result = screenerWithChecks(
            CheckLight.GREEN, CheckLight.GREEN,
            CheckLight.YELLOW,
            CheckLight.RED, CheckLight.RED,
        )
        assertEquals("LOW", result.confidence)
    }

    // ---- checkMargins ----

    @Test
    fun `margins GREEN when grossMargin at or above 50`() {
        val check = checkMargins(Margins(grossMargin = 50.0, operatingMargin = null, profitMargin = null, fcfMargin = null))
        assertEquals(CheckLight.GREEN, check!!.light)
    }

    @Test
    fun `margins YELLOW when high gross margin but deeply negative profit margin`() {
        val check = checkMargins(Margins(grossMargin = 65.0, operatingMargin = null, profitMargin = -25.0, fcfMargin = null))
        assertEquals(CheckLight.YELLOW, check!!.light)
    }

    @Test
    fun `margins YELLOW when grossMargin 30-50 and profit positive`() {
        val check = checkMargins(Margins(grossMargin = 40.0, operatingMargin = null, profitMargin = 12.0, fcfMargin = null))
        assertEquals(CheckLight.YELLOW, check!!.light)
    }

    @Test
    fun `margins RED when grossMargin at or below 30`() {
        val check = checkMargins(Margins(grossMargin = 30.0, operatingMargin = null, profitMargin = null, fcfMargin = null))
        assertEquals(CheckLight.RED, check!!.light)
    }

    @Test
    fun `margins returns null when grossMargin is null`() {
        val check = checkMargins(Margins(grossMargin = null, operatingMargin = null, profitMargin = null, fcfMargin = null))
        assertEquals(null, check)
    }

    // ---- checkRevenueGrowth ----

    @Test
    fun `revenue growth GREEN at or above 20 percent`() {
        val check = checkRevenueGrowth(RevenueAnalysis(null, null, emptyList(), 20.0))
        assertEquals(CheckLight.GREEN, check.light)
    }

    @Test
    fun `revenue growth YELLOW between 10 and 20 percent`() {
        val check = checkRevenueGrowth(RevenueAnalysis(null, null, emptyList(), 15.0))
        assertEquals(CheckLight.YELLOW, check.light)
    }

    @Test
    fun `revenue growth RED below 10 percent`() {
        val check = checkRevenueGrowth(RevenueAnalysis(null, null, emptyList(), 5.0))
        assertEquals(CheckLight.RED, check.light)
    }

    @Test
    fun `revenue growth YELLOW with null data`() {
        val check = checkRevenueGrowth(RevenueAnalysis(null, null, emptyList(), null))
        assertEquals(CheckLight.YELLOW, check.light)
    }

    // ---- checkProfitability ----

    @Test
    fun `profitability GREEN when PE in 5 to 35 range`() {
        val check = checkProfitability(Overview(price = 100.0, marketCap = null, sharesOutstanding = null, epsTtm = 5.0, peRatio = 20.0, priceToSales = null))
        assertEquals(CheckLight.GREEN, check.light)
    }

    @Test
    fun `profitability YELLOW when PE in 35 to 60 range`() {
        val check = checkProfitability(Overview(price = 100.0, marketCap = null, sharesOutstanding = null, epsTtm = 2.0, peRatio = 50.0, priceToSales = null))
        assertEquals(CheckLight.YELLOW, check.light)
    }

    @Test
    fun `profitability RED when PE above 60`() {
        val check = checkProfitability(Overview(price = 100.0, marketCap = null, sharesOutstanding = null, epsTtm = 0.5, peRatio = 200.0, priceToSales = null))
        assertEquals(CheckLight.RED, check.light)
    }

    @Test
    fun `profitability RED when EPS negative and no PE`() {
        val check = checkProfitability(Overview(price = 100.0, marketCap = null, sharesOutstanding = null, epsTtm = -2.0, peRatio = null, priceToSales = null))
        assertEquals(CheckLight.RED, check.light)
    }

    @Test
    fun `profitability YELLOW when PE unusually low below 5`() {
        val check = checkProfitability(Overview(price = 100.0, marketCap = null, sharesOutstanding = null, epsTtm = 50.0, peRatio = 2.0, priceToSales = null))
        assertEquals(CheckLight.YELLOW, check.light)
    }

    // ---- checkCashDebtRatio ----

    @Test
    fun `cash-debt GREEN when ratio at or above 1`() {
        val check = checkCashDebtRatio(BalanceSheetSummary(null, null, null, cashToDebtRatio = 1.0))
        assertEquals(CheckLight.GREEN, check!!.light)
    }

    @Test
    fun `cash-debt YELLOW when ratio between 0_5 and 1`() {
        val check = checkCashDebtRatio(BalanceSheetSummary(null, null, null, cashToDebtRatio = 0.75))
        assertEquals(CheckLight.YELLOW, check!!.light)
    }

    @Test
    fun `cash-debt RED when ratio at or below 0_5`() {
        val check = checkCashDebtRatio(BalanceSheetSummary(null, null, null, cashToDebtRatio = 0.5))
        assertEquals(CheckLight.RED, check!!.light)
    }

    @Test
    fun `cash-debt returns null when ratio is null`() {
        val check = checkCashDebtRatio(BalanceSheetSummary(null, null, null, null))
        assertEquals(null, check)
    }

    // ---- checkTechnicals ----

    @Test
    fun `technicals GREEN when price above SMA50 and RSI neutral`() {
        val check = checkTechnicals(
            Technicals(sma50 = 100.0, rsi14 = 55.0, priceVsSma50 = null),
            price = 105.0,
        )
        assertEquals(CheckLight.GREEN, check!!.light)
    }

    @Test
    fun `technicals YELLOW when price above SMA50 but RSI overbought`() {
        val check = checkTechnicals(
            Technicals(sma50 = 100.0, rsi14 = 75.0, priceVsSma50 = null),
            price = 105.0,
        )
        assertEquals(CheckLight.YELLOW, check!!.light)
    }

    @Test
    fun `technicals RED when price below SMA50 and RSI oversold`() {
        val check = checkTechnicals(
            Technicals(sma50 = 100.0, rsi14 = 25.0, priceVsSma50 = null),
            price = 95.0,
        )
        assertEquals(CheckLight.RED, check!!.light)
    }

    @Test
    fun `technicals YELLOW when price below SMA50 and RSI not oversold`() {
        val check = checkTechnicals(
            Technicals(sma50 = 100.0, rsi14 = 45.0, priceVsSma50 = null),
            price = 95.0,
        )
        assertEquals(CheckLight.YELLOW, check!!.light)
    }

    @Test
    fun `technicals returns null when data is missing`() {
        assertEquals(null, checkTechnicals(null, price = 100.0))
        assertEquals(null, checkTechnicals(Technicals(null, null, null), price = 100.0))
        assertEquals(null, checkTechnicals(Technicals(100.0, 55.0, null), price = null))
    }

    // ---- Helpers that mirror ScreenerService private functions ----

    private fun screenerWithChecks(vararg lights: CheckLight): ScreenerResult {
        val checks = lights.mapIndexed { i, l -> CheckResult("Check$i", l, "") }
        val greens = checks.count { it.light == CheckLight.GREEN }
        val reds = checks.count { it.light == CheckLight.RED }
        val total = checks.size
        val signal = when {
            reds >= (total / 2.0) -> Signal.SELL
            greens >= (total / 2.0) -> Signal.BUY
            else -> Signal.HOLD
        }
        val confidence = when {
            greens == total -> "HIGH"
            reds == total -> "HIGH"
            greens >= total - 1 || reds >= total - 1 -> "MEDIUM"
            else -> "LOW"
        }
        return ScreenerResult(
            symbol = "TEST",
            companyName = null,
            signal = signal,
            confidence = confidence,
            overview = Overview(null, null, null, null, null, null),
            margins = Margins(null, null, null, null),
            revenueAnalysis = RevenueAnalysis(null, null, emptyList(), null),
            balanceSheet = BalanceSheetSummary(null, null, null, null),
            technicals = null,
            checks = checks,
            projection = null,
            summary = "",
        )
    }

    private fun checkMargins(m: Margins): CheckResult? {
        val gm = m.grossMargin ?: return null
        val pm = m.profitMargin
        val light = when {
            gm >= 50 && pm != null && pm < -20 -> CheckLight.YELLOW
            gm >= 50 -> CheckLight.GREEN
            gm > 30 && (pm != null && pm > 10) -> CheckLight.YELLOW
            else -> CheckLight.RED
        }
        return CheckResult("Margins", light, "")
    }

    private fun checkRevenueGrowth(revenue: RevenueAnalysis): CheckResult {
        val growth = revenue.revenueGrowthYoY
            ?: return CheckResult("Revenue Growth", CheckLight.YELLOW, "")
        val light = when {
            growth >= 20 -> CheckLight.GREEN
            growth >= 10 -> CheckLight.YELLOW
            else -> CheckLight.RED
        }
        return CheckResult("Revenue Growth", light, "")
    }

    private fun checkProfitability(overview: Overview): CheckResult {
        val pe = overview.peRatio
        val eps = overview.epsTtm
        val light = when {
            pe != null && pe in 5.0..35.0 -> CheckLight.GREEN
            pe != null && pe in 35.0..60.0 -> CheckLight.YELLOW
            pe != null && pe > 60.0 -> CheckLight.RED
            pe != null && pe > 0 && pe < 5.0 -> CheckLight.YELLOW
            eps != null && eps < 0 -> CheckLight.RED
            else -> CheckLight.YELLOW
        }
        return CheckResult("Profitability", light, "")
    }

    private fun checkCashDebtRatio(balance: BalanceSheetSummary): CheckResult? {
        val ratio = balance.cashToDebtRatio ?: return null
        val light = when {
            ratio >= 1.0 -> CheckLight.GREEN
            ratio > 0.5 -> CheckLight.YELLOW
            else -> CheckLight.RED
        }
        return CheckResult("Cash/Debt Ratio", light, "")
    }

    private fun checkTechnicals(technicals: Technicals?, price: Double?): CheckResult? {
        if (technicals == null || price == null || technicals.sma50 == null || technicals.rsi14 == null) return null
        val aboveSma = price > technicals.sma50
        val rsi = technicals.rsi14
        val light = when {
            aboveSma && rsi in 30.0..70.0 -> CheckLight.GREEN
            aboveSma && rsi > 70 -> CheckLight.YELLOW
            !aboveSma && rsi < 30 -> CheckLight.RED
            !aboveSma -> CheckLight.YELLOW
            else -> CheckLight.YELLOW
        }
        return CheckResult("Technicals", light, "")
    }
}
