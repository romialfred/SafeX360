package com.hms.gateway.filter;

import java.util.Set;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import com.hms.gateway.config.AllowedOriginPolicy;

import reactor.core.publisher.Mono;

/**
 * Protection CSRF adaptée au cookie JWT cross-site : toute mutation navigateur
 * doit porter une origine exacte de la liste approuvée. Un site tiers ne peut
 * pas forger l'en-tête Origin dans le navigateur.
 */
@Component
public class CsrfOriginFilter implements GlobalFilter, Ordered {

    private static final Set<HttpMethod> SAFE_METHODS = Set.of(
        HttpMethod.GET, HttpMethod.HEAD, HttpMethod.OPTIONS, HttpMethod.TRACE
    );

    private final AllowedOriginPolicy originPolicy;

    public CsrfOriginFilter(AllowedOriginPolicy originPolicy) {
        this.originPolicy = originPolicy;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        HttpMethod method = exchange.getRequest().getMethod();
        String path = exchange.getRequest().getPath().value();
        if (method == null || SAFE_METHODS.contains(method)
                || !(path.startsWith("/hrms/") || path.startsWith("/hns/"))) {
            return chain.filter(exchange);
        }

        String origin = exchange.getRequest().getHeaders().getOrigin();
        if (!originPolicy.allows(origin)) {
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -200;
    }
}

