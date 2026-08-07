package com.minexpert.hns.config;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.minexpert.hns.entity.users.PermissionManagement;
import com.minexpert.hns.repository.users.PermissionManagementRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * GARDE RBAC SERVEUR par MODULE — applique la condition « l'utilisateur n'a droit
 * qu'au module DONT IL A LE DROIT » (allowed_modules du compte), qui n'était
 * jusqu'ici vérifiée que par le masquage du menu (contournable par URL/API).
 *
 * <p><b>Modes</b> ({@code rbac.module-guard.mode}) :
 * <ul>
 *   <li>{@code audit} (défaut) — NE BLOQUE RIEN : journalise les accès qui
 *       SERAIENT refusés. Sert à valider la cartographie chemin→module sans
 *       risque de régression avant de passer en strict.</li>
 *   <li>{@code strict} — refuse (403) tout accès à un module non accordé.</li>
 *   <li>{@code off} — désactivé.</li>
 * </ul>
 *
 * <p>Conservateur : seuls les chemins à correspondance module CERTAINE sont gardés
 * ({@link ModulePathResolver}) ; les administrateurs sont exemptés ; la garde ne
 * s'applique qu'aux requêtes utilisateur porteuses d'un cookie JWT décodable.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 30)
@RequiredArgsConstructor
public class ModuleAccessAuditFilter extends OncePerRequestFilter {

    private static final Logger LOG = LoggerFactory.getLogger(ModuleAccessAuditFilter.class);
    private static final Set<String> ADMIN_ROLES = Set.of("SYSTEM_ADMINISTRATOR", "ADMINISTRATOR", "ADMIN");

    private final ModulePathResolver pathResolver;
    private final PermissionManagementRepository permissionRepository;

    @Value("${rbac.module-guard.mode:audit}")
    private String mode;

    @Value("${JWT_SECRET:}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        if ("off".equalsIgnoreCase(mode)) {
            filterChain.doFilter(request, response);
            return;
        }

        String moduleKey = pathResolver.moduleKeyForPath(request.getRequestURI());
        if (moduleKey == null) {
            filterChain.doFilter(request, response); // chemin non gardé par cette couche
            return;
        }

        Claims claims = decodeJwt(request);
        if (claims == null) {
            filterChain.doFilter(request, response); // pas d'identité décodable : géré ailleurs
            return;
        }

        String role = asString(claims.get("role"));
        if (role != null && ADMIN_ROLES.contains(role.trim().toUpperCase(java.util.Locale.ROOT))) {
            filterChain.doFilter(request, response); // bypass admin
            return;
        }

        Long accountId = asLong(claims.get("id"));
        if (accountId == null) {
            filterChain.doFilter(request, response); // sans compte on ne peut pas décider
            return;
        }

        if (!isGranted(accountId, moduleKey)) {
            if ("strict".equalsIgnoreCase(mode)) {
                LOG.warn("MODULE_GUARD[strict] REFUS account={} module={} {} {}",
                        accountId, moduleKey, request.getMethod(), request.getRequestURI());
                response.sendError(HttpStatus.FORBIDDEN.value(), "MODULE_NOT_GRANTED");
                return;
            }
            LOG.warn("MODULE_GUARD[audit] SERAIT REFUSE account={} module={} {} {} (module absent de allowed_modules)",
                    accountId, moduleKey, request.getMethod(), request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }

    private boolean isGranted(Long accountId, String moduleKey) {
        Optional<PermissionManagement> pm = permissionRepository.findByAccountId(accountId);
        if (pm.isEmpty()) {
            return false; // aucun profil = aucun droit
        }
        String csv = pm.get().getAllowedModules();
        if (csv == null || csv.isBlank()) {
            return false;
        }
        Set<String> allowed = Arrays.stream(csv.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toSet());
        return allowed.contains(moduleKey);
    }

    private Claims decodeJwt(HttpServletRequest request) {
        if (jwtSecret == null || jwtSecret.isBlank() || request.getCookies() == null) {
            return null;
        }
        for (Cookie c : request.getCookies()) {
            if ("jwt".equals(c.getName())) {
                try {
                    return Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(c.getValue()).getBody();
                } catch (Exception e) {
                    return null; // token invalide/expiré : laissé aux gardes d'auth
                }
            }
        }
        return null;
    }

    private static String asString(Object o) {
        return o == null ? null : o.toString();
    }

    private static Long asLong(Object o) {
        if (o instanceof Number n) {
            return n.longValue();
        }
        if (o != null) {
            try {
                return Long.parseLong(o.toString().trim());
            } catch (NumberFormatException ignored) {
                // pas un identifiant
            }
        }
        return null;
    }
}
