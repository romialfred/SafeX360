package com.minexpert.hns.config;

import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Component;

/** Matrice d'autorisation serveur role x operation x perimetre de mine. */
@Component
public class GatewayAuthorizationMatrix {

    private static final Set<String> ADMIN_ROLES = Set.of(
            "SYSTEM_ADMINISTRATOR", "ADMINISTRATOR", "ADMIN");
    private static final Set<String> COORDINATOR_ROLES = Set.of(
            "HEALTH_SAFETY_COORDINATOR", "HSE_MANAGER", "HSE_OFFICER");

    public Operation classify(String method, String requestUri) {
        String verb = method == null ? "" : method.toUpperCase(Locale.ROOT);
        String path = normalizePath(requestUri);
        if (path.contains("/users/permissions")) {
            return "GET".equals(verb) && path.contains("/by-account/")
                    ? Operation.SELF_SERVICE
                    : Operation.ADMINISTRATION;
        }
        if ("GET".equals(verb) || "HEAD".equals(verb)) {
            return isExportPath(path) ? Operation.EXPORT : Operation.READ;
        }
        if (isMutationVerb(verb) && isAdministrationPath(path)) {
            return Operation.ADMINISTRATION;
        }
        if ("POST".equals(verb) && isDeclarationPath(path)) {
            return Operation.DECLARE;
        }
        if (("POST".equals(verb) || "PUT".equals(verb) || "PATCH".equals(verb))
                && isSelfServicePath(path)) {
            return Operation.SELF_SERVICE;
        }
        if (isMutationVerb(verb)) {
            return Operation.WRITE;
        }
        return Operation.UNKNOWN;
    }

    public boolean isAllowed(String role, Operation operation, MineAccess mineAccess,
            String requestUri) {
        if (operation == null || operation == Operation.UNKNOWN
                || mineAccess == null || mineAccess == MineAccess.NONE
                || mineAccess == MineAccess.OUT_OF_SCOPE) {
            return false;
        }

        String normalizedRole = GatewayRequestContext.normalizeRole(role);
        if (ADMIN_ROLES.contains(normalizedRole)) {
            return true;
        }
        if (COORDINATOR_ROLES.contains(normalizedRole)) {
            return operation != Operation.ADMINISTRATION;
        }

        return switch (normalizedRole) {
            case "INCIDENT_INVESTIGATOR" -> operation == Operation.READ
                    || operation == Operation.DECLARE
                    || operation == Operation.SELF_SERVICE
                    || operation == Operation.WRITE;
            case "AUDITOR" -> operation == Operation.READ
                    || operation == Operation.EXPORT
                    || operation == Operation.DECLARE
                    || operation == Operation.SELF_SERVICE
                    || (operation == Operation.WRITE && isAuditPath(normalizePath(requestUri)));
            case "EMPLOYEE" -> operation == Operation.READ
                    || operation == Operation.DECLARE
                    || operation == Operation.SELF_SERVICE;
            default -> false;
        };
    }

    private static boolean isExportPath(String path) {
        return path.contains("/export")
                || path.contains("/download")
                || path.contains("/pdf/")
                || path.endsWith("/pdf")
                || path.contains("/csv/")
                || path.endsWith("/csv")
                || path.contains("/attestation");
    }

    private static boolean isMutationVerb(String verb) {
        return "POST".equals(verb) || "PUT".equals(verb)
                || "PATCH".equals(verb) || "DELETE".equals(verb);
    }

    private static boolean isAdministrationPath(String path) {
        return path.contains("/modules/")
                || path.endsWith("/modules");
    }

    boolean isAdministrator(String role) {
        return ADMIN_ROLES.contains(GatewayRequestContext.normalizeRole(role));
    }

    private static boolean isDeclarationPath(String path) {
        return path.contains("/incidents/report")
                || path.contains("/non-conformity/create")
                || path.endsWith("/error/events")
                || path.contains("/observation/create")
                || path.contains("/observations/create")
                || path.contains("/near-miss")
                || path.contains("/hazard-report");
    }

    private static boolean isSelfServicePath(String path) {
        return path.contains("/mobile/push-token")
                || path.contains("/acknowledge")
                || path.contains("/acknowledgement")
                || path.contains("/acknowledgment");
    }

    private static boolean isAuditPath(String path) {
        return path.contains("/audit") || path.contains("/inspection");
    }

    private static String normalizePath(String path) {
        return path == null ? "" : path.toLowerCase(Locale.ROOT);
    }

    public enum Operation {
        READ,
        DECLARE,
        SELF_SERVICE,
        WRITE,
        ADMINISTRATION,
        EXPORT,
        UNKNOWN
    }

    public enum MineAccess {
        ASSIGNED,
        ALL,
        NONE,
        OUT_OF_SCOPE
    }
}
