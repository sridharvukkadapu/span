package com.sv.span.config

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
@EnableConfigurationProperties(MassiveApiProperties::class)
class RestClientConfig(private val props: MassiveApiProperties) {

    @Bean
    fun massiveRestClient(): RestClient {
        // Trust-all SSL context to bypass corporate proxy cert issues in dev
        val trustAll = arrayOf<TrustManager>(object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
            override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
            override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
        })
        val sslContext = SSLContext.getInstance("TLS").apply { init(null, trustAll, SecureRandom()) }

        val httpClient = HttpClient.newBuilder()
            .sslContext(sslContext)
            .build()

        return RestClient.builder()
            .requestFactory(JdkClientHttpRequestFactory(httpClient))
            .baseUrl(props.baseUrl)
            .defaultHeader("Authorization", "Bearer ${props.key}")
            .build()
    }
}
