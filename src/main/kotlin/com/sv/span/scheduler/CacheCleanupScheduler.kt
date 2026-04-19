package com.sv.span.scheduler

import com.sv.span.cache.TickerCacheRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Component
class CacheCleanupScheduler(private val repo: TickerCacheRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    /** Purge expired rows from ticker_cache once per day at 3 AM UTC */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    fun purgeExpired() {
        val deleted = repo.deleteExpired(Instant.now())
        if (deleted > 0) log.info("Purged {} expired ticker_cache rows", deleted)
    }
}
