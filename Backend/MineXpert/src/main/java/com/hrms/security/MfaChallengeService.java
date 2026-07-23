package com.hrms.security;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

/** Challenges opaques, courts, mono-usage et limites a cinq essais. */
@Service
public class MfaChallengeService {

    // PASSWORD_CHANGE : challenge pré-session émis au 1er login (firstLogin=true)
    // pour permettre le changement du mot de passe temporaire AVANT la MFA.
    public enum Purpose { ENROLL, VERIFY, PASSWORD_CHANGE }

    public record Challenge(String token, long accountId, String login, Purpose purpose, Instant expiresAt) { }

    // Package-private : MfaService aligne l'expiration des secrets d'enrolement
    // en attente sur celle des challenges (source unique de la durée de vie).
    static final Duration TTL = Duration.ofMinutes(5);
    private static final int MAX_ATTEMPTS = 5;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, State> challenges = new ConcurrentHashMap<>();
    private final Clock clock;

    public MfaChallengeService() {
        this(Clock.systemUTC());
    }

    MfaChallengeService(Clock clock) {
        this.clock = clock;
    }

    public Challenge issue(long accountId, String login, Purpose purpose) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt = clock.instant().plus(TTL);
        challenges.put(token, new State(accountId, login, purpose, expiresAt));
        return new Challenge(token, accountId, login, purpose, expiresAt);
    }

    public synchronized Challenge require(String token, Purpose purpose) {
        State state = challenges.get(token);
        if (state == null || state.used || state.expiresAt.isBefore(clock.instant()) || state.purpose != purpose) {
            if (state != null) challenges.remove(token);
            throw new MfaChallengeException("MFA_CHALLENGE_INVALID");
        }
        return new Challenge(token, state.accountId, state.login, state.purpose, state.expiresAt);
    }

    public synchronized void recordFailure(String token) {
        State state = challenges.get(token);
        if (state == null) throw new MfaChallengeException("MFA_CHALLENGE_INVALID");
        state.attempts++;
        if (state.attempts >= MAX_ATTEMPTS) {
            challenges.remove(token);
            throw new MfaChallengeException("MFA_CHALLENGE_LOCKED");
        }
    }

    public synchronized void consume(String token) {
        State state = challenges.remove(token);
        if (state == null || state.used || state.expiresAt.isBefore(clock.instant())) {
            throw new MfaChallengeException("MFA_CHALLENGE_INVALID");
        }
        state.used = true;
    }

    public static final class MfaChallengeException extends RuntimeException {
        private static final long serialVersionUID = 1L;
        MfaChallengeException(String code) { super(code); }
    }

    private static final class State {
        final long accountId;
        final String login;
        final Purpose purpose;
        final Instant expiresAt;
        int attempts;
        boolean used;
        State(long accountId, String login, Purpose purpose, Instant expiresAt) {
            this.accountId = accountId;
            this.login = login;
            this.purpose = purpose;
            this.expiresAt = expiresAt;
        }
    }
}
