package com.hms.gateway.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Source de vérité des origines navigateur autorisées par la Gateway. */
@Component
public class AllowedOriginPolicy {

    private final List<String> origins;

    // Propriete INTERNE `safex.allowed-origins` (elle-meme alimentee par l'env
    // var SAFEX_ALLOWED_ORIGINS avec repli sur la liste par defaut du yml).
    // Ne JAMAIS redonner a la propriete le nom de l'env var : le placeholder
    // se resoudrait sur lui-meme quand la variable est absente -> « Circular
    // placeholder reference » -> crash au demarrage (panne prod du 2026-07-19).
    public AllowedOriginPolicy(@Value("${safex.allowed-origins}") String configuredOrigins) {
        this.origins = Arrays.stream(configuredOrigins.split(","))
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .distinct()
            .toList();
        if (origins.isEmpty()) {
            throw new IllegalStateException("SAFEX_ALLOWED_ORIGINS ne peut pas être vide");
        }
    }

    public List<String> origins() {
        return origins;
    }

    public boolean allows(String origin) {
        return origin != null && origins.contains(origin);
    }
}

