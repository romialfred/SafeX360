package com.hms.gateway;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest
@ActiveProfiles("test")
class GatewayMsApplicationTests {
	private static final String EPHEMERAL_JWT = ephemeralValue("jwt");

	@DynamicPropertySource
	static void ephemeralCredentials(DynamicPropertyRegistry registry) {
		registry.add("JWT_SECRET", () -> EPHEMERAL_JWT);
		registry.add("SAFEX_GATEWAY_HNS_TOKEN_KEY", () -> ephemeralValue("gateway-hns"));
		registry.add("SAFEX_GATEWAY_HRMS_TOKEN_KEY", () -> ephemeralValue("gateway-hrms"));
	}

	private static String ephemeralValue(String purpose) {
		return "test-" + purpose + "-" + UUID.randomUUID() + UUID.randomUUID();
	}

	@Test
	void contextLoads() {
	}

}
