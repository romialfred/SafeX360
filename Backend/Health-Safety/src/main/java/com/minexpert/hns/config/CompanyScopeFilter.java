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
        if (requestedValues != null && requestedValues.length > 0) {
            Long requestedCompany = parseSingleCompanyId(requestedValues);
            if (requestedCompany == null) {
                deny(response, request, "INVALID_COMPANY_PARAMETER");
                return;
            }
            if (!user.allMines() && !user.companyIds().contains(requestedCompany)) {
                deny(response, request, "COMPANY_SCOPE_FORBIDDEN");
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }

        if (user.allMines()) {
            filterChain.doFilter(request, response);
            return;
        }
        if (user.companyIds().isEmpty()) {
            deny(response, request, "NO_ASSIGNED_COMPANY");
            return;
        }

        String clamp = String.valueOf(user.companyIds().iterator().next());
        filterChain.doFilter(new CompanyIdInjectingRequest(request, clamp), response);
    }

    private static Long parseSingleCompanyId(String[] values) {
        if (values.length != 1 || values[0] == null || values[0].isBlank()) {
            return null;
        }
        try {
            long parsed = Long.parseLong(values[0].trim());
            return parsed > 0 ? parsed : null;
        } catch (NumberFormatException ex) {
            return null;
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

    private static final class CompanyIdInjectingRequest extends HttpServletRequestWrapper {
        private final String clampValue;

        CompanyIdInjectingRequest(HttpServletRequest request, String clampValue) {
            super(request);
            this.clampValue = clampValue;
        }

        @Override
        public String getParameter(String name) {
            return PARAMETER_COMPANY_ID.equals(name) ? clampValue : super.getParameter(name);
        }

        @Override
        public String[] getParameterValues(String name) {
            return PARAMETER_COMPANY_ID.equals(name)
                    ? new String[] { clampValue }
                    : super.getParameterValues(name);
        }

        @Override
        public Map<String, String[]> getParameterMap() {
            Map<String, String[]> map = new HashMap<>(super.getParameterMap());
            map.put(PARAMETER_COMPANY_ID, new String[] { clampValue });
            return Collections.unmodifiableMap(map);
        }
    }
}
