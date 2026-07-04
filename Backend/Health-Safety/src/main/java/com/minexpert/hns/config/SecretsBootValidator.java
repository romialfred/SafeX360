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
        boolean fatal = false;
        fatal |= !validateJwtSecret();
        fatal |= !validateGatewaySecret();
        if (!fatal) {
            LOG.info("[SecretsBootValidator] All secrets validated — boot authorized.");
        } else {
            LOG.error("╔══════════════════════════════════════════════════════════════╗");
            LOG.error("║  FATAL — required secrets missing or compromised.           ║");
            LOG.error("║  The application CANNOT start safely. Fix env vars above.   ║");
            LOG.error("╚══════════════════════════════════════════════════════════════╝");
            throw new IllegalStateException(
                    "SecretsBootValidator: required secrets are missing or compromised — refusing to start. "
                    + "Set JWT_SECRET and INTERNAL_GATEWAY_SECRET as environment variables.");
        }
    }

    private boolean validateJwtSecret() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            LOG.error("[SecretsBootValidator] JWT_SECRET is BLANK. "
                    + "Authentication will fail. Set JWT_SECRET (min 64 hex chars). "
                    + "Generate: openssl rand -hex 64");
            return false;
        }
        if (jwtSecret.startsWith(LEAKED_JWT_PREFIX)) {
            LOG.error("[SecretsBootValidator] JWT_SECRET matches the value leaked in public git history. "
                    + "This key is COMPROMISED — anyone can forge JWTs. "
                    + "Rotate ASAP: openssl rand -hex 64, then set JWT_SECRET on ALL services.");
            return false;
        }
        return true;
    }

    private boolean validateGatewaySecret() {
        if (gatewaySecret == null || gatewaySecret.isBlank()) {
            LOG.warn("[SecretsBootValidator] INTERNAL_GATEWAY_SECRET is blank. "
                    + "Security filter will match empty header — set a proper value.");
            return false;
        }
        if ("CHANGE_ME_IN_PROD".equals(gatewaySecret) || "dev-secret".equals(gatewaySecret)) {
            LOG.warn("[SecretsBootValidator] INTERNAL_GATEWAY_SECRET is a known default ('"
                    + gatewaySecret + "'). Not safe for production. "
                    + "Generate: openssl rand -hex 32");
            return false;
        }
        return true;
    }
}
