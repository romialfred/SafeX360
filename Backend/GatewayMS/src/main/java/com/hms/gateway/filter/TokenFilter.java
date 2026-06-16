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
    @org.springframework.beans.factory.annotation.Value("${JWT_SECRET:80f9762a858c60d6a48a940ffbe1bb2c0af7557c93030805bd10a397d2ae072d77c509aab1bd901f1115e84fb50561d1b61ceb7e99d97f1e785e0b9452e5d874}")
    private String SECRET;

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
                // Cookie JWT manquant : 401 réactif (pas de 500).
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
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
                // Token invalide/expiré : 401 réactif (pas de 500).
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            return chain.filter(exchange);
        };
    }

    public static class Config {

    }
}
