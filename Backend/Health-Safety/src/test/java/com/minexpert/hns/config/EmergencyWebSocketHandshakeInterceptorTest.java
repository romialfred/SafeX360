package com.minexpert.hns.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.util.Date;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.socket.WebSocketHandler;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

class EmergencyWebSocketHandshakeInterceptorTest {

    private static final String SECRET = Base64.getEncoder().encodeToString(
            UUID.randomUUID().toString().repeat(4).getBytes(StandardCharsets.UTF_8));

    @Test
    void verifiesJwtAndMaterializesMineScope() {
        String token = token(new Date(System.currentTimeMillis() + 60_000));
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.addHeader("Cookie", "jwt=" + token);
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();
        Map<String, Object> attributes = new HashMap<>();

        boolean accepted = new EmergencyWebSocketHandshakeInterceptor(SECRET).beforeHandshake(
                new ServletServerHttpRequest(servletRequest),
                new ServletServerHttpResponse(servletResponse),
                mock(WebSocketHandler.class), attributes);

        assertThat(accepted).isTrue();
        StompIdentity identity = (StompIdentity) attributes.get(StompIdentity.SESSION_KEY);
        assertThat(identity.subject()).isEqualTo("coordinator@example.test");
        assertThat(identity.role()).isEqualTo("HSE_MANAGER");
        assertThat(identity.mineIds()).containsExactlyInAnyOrder(7L, 8L, 9L);
    }

    @Test
    void rejectsExpiredForgedAndMissingTokens() {
        EmergencyWebSocketHandshakeInterceptor interceptor =
                new EmergencyWebSocketHandshakeInterceptor(SECRET);

        assertThat(handshake(interceptor, token(new Date(System.currentTimeMillis() - 1_000))))
                .isFalse();
        assertThat(handshake(interceptor, token(new Date(System.currentTimeMillis() + 60_000)) + "x"))
                .isFalse();
        assertThat(handshake(interceptor, null)).isFalse();
    }

    private boolean handshake(EmergencyWebSocketHandshakeInterceptor interceptor, String token) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        if (token != null) {
            request.addHeader("Cookie", "jwt=" + token);
        }
        return interceptor.beforeHandshake(
                new ServletServerHttpRequest(request),
                new ServletServerHttpResponse(new MockHttpServletResponse()),
                mock(WebSocketHandler.class), new HashMap<>());
    }

    private String token(Date expiration) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", 4L);
        claims.put("role", "HSE_MANAGER");
        claims.put("companies", "7,8");
        claims.put("workingCompanyId", 9L);
        claims.put("allMines", false);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject("coordinator@example.test")
                .setIssuedAt(new Date(System.currentTimeMillis() - 1_000))
                .setExpiration(expiration)
                .signWith(SignatureAlgorithm.HS512, SECRET)
                .compact();
    }
}
