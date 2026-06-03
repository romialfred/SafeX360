package com.hms.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

@Component
public class TokenFilter extends AbstractGatewayFilterFactory<TokenFilter.Config> {
    // R-001 Phase 2.a — Secret extrait du code source
    @org.springframework.beans.factory.annotation.Value("${JWT_SECRET}")
    private String SECRET;

    public TokenFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String method = exchange.getRequest().getMethod().name();
            String path = exchange.getRequest().getPath().toString();

            // 🛑 Skip JWT check for preflight (CORS) requests
            if (method.equalsIgnoreCase("OPTIONS")) {
                return chain.filter(exchange);
            }
            if (path.contains("/actuator/health") || path.contains("/services-health")) {
                return chain.filter(exchange);
            }

            if (path.equals("/hrms/auth/login") || path.equals("/hrms/account/reset-password")) {
                return chain.filter(exchange.mutate()
                        .request(r -> r.header("X-Secret-Key", "SECRET"))
                        .build());
            }

            String token = null;
            if (exchange.getRequest().getCookies().containsKey("jwt")) {
                token = exchange.getRequest().getCookies().getFirst("jwt").getValue();
            }

            if (token == null || token.isEmpty()) {
                throw new RuntimeException("JWT cookie is missing");
            }

            try {
                Claims claims = Jwts.parser()
                        .setSigningKey(SECRET)
                        .parseClaimsJws(token)
                        .getBody();

                exchange = exchange.mutate()
                        .request(r -> r.header("X-Secret-Key", "SECRET"))
                        .build();

            } catch (Exception e) {
                throw new RuntimeException("Token is invalid");
            }

            return chain.filter(exchange);
        };
    }

    public static class Config {

    }
}
