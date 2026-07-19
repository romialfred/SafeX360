package com.minexpert.hns.config;

import org.springframework.context.annotation.Configuration;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import com.minexpert.hns.security.ServiceTokenIssuer;
import com.minexpert.hns.security.ServiceTokenVerifier;

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

    private final ServiceTokenIssuer tokenIssuer;

    public FeignClientInterceptor(ServiceTokenIssuer tokenIssuer) {
        this.tokenIssuer = tokenIssuer;
    }

    @Override
    public void apply(RequestTemplate template) {
        template.header(ServiceTokenVerifier.HEADER, tokenIssuer.issueReferenceRead());
    }
}
