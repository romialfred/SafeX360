package com.hrms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class MyConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration builder) throws Exception {
        return builder.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf().disable()
                .authorizeHttpRequests(auth -> auth
                        // Public actuator endpoints
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()

                        // R-060 Phase 2.a — Swagger UI / OpenAPI documentation
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html",
                                         "/v3/api-docs/**", "/v3/api-docs.yaml").permitAll()

                        // Backdoor X-Secret-Key (R-003 — à supprimer Phase 2.a sprint 1 après mise en place mTLS)
                        .requestMatchers(request -> "SECRET".equals(request.getHeader("X-Secret-Key"))).permitAll()

                        .anyRequest().denyAll());
        return http.build();
    }

}
