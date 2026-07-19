package com.minexpert.hns.config;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.minexpert.hns.config.GatewayAuthorizationMatrix.MineAccess;
import com.minexpert.hns.config.GatewayAuthorizationMatrix.Operation;
import com.minexpert.hns.config.GatewayRequestContext.Kind;
import com.minexpert.hns.config.GatewayRequestContext.Resolution;
import com.minexpert.hns.config.GatewayRequestContext.UserContext;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Garde serveur transversal pour les controles d'autorisation non couverts par
 * une annotation {@code @PreAuthorize}. Il refuse par defaut les roles inconnus,
 * contextes Gateway incomplets et operations non classees.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class GatewayRequestAuthorizationFilter extends OncePerRequestFilter {

    private static final Logger LOG = LoggerFactory.getLogger(GatewayRequestAuthorizationFilter.class);

    private final GatewayRequestContext requestContext;
    private final GatewayAuthorizationMatrix authorizationMatrix;

    public GatewayRequestAuthorizationFilter(GatewayRequestContext requestContext,
            GatewayAuthorizationMatrix authorizationMatrix) {
        this.requestContext = requestContext;
        this.authorizationMatrix = authorizationMatrix;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        Resolution resolution = requestContext.resolve(request);
        if (resolution.kind() == Kind.INVALID) {
            LOG.warn("Autorisation HNS refusee: contexte Gateway invalide ({}) sur {} {}",
                    resolution.failureCode(), request.getMethod(), request.getRequestURI());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "TRUSTED_GATEWAY_REQUIRED");
            return;
        }
        if (resolution.kind() == Kind.INTERNAL) {
            if (isAllowedInternal(request, resolution.service())) {
                filterChain.doFilter(request, response);
            } else {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "SERVICE_SCOPE_FORBIDDEN");
            }
            return;
        }

        UserContext user = resolution.user();
        Operation operation = authorizationMatrix.classify(request.getMethod(), request.getRequestURI());
        MineAccess mineAccess = resolveMineAccess(request, user);
        boolean allowed = authorizationMatrix.isAllowed(
                user.role(), operation, mineAccess, request.getRequestURI());
        if (allowed && isAccountPermissionSelfPath(request.getRequestURI())
                && !authorizationMatrix.isAdministrator(user.role())) {
            allowed = targetsOwnAccount(request.getRequestURI(), user.userId());
        }
        if (!allowed) {
            LOG.warn("Autorisation HNS refusee: role={}, operation={}, mineAccess={} sur {} {}",
                    user.role(), operation, mineAccess, request.getMethod(), request.getRequestURI());
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "HNS_OPERATION_FORBIDDEN");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static boolean isAllowedInternal(HttpServletRequest request,
            com.minexpert.hns.security.ServiceIdentity service) {
        if (service == null || !"safex-hrms".equals(service.issuer())) return false;
        String path = request.getRequestURI().toLowerCase(java.util.Locale.ROOT);
        if (!path.contains("/users/permissions/")) return false;
        return "GET".equalsIgnoreCase(request.getMethod())
                ? service.hasScope("hns:permissions:read")
                : service.hasScope("hns:permissions:write");
    }

    private MineAccess resolveMineAccess(HttpServletRequest request, UserContext user) {
        if (user.allMines()) {
            return MineAccess.ALL;
        }
        if (user.companyIds().isEmpty()) {
            return MineAccess.NONE;
        }

        String[] requestedValues = request.getParameterValues("companyId");
        if (requestedValues == null || requestedValues.length == 0) {
            return MineAccess.ASSIGNED;
        }
        if (requestedValues.length != 1 || requestedValues[0] == null) {
            return MineAccess.OUT_OF_SCOPE;
        }
        try {
            long requested = Long.parseLong(requestedValues[0].trim());
            return requested > 0 && user.companyIds().contains(requested)
                    ? MineAccess.ASSIGNED
                    : MineAccess.OUT_OF_SCOPE;
        } catch (NumberFormatException ex) {
            return MineAccess.OUT_OF_SCOPE;
        }
    }

    private static boolean isAccountPermissionSelfPath(String requestUri) {
        return requestUri != null
                && requestUri.toLowerCase(java.util.Locale.ROOT).contains("/users/permissions/by-account/");
    }

    private static boolean targetsOwnAccount(String requestUri, long userId) {
        String normalized = requestUri.toLowerCase(java.util.Locale.ROOT);
        String marker = "/users/permissions/by-account/";
        int start = normalized.indexOf(marker);
        if (start < 0) {
            return false;
        }
        String accountId = normalized.substring(start + marker.length());
        if (accountId.endsWith("/")) {
            accountId = accountId.substring(0, accountId.length() - 1);
        }
        try {
            return Long.parseLong(accountId) == userId;
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().toLowerCase(java.util.Locale.ROOT);
        return path.contains("/actuator/")
                || path.endsWith("/actuator")
                || path.contains("/ws/")
                || path.endsWith("/ws")
                || path.endsWith("/error")
                // Modules traites dans des lots paralleles disposant de gardes specialises.
                || path.contains("/emergency/")
                || path.endsWith("/emergency")
                || path.contains("/blast/")
                || path.endsWith("/blast")
                || path.contains("/blast-setting")
                || path.contains("/dosimetry/")
                || path.endsWith("/dosimetry");
    }
}
