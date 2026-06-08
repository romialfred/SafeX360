package com.minexpert.hns.config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.minexpert.hns.blast.config.BlastRBACConfig;
import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.inspections.config.InspectionRBACConfig;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filtre Spring Security qui materialise les headers d'identite et de permissions provenant
 * de la Gateway en {@link org.springframework.security.core.Authentication}.
 *
 * <p><b>Headers attendus</b> (positionnes par la Gateway apres validation du JWT) :
 * <ul>
 *   <li>{@code X-User-Id} : identifiant numerique de l'utilisateur (peut etre absent pour
 *       les appels system-to-system via secret).</li>
 *   <li>{@code X-Permissions} : liste CSV des permissions effectives (ex.
 *       {@code DOSIMETRY_READ_NOMINATIVE,DOSIMETRY_WRITE}). Chaque element devient un
 *       {@link GrantedAuthority}.</li>
 * </ul>
 *
 * <p><b>Phase 10-A (Security Hardening) :</b> sans ce filtre, l'activation de
 * {@code @EnableMethodSecurity} bloquerait TOUTES les requetes annotees
 * {@code @PreAuthorize("hasAuthority('X')")} car le {@code SecurityContext} resterait
 * vide (anonymous). En materialisant les permissions dans le contexte, on rend les
 * annotations effectivement appliquees au runtime tout en preservant la chaine de
 * confiance Gateway -&gt; microservice (le header X-Secret-Key garantit deja l'origine).
 *
 * <p>Le token genere n'a pas de credentials et n'est pas authentifie via UsernamePassword :
 * il s'agit d'un {@link PreAuthenticatedAuthorityToken} (proxy d'authentification au-dela
 * du perimetre de la Gateway).
 */
@Component
public class GatewayAuthorityFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = LoggerFactory.getLogger(GatewayAuthorityFilter.class);

    static final String HEADER_USER_ID = "X-User-Id";
    static final String HEADER_PERMISSIONS = "X-Permissions";
    static final String HEADER_SECRET_KEY = "X-Secret-Key";

    /**
     * Toutes les permissions Dosimetry, accordees automatiquement aux requetes system-to-system
     * authentifiees via le secret partage Gateway (compat ascendante pour les jobs internes).
     */
    private static final List<String> SYSTEM_TRUST_PERMISSIONS = List.of(
            DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE,
            DosimetryRBACConfig.DOSIMETRY_READ_NOMINATIVE,
            DosimetryRBACConfig.DOSIMETRY_WRITE,
            DosimetryRBACConfig.DOSIMETRY_MEDICAL,
            DosimetryRBACConfig.DOSIMETRY_PCR_RPO,
            DosimetryRBACConfig.DOSIMETRY_ADMIN,
            DosimetryRBACConfig.DOSIMETRY_EXPORT_MEDICAL,
            // Blast Management — toutes les permissions accordees aux requetes system-to-system
            BlastRBACConfig.BLAST_VIEW,
            BlastRBACConfig.BLAST_PLAN,
            BlastRBACConfig.BLAST_CONFIRM,
            BlastRBACConfig.BLAST_ALARM,
            BlastRBACConfig.BLAST_REPORT,
            BlastRBACConfig.BLAST_ADMIN,
            // Inspections (refonte 2026-06) — toutes les permissions system-to-system
            InspectionRBACConfig.INSPECTION_VIEW,
            InspectionRBACConfig.INSPECTION_PLAN,
            InspectionRBACConfig.INSPECTION_EXECUTE,
            InspectionRBACConfig.INSPECTION_VALIDATE,
            InspectionRBACConfig.INSPECTION_TEMPLATE_MANAGE,
            InspectionRBACConfig.INSPECTION_ADMIN
    );

    @Value("${INTERNAL_GATEWAY_SECRET:CHANGE_ME_IN_PROD}")
    private String internalGatewaySecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String permissionsHeader = request.getHeader(HEADER_PERMISSIONS);
            String userIdHeader = request.getHeader(HEADER_USER_ID);
            String secretKey = request.getHeader(HEADER_SECRET_KEY);

            List<GrantedAuthority> authorities = new ArrayList<>(parsePermissions(permissionsHeader));

            // Phase 10-A : compat ascendante - si le secret partage Gateway est present mais
            // aucune permission n'est envoyee (Gateway non encore mise a jour pour relayer
            // X-Permissions), on accorde le set complet de permissions Dosimetry car la
            // trust frontiere est garantie par le secret pre-partage (R-003).
            // Pour transitionner vers du JWT propage, retirer cette compat des que la Gateway
            // envoie systematiquement X-Permissions.
            if (authorities.isEmpty()
                    && secretKey != null
                    && secretKey.equals(internalGatewaySecret)) {
                authorities = SYSTEM_TRUST_PERMISSIONS.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toCollection(ArrayList::new));
            }

            if (!authorities.isEmpty() || userIdHeader != null) {
                PreAuthenticatedAuthorityToken auth = new PreAuthenticatedAuthorityToken(
                        userIdHeader != null ? userIdHeader : "anonymous-gateway",
                        authorities);
                auth.setAuthenticated(true);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception ex) {
            // Defense-in-depth : on ne casse pas la requete si le parsing echoue,
            // mais on logge pour analyse. L'absence d'authority entrainera 403 sur
            // les endpoints @PreAuthorize, ce qui est le comportement attendu.
            LOGGER.warn("[GatewayAuthorityFilter] Failed to materialize permissions: {}",
                    ex.getMessage());
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Nettoyage strict pour eviter la pollution entre requetes (thread pool).
            SecurityContextHolder.clearContext();
        }
    }

    /**
     * Parse "PERM_A,PERM_B,PERM_C" en GrantedAuthority. Tolerant aux espaces et entrees vides.
     */
    static List<GrantedAuthority> parsePermissions(String header) {
        if (header == null || header.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(header.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    /**
     * Token d'authentification pre-validee par la Gateway. Le principal est l'identifiant
     * utilisateur (string), les autorites sont les permissions parsees.
     */
    public static final class PreAuthenticatedAuthorityToken extends AbstractAuthenticationToken {

        private static final long serialVersionUID = 1L;

        private final String principal;

        public PreAuthenticatedAuthorityToken(String principal, List<GrantedAuthority> authorities) {
            super(authorities);
            this.principal = principal;
        }

        @Override
        public Object getCredentials() {
            return ""; // pas de credentials : la Gateway a deja valide le JWT.
        }

        @Override
        public Object getPrincipal() {
            return principal;
        }
    }
}
