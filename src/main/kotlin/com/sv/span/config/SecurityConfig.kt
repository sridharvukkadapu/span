package com.sv.span.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.ClientAuthenticationMethod
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames
import org.springframework.security.oauth2.client.registration.ClientRegistration
import org.springframework.security.provisioning.InMemoryUserDetailsManager
import org.springframework.security.web.SecurityFilterChain

@Configuration
@EnableWebSecurity
class SecurityConfig(
    @Value("\${google.oauth2.client-id:}") private val googleClientId: String,
    @Value("\${google.oauth2.client-secret:}") private val googleClientSecret: String,
) {

    /**
     * Manually create the client registration so Spring Boot's auto-validator
     * never sees our (possibly empty) credentials.
     * When credentials are absent, placeholder values are used — the app starts fine
     * and sign-in redirects to Google, which shows "invalid_client" gracefully.
     */
    @Bean
    fun clientRegistrationRepository(): ClientRegistrationRepository {
        val google = ClientRegistration.withRegistrationId("google")
            .clientId(googleClientId.ifEmpty { "not-configured" })
            .clientSecret(googleClientSecret.ifEmpty { "not-configured" })
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
            .scope("openid", "email", "profile")
            .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
            .tokenUri("https://www.googleapis.com/oauth2/v4/token")
            .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
            .userNameAttributeName(IdTokenClaimNames.SUB)
            .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
            .clientName("Google")
            .build()
        return InMemoryClientRegistrationRepository(google)
    }

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests { it.anyRequest().permitAll() }
            .oauth2Login { oauth2 ->
                oauth2.defaultSuccessUrl("/watchlist", false)
            }
            .logout { logout ->
                logout
                    .logoutRequestMatcher { req -> req.requestURI == "/logout" }
                    .logoutSuccessUrl("/")
                    .invalidateHttpSession(true)
                    .clearAuthentication(true)
            }
            .csrf { it.disable() }
        return http.build()
    }

    /** Suppress the auto-generated admin password — we use OAuth2 only. */
    @Bean
    fun userDetailsService() = InMemoryUserDetailsManager()
}
