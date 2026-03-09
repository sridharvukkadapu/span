package com.sv.span.watchlist

import org.springframework.data.jpa.repository.JpaRepository

interface WatchlistRepository : JpaRepository<WatchlistItem, Long> {
    fun findBySessionIdOrderByAddedAtDesc(sessionId: String): List<WatchlistItem>
    fun existsBySessionIdAndTicker(sessionId: String, ticker: String): Boolean
    fun deleteBySessionIdAndTicker(sessionId: String, ticker: String)
}
