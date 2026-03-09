package com.sv.span.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.provisioning.InMemoryUserDetailsManager
import org.springframework.security.web.SecurityFilterChain

@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests { it.anyRequest().permitAll() }
            .oauth2Login { oauth2 ->
                oauth2.defaultSuccessUrl("/watchlist", false)
            }
            .logout { logout ->
                // Allow GET /logout since CSRF is disabled
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
