package com.minexpert.hns.config;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.minexpert.hns.config.GatewayRequestContext.Kind;
import com.minexpert.hns.config.GatewayRequestContext.Resolution;
import com.minexpert.hns.config.GatewayRequestContext.UserContext;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Cloisonnement central et strict des donnees par mine.
 *
 * <p>Le perimetre n'est interprete qu'apres validation de la provenance Gateway
 * par {@link GatewayRequestContext}. Une requete utilisateur sans mine assignee,
 * un parametre duplique/mal forme ou une mine hors perimetre est refuse. Lorsque
 * {@code companyId} est absent, la premiere mine assignee est injectee afin de
 * supprimer les vues consolidees implicites.</p>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class CompanyScopeFilter extends OncePerRequestFilter {

    private static final Logger LOG = LoggerFactory.getLogger(CompanyScopeFilter.class);
    private static final String PARAMETER_COMPANY_ID = "companyId";

    private final GatewayRequestContext requestContext;

    public CompanyScopeFilter(GatewayRequestContext requestContext) {
        this.requestContext = requestContext;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        Resolution resolution = requestContext.resolve(request);
        if (resolution.kind() == Kind.INVALID) {
            LOG.warn("Cloisonnement mines refuse: contexte Gateway invalide ({}) sur {} {}",
                    resolution.failureCode(), request.getMethod(), request.getRequestURI());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "TRUSTED_GATEWAY_REQUIRED");
            return;
        }
        if (resolution.kind() == Kind.INTERNAL) {
            filterChain.doFilter(request, response);
            return;
        }

        UserContext user = resolution.user();
        String[] requestedValues = request.getParameterValues(PARAMETER_COMPANY_ID);

        // Mine PRECISE demandee (companyId > 0), sinon null.
        Long requestedCompany = null;
        if (requestedValues != null && requestedValues.length > 0) {
            // Pollution de parametres (valeurs multiples) ou valeur non numerique
            // => refus strict : ce sont des requetes malformees, jamais legitimes.
            if (requestedValues.length != 1 || !isParsableLong(requestedValues[0])) {
                deny(response, request, "INVALID_COMPANY_PARAMETER");
                return;
            }
            long parsed = Long.parseLong(requestedValues[0].trim());
            if (parsed > 0) {
                requestedCompany = parsed;
            }
            // parsed <= 0 : SENTINELLE « vue consolidee / aucune mine precise »
            // (le front envoie 0 quand l'en-tete est sur « Toutes les Mines »).
            // On la traite comme un parametre ABSENT — repli allMines/clamp
            // ci-dessous — et NON comme une tentative d'acces hors perimetre : un
            // 0 n'est pas une mine etrangere. Rejeter en 403 cassait TOUTE
            // ecriture en vue consolidee (planification d'inspection, etc.).
        }

        if (requestedCompany != null) {
            if (!user.allMines() && !user.companyIds().contains(requestedCompany)) {
                deny(response, request, "COMPANY_SCOPE_FORBIDDEN");
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }

        // Aucune mine precise (parametre absent ou <= 0). On RETIRE tout companyId
        // residuel (ex. « 0 ») avant de poursuivre : laisser filer companyId=0
        // jusqu'au controleur empoisonnait les traitements aval (mine orpheline,
        // controle de template en echec...).
        if (user.allMines()) {
            filterChain.doFilter(new CompanyIdInjectingRequest(request, null), response);
            return;
        }
        if (user.companyIds().isEmpty()) {
            deny(response, request, "NO_ASSIGNED_COMPANY");
            return;
        }

        String clamp = String.valueOf(user.companyIds().iterator().next());
        filterChain.doFilter(new CompanyIdInjectingRequest(request, clamp), response);
    }

    private static boolean isParsableLong(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        try {
            Long.parseLong(value.trim());
            return true;
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    private void deny(HttpServletResponse response, HttpServletRequest request, String reason)
            throws IOException {
        LOG.warn("Cloisonnement mines refuse: {} sur {} {}", reason,
                request.getMethod(), request.getRequestURI());
        response.sendError(HttpServletResponse.SC_FORBIDDEN, reason);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().toLowerCase(java.util.Locale.ROOT);
        return path.contains("/actuator/")
                || path.endsWith("/actuator")
                || path.contains("/ws/")
                || path.endsWith("/ws")
                || path.endsWith("/error");
    }

    /**
     * Force la valeur de {@code companyId} vue par le controleur :
     * <ul>
     *   <li>valeur non nulle → le parametre est remplace (clamp vers la mine
     *       assignee) ;</li>
     *   <li>{@code null} → le parametre est RETIRE (le controleur le voit absent,
     *       ce qui neutralise une sentinelle « 0 » de vue consolidee).</li>
     * </ul>
     */
    private static final class CompanyIdInjectingRequest extends HttpServletRequestWrapper {
        private final String overrideValue;

        CompanyIdInjectingRequest(HttpServletRequest request, String overrideValue) {
            super(request);
            this.overrideValue = overrideValue;
        }

        @Override
        public String getParameter(String name) {
            return PARAMETER_COMPANY_ID.equals(name) ? overrideValue : super.getParameter(name);
        }

        @Override
        public String[] getParameterValues(String name) {
            if (PARAMETER_COMPANY_ID.equals(name)) {
                return overrideValue == null ? null : new String[] { overrideValue };
            }
            return super.getParameterValues(name);
        }

        @Override
        public Map<String, String[]> getParameterMap() {
            Map<String, String[]> map = new HashMap<>(super.getParameterMap());
            if (overrideValue == null) {
                map.remove(PARAMETER_COMPANY_ID);
            } else {
                map.put(PARAMETER_COMPANY_ID, new String[] { overrideValue });
            }
            return Collections.unmodifiableMap(map);
        }
    }
}
