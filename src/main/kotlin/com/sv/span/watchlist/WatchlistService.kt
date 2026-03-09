package com.sv.span.watchlist

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WatchlistService(private val repo: WatchlistRepository) {

    fun getAll(sessionId: String): List<String> =
        repo.findBySessionIdOrderByAddedAtDesc(sessionId).map { it.ticker }

    fun isSaved(sessionId: String, ticker: String): Boolean =
        repo.existsBySessionIdAndTicker(sessionId, ticker.uppercase())

    @Transactional
    fun add(sessionId: String, ticker: String) {
        val symbol = ticker.uppercase()
        if (!repo.existsBySessionIdAndTicker(sessionId, symbol)) {
            repo.save(WatchlistItem(sessionId = sessionId, ticker = symbol))
        }
    }

    @Transactional
    fun remove(sessionId: String, ticker: String) {
        repo.deleteBySessionIdAndTicker(sessionId, ticker.uppercase())
    }
}
