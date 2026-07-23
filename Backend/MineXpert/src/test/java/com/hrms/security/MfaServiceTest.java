package com.hrms.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;

import com.hrms.entity.Account;
import com.hrms.repository.AccountRepository;
import com.hrms.security.MfaChallengeService.Purpose;

class MfaServiceTest {

    private Account account;
    private MfaChallengeService challenges;
    private MfaService service;
    private MutableClock clock;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-07-19T12:00:00Z"));
        AccountRepository repository = mock(AccountRepository.class);
        account = new Account();
        account.setId(7L);
        account.setLogin("privileged.user");
        account.setRole("SYSTEM_ADMINISTRATOR");
        when(repository.findById(7L)).thenReturn(Optional.of(account));
        when(repository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        challenges = new MfaChallengeService(clock);
        MfaCryptoService crypto = new MfaCryptoService("unit-test-key-material-generated-at-runtime", mock(Environment.class));
        service = new MfaService(repository, challenges, new MfaRolePolicy(),
                new TotpService(clock), crypto);
    }

    @Test
    void enrollmentThenTotpLoginRejectsReplay() {
        String enrollChallenge = challenges.issue(7L, account.getLogin(), Purpose.ENROLL).token();
        MfaService.Enrollment enrollment = service.beginEnrollment(enrollChallenge);
        long step = clock.instant().getEpochSecond() / 30;
        String enrollmentCode = TotpService.generateCode(enrollment.manualKey(), step);
        service.confirmEnrollment(enrollChallenge, enrollmentCode);

        clock.advance(Duration.ofSeconds(30));
        String loginChallenge = challenges.issue(7L, account.getLogin(), Purpose.VERIFY).token();
        String loginCode = TotpService.generateCode(enrollment.manualKey(), step + 1);
        assertThat(service.verify(loginChallenge, loginCode, null).getId()).isEqualTo(7L);

        String replayChallenge = challenges.issue(7L, account.getLogin(), Purpose.VERIFY).token();
        assertThatThrownBy(() -> service.verify(replayChallenge, loginCode, null))
                .isInstanceOf(MfaService.MfaException.class)
                .hasMessage("MFA_CODE_INVALID_OR_REPLAYED");
    }

    @Test
    void recoveryCodeCanBeUsedOnlyOnceAfterPrimaryChallenge() {
        String enrollChallenge = challenges.issue(7L, account.getLogin(), Purpose.ENROLL).token();
        MfaService.Enrollment enrollment = service.beginEnrollment(enrollChallenge);
        String enrollmentCode = TotpService.generateCode(enrollment.manualKey(), clock.instant().getEpochSecond() / 30);
        String recovery = service.confirmEnrollment(enrollChallenge, enrollmentCode).recoveryCodes().get(0);

        String first = challenges.issue(7L, account.getLogin(), Purpose.VERIFY).token();
        assertThat(service.verify(first, null, recovery).getLogin()).isEqualTo(account.getLogin());
        String second = challenges.issue(7L, account.getLogin(), Purpose.VERIFY).token();
        assertThatThrownBy(() -> service.verify(second, null, recovery))
                .isInstanceOf(MfaService.MfaException.class)
                .hasMessage("MFA_CODE_INVALID_OR_REPLAYED");
    }

    /**
     * VERROU MORTEL (regression) : un compte {@code mfaEnabled=true} sans secret
     * recevait un challenge ENROLL de /login, mais l'enrolement le refusait
     * (MFA_ENROLLMENT_NOT_ALLOWED) — plus aucun ecran 2FA, connexion impossible.
     * L'enrolement doit demarrer : le drapeau seul ne vaut pas enrolement.
     */
    @Test
    void enrollmentStartsWhenFlagIsSetButSecretIsMissing() {
        account.setMfaEnabled(true);
        account.setMfaSecretEncrypted(null);

        String enrollChallenge = challenges.issue(7L, account.getLogin(), Purpose.ENROLL).token();
        assertThat(service.beginEnrollment(enrollChallenge).manualKey()).isNotBlank();
    }

    /** L'autre sens de la garde : un compte REELLEMENT enrole ne se re-enrole pas. */
    @Test
    void enrollmentIsRefusedWhenAccountIsTrulyEnrolled() {
        String first = challenges.issue(7L, account.getLogin(), Purpose.ENROLL).token();
        MfaService.Enrollment enrollment = service.beginEnrollment(first);
        service.confirmEnrollment(first,
                TotpService.generateCode(enrollment.manualKey(), clock.instant().getEpochSecond() / 30));

        String second = challenges.issue(7L, account.getLogin(), Purpose.ENROLL).token();
        assertThatThrownBy(() -> service.beginEnrollment(second))
                .isInstanceOf(MfaService.MfaException.class)
                .hasMessage("MFA_ENROLLMENT_NOT_ALLOWED");
    }

    /** Symetrique cote verification : drapeau sans secret = non enrole. */
    @Test
    void verifyIsRefusedWhenFlagIsSetButSecretIsMissing() {
        account.setMfaEnabled(true);
        account.setMfaSecretEncrypted(null);

        String verifyChallenge = challenges.issue(7L, account.getLogin(), Purpose.VERIFY).token();
        assertThatThrownBy(() -> service.verify(verifyChallenge, "123456", null))
                .isInstanceOf(MfaService.MfaException.class)
                .hasMessage("MFA_NOT_ENROLLED");
    }

    /** FAIL-CLOSED : un compte sans role reste soumis a la 2FA (pas de contournement). */
    @Test
    void enrollmentStartsForAccountWithoutRole() {
        account.setRole(null);

        String enrollChallenge = challenges.issue(7L, account.getLogin(), Purpose.ENROLL).token();
        assertThat(service.beginEnrollment(enrollChallenge).manualKey()).isNotBlank();
    }

    private static final class MutableClock extends Clock {
        private Instant instant;
        MutableClock(Instant instant) { this.instant = instant; }
        void advance(Duration duration) { instant = instant.plus(duration); }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return instant; }
    }
}
