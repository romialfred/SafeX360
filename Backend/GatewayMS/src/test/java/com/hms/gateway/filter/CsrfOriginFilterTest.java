package com.hms.gateway.filter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

import com.hms.gateway.config.AllowedOriginPolicy;

class CsrfOriginFilterTest {

    private CsrfOriginFilter filter;

    @BeforeEach
    void setUp() {
        filter = new CsrfOriginFilter(new AllowedOriginPolicy(
            "https://safex.example,https://localhost"
        ));
    }

    @Test
    void rejectsMutationWithoutOrigin() {
        MockServerWebExchange exchange = exchange(HttpMethod.POST, null);
        AtomicBoolean chained = new AtomicBoolean(false);

        filter.filter(exchange, ignored -> {
            chained.set(true);
            return reactor.core.publisher.Mono.empty();
        }).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(chained).isFalse();
    }

    @Test
    void rejectsMutationFromUnapprovedOrigin() {
        MockServerWebExchange exchange = exchange(HttpMethod.DELETE, "https://attacker.example");

        filter.filter(exchange, ignored -> reactor.core.publisher.Mono.empty()).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void allowsApprovedMutationAndSafeReads() {
        AtomicBoolean approvedChained = new AtomicBoolean(false);
        MockServerWebExchange approved = exchange(HttpMethod.PATCH, "https://safex.example");
        filter.filter(approved, ignored -> {
            approvedChained.set(true);
            return reactor.core.publisher.Mono.empty();
        }).block();

        AtomicBoolean readChained = new AtomicBoolean(false);
        MockServerWebExchange read = exchange(HttpMethod.GET, null);
        filter.filter(read, ignored -> {
            readChained.set(true);
            return reactor.core.publisher.Mono.empty();
        }).block();

        assertThat(approvedChained).isTrue();
        assertThat(readChained).isTrue();
    }

    private MockServerWebExchange exchange(HttpMethod method, String origin) {
        MockServerHttpRequest.BaseBuilder<?> request = MockServerHttpRequest
            .method(method, "/hns/emergency/sos");
        if (origin != null) request.header("Origin", origin);
        return MockServerWebExchange.from(request.build());
    }
}

