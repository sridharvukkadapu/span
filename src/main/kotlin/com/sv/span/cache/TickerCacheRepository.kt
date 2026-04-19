package com.sv.span.cache

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface TickerCacheRepository : JpaRepository<TickerCacheEntity, Long> {

    fun findByNamespaceAndTicker(namespace: String, ticker: String): TickerCacheEntity?

    fun findAllByNamespaceAndExpiresAtAfter(namespace: String, expiresAt: Instant): List<TickerCacheEntity>

    @Modifying(clearAutomatically = true)
    @Query(value = """
        INSERT INTO ticker_cache (namespace, ticker, type_name, payload, computed_at, expires_at, compute_ms)
        VALUES (:namespace, :ticker, :typeName, CAST(:payload AS jsonb), :computedAt, :expiresAt, :computeMs)
        ON CONFLICT (namespace, ticker) DO UPDATE SET
            type_name   = EXCLUDED.type_name,
            payload     = EXCLUDED.payload,
            computed_at = EXCLUDED.computed_at,
            expires_at  = EXCLUDED.expires_at,
            compute_ms  = EXCLUDED.compute_ms
    """, nativeQuery = true)
    fun upsert(
        @Param("namespace")  namespace:  String,
        @Param("ticker")     ticker:     String,
        @Param("typeName")   typeName:   String,
        @Param("payload")    payload:    String,
        @Param("computedAt") computedAt: Instant,
        @Param("expiresAt")  expiresAt:  Instant,
        @Param("computeMs")  computeMs:  Long,
    )

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM TickerCacheEntity e WHERE e.ticker = :ticker")
    fun deleteAllByTicker(ticker: String): Int

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM TickerCacheEntity e WHERE e.expiresAt < :now")
    fun deleteExpired(now: Instant): Int
}
