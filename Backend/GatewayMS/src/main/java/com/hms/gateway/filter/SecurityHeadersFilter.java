package com.hms.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class SecurityHeadersFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        final ServerHttpResponse response = exchange.getResponse();
        // BUG P0 CORRIGE : la version precedente ajoutait les en-tetes dans un
        // « chain.filter(exchange).then(...) », c.-a-d. APRES l'execution de la
        // chaine. A cet instant la reponse est deja committee (NettyWriteResponse
        // Filter) et ses en-tetes sont des ReadOnlyHttpHeaders : addIfAbsent(...)
        // lancait UnsupportedOperationException, que Spring Cloud Gateway
        // convertissait en 500 sur TOUTE requete proxifiee (login excepte selon
        // le timing du commit). Symptome cote client : « aucun formulaire
        // n'enregistre », dropdowns vides, floods de 500.
        //
        // beforeCommit(...) enregistre un callback execute JUSTE AVANT le commit,
        // pendant que les en-tetes sont encore mutables : c'est le point d'ancrage
        // canonique pour ajouter des en-tetes de reponse dans une gateway reactive.
        response.beforeCommit(() -> {
            HttpHeaders headers = response.getHeaders();
            headers.addIfAbsent("X-Content-Type-Options", "nosniff");
            headers.addIfAbsent("X-Frame-Options", "DENY");
            headers.addIfAbsent("Referrer-Policy", "strict-origin-when-cross-origin");
            headers.addIfAbsent("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
            headers.addIfAbsent("X-Permitted-Cross-Domain-Policies", "none");
            headers.addIfAbsent("Content-Security-Policy",
                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
            return Mono.empty();
        });
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
