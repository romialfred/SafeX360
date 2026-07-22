package com.hms.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import com.hms.gateway.security.ServiceTokenIssuer;

@Component
public class TokenFilter extends AbstractGatewayFilterFactory<TokenFilter.Config> {
    private static final org.slf4j.Logger LOG = org.slf4j.LoggerFactory.getLogger(TokenFilter.class);

    // LOT 52 (remédiation GATE SEC-03) : clé JWT externalisée — la valeur par
    // défaut historique reste en repli pour ne pas casser les déploiements
    // existants ; LA ROTATION (nouvelle valeur via env JWT_SECRET sur tous les
    // services simultanément) reste REQUISE, l'ancienne valeur étant publique.
    @org.springframework.beans.factory.annotation.Value("${JWT_SECRET:}")
    private String SECRET;

    // LOT 41 P0 SECURITY: secret partagé entre Gateway et microservices.
    // Permet aux microservices de rejeter toute requête qui ne provient pas du Gateway.
    // L'attaquant doit désormais (1) atteindre le port backend ET (2) connaître ce secret.
    @org.springframework.beans.factory.annotation.Autowired
    private ServiceTokenIssuer serviceTokenIssuer;

    public TokenFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // SEC 1.1 — Strip any externally-supplied X-Secret-Key to prevent spoofing.
            // SEC 2.1 — Strip X-Permissions as well: no legitimate client sends it.
            // RBAC — Strip X-User-Id too: il est désormais RÉINJECTÉ depuis le claim
            // `id` du JWT (autoritaire), pour empêcher l'usurpation d'identité et
            // alimenter les gardes SELF downstream (accès à SES propres données).
            exchange = exchange.mutate()
                    .request(r -> r.headers(h -> {
                        h.remove("X-Secret-Key");
                        h.remove(ServiceTokenIssuer.HEADER);
                        h.remove("X-Permissions");
                        h.remove("X-User-Id");
                        // Identité EMPLOYÉ (empId) — distincte de X-User-Id (id de compte).
                        // Réinjectée depuis le claim `empId` du JWT ci-dessous ; strip de
                        // toute version cliente pour empêcher l'usurpation. Sert aux gardes
                        // de ségrégation des tâches (§10.2 e) qui comparent des empId entre eux.
                        h.remove("X-User-Emp-Id");
                        h.remove("X-Role");
                        // Cloisonnement mines : ces en-têtes sont AUTORITAIRES (réinjectés
                        // depuis le JWT ci-dessous). On strip toute version cliente pour
                        // empêcher l'usurpation de périmètre de mines.
                        h.remove("X-User-Companies");
                        h.remove("X-All-Mines");
                    }))
                    .build();

            String method = exchange.getRequest().getMethod().name();
            String path = exchange.getRequest().getPath().toString();

            if (method.equalsIgnoreCase("OPTIONS")) {
                return chain.filter(exchange);
            }
            if (path.startsWith("/actuator/health") || path.startsWith("/services-health")) {
                return chain.filter(exchange);
            }

            // Endpoints PRÉ-authentification : pas encore de cookie jwt à ce stade.
            // Les trois routes MFA en font partie — l'utilisateur ne détient alors
            // qu'un jeton de défi opaque (court, à usage unique, verrouillé après
            // 5 essais côté HRMS) : exiger le cookie ici rendait tout le parcours
            // MFA infranchissable, l'enrôlement comme la vérification.
            if (path.equals("/hrms/auth/login") || path.equals("/hrms/account/reset-password")
                    || path.equals("/hrms/auth/mfa/enroll/start")
                    || path.equals("/hrms/auth/mfa/enroll/confirm")
                    || path.equals("/hrms/auth/mfa/verify")) {
                return chain.filter(exchange.mutate()
                        .request(r -> r.header(ServiceTokenIssuer.HEADER, serviceTokenIssuer.issueForPath(path)))
                        .build());
            }

            String token = null;
            if (exchange.getRequest().getCookies().containsKey("jwt")) {
                token = exchange.getRequest().getCookies().getFirst("jwt").getValue();
            }

            if (token == null || token.isEmpty()) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            try {
                Claims claims = Jwts.parser()
                        .setSigningKey(SECRET)
                        .parseClaimsJws(token)
                        .getBody();

                // RBAC : retraduit le claim `role` du JWT en autorités RBAC et les
                // injecte en X-Permissions (CSV). Le header est TOUJOURS présent pour
                // une requête utilisateur authentifiée (même vide si rôle inconnu) —
                // c'est ce qui permet au downstream de distinguer « requête utilisateur
                // (RBAC strict) » de « appel système sans JWT (fallback de confiance) ».
                final String role = claims.get("role", String.class);
                final String normalizedRole = normalizeRole(role);
                final String permissions = permissionsForRole(normalizedRole);
                // Identité autoritaire depuis le JWT (claim `id`) pour les gardes SELF.
                final Object idClaim = claims.get("id");
                final String userId = idClaim != null ? String.valueOf(idClaim) : "";
                // Identité EMPLOYÉ (empId) : espace d'identifiants des personnes (responsable
                // d'action, membre d'équipe d'enquête). Distinct du claim `id` (compte). Requis
                // pour les gardes d'indépendance §10.2 e (vérificateur ≠ responsable, validateur
                // ≠ investigateur) qui comparent des empId — un compte peut ne pas avoir d'empId.
                final Object empIdClaim = claims.get("empId");
                final String empId = empIdClaim != null ? String.valueOf(empIdClaim) : "";
                // Cloisonnement mines (autoritaire) : périmètre depuis le JWT.
                final Object allMinesClaim = claims.get("allMines");
                final boolean allMines = Boolean.TRUE.equals(allMinesClaim)
                        || "true".equalsIgnoreCase(String.valueOf(allMinesClaim));
                final Object companiesClaim = claims.get("companies");
                final String companies = companiesClaim != null ? String.valueOf(companiesClaim) : "";
                exchange = exchange.mutate()
                        .request(r -> {
                            r.header(ServiceTokenIssuer.HEADER, serviceTokenIssuer.issueForPath(path));
                            r.header("X-Permissions", permissions);
                            r.header("X-Role", normalizedRole);
                            if (!userId.isBlank()) {
                                r.header("X-User-Id", userId);
                            }
                            if (!empId.isBlank()) {
                                r.header("X-User-Emp-Id", empId);
                            }
                            // TOUJOURS présents pour une requête utilisateur authentifiée
                            // (même vide), pour que HNS distingue requête utilisateur
                            // (cloisonnement strict) d'appel système (fail-open).
                            r.header("X-All-Mines", String.valueOf(allMines));
                            r.header("X-User-Companies", companies);
                        })
                        .build();

            } catch (Exception e) {
                // Trace indispensable au diagnostic : sans elle, impossible de
                // distinguer token expiré / signature invalide / token malformé.
                LOG.warn("JWT rejeté sur {} {} : {}", method, path, e.getMessage());
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            return chain.filter(exchange);
        };
    }

    // ==== RBAC : mapping rôle (claim JWT) -> autorités RBAC downstream ====
    // Les autorités doivent correspondre EXACTEMENT aux constantes des *RBACConfig
    // HNS (hasAuthority). Rôles ultra-sensibles (DOSIMETRY_MEDICAL/_EXPORT_MEDICAL/
    // _ADMIN, BLAST_ADMIN, BLAST_ALARM, INSPECTION_ADMIN) réservés aux admins faute
    // de rôles médecin/RPO dédiés (dette : enrichir UserRole).
    // INCIDENT_VALIDATE / INCIDENT_CLOSE : gouvernance RACI du module Incidents
    // (ISO 45001 §10.2). Accordées aux rôles « Accountable » (coordinateur/manager
    // HSE + admins) — voir HNS IncidentRbacConfig. NON accordées à l'investigateur,
    // l'auditeur ni l'employé : l'investigateur mène l'enquête mais ne signe pas sa
    // propre revue et ne prononce pas la clôture.
    private static final String ADMIN_PERMS = String.join(",",
            "DOSIMETRY_READ_AGGREGATE", "DOSIMETRY_READ_NOMINATIVE", "DOSIMETRY_WRITE",
            "DOSIMETRY_MEDICAL", "DOSIMETRY_PCR_RPO", "DOSIMETRY_ADMIN", "DOSIMETRY_EXPORT_MEDICAL",
            "BLAST_VIEW", "BLAST_PLAN", "BLAST_CONFIRM", "BLAST_ALARM", "BLAST_REPORT", "BLAST_ADMIN",
            "INSPECTION_VIEW", "INSPECTION_PLAN", "INSPECTION_EXECUTE", "INSPECTION_VALIDATE",
            "INSPECTION_TEMPLATE_MANAGE", "INSPECTION_ADMIN",
            "INCIDENT_VALIDATE", "INCIDENT_CLOSE");
    private static final String COORDINATOR_PERMS = String.join(",",
            "DOSIMETRY_READ_AGGREGATE", "DOSIMETRY_READ_NOMINATIVE", "DOSIMETRY_WRITE", "DOSIMETRY_PCR_RPO",
            "BLAST_VIEW", "BLAST_PLAN", "BLAST_CONFIRM", "BLAST_REPORT",
            "INSPECTION_VIEW", "INSPECTION_PLAN", "INSPECTION_EXECUTE", "INSPECTION_VALIDATE",
            "INSPECTION_TEMPLATE_MANAGE",
            "INCIDENT_VALIDATE", "INCIDENT_CLOSE");
    private static final String INVESTIGATOR_PERMS = String.join(",",
            "DOSIMETRY_READ_AGGREGATE", "DOSIMETRY_READ_NOMINATIVE", "INSPECTION_VIEW", "BLAST_VIEW");
    private static final String AUDITOR_PERMS = String.join(",",
            "INSPECTION_VIEW", "INSPECTION_VALIDATE", "DOSIMETRY_READ_AGGREGATE", "BLAST_VIEW");
    // EMPLOYEE : PAS de DOSIMETRY_READ_NOMINATIVE (donnerait accès nominatif à TOUS
    // les travailleurs via /dose-record/getAll sans garde SELF — fuite RGPD). Lecture
    // inspections/tirs uniquement ; l'accès à SES propres doses relèvera d'une garde
    // SELF dédiée (X-User-Id injecté ci-dessous).
    private static final String EMPLOYEE_PERMS = String.join(",",
            "INSPECTION_VIEW", "BLAST_VIEW");

    // Clés en MAJUSCULES. Alias inclus car account.role stocke des valeurs libres
    // en base (« Administrator », « HSE_MANAGER »/« HSE_OFFICER » seedés) qui ne
    // correspondent pas 1:1 à l'enum -> sans alias, ces comptes (dont l'admin PROD)
    // seraient verrouillés hors de tout HNS (fail-closed).
    private static final java.util.Map<String, String> ROLE_PERMISSIONS = java.util.Map.ofEntries(
            java.util.Map.entry("SYSTEM_ADMINISTRATOR", ADMIN_PERMS),
            java.util.Map.entry("ADMINISTRATOR", ADMIN_PERMS),
            java.util.Map.entry("ADMIN", ADMIN_PERMS),
            java.util.Map.entry("HEALTH_SAFETY_COORDINATOR", COORDINATOR_PERMS),
            java.util.Map.entry("HSE_MANAGER", COORDINATOR_PERMS),
            java.util.Map.entry("HSE_OFFICER", COORDINATOR_PERMS),
            java.util.Map.entry("INCIDENT_INVESTIGATOR", INVESTIGATOR_PERMS),
            java.util.Map.entry("AUDITOR", AUDITOR_PERMS),
            java.util.Map.entry("EMPLOYEE", EMPLOYEE_PERMS));

    /**
     * Autorités CSV pour un rôle (normalisé MAJUSCULES + trim). Rôle inconnu/null
     * -> chaîne vide : le header X-Permissions reste présent (requête utilisateur)
     * mais n'accorde aucune autorité downstream (fail-closed côté HNS).
     */
    private static String permissionsForRole(String role) {
        return ROLE_PERMISSIONS.getOrDefault(normalizeRole(role), "");
    }

    /**
     * Normalise le role issu du JWT avant de le propager. La Gateway retire toujours
     * toute valeur fournie par le client : {@code X-Role} ne peut donc pas servir a
     * une elevation de privileges par injection d'en-tete.
     */
    private static String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "";
        }
        return role.trim().toUpperCase(java.util.Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_');
    }

    public static class Config {

    }
}
