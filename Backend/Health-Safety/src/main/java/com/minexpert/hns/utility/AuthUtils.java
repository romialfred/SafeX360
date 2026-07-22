package com.minexpert.hns.utility;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Accès à l'identité AUTHENTIFIÉE de la requête courante.
 *
 * Le principal du SecurityContext est posé par {@code GatewayAuthorityFilter}
 * à la valeur de l'en-tête {@code X-User-Id} (identifiant employé injecté par la
 * passerelle après validation du JWT). C'est la SEULE source non répudiable du
 * « qui » — à préférer à tout identifiant fourni dans le corps/paramètre d'une
 * requête (falsifiable) pour la traçabilité réglementaire (ISO 45001 §7.5.3).
 */
public final class AuthUtils {

    private AuthUtils() {
    }

    /** Id de l'utilisateur authentifié, ou null (appel système / non authentifié). */
    public static Long currentActorId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) {
                return null;
            }
            String name = auth.getName();
            if (name == null || name.isBlank()
                    || "anonymous-gateway".equals(name) || "anonymousUser".equals(name)) {
                return null;
            }
            return Long.parseLong(name.trim());
        } catch (Exception e) {
            return null;
        }
    }
}
