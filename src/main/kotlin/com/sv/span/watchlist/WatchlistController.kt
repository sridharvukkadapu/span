package com.sv.span.watchlist

import com.sv.span.service.IdentityService
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/watchlist")
class WatchlistController(
    private val service: WatchlistService,
    private val identityService: IdentityService,
) {

    @GetMapping
    fun getWatchlist(request: HttpServletRequest, response: HttpServletResponse): ResponseEntity<List<String>> {
        val identity = identityService.resolve(request, response)
        return ResponseEntity.ok(service.getAll(identity))
    }

    @PostMapping("/{ticker}")
    fun addTicker(
        @PathVariable ticker: String,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<Map<String, Any>> {
        val identity = identityService.resolve(request, response)
        service.add(identity, ticker)
        return ResponseEntity.ok(mapOf("saved" to true, "ticker" to ticker.uppercase()))
    }

    @DeleteMapping("/{ticker}")
    fun removeTicker(
        @PathVariable ticker: String,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<Map<String, Any>> {
        val identity = identityService.resolve(request, response)
        service.remove(identity, ticker)
        return ResponseEntity.ok(mapOf("saved" to false, "ticker" to ticker.uppercase()))
    }

    @GetMapping("/{ticker}/saved")
    fun isSaved(
        @PathVariable ticker: String,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<Map<String, Any>> {
        val identity = identityService.resolve(request, response)
        return ResponseEntity.ok(mapOf("saved" to service.isSaved(identity, ticker)))
    }
}
