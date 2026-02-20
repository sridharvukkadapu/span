package com.sv.span.config

import com.sv.span.provider.CompositeMarketDataProvider
import com.sv.span.provider.FmpMarketDataProvider
import com.sv.span.provider.MarketDataProvider
import com.sv.span.provider.MassiveMarketDataProvider
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * Factory configuration that selects the active [MarketDataProvider]
 * for backtesting based on the `backtest.provider` property.
 *
 * Supported values: "composite" (default), "fmp", "massive".
 * Adding a new provider requires only:
 *   1. A new MarketDataProvider implementation
 *   2. A new branch in this factory
 */
@Configuration
class BacktestProviderConfig {

    private val log = LoggerFactory.getLogger(javaClass)

    @Bean
    fun backtestMarketDataProvider(
        @Value("\${backtest.provider:composite}") providerName: String,
        fmpProvider: FmpMarketDataProvider,
        massiveProvider: MassiveMarketDataProvider,
    ): MarketDataProvider {
        val provider = when (providerName.lowercase().trim()) {
            "composite", "hybrid" -> CompositeMarketDataProvider(fmpProvider, massiveProvider)
            "fmp" -> fmpProvider
            "massive", "polygon" -> massiveProvider
            else -> {
                log.warn("Unknown backtest provider '{}', falling back to Composite", providerName)
                CompositeMarketDataProvider(fmpProvider, massiveProvider)
            }
        }
        log.info("╔══════════════════════════════════════════════╗")
        log.info("║  Backtest provider: {}", provider.providerName.padEnd(25) + "║")
        log.info("╚══════════════════════════════════════════════╝")
        return provider
    }
}
