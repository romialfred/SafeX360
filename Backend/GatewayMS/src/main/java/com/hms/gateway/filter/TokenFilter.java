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
            // SEC 2.1 — Strip X-Permissions as well: no legitimate client sends it,
            // and downstream services grant authorities from it. X-User-Id is kept
            // (attribution only, sent legitimately by the mobile app).
            exchange = exchange.mutate()
                    .request(r -> r.headers(h -> {
                        h.remove("X-Secret-Key");
                        h.remove("X-Permissions");
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
                exchange = exchange.mutate()
                        .request(r -> r.header("X-Secret-Key", INTERNAL_GATEWAY_SECRET)
                                .header("X-Permissions", permissions))
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
    // Source de vérité côté périmètre (gateway). Les autorités doivent
    // correspondre EXACTEMENT aux constantes des *RBACConfig HNS (hasAuthority).
    // Rôles ultra-sensibles (DOSIMETRY_MEDICAL/_EXPORT_MEDICAL/_ADMIN, BLAST_ADMIN,
    // BLAST_ALARM, INSPECTION_ADMIN) réservés à SYSTEM_ADMINISTRATOR faute de
    // rôles médecin/RPO dédiés dans l'enum (dette : enrichir UserRole plus tard).
    private static final java.util.Map<String, String> ROLE_PERMISSIONS = java.util.Map.of(
            "SYSTEM_ADMINISTRATOR", String.join(",",
                    "DOSIMETRY_READ_AGGREGATE", "DOSIMETRY_READ_NOMINATIVE", "DOSIMETRY_WRITE",
                    "DOSIMETRY_MEDICAL", "DOSIMETRY_PCR_RPO", "DOSIMETRY_ADMIN", "DOSIMETRY_EXPORT_MEDICAL",
                    "BLAST_VIEW", "BLAST_PLAN", "BLAST_CONFIRM", "BLAST_ALARM", "BLAST_REPORT", "BLAST_ADMIN",
                    "INSPECTION_VIEW", "INSPECTION_PLAN", "INSPECTION_EXECUTE", "INSPECTION_VALIDATE",
                    "INSPECTION_TEMPLATE_MANAGE", "INSPECTION_ADMIN"),
            "HEALTH_SAFETY_COORDINATOR", String.join(",",
                    "DOSIMETRY_READ_AGGREGATE", "DOSIMETRY_READ_NOMINATIVE", "DOSIMETRY_WRITE", "DOSIMETRY_PCR_RPO",
                    "BLAST_VIEW", "BLAST_PLAN", "BLAST_CONFIRM", "BLAST_REPORT",
                    "INSPECTION_VIEW", "INSPECTION_PLAN", "INSPECTION_EXECUTE", "INSPECTION_VALIDATE",
                    "INSPECTION_TEMPLATE_MANAGE"),
            "INCIDENT_INVESTIGATOR", String.join(",",
                    "DOSIMETRY_READ_AGGREGATE", "DOSIMETRY_READ_NOMINATIVE", "INSPECTION_VIEW", "BLAST_VIEW"),
            "AUDITOR", String.join(",",
                    "INSPECTION_VIEW", "INSPECTION_VALIDATE", "DOSIMETRY_READ_AGGREGATE", "BLAST_VIEW"),
            "EMPLOYEE", String.join(",",
                    "DOSIMETRY_READ_NOMINATIVE", "INSPECTION_VIEW", "BLAST_VIEW"));

    /**
     * Autorités CSV pour un rôle. Rôle inconnu/null -> chaîne vide : le header
     * X-Permissions reste présent (requête utilisateur) mais n'accorde aucune
     * autorité RBAC downstream (fail-closed côté HNS).
     */
    private static String permissionsForRole(String role) {
        if (role == null) {
            return "";
        }
        return ROLE_PERMISSIONS.getOrDefault(role.trim(), "");
    }

    public static class Config {

    }
}
