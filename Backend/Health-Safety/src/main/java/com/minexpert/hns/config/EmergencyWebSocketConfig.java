package com.minexpert.hns.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuration WebSocket STOMP pour le broadcast SOS / Alerte Générale
 * (LOT 48 Phase 3.a).
 *
 * <p>Topics utilisés :</p>
 * <ul>
 *   <li>{@code /topic/emergency/sos/company/{companyId}} — broadcast aux
 *       coordinateurs d'une mine pour TOUTES les transitions d'alertes</li>
 *   <li>{@code /topic/emergency/sos/{id}} — broadcast spécifique à une alerte</li>
 * </ul>
 *
 * <p>Endpoint d'établissement : {@code /ws/emergency} (avec SockJS fallback).</p>
 *
 * <p>Sécurité : l'authentification se fait côté gateway (TokenFilter ajoute
 * un header X-User-Id + X-Permissions). Le WebSocket hérite via interceptor
 * (à durcir Phase 6 — pour l'instant, accès public en local).</p>
 */
@Configuration
@EnableWebSocketMessageBroker
public class EmergencyWebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Topic préfixe pour les broadcasts serveur → clients
        registry.enableSimpleBroker("/topic", "/queue");
        // Préfixe pour les messages clients → serveur (handlers @MessageMapping)
        registry.setApplicationDestinationPrefixes("/app");
        // Préfixe pour les messages user-spécifiques
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
            .addEndpoint("/ws/emergency")
            // Origines : localhost dev + prod Vercel + prod custom domain
            .setAllowedOriginPatterns(
                "http://localhost:5173",
                "http://localhost:3000",
                "https://safex360.data-univers.com",
                "https://dev.safex360.data-univers.com",
                "https://health-safety-eight.vercel.app"
            )
            .withSockJS();
    }
}
