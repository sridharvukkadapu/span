package com.sv.span.cache

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant

interface TickerCacheRepository : JpaRepository<TickerCacheEntity, Long> {

    fun findByNamespaceAndTicker(namespace: String, ticker: String): TickerCacheEntity?

    fun findAllByNamespaceAndExpiresAtAfter(namespace: String, expiresAt: Instant): List<TickerCacheEntity>

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM TickerCacheEntity e WHERE e.ticker = :ticker")
    fun deleteAllByTicker(ticker: String): Int

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM TickerCacheEntity e WHERE e.expiresAt < :now")
    fun deleteExpired(now: Instant): Int
}
