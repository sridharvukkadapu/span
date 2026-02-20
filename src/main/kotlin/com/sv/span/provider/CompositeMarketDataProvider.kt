package com.sv.span.provider

import org.slf4j.LoggerFactory
import java.time.LocalDate

/**
 * Composite [MarketDataProvider] that merges two data sources:
 *
 *   • **Massive (Polygon)** — quarterly financials for the recent 2 years
 *   • **FMP**               — annual financials for the older 3 years,
 *                              daily price bars for the full 5-year window,
 *                              and company profile
 *
 * This gives the best of both worlds: high signal density from quarterly
 * evaluations in the recent period, plus full 5-year coverage.
 *
 * The class is **not** a Spring component — it is created by [BacktestProviderConfig].
 */
class CompositeMarketDataProvider(
    private val fmpProvider: FmpMarketDataProvider,
    private val massiveProvider: MassiveMarketDataProvider,
) : MarketDataProvider {

    private val log = LoggerFactory.getLogger(javaClass)

    override val providerName: String = "Composite (Massive+FMP)"

    /**
     * Daily bars: use FMP for the full range (5 years available on free tier).
     */
    override fun getDailyBars(symbol: String, from: String, to: String): List<DailyBar> {
        log.info("[Composite] Fetching daily bars from FMP for {} ({} → {})", symbol, from, to)
        return fmpProvider.getDailyBars(symbol, from, to)
    }

    /**
     * Financials: merge Massive quarterly (recent 2 years) + FMP annual (older 3 years).
     *
     * Strategy:
     *   1. Fetch quarterly financials from Massive (up to 20 quarters)
     *   2. Fetch annual financials from FMP (up to 5 years)
     *   3. Determine the cutoff: oldest Massive quarterly record
     *   4. Keep FMP annual records that are BEFORE the cutoff (older data)
     *   5. Merge and sort by endDate ascending
     */
    override fun getQuarterlyFinancials(symbol: String, limit: Int): List<QuarterlyFinancial> {
        log.info("[Composite] Fetching quarterly financials from Massive for {}", symbol)
        val massiveFinancials = try {
            massiveProvider.getQuarterlyFinancials(symbol, 20)
        } catch (e: Exception) {
            log.warn("[Composite] Massive quarterly fetch failed for {}: {}", symbol, e.message)
            emptyList()
        }

        log.info("[Composite] Fetching annual financials from FMP for {}", symbol)
        val fmpFinancials = try {
            fmpProvider.getQuarterlyFinancials(symbol, 5)
        } catch (e: Exception) {
            log.warn("[Composite] FMP annual fetch failed for {}: {}", symbol, e.message)
            emptyList()
        }

        if (massiveFinancials.isEmpty() && fmpFinancials.isEmpty()) {
            log.error("[Composite] No financials available from either provider for {}", symbol)
            return emptyList()
        }

        // If one source failed, fall back to the other
        if (massiveFinancials.isEmpty()) {
            log.info("[Composite] Using FMP-only financials for {} ({} records)", symbol, fmpFinancials.size)
            return fmpFinancials
        }
        if (fmpFinancials.isEmpty()) {
            log.info("[Composite] Using Massive-only financials for {} ({} records)", symbol, massiveFinancials.size)
            return massiveFinancials
        }

        // Determine the cutoff: oldest Massive quarterly endDate
        val oldestMassiveDate = massiveFinancials.minOf { it.endDate }
        log.info("[Composite] Massive covers from {} onward ({} quarterly records)",
            oldestMassiveDate, massiveFinancials.size)

        // Keep FMP annual records that are strictly BEFORE the Massive coverage window
        val olderFmpRecords = fmpFinancials.filter { it.endDate < oldestMassiveDate }
        log.info("[Composite] FMP provides {} annual records before Massive cutoff ({})",
            olderFmpRecords.size, oldestMassiveDate)

        // Merge: older FMP annual + recent Massive quarterly
        val merged = (olderFmpRecords + massiveFinancials).sortedBy { it.endDate }

        log.info("[Composite] Merged {} financials for {} ({} FMP annual + {} Massive quarterly)",
            merged.size, symbol, olderFmpRecords.size, massiveFinancials.size)

        for (f in merged) {
            log.debug("[Composite]   {} | period={} | rev={} | filing={}",
                f.endDate, f.fiscalPeriod, f.revenue, f.filingDate)
        }

        return merged
    }

    /**
     * Company profile: use FMP (more reliable shares outstanding data).
     */
    override fun getCompanyProfile(symbol: String): CompanyProfile? {
        log.info("[Composite] Fetching company profile from FMP for {}", symbol)
        return fmpProvider.getCompanyProfile(symbol)
    }
}
