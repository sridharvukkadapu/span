package com.sv.span.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "fmp.api")
data class FmpApiProperties(
    val baseUrl: String = "https://financialmodelingprep.com",
    val key: String = "",
)
