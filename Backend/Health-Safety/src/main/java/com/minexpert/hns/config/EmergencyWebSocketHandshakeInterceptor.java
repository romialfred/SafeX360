package com.minexpert.hns.config;

import java.net.HttpCookie;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

/**
 * Authentifie le handshake SockJS/WebSocket à partir du cookie HttpOnly
 * {@code jwt}. Le navigateur n'a jamais à recopier le secret dans JavaScript.
 */
@Component
public class EmergencyWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger LOG =
            LoggerFactory.getLogger(EmergencyWebSocketHandshakeInterceptor.class);

    private final String jwtSecret;

    public EmergencyWebSocketHandshakeInterceptor(@Value("${JWT_SECRET:}") String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Map<String, Object> attributes) {
        try {
            String token = extractToken(request.getHeaders());
            if (jwtSecret == null || jwtSecret.isBlank() || token == null || token.isBlank()) {
                return reject(response, "missing credentials");
            }

            Claims claims = Jwts.parser()
                    .setSigningKey(jwtSecret)
                    .parseClaimsJws(token)
                    .getBody();
            String subject = claims.getSubject();
            String role = claims.get("role", String.class);
            if (subject == null || subject.isBlank() || role == null || role.isBlank()) {
                return reject(response, "missing identity claims");
            }

            Set<Long> mineIds = parseMineIds(claims.get("companies"));
            addLongClaim(mineIds, claims.get("company"));
            addLongClaim(mineIds, claims.get("workingCompanyId"));
            boolean allMines = Boolean.TRUE.equals(claims.get("allMines"))
                    || "true".equalsIgnoreCase(String.valueOf(claims.get("allMines")));
            Long userId = toLong(claims.get("id"));

            attributes.put(StompIdentity.SESSION_KEY,
                    new StompIdentity(subject, role, userId, allMines, mineIds));
            return true;
        } catch (Exception ex) {
            LOG.warn("WebSocket handshake rejected: {}", ex.getClass().getSimpleName());
            return reject(response, "invalid or expired token");
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Exception exception) {
        // Aucun état temporaire à libérer.
    }

    private boolean reject(ServerHttpResponse response, String reason) {
        LOG.warn("WebSocket handshake rejected: {}", reason);
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        return false;
    }

    private String extractToken(HttpHeaders headers) {
        for (String cookieHeader : headers.getOrEmpty(HttpHeaders.COOKIE)) {
            for (HttpCookie cookie : HttpCookie.parse(cookieHeader)) {
                if ("jwt".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        String authorization = headers.getFirst(HttpHeaders.AUTHORIZATION);
        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring(7).trim();
        }
        return headers.getFirst("X-Auth-Token");
    }

    private Set<Long> parseMineIds(Object raw) {
        Set<Long> values = new HashSet<>();
        if (raw == null) {
            return values;
        }
        if (raw instanceof Iterable<?> iterable) {
            iterable.forEach(value -> addLongClaim(values, value));
            return values;
        }
        for (String value : String.valueOf(raw).split(",")) {
            addLongClaim(values, value);
        }
        return values;
    }

    private void addLongClaim(Set<Long> target, Object value) {
        Long parsed = toLong(value);
        if (parsed != null && parsed > 0) {
            target.add(parsed);
        }
    }

    private Long toLong(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(String.valueOf(value).trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
