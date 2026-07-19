package com.minexpert.hns.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;

class StompSecurityInterceptorTest {

    private final StompSecurityInterceptor interceptor = new StompSecurityInterceptor();

    @Test
    void authorizesMineScopedSubscriptionFromSignedIdentity() {
        Message<byte[]> message = frame(StompCommand.SUBSCRIBE,
                "/topic/emergency/sos/company/7",
                new StompIdentity("coordinator", "HSE_MANAGER", 4L, false, Set.of(7L)));

        assertThatCode(() -> interceptor.preSend(message, null))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsCrossMineAndGlobalSubscriptions() {
        StompIdentity identity =
                new StompIdentity("coordinator", "HSE_MANAGER", 4L, false, Set.of(7L));

        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.SUBSCRIBE,
                "/topic/emergency/sos/company/8", identity), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cross-mine");
        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.SUBSCRIBE,
                "/topic/blast-popup", identity), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("global");
    }

    @Test
    void rejectsUnauthorizedRoleAndEveryClientSend() {
        StompIdentity employee =
                new StompIdentity("worker", "EMPLOYEE", 5L, false, Set.of(7L));

        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.SUBSCRIBE,
                "/topic/emergency/sos/company/7", employee), null))
                .hasMessageContaining("role");
        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.SEND,
                "/app/emergency", employee), null))
                .hasMessageContaining("SEND");
    }

    @Test
    void rejectsFramesWithoutVerifiedHandshakeIdentity() {
        assertThatThrownBy(() -> interceptor.preSend(
                frame(StompCommand.CONNECT, null, null), null))
                .hasMessageContaining("authenticated");
    }

    private Message<byte[]> frame(StompCommand command, String destination,
            StompIdentity identity) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        if (destination != null) {
            accessor.setDestination(destination);
        }
        accessor.setSessionAttributes(identity == null
                ? Map.of() : Map.of(StompIdentity.SESSION_KEY, identity));
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
