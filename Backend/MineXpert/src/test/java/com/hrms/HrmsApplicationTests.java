package com.hrms;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest
@ActiveProfiles("test")
class HrmsApplicationTests {
	private static final String EPHEMERAL_JWT = ephemeralValue("jwt");
	private static final String EPHEMERAL_DIRECTORY = ephemeralValue("directory");
	private static final String EPHEMERAL_MAIL = ephemeralValue("mail");

	@DynamicPropertySource
	static void ephemeralCredentials(DynamicPropertyRegistry registry) {
		registry.add("JWT_SECRET", () -> EPHEMERAL_JWT);
		registry.add("jwt.secret", () -> EPHEMERAL_JWT);
		registry.add("SAFEX_GATEWAY_HRMS_TOKEN_KEY", () -> ephemeralValue("gateway-hrms"));
		registry.add("SAFEX_HNS_HRMS_TOKEN_KEY", () -> ephemeralValue("hns-hrms"));
		registry.add("SAFEX_HRMS_HNS_TOKEN_KEY", () -> ephemeralValue("hrms-hns"));
		registry.add("MFA_ENCRYPTION_KEY", () -> ephemeralValue("mfa-encryption"));
		registry.add("SAFEX_ENCRYPTION_KEY", () -> EPHEMERAL_DIRECTORY);
		registry.add("spring.mail.password", () -> EPHEMERAL_MAIL);
	}

	private static String ephemeralValue(String purpose) {
		return "test-" + purpose + "-" + UUID.randomUUID() + UUID.randomUUID();
	}

	@Test
	void contextLoads() {
	}

}
