package com.sv.span.config

import org.slf4j.LoggerFactory
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.JdkClientHttpRequestFactory
import org.springframework.web.client.RestClient
import java.net.http.HttpClient
import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

@Configuration
@EnableConfigurationProperties(MassiveApiProperties::class, FmpApiProperties::class)
class RestClientConfig(
    private val massiveProps: MassiveApiProperties,
    private val fmpProps: FmpApiProperties,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    /**
     * Build a trust-all SSL context to bypass corporate proxy cert issues in dev.
     */
    private fun trustAllSslContext(): SSLContext {
        val trustAll = arrayOf<TrustManager>(object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
            override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
            override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
        })
        return SSLContext.getInstance("TLS").apply { init(null, trustAll, SecureRandom()) }
    }

    @Bean
    fun massiveRestClient(): RestClient {
        log.info("Configuring Massive (Polygon) RestClient → {}", massiveProps.baseUrl)
        val httpClient = HttpClient.newBuilder()
            .sslContext(trustAllSslContext())
            .build()

        return RestClient.builder()
            .requestFactory(JdkClientHttpRequestFactory(httpClient))
            .baseUrl(massiveProps.baseUrl)
            .defaultHeader("Authorization", "Bearer ${massiveProps.key}")
            .build()
    }

    @Bean
    fun fmpRestClient(): RestClient {
        log.info("Configuring FMP RestClient → {}", fmpProps.baseUrl)
        val httpClient = HttpClient.newBuilder()
            .sslContext(trustAllSslContext())
            .build()

        // FMP uses query-param authentication: ?apikey=...
        return RestClient.builder()
            .requestFactory(JdkClientHttpRequestFactory(httpClient))
            .baseUrl(fmpProps.baseUrl)
            .defaultHeader("Accept", "application/json")
            .requestInterceptor { request, body, execution ->
                // Append apikey to every request URI
                val uri = request.uri
                val separator = if (uri.query.isNullOrEmpty()) "?" else "&"
                val newUri = java.net.URI.create("$uri${separator}apikey=${fmpProps.key}")
                val newRequest = org.springframework.http.client.support.HttpRequestWrapper(request)
                val modifiedRequest = object : org.springframework.http.HttpRequest by newRequest {
                    override fun getURI() = newUri
                }
                execution.execute(modifiedRequest, body)
            }
            .build()
    }
}
