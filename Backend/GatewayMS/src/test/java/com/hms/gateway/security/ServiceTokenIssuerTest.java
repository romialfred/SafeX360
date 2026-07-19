package com.hms.gateway.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

class ServiceTokenIssuerTest {
    private static final String HNS = "runtime-generated-gateway-hns-key-material";
    private static final String HRMS = "runtime-generated-gateway-hrms-key-material";

    @Test
    void signsDifferentAudiencesWithDifferentKeys() throws Exception {
        ServiceTokenIssuer issuer = new ServiceTokenIssuer(HNS, HRMS, new MockEnvironment());
        var hnsClaims = Jwts.parserBuilder().setSigningKey(Keys.hmacShaKeyFor(
                MessageDigest.getInstance("SHA-256").digest(HNS.getBytes(StandardCharsets.UTF_8))))
                .build().parseClaimsJws(issuer.issueForPath("/hns/incidents")).getBody();
        var hrmsClaims = Jwts.parserBuilder().setSigningKey(Keys.hmacShaKeyFor(
                MessageDigest.getInstance("SHA-256").digest(HRMS.getBytes(StandardCharsets.UTF_8))))
                .build().parseClaimsJws(issuer.issueForPath("/hrms/auth/login")).getBody();
        assertThat(hnsClaims.getAudience()).isEqualTo("safex-hns");
        assertThat(hnsClaims.get("scope", String.class)).isEqualTo("hns:proxy");
        assertThat(hrmsClaims.getAudience()).isEqualTo("safex-hrms");
        assertThat(hrmsClaims.get("scope", String.class)).isEqualTo("hrms:proxy");
    }
}
