package com.hms.gateway.clients;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import feign.RequestInterceptor;
import feign.RequestTemplate;

/**
 * LOT 41 P0 SECURITY (audit fix) : externalisation du secret service-to-service.
 *
 * Avant : header X-Secret-Key=SECRET hardcodé. Aligné maintenant avec les 4
 * autres emplacements (TokenFilter, MyConfig, SecurityConfig MineXpert,
 * SecurityConfig Health-Safety, FeignClientInterceptor Health-Safety) qui
 * lisent tous la variable d'environnement INTERNAL_GATEWAY_SECRET.
 *
 * Sans ce fix, tout appel Feign depuis le Gateway vers MineXpert ou
 * Health-Safety était rejeté en denyAll côté microservices.
 */
@Configuration
public class FeignClientInterceptor implements RequestInterceptor {

    @Value("${INTERNAL_GATEWAY_SECRET:}")
    private String internalSecret;

    @Override
    public void apply(RequestTemplate template) {
        template.header("X-Secret-Key", internalSecret);
    }
}
