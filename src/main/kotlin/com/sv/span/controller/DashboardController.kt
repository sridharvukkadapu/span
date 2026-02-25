package com.sv.span.controller

import com.sv.span.service.DashboardService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * REST API for the Top-25 Dashboard leaderboard.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
class DashboardController(
    private val dashboardService: DashboardService,
) {

    /**
     * Returns the current top N stocks ranked by composite score + scan status.
     */
    @GetMapping
    fun getDashboard(@RequestParam(defaultValue = "25") limit: Int): ResponseEntity<Any> {
        val top = dashboardService.topN(limit)
        val status = dashboardService.status()

        val stocks = top.mapIndexed { i, scored ->
            val r = scored.result
            val greens = r.checks.count { it.light == com.sv.span.model.CheckLight.GREEN }
            val reds = r.checks.count { it.light == com.sv.span.model.CheckLight.RED }
            mapOf(
                "rank" to i + 1,
                "symbol" to r.symbol,
                "companyName" to r.companyName,
                "signal" to r.signal.name,
                "confidence" to r.confidence,
                "score" to scored.score,
                "greens" to greens,
                "reds" to reds,
                "totalChecks" to r.checks.size,
                "price" to r.overview.priceFormatted,
                "marketCap" to r.overview.marketCapFormatted,
                "peRatio" to r.overview.peRatioFormatted,
                "grossMargin" to r.margins.grossMarginFormatted,
                "profitMargin" to r.margins.profitMarginFormatted,
                "revenueGrowth" to r.revenueAnalysis.revenueGrowthFormatted,
                "cashToDebt" to r.balanceSheet.cashToDebtFormatted,
                "scannedAt" to scored.scannedAt.toString(),
            )
        }

        return ResponseEntity.ok(mapOf(
            "status" to status,
            "stocks" to stocks,
        ))
    }

    /**
     * Returns just the scan status (for polling progress).
     */
    @GetMapping("/status")
    fun getStatus(): ResponseEntity<Any> =
        ResponseEntity.ok(dashboardService.status())
}
