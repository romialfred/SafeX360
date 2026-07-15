package com.minexpert.hns.config;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Cloisonnement STRICT des données par mine (multi-tenant).
 *
 * <p>Le périmètre autorisé d'un utilisateur est porté par le JWT et réinjecté par
 * le gateway (autoritaire) dans deux en-têtes :
 * <ul>
 *   <li>{@code X-User-Companies} : CSV des ids de mines assignées ;</li>
 *   <li>{@code X-All-Mines} : {@code true} si accès à toutes les mines (consolidé).</li>
 * </ul>
 *
 * <p>Règles appliquées à chaque requête utilisateur :
 * <ul>
 *   <li><b>Appel système</b> (aucun en-tête {@code X-User-Companies}, ex. service-à-service
 *       avec {@code X-Secret-Key}) → fail-open (laisse passer).</li>
 *   <li><b>allMines=true</b> → laisse passer (voit tout).</li>
 *   <li>Sinon, paramètre {@code companyId} présent :
 *       ∈ périmètre → OK ; ∉ périmètre → <b>403</b> (tentative d'accès inter-mines).</li>
 *   <li>Sinon, {@code companyId} absent → <b>clamp</b> : on injecte la 1re mine autorisée,
 *       de sorte qu'un utilisateur non-« toutes mines » ne puisse JAMAIS obtenir une vue
 *       consolidée multi-sites. (Le clamp est inoffensif pour les endpoints non scopés
 *       par mine : ils ignorent simplement le paramètre.)</li>
 * </ul>
 *
 * <p>Ce filtre est le point de contrôle central du cloisonnement : il ne requiert pas de
 * modifier chaque endpoint. Les lectures par identifiant direct ({@code /get/{id}}) qui
 * n'exposent pas {@code companyId} restent à durcir par garde d'appartenance (dette suivi).
 */
@Component
@Order(15) // après le GatewayAuthorityFilter (identité/permissions), avant les controllers.
public class CompanyScopeFilter extends OncePerRequestFilter {

    private static final Logger LOG = LoggerFactory.getLogger(CompanyScopeFilter.class);
    private static final String H_COMPANIES = "X-User-Companies";
    private static final String H_ALL_MINES = "X-All-Mines";
    private static final String P_COMPANY_ID = "companyId";
    /** Sentinelle : id de mine qui n'existe jamais → fail-closed (résultats vides). */
    private static final String SENTINEL_NO_MINE = "-1";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String companiesHeader = request.getHeader(H_COMPANIES);

        // Appel système (pas de contexte utilisateur gateway) → fail-open, cohérent
        // avec GatewayAuthorityFilter (les appels service-à-service portent X-Secret-Key
        // mais pas les en-têtes d'identité).
        if (companiesHeader == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Accès à toutes les mines (consolidé) → aucun cloisonnement.
        if ("true".equalsIgnoreCase(request.getHeader(H_ALL_MINES))) {
            filterChain.doFilter(request, response);
            return;
        }

        final Set<String> allowed = Arrays.stream(companiesHeader.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        final String requested = request.getParameter(P_COMPANY_ID);
        if (requested != null && !requested.trim().isEmpty()) {
            // FAIL-CLOSED : un companyId hors du périmètre (y compris si le périmètre
            // est VIDE — token périmé sans claims, ou compte orphelin sans mine) → 403.
            if (!allowed.contains(requested.trim())) {
                LOG.warn("Cloisonnement mines : companyId={} hors périmètre {} sur {} {} → 403",
                        requested, allowed, request.getMethod(), request.getRequestURI());
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "COMPANY_SCOPE_FORBIDDEN");
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }

        // companyId absent → clamp. Périmètre vide (utilisateur authentifié SANS mine
        // assignée : token périmé ou compte orphelin) → clamp sur une sentinelle
        // impossible (aucune mine ne porte cet id) : les endpoints scopés renvoient
        // VIDE (fail-closed), les endpoints non scopés (référentiels) ignorent le param.
        // Ainsi un tel utilisateur ne voit JAMAIS de données multi-mines.
        final String clamp = allowed.isEmpty() ? SENTINEL_NO_MINE : allowed.iterator().next();
        filterChain.doFilter(new CompanyIdInjectingRequest(request, clamp), response);
    }

    /**
     * Wrapper qui force le paramètre {@code companyId} à la valeur de clamp, sans
     * consommer le corps de la requête (surcharge ciblée de getParameter*).
     */
    private static final class CompanyIdInjectingRequest extends HttpServletRequestWrapper {
        private final String clampValue;

        CompanyIdInjectingRequest(HttpServletRequest request, String clampValue) {
            super(request);
            this.clampValue = clampValue;
        }

        @Override
        public String getParameter(String name) {
            if (P_COMPANY_ID.equals(name)) {
                return clampValue;
            }
            return super.getParameter(name);
        }

        @Override
        public String[] getParameterValues(String name) {
            if (P_COMPANY_ID.equals(name)) {
                return new String[] { clampValue };
            }
            return super.getParameterValues(name);
        }

        @Override
        public Map<String, String[]> getParameterMap() {
            Map<String, String[]> map = new HashMap<>(super.getParameterMap());
            map.put(P_COMPANY_ID, new String[] { clampValue });
            return Collections.unmodifiableMap(map);
        }
    }
}
