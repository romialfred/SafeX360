package com.minexpert.hns.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import feign.RequestInterceptor;
import feign.RequestTemplate;

/**
 * LOT 41 P0 SECURITY : externalisation du secret service-to-service.
 *
 * Avant : header X-Secret-Key=SECRET hardcodé. Maintenant : valeur lue
 * via env var INTERNAL_GATEWAY_SECRET, alignée avec :
 *   - TokenFilter.java (Gateway)
 *   - MyConfig.java (MineXpert)
 *   - SecurityConfig.java (Health-Safety)
 *
 * Un attaquant qui atteint MineXpert:8080 ou Health-Safety:8081 doit
 * désormais connaître la valeur de INTERNAL_GATEWAY_SECRET pour bypass
 * l'authentification — au lieu de simplement envoyer la chaîne "SECRET".
 */
@Configuration
public class FeignClientInterceptor implements RequestInterceptor {

    @Value("${INTERNAL_GATEWAY_SECRET:CHANGE_ME_IN_PROD}")
    private String internalSecret;

    @Override
    public void apply(RequestTemplate template) {
        template.header("X-Secret-Key", internalSecret);
    }
}
