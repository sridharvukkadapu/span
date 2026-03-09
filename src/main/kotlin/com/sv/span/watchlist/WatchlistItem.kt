package com.sv.span.watchlist

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "watchlist")
data class WatchlistItem(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "session_id", nullable = false, length = 36)
    val sessionId: String,

    @Column(nullable = false, length = 10)
    val ticker: String,

    @Column(name = "added_at", nullable = false)
    val addedAt: Instant = Instant.now(),
)
