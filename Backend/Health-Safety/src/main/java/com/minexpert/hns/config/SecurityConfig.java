package com.minexpert.hns.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuration de securite du microservice Health-Safety.
 *
 * <p><b>Phase 10-A (Security Hardening) :</b> activation de
 * {@link EnableMethodSecurity} avec {@code prePostEnabled = true} pour rendre effectifs
 * les annotations {@code @PreAuthorize} declarees dans les controllers du module
 * Dosimetrie (Phases 3-7). Ces annotations referencent les permissions de
 * {@code DosimetryRBACConfig} (DOSIMETRY_READ_AGGREGATE, DOSIMETRY_READ_NOMINATIVE,
 * DOSIMETRY_WRITE, DOSIMETRY_MEDICAL, DOSIMETRY_PCR_RPO, DOSIMETRY_ADMIN,
 * DOSIMETRY_EXPORT_MEDICAL).
 *
 * <p><b>Compatibilite ascendante :</b> la regle "anyRequest denyAll" reste portee par
 * le filtre HTTP via le header X-Secret-Key partage avec la Gateway. Les endpoints qui
 * ne portent PAS d'annotation {@code @PreAuthorize} restent accessibles (le header
 * X-Secret-Key les laisse passer). En revanche, tout endpoint annote @PreAuthorize
 * exigera desormais l'authority correspondante dans le SecurityContext (fournie par
 * la Gateway via le header X-Permissions, mappe par {@link GatewayAuthorityFilter}).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    // LOT 41 P0 SECURITY: secret partagé Gateway↔Microservice, externalisé via env var.
    // Toute requête atteignant directement ce microservice sans ce header sera rejetée (denyAll).
    @Value("${INTERNAL_GATEWAY_SECRET:}")
    private String internalGatewaySecret;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration builder) throws Exception {
        return builder.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   GatewayAuthorityFilter gatewayAuthorityFilter) throws Exception {
        http.csrf().disable()
                // Phase 10-A : filtre qui materialise les permissions du header X-Permissions
                // en GrantedAuthority dans le SecurityContext. Necessaire pour que les
                // @PreAuthorize("hasAuthority('X')") fonctionnent au runtime.
                .addFilterBefore(gatewayAuthorityFilter,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        // LOT 42 hotfix : ouvrir /actuator/health/** pour liveness + readiness probes Render
                        .requestMatchers("/actuator/health/**", "/actuator/health", "/actuator/info").permitAll()

                        // R-060 Phase 2.a — Swagger UI / OpenAPI documentation
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html",
                                         "/v3/api-docs/**", "/v3/api-docs.yaml").permitAll()

                        // LOT 48 Phase 4.b — WebSocket SockJS/STOMP pour Emergency
                        // (les XHR SockJS ne portent pas X-Secret-Key car browser-initiated,
                        // pas via gateway). La sécurisation se fera Phase 6 au niveau STOMP
                        // CONNECT (vérification du JWT cookie côté handshake).
                        .requestMatchers("/ws/**").permitAll()

                        // LOT 41 P0 SECURITY: header X-Secret-Key dont la valeur provient de INTERNAL_GATEWAY_SECRET
                        // (R-003 — à remplacer par mTLS en Phase 2.a sprint 1)
                        .requestMatchers(request -> internalGatewaySecret.equals(request.getHeader("X-Secret-Key"))).permitAll()

                        // Deny anything else
                        .anyRequest().denyAll());
        return http.build();
    }

}
