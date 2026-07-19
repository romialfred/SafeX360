package com.hms.gateway.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Date;
import java.util.Set;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;

/** Jetons workload courts et distincts par audience. */
@Component
public class ServiceTokenIssuer {
    public static final String HEADER = "X-Service-Token";
    private static final Logger LOG = LoggerFactory.getLogger(ServiceTokenIssuer.class);
    private final SecretKey hnsKey;
    private final SecretKey hrmsKey;

    public ServiceTokenIssuer(
            @Value("${SAFEX_GATEWAY_HNS_TOKEN_KEY:}") String hnsMaterial,
            @Value("${SAFEX_GATEWAY_HRMS_TOKEN_KEY:}") String hrmsMaterial,
            Environment environment) {
        boolean local = environment.acceptsProfiles(Profiles.of("dev", "test", "local"));
        hnsMaterial = material(hnsMaterial, local, "gateway-hns");
        hrmsMaterial = material(hrmsMaterial, local, "gateway-hrms");
        if (MessageDigest.isEqual(hnsMaterial.getBytes(StandardCharsets.UTF_8),
                hrmsMaterial.getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalStateException("SERVICE_TOKEN_KEYS_MUST_BE_DISTINCT");
        }
        this.hnsKey = key(hnsMaterial);
        this.hrmsKey = key(hrmsMaterial);
    }

    public String issueForPath(String path) {
        if (path != null && path.startsWith("/hns/")) {
            return issue(hnsKey, "safex-hns", Set.of("hns:proxy"));
        }
        if (path != null && path.startsWith("/hrms/")) {
            return issue(hrmsKey, "safex-hrms", Set.of("hrms:proxy"));
        }
        throw new IllegalArgumentException("SERVICE_AUDIENCE_UNKNOWN");
    }

    String issue(SecretKey key, String audience, Set<String> scopes) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setIssuer("safex-gateway")
                .setAudience(audience)
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(45)))
                .claim("scope", String.join(" ", scopes))
                .signWith(key)
                .compact();
    }

    private static SecretKey key(String material) {
        try {
            return Keys.hmacShaKeyFor(MessageDigest.getInstance("SHA-256")
                    .digest(material.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("SERVICE_TOKEN_CRYPTO_UNAVAILABLE", ex);
        }
    }

    private static String material(String configured, boolean local, String purpose) {
        if (configured != null && !configured.isBlank()) return configured;
        if (!local) throw new IllegalStateException("SERVICE_TOKEN_KEY_REQUIRED_" + purpose.toUpperCase());
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        LOG.warn("Cle {} ephemere generee pour profil local/test", purpose);
        return Encoders.BASE64.encode(bytes);
    }
}
