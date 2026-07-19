package com.hms.gateway.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class GatewayCorsConfiguration {

    @Bean
    CorsWebFilter corsWebFilter(AllowedOriginPolicy originPolicy) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(originPolicy.origins());
        cors.setAllowedMethods(List.of("GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of(
            "Accept", "Content-Type", "If-Match", "If-None-Match",
            "X-Requested-With", "X-CSRF-Token",
            // En-têtes MÉTIER envoyés par le frontend et EXIGÉS par le serveur :
            // X-Reason est un @RequestHeader(required = true) des endpoints
            // nominatifs de dosimétrie (traçabilité RGPD art. 30) et des actions
            // blast ; X-User-Id accompagne plusieurs services (blast, rapports
            // d'évacuation). Les omettre faisait échouer le preflight de tout
            // client cross-origin — dev web (5173 → 9100) et APK Capacitor —
            // donc les écrans dosimétrie nominative et blast hors proxy Vercel.
            "X-Reason", "X-User-Id"
        ));
        cors.setExposedHeaders(List.of("Content-Disposition", "ETag", "Retry-After"));
        cors.setAllowCredentials(true);
        cors.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return new CorsWebFilter(source);
    }
}

