package com.minexpert.hns.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.minexpert.hns.config.GatewayRequestContext.Kind;
import com.minexpert.hns.config.GatewayRequestContext.Resolution;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Garde reutilisable pour les mines portees dans un corps, une variable de chemin
 * ou resolues depuis une entite par identifiant.
 */
@Component
public class CompanyScopeGuard {

    private static final Logger LOG = LoggerFactory.getLogger(CompanyScopeGuard.class);

    private final GatewayRequestContext requestContext;

    public CompanyScopeGuard(GatewayRequestContext requestContext) {
        this.requestContext = requestContext;
    }

    /** Refuse une mine hors du perimetre Gateway authentifie. */
    public void assertInScope(Long companyId) {
        if (companyId == null) {
            return;
        }
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return; // execution non HTTP (batch/job interne)
        }

        Resolution resolution = requestContext.resolve(request);
        if (resolution.kind() == Kind.INTERNAL) {
            return;
        }
        if (resolution.kind() == Kind.INVALID || (!resolution.user().allMines()
                && !resolution.user().companyIds().contains(companyId))) {
            LOG.warn("Cloisonnement mines refuse: companyId={} sur {} {}",
                    companyId, request.getMethod(), request.getRequestURI());
            throw new AccessDeniedException("COMPANY_SCOPE_FORBIDDEN");
        }
    }

    private HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        return attrs instanceof ServletRequestAttributes servletAttributes
                ? servletAttributes.getRequest()
                : null;
    }
}
