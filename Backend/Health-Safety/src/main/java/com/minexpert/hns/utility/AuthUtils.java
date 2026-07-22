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

    /**
     * Id EMPLOYÉ (empId) de l'utilisateur authentifié, ou null. Distinct de
     * {@link #currentActorId()} (id de compte) : c'est l'espace d'identifiants des
     * PERSONNES (responsable d'action, membre d'équipe d'enquête). Posé par
     * {@code GatewayAuthorityFilter} dans les {@code details} depuis l'en-tête
     * {@code X-User-Emp-Id} (claim {@code empId} du JWT, non répudiable).
     *
     * <p>Sert aux gardes d'indépendance / ségrégation des tâches (ISO 45001 §10.2 e) :
     * vérificateur ≠ responsable, validateur ≠ investigateur. Null (compte sans
     * employé) ⇒ l'acteur ne peut être ni l'un ni l'autre (tous deux des empId),
     * la garde ne bloque donc pas — comportement sûr par construction.
     */
    public static Long currentEmpId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) {
                return null;
            }
            Object details = auth.getDetails();
            if (details == null) {
                return null;
            }
            String raw = String.valueOf(details).trim();
            if (raw.isEmpty()) {
                return null;
            }
            return Long.parseLong(raw);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Vrai si la requête courante porte l'autorité RBAC donnée (posée par la
     * passerelle dans {@code X-Permissions}, jamais fournie par le client). Sert
     * aux gardes de service qui ne peuvent pas passer par {@code @PreAuthorize}
     * (ex. une action conditionnée par le statut cible sur un endpoint partagé).
     */
    public static boolean hasAuthority(String authority) {
        if (authority == null) {
            return false;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> authority.equals(a.getAuthority()));
    }

    /**
     * Vrai si la requête courante porte AU MOINS une autorité RBAC (posée par la
     * passerelle dans {@code X-Permissions}). Signal robuste de « requête utilisateur
     * passée par la passerelle », indépendant de la présence du claim identité —
     * utile aux gardes fail-closed qui ne doivent pas s'ouvrir si {@code X-User-Id}
     * venait à manquer alors que des autorités sont pourtant présentes.
     */
    public static boolean hasAnyAuthority() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities() != null && !auth.getAuthorities().isEmpty();
    }
}
