package com.minexpert.hns.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Date;
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

@Component
public class ServiceTokenIssuer {
    private static final Logger LOG = LoggerFactory.getLogger(ServiceTokenIssuer.class);
    private final SecretKey key;

    public ServiceTokenIssuer(@Value("${SAFEX_HNS_HRMS_TOKEN_KEY:}") String material,
            Environment environment) {
        boolean local = environment.acceptsProfiles(Profiles.of("dev", "test", "local"));
        if (material == null || material.isBlank()) {
            if (!local) throw new IllegalStateException("SAFEX_HNS_HRMS_TOKEN_KEY_REQUIRED");
            byte[] bytes = new byte[32]; new SecureRandom().nextBytes(bytes);
            material = Encoders.BASE64.encode(bytes);
            LOG.warn("Cle hns-hrms ephemere generee pour profil local/test");
        }
        try {
            key = Keys.hmacShaKeyFor(MessageDigest.getInstance("SHA-256")
                    .digest(material.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("SERVICE_TOKEN_CRYPTO_UNAVAILABLE", ex);
        }
    }

    public String issueReferenceRead() {
        Instant now = Instant.now();
        return Jwts.builder().setIssuer("safex-hns").setAudience("safex-hrms")
                .setId(UUID.randomUUID().toString()).setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(45)))
                .claim("scope", "hrms:reference:read").signWith(key).compact();
    }
}
