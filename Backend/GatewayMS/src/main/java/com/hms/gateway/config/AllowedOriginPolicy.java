package com.hms.gateway.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Source de vérité des origines navigateur autorisées par la Gateway. */
@Component
public class AllowedOriginPolicy {

    private final List<String> origins;

    public AllowedOriginPolicy(@Value("${SAFEX_ALLOWED_ORIGINS}") String configuredOrigins) {
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

