package com.minexpert.hns.config;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.minexpert.hns.security.ServiceIdentity;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Point unique de resolution des en-tetes d'identite emis par la Gateway.
 *
 * <p>Aucun en-tete utilisateur n'est interprete avant validation du secret interne.
 * Un appel interne est reconnu uniquement lorsqu'il porte un secret valide et aucun
 * marqueur utilisateur. Toute combinaison partielle ou mal formee est invalide.</p>
 */
@Component
public class GatewayRequestContext {

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_ROLE = "X-Role";
    public static final String HEADER_PERMISSIONS = "X-Permissions";
    public static final String HEADER_COMPANIES = "X-User-Companies";
    public static final String HEADER_ALL_MINES = "X-All-Mines";

    public Resolution resolve(HttpServletRequest request) {
        ServiceIdentity service = (ServiceIdentity) request.getAttribute(ServiceIdentity.REQUEST_ATTRIBUTE);
        if (service == null) return Resolution.invalid("UNTRUSTED_SERVICE");

        boolean hasUserMarker = hasHeader(request, HEADER_USER_ID)
                || hasHeader(request, HEADER_ROLE)
                || hasHeader(request, HEADER_PERMISSIONS)
                || hasHeader(request, HEADER_COMPANIES)
                || hasHeader(request, HEADER_ALL_MINES);
        if (!hasUserMarker) {
            return Resolution.internal(service);
        }

        if (!"safex-gateway".equals(service.issuer()) || !service.hasScope("hns:proxy"))
            return Resolution.invalid("USER_CONTEXT_REQUIRES_GATEWAY_PROXY_SCOPE");

        if (!hasHeader(request, HEADER_USER_ID)
                || !hasHeader(request, HEADER_ROLE)
                || !hasHeader(request, HEADER_PERMISSIONS)
                || !hasHeader(request, HEADER_COMPANIES)
                || !hasHeader(request, HEADER_ALL_MINES)) {
            return Resolution.invalid("INCOMPLETE_USER_CONTEXT");
        }

        Long userId = parsePositiveLong(request.getHeader(HEADER_USER_ID));
        String role = normalizeRole(request.getHeader(HEADER_ROLE));
        Boolean allMines = parseBooleanStrict(request.getHeader(HEADER_ALL_MINES));
        Set<Long> companies = parseCompanies(request.getHeader(HEADER_COMPANIES));
        if (userId == null || role.isBlank() || allMines == null || companies == null) {
            return Resolution.invalid("MALFORMED_USER_CONTEXT");
        }

        Set<String> permissions = parseCsv(request.getHeader(HEADER_PERMISSIONS));
        return Resolution.user(new UserContext(userId, role, permissions, companies, allMines), service);
    }

    private static boolean hasHeader(HttpServletRequest request, String name) {
        return request.getHeader(name) != null;
    }

    private static Long parsePositiveLong(String value) {
        try {
            long parsed = Long.parseLong(value == null ? "" : value.trim());
            return parsed > 0 ? parsed : null;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static Boolean parseBooleanStrict(String value) {
        if ("true".equalsIgnoreCase(value)) {
            return Boolean.TRUE;
        }
        if ("false".equalsIgnoreCase(value)) {
            return Boolean.FALSE;
        }
        return null;
    }

    private static Set<Long> parseCompanies(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptySet();
        }
        Set<Long> result = new LinkedHashSet<>();
        for (String token : value.split(",", -1)) {
            Long companyId = parsePositiveLong(token);
            if (companyId == null) {
                return null;
            }
            result.add(companyId);
        }
        return Collections.unmodifiableSet(result);
    }

    private static Set<String> parseCsv(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptySet();
        }
        Set<String> parsed = Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        return Collections.unmodifiableSet(parsed);
    }

    static String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "";
        }
        return role.trim().toUpperCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_');
    }

    public enum Kind {
        INVALID,
        INTERNAL,
        USER
    }

    public record UserContext(long userId, String role, Set<String> permissions,
            Set<Long> companyIds, boolean allMines) {
    }

    public record Resolution(Kind kind, UserContext user, ServiceIdentity service, String failureCode) {
        static Resolution invalid(String failureCode) {
            return new Resolution(Kind.INVALID, null, null, failureCode);
        }

        static Resolution internal(ServiceIdentity service) {
            return new Resolution(Kind.INTERNAL, null, service, null);
        }

        static Resolution user(UserContext user, ServiceIdentity service) {
            return new Resolution(Kind.USER, user, service, null);
        }
    }
}
