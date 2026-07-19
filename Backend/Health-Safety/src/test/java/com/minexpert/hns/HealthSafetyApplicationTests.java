package com.minexpert.hns;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest
@ActiveProfiles("test")
class HealthSafetyApplicationTests {
    private static final String EPHEMERAL_JWT = ephemeralValue("jwt");
    private static final String EPHEMERAL_AES_KEY = ephemeralAesKey();
    private static final String EPHEMERAL_MAIL = ephemeralValue("mail");

    @DynamicPropertySource
    static void ephemeralCredentials(DynamicPropertyRegistry registry) {
        registry.add("JWT_SECRET", () -> EPHEMERAL_JWT);
        registry.add("SAFEX_GATEWAY_HNS_TOKEN_KEY", () -> ephemeralValue("gateway-hns"));
        registry.add("SAFEX_HRMS_HNS_TOKEN_KEY", () -> ephemeralValue("hrms-hns"));
        registry.add("SAFEX_HNS_HRMS_TOKEN_KEY", () -> ephemeralValue("hns-hrms"));
        registry.add("safex.encryption.key", () -> EPHEMERAL_AES_KEY);
        registry.add("spring.mail.password", () -> EPHEMERAL_MAIL);
        registry.add("MAIL_PASSWORD", () -> EPHEMERAL_MAIL);
    }

    private static String ephemeralValue(String purpose) {
        return "test-" + purpose + "-" + UUID.randomUUID() + UUID.randomUUID();
    }

    private static String ephemeralAesKey() {
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }

    @Test
    void contextLoadsWithoutExternalServices() {
    }
}
