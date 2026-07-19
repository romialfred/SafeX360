package com.minexpert.hns.api;

import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Garde RBAC du module Gestion des Erreurs — reprend EXACTEMENT la strategie de
 * {@code AccountPermissionController.requireAdminOrInternal} (remediation
 * securite) sans inventer de nouveau mecanisme :
 *  - cookie jwt present  → decision EXCLUSIVEMENT sur le role du token
 *                          (claim role ∈ alias admin) ; sinon 403.
 *  - pas de cookie + X-Secret-Key == secret interne → appel service-a-service
 *    legitime du gateway → autorise.
 *  - sinon 403.
 *
 * Extrait dans un composant partage pour eviter la duplication entre les deux
 * controllers du module ; la valeur des secrets reste alignee sur les autres
 * services (toute divergence casserait la validation de signature).
 */
@Component
public class ErrorRbacGuard {

    private static final Logger LOG = LoggerFactory.getLogger(ErrorRbacGuard.class);

    @Value("${JWT_SECRET:}")
    private String jwtSecret;

    /** Alias de role « administrateur » (insensible a la casse) — aligne sur MineXpert. */
    private static final Set<String> ADMIN_ROLE_ALIASES = Set.of(
            "SYSTEM_ADMINISTRATOR", "ADMINISTRATOR", "ADMIN");

    /**
     * Autorise uniquement un admin (cookie jwt avec role admin) OU un appel
     * interne service-a-service (X-Secret-Key sans cookie). Leve 403 sinon.
     */
    public void requireAdminOrInternal(HttpServletRequest request) {
        String token = readJwtCookie(request);
        if (token != null && !token.isBlank()) {
            try {
                Claims claims = Jwts.parser().setSigningKey(jwtSecret)
                        .parseClaimsJws(token).getBody();
                Object roleClaim = claims.get("role");
                String role = roleClaim != null ? roleClaim.toString().trim().toUpperCase() : null;
                if (role != null && ADMIN_ROLE_ALIASES.contains(role)) {
                    return;
                }
            } catch (Exception e) {
                LOG.warn("JWT module erreurs invalide: {}", e.getMessage());
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Acces reserve aux administrateurs");
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Acces reserve aux administrateurs");
    }

    /**
     * Autorise TOUT utilisateur authentifie (cookie jwt valide, quel que soit le
     * role) OU un appel interne service-a-service (X-Secret-Key). Reserve a la
     * DECLARATION d'un evenement — pilier Just Culture (§6 : tout collaborateur
     * peut declarer). La qualification/analyse/cloture restent reservees admin.
     */
    public void requireAuthenticated(HttpServletRequest request) {
        String token = readJwtCookie(request);
        if (token != null && !token.isBlank()) {
            try {
                Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
                return; // cookie jwt valide = utilisateur authentifie
            } catch (Exception e) {
                LOG.warn("JWT module erreurs invalide: {}", e.getMessage());
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise");
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise");
    }

    private String readJwtCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie c : cookies) {
            if ("jwt".equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }
}
