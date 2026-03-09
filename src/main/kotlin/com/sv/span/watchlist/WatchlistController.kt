package com.sv.span.watchlist

import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/v1/watchlist")
class WatchlistController(private val service: WatchlistService) {

    @GetMapping
    fun getWatchlist(request: HttpServletRequest, response: HttpServletResponse): ResponseEntity<List<String>> {
        val sessionId = resolveSessionId(request, response)
        return ResponseEntity.ok(service.getAll(sessionId))
    }

    @PostMapping("/{ticker}")
    fun addTicker(
        @PathVariable ticker: String,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<Map<String, Any>> {
        val sessionId = resolveSessionId(request, response)
        service.add(sessionId, ticker)
        return ResponseEntity.ok(mapOf("saved" to true, "ticker" to ticker.uppercase()))
    }

    @DeleteMapping("/{ticker}")
    fun removeTicker(
        @PathVariable ticker: String,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<Map<String, Any>> {
        val sessionId = resolveSessionId(request, response)
        service.remove(sessionId, ticker)
        return ResponseEntity.ok(mapOf("saved" to false, "ticker" to ticker.uppercase()))
    }

    @GetMapping("/{ticker}/saved")
    fun isSaved(
        @PathVariable ticker: String,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<Map<String, Any>> {
        val sessionId = resolveSessionId(request, response)
        return ResponseEntity.ok(mapOf("saved" to service.isSaved(sessionId, ticker)))
    }

    // ---- Session cookie helpers ----

    private fun resolveSessionId(request: HttpServletRequest, response: HttpServletResponse): String {
        val existing = request.cookies?.firstOrNull { it.name == SESSION_COOKIE }?.value
        if (existing != null) return existing
        val newId = UUID.randomUUID().toString()
        response.addCookie(buildCookie(newId))
        return newId
    }

    private fun buildCookie(value: String) = Cookie(SESSION_COOKIE, value).apply {
        maxAge = 60 * 60 * 24 * 365  // 1 year
        path = "/"
        isHttpOnly = true
    }

    companion object {
        private const val SESSION_COOKIE = "span_session"
    }
}
