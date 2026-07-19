package com.hrms.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;

@Component
public class ServiceTokenVerifier {
    public static final String HEADER = "X-Service-Token";
    private static final Logger LOG = LoggerFactory.getLogger(ServiceTokenVerifier.class);
    private final Map<String, SecretKey> issuerKeys;
    private final Map<String, Long> consumedJti = new ConcurrentHashMap<>();
    private final Clock clock;

    @Autowired
    public ServiceTokenVerifier(
            @Value("${SAFEX_GATEWAY_HRMS_TOKEN_KEY:}") String gatewayMaterial,
            @Value("${SAFEX_HNS_HRMS_TOKEN_KEY:}") String hnsMaterial,
            Environment environment) {
        this(gatewayMaterial, hnsMaterial, environment, Clock.systemUTC());
    }

    ServiceTokenVerifier(String gatewayMaterial, String hnsMaterial, Environment environment, Clock clock) {
        boolean local = environment.acceptsProfiles(Profiles.of("dev", "test", "local"));
        gatewayMaterial = material(gatewayMaterial, local, "gateway-hrms");
        hnsMaterial = material(hnsMaterial, local, "hns-hrms");
        if (MessageDigest.isEqual(gatewayMaterial.getBytes(StandardCharsets.UTF_8),
                hnsMaterial.getBytes(StandardCharsets.UTF_8))) throw new IllegalStateException("SERVICE_TOKEN_KEYS_MUST_BE_DISTINCT");
        issuerKeys = Map.of("safex-gateway", key(gatewayMaterial), "safex-hns", key(hnsMaterial));
        this.clock = clock;
    }

    public ServiceIdentity verify(String compactToken) {
        if (compactToken == null || compactToken.isBlank()) throw new ServiceTokenException("SERVICE_TOKEN_REQUIRED");
        Claims claims = null; String issuer = null;
        for (Map.Entry<String, SecretKey> candidate : issuerKeys.entrySet()) {
            try {
                // L'horloge INJECTEE doit aussi gouverner le parseur : sans ce
                // setClock, jjwt validait l'expiration sur l'horloge SYSTEME.
                // Consequence concrete : le test a horloge figee ne passait que
                // dans les 45 secondes suivant l'instant fige (midi UTC), et
                // l'ExpiredJwtException avalee ressortait en SIGNATURE_INVALID,
                // masquant la vraie cause.
                Claims parsed = Jwts.parserBuilder().setSigningKey(candidate.getValue())
                        .setClock(() -> java.util.Date.from(clock.instant())).build()
                        .parseClaimsJws(compactToken).getBody();
                if (candidate.getKey().equals(parsed.getIssuer())) { claims = parsed; issuer = candidate.getKey(); break; }
            } catch (Exception ignored) { }
        }
        if (claims == null) throw new ServiceTokenException("SERVICE_TOKEN_SIGNATURE_INVALID");
        Instant now = clock.instant();
        if (!"safex-hrms".equals(claims.getAudience())) throw new ServiceTokenException("SERVICE_TOKEN_AUDIENCE_INVALID");
        if (claims.getIssuedAt() == null || claims.getExpiration() == null
                || claims.getIssuedAt().toInstant().isAfter(now.plusSeconds(5))
                || !claims.getExpiration().toInstant().isAfter(now)
                || claims.getExpiration().toInstant().isAfter(claims.getIssuedAt().toInstant().plusSeconds(90))) {
            throw new ServiceTokenException("SERVICE_TOKEN_LIFETIME_INVALID");
        }
        String jti = claims.getId();
        if (jti == null || jti.isBlank()) throw new ServiceTokenException("SERVICE_TOKEN_JTI_REQUIRED");
        consumedJti.entrySet().removeIf(entry -> entry.getValue() <= now.getEpochSecond());
        if (consumedJti.putIfAbsent(jti, claims.getExpiration().toInstant().getEpochSecond()) != null)
            throw new ServiceTokenException("SERVICE_TOKEN_REPLAYED");
        Set<String> scopes = parseScopes(claims.get("scope", String.class));
        if (scopes.isEmpty()) throw new ServiceTokenException("SERVICE_TOKEN_SCOPE_REQUIRED");
        return new ServiceIdentity(issuer, claims.getAudience(), scopes, jti);
    }

    private static Set<String> parseScopes(String value) {
        if (value == null || value.isBlank()) return Collections.emptySet();
        return Collections.unmodifiableSet(new LinkedHashSet<>(Arrays.asList(value.trim().split("\\s+"))));
    }
    private static SecretKey key(String material) {
        try { return Keys.hmacShaKeyFor(MessageDigest.getInstance("SHA-256").digest(material.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception ex) { throw new IllegalStateException("SERVICE_TOKEN_CRYPTO_UNAVAILABLE", ex); }
    }
    private static String material(String configured, boolean local, String purpose) {
        if (configured != null && !configured.isBlank()) return configured;
        if (!local) throw new IllegalStateException("SERVICE_TOKEN_KEY_REQUIRED_" + purpose.toUpperCase());
        byte[] bytes = new byte[32]; new SecureRandom().nextBytes(bytes);
        LOG.warn("Cle {} ephemere generee pour profil local/test", purpose);
        return Encoders.BASE64.encode(bytes);
    }
    public static final class ServiceTokenException extends RuntimeException {
        private static final long serialVersionUID = 1L;
        public ServiceTokenException(String code) { super(code); }
    }
}
