package com.sv.span.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "massive.api")
data class MassiveApiProperties(
    val baseUrl: String,
    val key: String,
)
