package com.minexpert.hns.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Date;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

class ServiceTokenVerifierTest {
    private static final String GATEWAY_KEY = "runtime-generated-gateway-to-hns-material";
    private static final String HRMS_KEY = "runtime-generated-hrms-to-hns-material-distinct";
    private static final Instant NOW = Instant.parse("2026-07-19T12:00:00Z");
    private ServiceTokenVerifier verifier;

    @BeforeEach
    void setUp() {
        verifier = new ServiceTokenVerifier(GATEWAY_KEY, HRMS_KEY, mock(Environment.class),
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void validatesIssuerAudienceAndScope() {
        ServiceIdentity identity = verifier.verify(token(GATEWAY_KEY, "safex-gateway", "safex-hns", "hns:proxy", "one"));
        assertThat(identity.issuer()).isEqualTo("safex-gateway");
        assertThat(identity.hasScope("hns:proxy")).isTrue();
    }

    @Test
    void rejectsWrongAudienceAndSignature() {
        assertThatThrownBy(() -> verifier.verify(token(GATEWAY_KEY, "safex-gateway", "safex-hrms", "hns:proxy", "aud")))
                .hasMessage("SERVICE_TOKEN_AUDIENCE_INVALID");
        assertThatThrownBy(() -> verifier.verify(token("unrelated-runtime-key-material-long-enough", "safex-gateway", "safex-hns", "hns:proxy", "sig")))
                .hasMessage("SERVICE_TOKEN_SIGNATURE_INVALID");
    }

    @Test
    void rejectsReplay() {
        String token = token(HRMS_KEY, "safex-hrms", "safex-hns", "hns:permissions:read", "replay");
        verifier.verify(token);
        assertThatThrownBy(() -> verifier.verify(token)).hasMessage("SERVICE_TOKEN_REPLAYED");
    }

    private static String token(String material, String issuer, String audience, String scope, String jti) {
        return Jwts.builder().setIssuer(issuer).setAudience(audience).setId(jti)
                .setIssuedAt(Date.from(NOW)).setExpiration(Date.from(NOW.plusSeconds(45)))
                .claim("scope", scope).signWith(key(material)).compact();
    }

    private static SecretKey key(String material) {
        try {
            return Keys.hmacShaKeyFor(MessageDigest.getInstance("SHA-256")
                    .digest(material.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new AssertionError(ex);
        }
    }
}
