package com.sv.span.cache

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant

@Entity
@Table(name = "ticker_cache")
data class TickerCacheEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, length = 32)
    val namespace: String,

    @Column(nullable = false, length = 10)
    val ticker: String,

    @Column(name = "type_name", nullable = false, length = 255)
    val typeName: String,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    val payload: String,

    @Column(name = "computed_at", nullable = false)
    val computedAt: Instant = Instant.now(),

    @Column(name = "expires_at", nullable = false)
    val expiresAt: Instant,

    @Column(name = "compute_ms", nullable = false)
    val computeMs: Long = 0,
)
