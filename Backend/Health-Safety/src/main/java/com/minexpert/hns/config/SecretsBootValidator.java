package com.minexpert.hns.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class SecretsBootValidator {

    private static final Logger LOG = LoggerFactory.getLogger(SecretsBootValidator.class);

    private static final String LEAKED_JWT_PREFIX = "80f9762a858c60d6a48a940ffbe1bb2c";

    @Value("${JWT_SECRET:}")
    private String jwtSecret;

    @Value("${INTERNAL_GATEWAY_SECRET:}")
    private String gatewaySecret;

    @PostConstruct
    public void validate() {
        validateJwtSecret();
        validateGatewaySecret();
        LOG.info("[SecretsBootValidator] All secrets validated — boot authorized.");
    }

    private void validateJwtSecret() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "[SecretsBootValidator] JWT_SECRET is REQUIRED. "
                            + "Set the JWT_SECRET environment variable (min 64 hex chars). "
                            + "Generate one with: openssl rand -hex 64");
        }
        if (jwtSecret.startsWith(LEAKED_JWT_PREFIX)) {
            throw new IllegalStateException(
                    "[SecretsBootValidator] JWT_SECRET matches the value leaked in public git history. "
                            + "This key is COMPROMISED — anyone can forge JWTs. "
                            + "Rotate immediately: openssl rand -hex 64, then set JWT_SECRET on ALL services.");
        }
    }

    private void validateGatewaySecret() {
        if (gatewaySecret == null || gatewaySecret.isBlank()) {
            throw new IllegalStateException(
                    "[SecretsBootValidator] INTERNAL_GATEWAY_SECRET is REQUIRED. "
                            + "Set the INTERNAL_GATEWAY_SECRET environment variable. "
                            + "Generate one with: openssl rand -hex 32");
        }
        if ("CHANGE_ME_IN_PROD".equals(gatewaySecret)) {
            throw new IllegalStateException(
                    "[SecretsBootValidator] INTERNAL_GATEWAY_SECRET is set to the default 'CHANGE_ME_IN_PROD'. "
                            + "Generate a proper secret: openssl rand -hex 32");
        }
    }
}
