package com.minexpert.hns.security;

import java.io.IOException;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.minexpert.hns.security.ServiceTokenVerifier.ServiceTokenException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class ServiceIdentityFilter extends OncePerRequestFilter {
    private final ServiceTokenVerifier verifier;
    public ServiceIdentityFilter(ServiceTokenVerifier verifier) { this.verifier = verifier; }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        try {
            ServiceIdentity identity = verifier.verify(request.getHeader(ServiceTokenVerifier.HEADER));
            if (!isAllowed(identity, request.getMethod(), request.getRequestURI())) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "SERVICE_SCOPE_FORBIDDEN");
                return;
            }
            request.setAttribute(ServiceIdentity.REQUEST_ATTRIBUTE, identity);
            filterChain.doFilter(request, response);
        } catch (ServiceTokenException ex) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, ex.getMessage());
        }
    }

    static boolean isAllowed(ServiceIdentity identity, String method, String requestUri) {
        if ("safex-gateway".equals(identity.issuer()) && identity.hasScope("hns:proxy")) return true;
        if (!"safex-hrms".equals(identity.issuer())) return false;
        String path = requestUri == null ? "" : requestUri.toLowerCase(java.util.Locale.ROOT);
        if (!path.contains("/users/permissions/")) return false;
        return "GET".equalsIgnoreCase(method)
                ? identity.hasScope("hns:permissions:read")
                : identity.hasScope("hns:permissions:write");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().toLowerCase(java.util.Locale.ROOT);
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || path.contains("/actuator/") || path.endsWith("/actuator")
                || path.contains("/ws/") || path.endsWith("/ws") || path.endsWith("/error");
    }
}
