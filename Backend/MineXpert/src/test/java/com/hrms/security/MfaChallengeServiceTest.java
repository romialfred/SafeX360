package com.hrms.security;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import com.hrms.security.MfaChallengeService.MfaChallengeException;
import com.hrms.security.MfaChallengeService.Purpose;

class MfaChallengeServiceTest {

    @Test
    void challengeIsSingleUse() {
        MfaChallengeService service = new MfaChallengeService(
                Clock.fixed(Instant.parse("2026-07-19T12:00:00Z"), ZoneOffset.UTC));
        String token = service.issue(7L, "admin", Purpose.VERIFY).token();
        service.require(token, Purpose.VERIFY);
        service.consume(token);
        assertThatThrownBy(() -> service.require(token, Purpose.VERIFY))
                .isInstanceOf(MfaChallengeException.class)
                .hasMessage("MFA_CHALLENGE_INVALID");
    }

    @Test
    void fifthFailureLocksChallenge() {
        MfaChallengeService service = new MfaChallengeService();
        String token = service.issue(7L, "admin", Purpose.VERIFY).token();
        for (int i = 0; i < 4; i++) service.recordFailure(token);
        assertThatThrownBy(() -> service.recordFailure(token))
                .isInstanceOf(MfaChallengeException.class)
                .hasMessage("MFA_CHALLENGE_LOCKED");
        assertThatThrownBy(() -> service.require(token, Purpose.VERIFY))
                .hasMessage("MFA_CHALLENGE_INVALID");
    }
}
