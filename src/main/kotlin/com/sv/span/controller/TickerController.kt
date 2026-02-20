package com.sv.span.controller

import com.sv.span.model.ScreenerResult
import com.sv.span.service.AnalyzerService
import com.sv.span.service.BacktestService
import com.sv.span.service.ScreenerService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/tickers")
class TickerController(
    private val screenerService: ScreenerService,
    private val backtestService: BacktestService,
    private val analyzerService: AnalyzerService,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    @GetMapping("/{symbol}/recommendation")
    fun getRecommendation(@PathVariable symbol: String): ResponseEntity<Any> {
        return try {
            val result = screenerService.analyze(symbol)
            ResponseEntity.ok(result)
        } catch (e: Exception) {
            log.error("Error analyzing {}: {}", symbol, e.message, e)
            ResponseEntity.internalServerError().body(
                mapOf("error" to "Failed to analyze $symbol", "detail" to (e.message ?: "Unknown error"))
            )
        }
    }

    @GetMapping("/{symbol}/backtest")
    fun getBacktest(@PathVariable symbol: String): ResponseEntity<Any> {
        return try {
            val result = backtestService.backtest(symbol)
            ResponseEntity.ok(result)
        } catch (e: Exception) {
            log.error("Error backtesting {}: {}", symbol, e.message, e)
            ResponseEntity.internalServerError().body(
                mapOf("error" to "Failed to backtest $symbol", "detail" to (e.message ?: "Unknown error"))
            )
        }
    }

    @GetMapping("/{symbol}/analyzer")
    fun getAnalyzerData(@PathVariable symbol: String): ResponseEntity<Any> {
        return try {
            val result = analyzerService.analyze(symbol)
            ResponseEntity.ok(result)
        } catch (e: Exception) {
            log.error("Error in analyzer for {}: {}", symbol, e.message, e)
            ResponseEntity.internalServerError().body(
                mapOf("error" to "Failed to analyze $symbol", "detail" to (e.message ?: "Unknown error"))
            )
        }
    }
}
