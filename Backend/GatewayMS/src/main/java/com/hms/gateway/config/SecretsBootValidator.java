package com.hms.gateway.config;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class SecretsBootValidator {
    private static final Logger LOG = LoggerFactory.getLogger(SecretsBootValidator.class);
    private static final String LEAKED_JWT_PREFIX = "80f9762a858c60d6a48a940ffbe1bb2c";
    @Value("${JWT_SECRET:}") private String jwtSecret;
    @Value("${SAFEX_GATEWAY_HNS_TOKEN_KEY:}") private String gatewayHnsKey;
    @Value("${SAFEX_GATEWAY_HRMS_TOKEN_KEY:}") private String gatewayHrmsKey;

    private final Environment environment;

    public SecretsBootValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validate() {
        // JWT_SECRET : exige partout (comportement d'avant la refonte).
        if (!validJwt()) throw new IllegalStateException("Required authentication keys missing, weak, or reused");
        // Cles d'identite de service : fatales en PRODUCTION uniquement — en
        // dev/test/local le ServiceTokenIssuer genere des cles ephemeres.
        boolean local = environment.acceptsProfiles(Profiles.of("dev", "test", "local"));
        boolean bothBlank = (gatewayHnsKey == null || gatewayHnsKey.isBlank())
                && (gatewayHrmsKey == null || gatewayHrmsKey.isBlank());
        if (local && bothBlank) {
            LOG.warn("Cles d'identite de service absentes — tolere en profil local, cles ephemeres utilisees");
            return;
        }
        boolean valid = validKey("SAFEX_GATEWAY_HNS_TOKEN_KEY", gatewayHnsKey)
                && validKey("SAFEX_GATEWAY_HRMS_TOKEN_KEY", gatewayHrmsKey)
                && distinct(gatewayHnsKey, gatewayHrmsKey);
        if (!valid) throw new IllegalStateException("Required authentication keys missing, weak, or reused");
        LOG.info("Authentication and audience-specific workload keys validated");
    }
    private boolean validJwt() {
        boolean valid = jwtSecret != null && !jwtSecret.isBlank() && !jwtSecret.startsWith(LEAKED_JWT_PREFIX);
        if (!valid) LOG.error("JWT_SECRET missing or compromised");
        return valid;
    }
    private boolean validKey(String name, String value) {
        boolean valid = value != null && value.length() >= 32;
        if (!valid) LOG.error("{} missing or shorter than 32 characters", name);
        return valid;
    }
    private boolean distinct(String left, String right) {
        boolean distinct = left != null && right != null && !MessageDigest.isEqual(
                left.getBytes(StandardCharsets.UTF_8), right.getBytes(StandardCharsets.UTF_8));
        if (!distinct) LOG.error("Workload keys must be distinct per audience");
        return distinct;
    }
}
