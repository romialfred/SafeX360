package com.hms.gateway.filter;

import static org.assertj.core.api.Assertions.assertThat;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.mock.env.MockEnvironment;

import com.hms.gateway.security.ServiceTokenIssuer;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Encoders;
import reactor.core.publisher.Mono;

class TokenFilterTrustedHeadersTest {

    @Test
    void stripsForgedHeadersAndInjectsRoleAndMineScopeFromValidatedJwt() {
        byte[] signingKey = new byte[64];
        new SecureRandom().nextBytes(signingKey);
        String jwtSecret = Encoders.BASE64.encode(signingKey);
        String token = Jwts.builder()
                .setClaims(Map.of(
                        "id", 41L,
                        "role", "hse manager",
                        "companies", "7,9",
                        "allMines", false))
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();

        TokenFilter filter = new TokenFilter();
        ReflectionTestUtils.setField(filter, "SECRET", jwtSecret);
        ReflectionTestUtils.setField(filter, "serviceTokenIssuer", new ServiceTokenIssuer(
                "runtime-generated-gateway-hns-key-material",
                "runtime-generated-gateway-hrms-key-material",
                new MockEnvironment()));

        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest
                .get("/hns/incidents/getAll")
                .cookie(new HttpCookie("jwt", token))
                .header("X-Role", "ADMIN")
                .header("X-User-Id", "999")
                .header("X-User-Companies", "999")
                .header("X-All-Mines", "true")
                .header("X-Permissions", "DOSIMETRY_ADMIN")
                .header("X-Secret-Key", "forged")
                .build());
        AtomicReference<org.springframework.web.server.ServerWebExchange> forwarded = new AtomicReference<>();

        filter.apply(new TokenFilter.Config())
                .filter(exchange, filtered -> {
                    forwarded.set(filtered);
                    return Mono.empty();
                })
                .block();

        var headers = forwarded.get().getRequest().getHeaders();
        assertThat(headers.getFirst("X-Secret-Key")).isNull();
        assertThat(headers.getFirst(ServiceTokenIssuer.HEADER)).isNotBlank();
        assertThat(headers.getFirst("X-Role")).isEqualTo("HSE_MANAGER");
        assertThat(headers.getFirst("X-User-Id")).isEqualTo("41");
        assertThat(headers.getFirst("X-User-Companies")).isEqualTo("7,9");
        assertThat(headers.getFirst("X-All-Mines")).isEqualTo("false");
        assertThat(headers.getFirst("X-Permissions"))
                .contains("INSPECTION_VIEW")
                .doesNotContain("DOSIMETRY_ADMIN");
    }
}
