package com.hms.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

@Component
public class TokenFilter extends AbstractGatewayFilterFactory<TokenFilter.Config> {
    // LOT 52 (remédiation GATE SEC-03) : clé JWT externalisée — la valeur par
    // défaut historique reste en repli pour ne pas casser les déploiements
    // existants ; LA ROTATION (nouvelle valeur via env JWT_SECRET sur tous les
    // services simultanément) reste REQUISE, l'ancienne valeur étant publique.
    @org.springframework.beans.factory.annotation.Value("${JWT_SECRET:}")
    private String SECRET;

    // LOT 41 P0 SECURITY: secret partagé entre Gateway et microservices.
    // Permet aux microservices de rejeter toute requête qui ne provient pas du Gateway.
    // L'attaquant doit désormais (1) atteindre le port backend ET (2) connaître ce secret.
    @org.springframework.beans.factory.annotation.Value("${INTERNAL_GATEWAY_SECRET:}")
    private String INTERNAL_GATEWAY_SECRET;

    public TokenFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // SEC 1.1 — Strip any externally-supplied X-Secret-Key to prevent spoofing.
            // The gateway is the sole legitimate source of this header.
            exchange = exchange.mutate()
                    .request(r -> r.headers(h -> h.remove("X-Secret-Key")))
                    .build();

            String method = exchange.getRequest().getMethod().name();
            String path = exchange.getRequest().getPath().toString();

            if (method.equalsIgnoreCase("OPTIONS")) {
                return chain.filter(exchange);
            }
            if (path.startsWith("/actuator/health") || path.startsWith("/services-health")) {
                return chain.filter(exchange);
            }

            if (path.equals("/hrms/auth/login") || path.equals("/hrms/account/reset-password")) {
                return chain.filter(exchange.mutate()
                        .request(r -> r.header("X-Secret-Key", INTERNAL_GATEWAY_SECRET))
                        .build());
            }

            String token = null;
            if (exchange.getRequest().getCookies().containsKey("jwt")) {
                token = exchange.getRequest().getCookies().getFirst("jwt").getValue();
            }

            if (token == null || token.isEmpty()) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            try {
                Claims claims = Jwts.parser()
                        .setSigningKey(SECRET)
                        .parseClaimsJws(token)
                        .getBody();

                exchange = exchange.mutate()
                        .request(r -> r.header("X-Secret-Key", INTERNAL_GATEWAY_SECRET))
                        .build();

            } catch (Exception e) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            return chain.filter(exchange);
        };
    }

    public static class Config {

    }
}
