package com.hrms.security;

import java.io.IOException;
import java.util.Locale;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.hrms.security.ServiceTokenVerifier.ServiceTokenException;

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
        if ("safex-gateway".equals(identity.issuer()) && identity.hasScope("hrms:proxy")) return true;
        if (!"safex-hns".equals(identity.issuer()) || !identity.hasScope("hrms:reference:read")
                || !"GET".equalsIgnoreCase(method)) return false;
        String path = requestUri == null ? "" : requestUri.toLowerCase(Locale.ROOT);
        return path.contains("/employee/getbyids")
                || path.contains("/employee/getallwithemailandposition")
                || path.contains("/employee/getempemailandposition/")
                || path.contains("/employee/getemployeewithdirection")
                || path.contains("/employee/getemailsbyids")
                || path.contains("/department/getbyids")
                || path.contains("/position/getallpositionnames")
                || path.contains("/position/getnamebyid/");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().toLowerCase(Locale.ROOT);
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || path.contains("/actuator/") || path.endsWith("/actuator") || path.endsWith("/error");
    }
}
