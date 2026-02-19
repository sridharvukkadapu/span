package com.sv.span.model

import com.fasterxml.jackson.annotation.JsonInclude
import kotlin.math.abs

@JsonInclude(JsonInclude.Include.NON_NULL)
data class BacktestResult(
    val symbol: String,
    val companyName: String?,
    val periodStart: String,
    val periodEnd: String,
    val initialInvestment: Double,
    val strategyFinalValue: Double,
    val buyAndHoldFinalValue: Double,
    val strategyReturn: Double,
    val buyAndHoldReturn: Double,
    val outperformance: Double,
    val totalTrades: Int,
    val winningTrades: Int,
    val losingTrades: Int,
    val winRate: Double?,
    val signalHistory: List<SignalSnapshot>,
    val trades: List<BacktestTrade>,
    val equityCurve: List<EquityPoint>,
    val summary: String,
) {
    val strategyReturnFormatted: String get() = "${fmt2(strategyReturn)}%"
    val buyAndHoldReturnFormatted: String get() = "${fmt2(buyAndHoldReturn)}%"
    val outperformanceFormatted: String get() = "${fmt2(outperformance)}%"
    val strategyFinalFormatted: String get() = "$${fmt2(strategyFinalValue)}"
    val buyAndHoldFinalFormatted: String get() = "$${fmt2(buyAndHoldFinalValue)}"
    val winRateFormatted: String? get() = winRate?.let { "${fmt2(it)}%" }
}

data class BacktestTrade(
    val type: String,  // "BUY" or "SELL"
    val date: String,
    val price: Double,
    val signal: Signal,
    val checksSummary: String,
    val sharesHeld: Double?,
    val tradeReturn: Double?,
) {
    val priceFormatted: String get() = "$${fmt2(price)}"
    val tradeReturnFormatted: String? get() = tradeReturn?.let { "${fmt2(it)}%" }
}

data class EquityPoint(
    val date: String,
    val strategyValue: Double,
    val buyAndHoldValue: Double,
)

data class SignalSnapshot(
    val date: String,
    val price: Double,
    val signal: Signal,
    val checksSummary: String,
    val action: String,       // "BUY", "SELL", "HOLD (no position)", "HOLD (in position)"
) {
    val priceFormatted: String get() = "$${fmt2(price)}"
}

private fun fmt2(v: Double): String = String.format("%.2f", v)
