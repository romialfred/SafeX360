package com.hrms.config;

import java.util.HashSet;
import java.util.List;

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
    @Value("${SAFEX_GATEWAY_HRMS_TOKEN_KEY:}") private String gatewayHrmsKey;
    @Value("${SAFEX_HNS_HRMS_TOKEN_KEY:}") private String hnsHrmsKey;
    @Value("${SAFEX_HRMS_HNS_TOKEN_KEY:}") private String hrmsHnsKey;

    private final Environment environment;

    public SecretsBootValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validate() {
        // JWT_SECRET reste exige PARTOUT, y compris en dev (comportement d'avant
        // la refonte : .env le fournit toujours, le login local en depend).
        if (jwtSecret == null || jwtSecret.isBlank() || jwtSecret.startsWith(LEAKED_JWT_PREFIX)) {
            LOG.error("JWT_SECRET missing or compromised");
            throw new IllegalStateException("Required authentication keys missing, weak, or reused");
        }
        List<String> keys = List.of(safe(gatewayHrmsKey), safe(hnsHrmsKey), safe(hrmsHnsKey));
        // Cles d'identite de service : fatales en PRODUCTION uniquement, comme le
        // documente .env.example. En dev/test/local, ServiceTokenVerifier/Issuer
        // generent des cles ephemeres — exiger les cles ici tuait ce repli.
        boolean local = environment.acceptsProfiles(Profiles.of("dev", "test", "local"));
        if (local && keys.stream().allMatch(String::isBlank)) {
            LOG.warn("Cles d'identite de service absentes — tolere en profil local, cles ephemeres utilisees");
            return;
        }
        boolean valid = keys.stream().allMatch(key -> key.length() >= 32)
                && new HashSet<>(keys).size() == keys.size();
        if (!valid) {
            LOG.error("Distinct HRMS workload keys missing, weak, or reused");
            throw new IllegalStateException("Required authentication keys missing, weak, or reused");
        }
        LOG.info("Authentication and least-privilege workload keys validated");
    }
    private static String safe(String value) { return value == null ? "" : value; }
}
