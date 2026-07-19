package com.minexpert.hns.config;

import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

/** Autorisation STOMP deny-by-default pour les alertes d'urgence et de tir. */
@Component
public class StompSecurityInterceptor implements ChannelInterceptor {

    private static final Logger LOG = LoggerFactory.getLogger(StompSecurityInterceptor.class);

    private static final Pattern MINE_TOPIC = Pattern.compile(
            "^/topic/(?:emergency/(?:sos|alert|escalation)/company|blast-popup/mine|blast-misfire/mine)/(\\d+)$");
    private static final Set<String> SOS_ROLES = Set.of(
            "SYSTEM_ADMINISTRATOR", "ADMINISTRATOR", "ADMIN",
            "HEALTH_SAFETY_COORDINATOR", "HSE_MANAGER", "HSE_OFFICER",
            "INCIDENT_INVESTIGATOR");

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (command == StompCommand.DISCONNECT || command == StompCommand.UNSUBSCRIBE) {
            return message;
        }

        StompIdentity identity = identity(accessor);
        if (identity == null) {
            throw denied("authenticated WebSocket session required");
        }

        if (command == StompCommand.CONNECT) {
            accessor.setUser(new UsernamePasswordAuthenticationToken(
                    identity.subject(), "N/A",
                    Set.of(new SimpleGrantedAuthority("ROLE_" + identity.role()))));
            return message;
        }
        if (command == StompCommand.SEND) {
            throw denied("client STOMP SEND is disabled");
        }
        if (command != StompCommand.SUBSCRIBE) {
            return message;
        }

        String destination = accessor.getDestination();
        if (destination != null && destination.startsWith("/user/")) {
            return message;
        }

        Matcher matcher = destination == null ? null : MINE_TOPIC.matcher(destination);
        if (matcher == null || !matcher.matches()) {
            throw denied("global or unknown subscription destination");
        }

        long mineId = Long.parseLong(matcher.group(1));
        if (!identity.canAccessMine(mineId)) {
            throw denied("cross-mine subscription rejected");
        }
        if (destination.startsWith("/topic/emergency/sos/")
                || destination.startsWith("/topic/emergency/escalation/")) {
            if (!SOS_ROLES.contains(identity.role())) {
                throw denied("role not authorized for SOS subscription");
            }
        }
        return message;
    }

    private StompIdentity identity(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        Object value = sessionAttributes == null
                ? null : sessionAttributes.get(StompIdentity.SESSION_KEY);
        return value instanceof StompIdentity stompIdentity ? stompIdentity : null;
    }

    private IllegalArgumentException denied(String reason) {
        LOG.warn("STOMP frame rejected: {}", reason);
        return new IllegalArgumentException(reason);
    }
}
