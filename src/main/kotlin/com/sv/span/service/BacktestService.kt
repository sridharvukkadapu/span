package com.sv.span.service

import com.sv.span.provider.DailyBar
import com.sv.span.provider.MarketDataProvider
import com.sv.span.provider.QuarterlyFinancial
import com.sv.span.model.*
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import java.time.LocalDate
import kotlin.math.abs
import kotlin.math.round

/**
 * 5-year backtesting engine.
 *
 * Uses the [MarketDataProvider] strategy interface so the data source
 * (FMP, Massive, etc.) can be swapped via configuration without any
 * code changes here.
 */
@Service
class BacktestService(
    @Qualifier("backtestMarketDataProvider") private val provider: MarketDataProvider,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun backtest(ticker: String, yearsBack: Int = 5): BacktestResult {
        val symbol = ticker.uppercase()
        val endDate = LocalDate.now()
        val startDate = endDate.minusYears(yearsBack.toLong())

        log.info("═══════════════════════════════════════════════")
        log.info("Starting {}-year backtest for {} ({} → {})", yearsBack, symbol, startDate, endDate)
        log.info("Data provider: {}", provider.providerName)
        log.info("═══════════════════════════════════════════════")

        // 1. Fetch daily bars
        val bars = provider.getDailyBars(symbol, startDate.toString(), endDate.toString())
        if (bars.isEmpty()) {
            log.error("No price data returned by {} for {}", provider.providerName, symbol)
            throw RuntimeException("No price data available for $symbol from ${provider.providerName}")
        }
        log.info("Loaded {} daily bars for {} (first={}, last={})",
            bars.size, symbol, bars.first().date, bars.last().date)

        // 2. Fetch quarterly financials
        val allFinancials = provider.getQuarterlyFinancials(symbol, 40) // 40 quarters = ~10 years of coverage
            .map { fin ->
                val effectiveFiling = fin.filingDate
                    ?: fin.endDate.let {
                        LocalDate.parse(it).plusDays(60).toString()  // estimate Q4/10-K filing lag
                    }
                fin to effectiveFiling
            }
            .sortedBy { it.second }

        log.info("Loaded {} financials for {} (earliest={}, latest={})",
            allFinancials.size, symbol,
            allFinancials.firstOrNull()?.second ?: "N/A",
            allFinancials.lastOrNull()?.second ?: "N/A")

        // Detect whether data is annual (FY) or quarterly
        val isAnnual = allFinancials.any { it.first.fiscalPeriod?.uppercase() == "FY" }
        val windowSize = if (isAnnual) 1 else 4  // annual: each record IS TTM; quarterly: sum 4
        log.info("Financial data mode: {} (windowSize={})", if (isAnnual) "ANNUAL" else "QUARTERLY", windowSize)

        // 3. Company profile
        val profile = provider.getCompanyProfile(symbol)
        if (profile == null) {
            log.error("No company profile found for {} via {}", symbol, provider.providerName)
            throw RuntimeException("Company profile not available for $symbol")
        }
        log.info("Company: {} | Shares outstanding: {}", profile.name, profile.sharesOutstanding)

        // Build date-indexed price map
        val barsByDate = bars.associateBy { it.date }
        val sortedDates = barsByDate.keys.sorted()

        // 4. Generate signal events at each filing date
        val filingDates = allFinancials
            .map { it.second }
            .distinct()
            .filter { it >= startDate.toString() }
            .sorted()

        log.info("Processing {} filing dates within backtest window", filingDates.size)

        data class SignalEvent(val date: String, val signal: Signal, val checksSummary: String)
        val signalEvents = mutableListOf<SignalEvent>()

        for (filingDate in filingDates) {
            val availableFinancials = allFinancials
                .filter { it.second <= filingDate }
                .map { it.first }
                .sortedByDescending { it.endDate }

            if (availableFinancials.size < windowSize + 1) {
                log.debug("Skipping filing date {} — only {} records available (need {})", filingDate, availableFinancials.size, windowSize + 1)
                continue
            }

            val recentQuarters = availableFinancials.take(windowSize)
            val priorQuarters = availableFinancials.drop(windowSize).take(windowSize)

            // Find closest trading day on or after filing date
            val tradeDate = sortedDates.firstOrNull { it >= filingDate } ?: continue
            val closingPrice = barsByDate[tradeDate]?.close ?: continue
            val shares = profile.sharesOutstanding ?: continue

            // Compute metrics
            val ttmRevenue = recentQuarters.mapNotNull { it.revenue }.sum().takeIf { it != 0.0 }
            val ttmNetIncome = recentQuarters.mapNotNull { it.netIncome }.sum()
            val ttmEps = if (shares > 0) round2(ttmNetIncome / shares) else null
            val marketCap = closingPrice * shares
            val priceToSales = if (ttmRevenue != null && ttmRevenue > 0) round2(marketCap / ttmRevenue) else null

            // Margins
            val totalRevenue = recentQuarters.mapNotNull { it.revenue }.sum().takeIf { it != 0.0 }
            val grossProfit = recentQuarters.mapNotNull { it.grossProfit }.sum()
            val netIncome = recentQuarters.mapNotNull { it.netIncome }.sum()
            val opCF = recentQuarters.mapNotNull { it.operatingCashFlow }.sum()
            val capex = recentQuarters.mapNotNull { it.capitalExpenditure }.sum()
            val fcf = opCF + capex   // capex is typically negative

            val grossMargin = safePercent(grossProfit, totalRevenue)
            val profitMargin = safePercent(netIncome, totalRevenue)
            val fcfMargin = if (totalRevenue != null) round2(fcf / totalRevenue * 100) else null

            // Revenue growth (YoY: recent 4Q vs prior 4Q)
            val priorRevenue = priorQuarters.mapNotNull { it.revenue }.sum().takeIf { it != 0.0 }
            val growthYoY = if (ttmRevenue != null && priorRevenue != null) {
                round2((ttmRevenue - priorRevenue) / priorRevenue * 100)
            } else null

            // Balance sheet
            val latest = recentQuarters.firstOrNull()
            val cash = latest?.cashAndEquivalents ?: 0.0
            val longTermDebt = latest?.longTermDebt ?: 0.0
            val currentLiabilities = latest?.currentLiabilities ?: 0.0
            val totalDebt = longTermDebt + currentLiabilities
            val cashToDebt = if (totalDebt > 0) round2(cash / totalDebt) else null

            // Technicals: compute SMA50 and RSI14 from bars
            val barsUpToDate = bars.filter { it.date <= tradeDate }
            val sma50 = computeSma(barsUpToDate, 50)
            val rsi14 = computeRsi(barsUpToDate, 14)

            // Run the 5 checks
            val checks = mutableListOf<Pair<String, CheckLight>>()

            // Check 1: Margins
            if (grossMargin != null) {
                val light = when {
                    grossMargin >= 50 -> CheckLight.GREEN
                    grossMargin > 30 && (profitMargin != null && profitMargin > 10) -> CheckLight.YELLOW
                    else -> CheckLight.RED
                }
                checks.add("Margins" to light)
            }

            // Check 2: Price/Sales
            if (priceToSales != null) {
                val revGrowth = growthYoY ?: 0.0
                val fcfM = fcfMargin ?: 0.0
                val combo = revGrowth + fcfM
                val light = when {
                    priceToSales <= 10 -> CheckLight.GREEN
                    priceToSales <= 20 && combo > 30 -> CheckLight.GREEN
                    priceToSales <= 20 -> CheckLight.YELLOW
                    else -> CheckLight.RED
                }
                checks.add("P/S" to light)
            }

            // Check 3: Revenue Growth
            if (growthYoY != null) {
                val light = when {
                    growthYoY >= 20 -> CheckLight.GREEN
                    growthYoY >= 10 -> CheckLight.YELLOW
                    else -> CheckLight.RED
                }
                checks.add("Growth" to light)
            }

            // Check 4: Cash/Debt
            if (cashToDebt != null) {
                val light = when {
                    cashToDebt >= 1.0 -> CheckLight.GREEN
                    cashToDebt > 0.5 -> CheckLight.YELLOW
                    else -> CheckLight.RED
                }
                checks.add("Cash/Debt" to light)
            }

            // Check 5: Technicals
            if (sma50 != null && rsi14 != null) {
                val aboveSma = closingPrice > sma50
                val light = when {
                    aboveSma && rsi14 in 30.0..70.0 -> CheckLight.GREEN
                    aboveSma && rsi14 > 70 -> CheckLight.YELLOW
                    !aboveSma && rsi14 < 30 -> CheckLight.RED
                    !aboveSma -> CheckLight.YELLOW
                    else -> CheckLight.YELLOW
                }
                checks.add("Technicals" to light)
            }

            if (checks.isEmpty()) continue

            val greens = checks.count { it.second == CheckLight.GREEN }
            val reds = checks.count { it.second == CheckLight.RED }
            val total = checks.size

            val signal = when {
                reds >= (total / 2.0) -> Signal.SELL
                greens >= (total / 2.0) -> Signal.BUY
                else -> Signal.HOLD
            }

            val summary = checks.joinToString(", ") { "${it.first}:${it.second}" }
            signalEvents.add(SignalEvent(tradeDate, signal, summary))

            log.debug("Signal @ {} | price={} | {} → {} | checks: {}",
                tradeDate, closingPrice, filingDate, signal, summary)
        }

        log.info("Generated {} raw signal events for {}", signalEvents.size, symbol)

        // Deduplicate: if multiple signals on same date, keep last
        val deduped = signalEvents.groupBy { it.date }.map { (_, events) -> events.last() }.sortedBy { it.date }
        log.info("After dedup: {} unique signal events", deduped.size)

        // 5. Simulate trading
        val initialInvestment = 10000.0
        var cash = initialInvestment
        var sharesHeld = 0.0
        var entryPrice = 0.0
        val trades = mutableListOf<BacktestTrade>()
        val signalHistory = mutableListOf<SignalSnapshot>()
        var winCount = 0
        var lossCount = 0
        var prevPrice: Double? = null

        for (event in deduped) {
            val price = barsByDate[event.date]?.close ?: continue
            val inPosition = sharesHeld > 0.0

            val pChange = prevPrice?.let { round2(price - it) }
            val pChangePct = prevPrice?.let { round2((price - it) / it * 100) }

            when {
                event.signal == Signal.BUY && !inPosition -> {
                    sharesHeld = cash / price
                    entryPrice = price
                    cash = 0.0
                    trades.add(BacktestTrade("BUY", event.date, price, event.signal, event.checksSummary, sharesHeld, null))
                    signalHistory.add(SignalSnapshot(event.date, price, event.signal, event.checksSummary, "BUY", pChange, pChangePct))
                    log.info("TRADE BUY  @ {} | price={} | shares={}", event.date, price, round2(sharesHeld))
                }
                event.signal == Signal.SELL && inPosition -> {
                    cash = sharesHeld * price
                    val tradeReturn = round2((price - entryPrice) / entryPrice * 100)
                    if (tradeReturn >= 0) winCount++ else lossCount++
                    trades.add(BacktestTrade("SELL", event.date, price, event.signal, event.checksSummary, null, tradeReturn))
                    signalHistory.add(SignalSnapshot(event.date, price, event.signal, event.checksSummary, "SELL", pChange, pChangePct))
                    log.info("TRADE SELL @ {} | price={} | return={}%", event.date, price, tradeReturn)
                    sharesHeld = 0.0
                    entryPrice = 0.0
                }
                else -> {
                    val action = when {
                        event.signal == Signal.BUY && inPosition -> "HOLD (already in)"
                        event.signal == Signal.SELL && !inPosition -> "HOLD (no position)"
                        inPosition -> "HOLD (in position)"
                        else -> "HOLD (no position)"
                    }
                    signalHistory.add(SignalSnapshot(event.date, price, event.signal, event.checksSummary, action, pChange, pChangePct))
                }
            }

            prevPrice = price
        }

        // Mark-to-market if still holding
        val lastPrice = bars.lastOrNull()?.close ?: 0.0
        val lastDate = bars.lastOrNull()?.date ?: endDate.toString()

        val strategyFinal = if (sharesHeld > 0.0) sharesHeld * lastPrice else cash

        // Buy-and-hold benchmark
        val firstPrice = bars.firstOrNull()?.close ?: 1.0
        val bAndHShares = initialInvestment / firstPrice
        val buyAndHoldFinal = round2(bAndHShares * lastPrice)

        val strategyReturn = round2((strategyFinal - initialInvestment) / initialInvestment * 100)
        val buyAndHoldReturn = round2((buyAndHoldFinal - initialInvestment) / initialInvestment * 100)

        // Build equity curve (~monthly sampling)
        val equityCurve = buildEquityCurve(sortedDates, barsByDate, trades, initialInvestment, bAndHShares)

        val totalTrades = trades.size
        val winRate = if (winCount + lossCount > 0) round2(winCount.toDouble() / (winCount + lossCount) * 100) else null

        val summary = buildSummary(symbol, startDate.toString(), lastDate, strategyReturn, buyAndHoldReturn, totalTrades, winRate)

        log.info("═══════════════════════════════════════════════")
        log.info("Backtest complete for {} | Strategy: {}% | B&H: {}% | Trades: {}",
            symbol, strategyReturn, buyAndHoldReturn, totalTrades)
        log.info("═══════════════════════════════════════════════")

        return BacktestResult(
            symbol = symbol,
            companyName = profile.name,
            periodStart = startDate.toString(),
            periodEnd = lastDate,
            initialInvestment = initialInvestment,
            strategyFinalValue = round2(strategyFinal),
            buyAndHoldFinalValue = buyAndHoldFinal,
            strategyReturn = strategyReturn,
            buyAndHoldReturn = buyAndHoldReturn,
            outperformance = round2(strategyReturn - buyAndHoldReturn),
            totalTrades = totalTrades,
            winningTrades = winCount,
            losingTrades = lossCount,
            winRate = winRate,
            signalHistory = signalHistory,
            trades = trades,
            equityCurve = equityCurve,
            summary = summary,
        )
    }

    // ---- Equity curve builder ----

    private fun buildEquityCurve(
        sortedDates: List<String>,
        barsByDate: Map<String, DailyBar>,
        trades: List<BacktestTrade>,
        initialInvestment: Double,
        bAndHShares: Double,
    ): List<EquityPoint> {
        val equityCurve = mutableListOf<EquityPoint>()
        var simCash = initialInvestment
        var simShares = 0.0
        var tradeIdx = 0

        val monthlyDates = sortedDates.filterIndexed { i, _ -> i % 21 == 0 }
        for (d in monthlyDates) {
            val p = barsByDate[d]?.close ?: continue
            while (tradeIdx < trades.size && trades[tradeIdx].date <= d) {
                val t = trades[tradeIdx]
                if (t.type == "BUY") {
                    simShares = simCash / t.price
                    simCash = 0.0
                } else {
                    simCash = simShares * t.price
                    simShares = 0.0
                }
                tradeIdx++
            }
            val stratVal = if (simShares > 0) round2(simShares * p) else round2(simCash)
            val bAndHVal = round2(bAndHShares * p)
            equityCurve.add(EquityPoint(d, stratVal, bAndHVal))
        }
        return equityCurve
    }

    // ---- Summary builder ----

    private fun buildSummary(
        symbol: String, start: String, end: String,
        strategyReturn: Double, buyAndHoldReturn: Double,
        totalTrades: Int, winRate: Double?,
    ): String = buildString {
        append("$symbol backtest: $start to $end. ")
        append("Strategy returned ${strategyReturn}% vs buy-and-hold ${buyAndHoldReturn}%. ")
        if (totalTrades == 0) {
            append("No trades executed — all signals were HOLD so capital stayed in cash.")
        } else {
            append("$totalTrades trades, ")
            if (winRate != null) append("${winRate}% win rate. ")
            val diff = round2(strategyReturn - buyAndHoldReturn)
            if (diff >= 0) append("Strategy OUTPERFORMED by ${diff}%.")
            else append("Strategy UNDERPERFORMED by ${round2(buyAndHoldReturn - strategyReturn)}%.")
        }
    }

    // ---- Technical indicator computation ----

    private fun computeSma(bars: List<DailyBar>, window: Int): Double? {
        if (bars.size < window) return null
        val closes = bars.takeLast(window).map { it.close }
        return round2(closes.average())
    }

    private fun computeRsi(bars: List<DailyBar>, period: Int): Double? {
        if (bars.size < period + 1) return null
        val closes = bars.map { it.close }
        val changes = (1 until closes.size).map { closes[it] - closes[it - 1] }
        val recentChanges = changes.takeLast(period)

        val avgGain = recentChanges.filter { it > 0 }.average().takeIf { !it.isNaN() } ?: 0.0
        val avgLoss = recentChanges.filter { it < 0 }.map { abs(it) }.average().takeIf { !it.isNaN() } ?: 0.0

        if (avgLoss == 0.0) return 100.0
        val rs = avgGain / avgLoss
        return round2(100 - (100 / (1 + rs)))
    }

    // ---- Utilities ----

    private fun safePercent(num: Double?, denom: Double?): Double? =
        if (num != null && denom != null && denom != 0.0) round2(num / denom * 100) else null

    private fun round2(v: Double): Double = round(v * 100) / 100
}
