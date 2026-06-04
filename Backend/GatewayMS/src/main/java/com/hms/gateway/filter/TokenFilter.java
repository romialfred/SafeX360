package com.hms.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

@Component
public class TokenFilter extends AbstractGatewayFilterFactory<TokenFilter.Config> {
    private static final String SECRET = "80f9762a858c60d6a48a940ffbe1bb2c0af7557c93030805bd10a397d2ae072d77c509aab1bd901f1115e84fb50561d1b61ceb7e99d97f1e785e0b9452e5d874";

    // LOT 41 P0 SECURITY: secret partagé entre Gateway et microservices.
    // Permet aux microservices de rejeter toute requête qui ne provient pas du Gateway.
    // L'attaquant doit désormais (1) atteindre le port backend ET (2) connaître ce secret.
    @org.springframework.beans.factory.annotation.Value("${INTERNAL_GATEWAY_SECRET:CHANGE_ME_IN_PROD}")
    private String INTERNAL_GATEWAY_SECRET;

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
                // LOT 41 P0 SECURITY: injecte la valeur secrète externalisée plutôt que le littéral "SECRET"
                return chain.filter(exchange.mutate()
                        .request(r -> r.header("X-Secret-Key", INTERNAL_GATEWAY_SECRET))
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

                // LOT 41 P0 SECURITY: injecte la valeur secrète externalisée plutôt que le littéral "SECRET"
                exchange = exchange.mutate()
                        .request(r -> r.header("X-Secret-Key", INTERNAL_GATEWAY_SECRET))
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
