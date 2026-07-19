package com.minexpert.hns.config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.minexpert.hns.security.ServiceIdentity;

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


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            ServiceIdentity service = (ServiceIdentity) request.getAttribute(ServiceIdentity.REQUEST_ATTRIBUTE);

            // SEC 2.1 — Fail-closed : les headers d'identite/permissions ne sont
            // honores QUE si la requete prouve qu'elle vient de la Gateway via le
            // secret partage. Le service etant joignable directement (URL publique
            // Render), un client forgeant X-Permissions obtiendrait sinon toutes
            // les permissions SANS JWT. Secret non configure = aucun trust.
            boolean fromGateway = service != null
                    && "safex-gateway".equals(service.issuer())
                    && service.hasScope("hns:proxy");

            if (fromGateway) {
                String permissionsHeader = request.getHeader(HEADER_PERMISSIONS);
                String userIdHeader = request.getHeader(HEADER_USER_ID);

                List<GrantedAuthority> authorities = new ArrayList<>(parsePermissions(permissionsHeader));

                // RBAC réel (remplace l'ancien fail-open Phase 10-A).
                // La Gateway injecte TOUJOURS X-Permissions pour une requête utilisateur
                // authentifiée (même vide si le rôle n'a aucune autorité) : sa PRÉSENCE
                // signale « requête utilisateur, RBAC strict ».
                //  - header présent (même vide) + aucune autorité -> fail-CLOSED :
                //    on n'accorde rien, les @PreAuthorize renverront 403 (comportement voulu).
                //  - header ABSENT -> appel système-à-système direct (jobs internes, pas de
                //    JWT) : on conserve le fallback de confiance (secret partagé garant),
                //    sinon on casserait le trafic interne légitime.
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
