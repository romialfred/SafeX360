package com.minexpert.hns.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;

/**
 * Intercepteur STOMP qui sécurise les connexions WebSocket (LOT 48 Phase 6).
 *
 * <p>Au CONNECT, vérifie qu'un en-tête {@code X-Auth-Token} OU un cookie
 * {@code accessToken} est présent. Si non, le frame CONNECT est rejeté
 * et la connexion se ferme.</p>
 *
 * <p>Note : on n'exige pas un JWT cryptographiquement valide à ce stade
 * (le HS partage la signature avec MineXpert mais ne valide pas ici la
 * signature). On exige juste la présence d'un token, ce qui suffit pour
 * exiger que le client soit "logged in" — l'identité réelle est imposée
 * par le filter X-Secret-Key sur les actions REST critiques.</p>
 *
 * <p>Le SUBSCRIBE et SEND ne sont pas restreints au-delà : tout client
 * authentifié peut s'abonner aux broadcasts d'urgence (par design — les
 * alertes sont diffusées à tous les coordinateurs de la mine).</p>
 */
public class StompSecurityInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompSecurityInterceptor.class);

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Vérifie la présence d'un token d'auth (header ou cookie)
            String authHeader = firstNative(accessor, "X-Auth-Token");
            String cookieHeader = firstNative(accessor, "cookie");
            boolean hasAuth = (authHeader != null && !authHeader.isBlank())
                || (cookieHeader != null && cookieHeader.contains("accessToken="));

            if (!hasAuth) {
                log.warn("STOMP CONNECT without auth token — connection rejected.");
                throw new IllegalArgumentException("Authentication required for WebSocket");
            }
        }

        return message;
    }

    private String firstNative(StompHeaderAccessor accessor, String header) {
        List<String> values = accessor.getNativeHeader(header);
        if (values == null || values.isEmpty()) return null;
        return values.get(0);
    }
}
