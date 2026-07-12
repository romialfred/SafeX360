package com.hms.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

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
    @org.springframework.beans.factory.annotation.Value("${INTERNAL_GATEWAY_SECRET:}")
    private String INTERNAL_GATEWAY_SECRET;

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
                        h.remove("X-Permissions");
                        h.remove("X-User-Id");
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

            if (path.equals("/hrms/auth/login") || path.equals("/hrms/account/reset-password")) {
                return chain.filter(exchange.mutate()
                        .request(r -> r.header("X-Secret-Key", INTERNAL_GATEWAY_SECRET))
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
                final String permissions = permissionsForRole(role);
                // Identité autoritaire depuis le JWT (claim `id`) pour les gardes SELF.
                final Object idClaim = claims.get("id");
                final String userId = idClaim != null ? String.valueOf(idClaim) : "";
                exchange = exchange.mutate()
                        .request(r -> {
                            r.header("X-Secret-Key", INTERNAL_GATEWAY_SECRET);
                            r.header("X-Permissions", permissions);
                            if (!userId.isBlank()) {
                                r.header("X-User-Id", userId);
                            }
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
    private static final String ADMIN_PERMS = String.join(",",
            "DOSIMETRY_READ_AGGREGATE", "DOSIMETRY_READ_NOMINATIVE", "DOSIMETRY_WRITE",
            "DOSIMETRY_MEDICAL", "DOSIMETRY_PCR_RPO", "DOSIMETRY_ADMIN", "DOSIMETRY_EXPORT_MEDICAL",
            "BLAST_VIEW", "BLAST_PLAN", "BLAST_CONFIRM", "BLAST_ALARM", "BLAST_REPORT", "BLAST_ADMIN",
            "INSPECTION_VIEW", "INSPECTION_PLAN", "INSPECTION_EXECUTE", "INSPECTION_VALIDATE",
            "INSPECTION_TEMPLATE_MANAGE", "INSPECTION_ADMIN");
    private static final String COORDINATOR_PERMS = String.join(",",
            "DOSIMETRY_READ_AGGREGATE", "DOSIMETRY_READ_NOMINATIVE", "DOSIMETRY_WRITE", "DOSIMETRY_PCR_RPO",
            "BLAST_VIEW", "BLAST_PLAN", "BLAST_CONFIRM", "BLAST_REPORT",
            "INSPECTION_VIEW", "INSPECTION_PLAN", "INSPECTION_EXECUTE", "INSPECTION_VALIDATE",
            "INSPECTION_TEMPLATE_MANAGE");
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
        if (role == null || role.isBlank()) {
            return "";
        }
        return ROLE_PERMISSIONS.getOrDefault(role.trim().toUpperCase(), "");
    }

    public static class Config {

    }
}
