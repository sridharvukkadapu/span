package com.sv.span.service

import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import java.util.UUID

data class GoogleUser(val name: String, val picture: String?)

@Service
class IdentityService {

    /**
     * Returns the watchlist identity key:
     * - Google sub prefixed with "g:" when the user is signed in via Google
     * - UUID cookie for anonymous users (created on first visit)
     */
    fun resolve(request: HttpServletRequest, response: HttpServletResponse): String {
        val auth = SecurityContextHolder.getContext().authentication
        if (auth is OAuth2AuthenticationToken) {
            val sub = auth.principal.getAttribute<String>("sub") ?: auth.name
            return "g:$sub"
        }
        val existing = request.cookies?.firstOrNull { it.name == SESSION_COOKIE }?.value
        if (existing != null) return existing
        val newId = UUID.randomUUID().toString()
        response.addCookie(Cookie(SESSION_COOKIE, newId).apply {
            maxAge = 60 * 60 * 24 * 365
            path = "/"
            isHttpOnly = true
        })
        return newId
    }

    /** Returns the signed-in Google user, or null for anonymous visitors. */
    fun currentUser(): GoogleUser? {
        val auth = SecurityContextHolder.getContext().authentication
        if (auth is OAuth2AuthenticationToken) {
            return GoogleUser(
                name = auth.principal.getAttribute<String>("name") ?: "User",
                picture = auth.principal.getAttribute<String>("picture"),
            )
        }
        return null
    }

    companion object {
        const val SESSION_COOKIE = "span_session"
    }
}
