package com.hrms.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Predicat UNIQUE « compte reellement enrole en 2FA ».
 *
 * <p>Regression couverte : un compte {@code mfaEnabled=true} SANS secret etait
 * juge « enrole » par l'enrolement (qui refusait alors de demarrer) mais « non
 * enrole » par /login (qui emettait un challenge ENROLL) — verrou mortel, aucun
 * ecran 2FA et connexion impossible. Le predicat doit dire « non enrole » dans
 * ce cas, pour que l'enrolement puisse demarrer.
 */
class AccountMfaEnrolledTest {

    private Account account(Boolean enabled, String secret) {
        Account a = new Account();
        a.setMfaEnabled(enabled);
        a.setMfaSecretEncrypted(secret);
        return a;
    }

    @Test
    void enrolledWhenFlagAndSecretArePresent() {
        assertThat(account(true, "chiffre").isMfaEnrolled()).isTrue();
    }

    @Test
    void notEnrolledWhenFlagIsSetButSecretIsMissing() {
        assertThat(account(true, null).isMfaEnrolled()).isFalse();
        assertThat(account(true, "").isMfaEnrolled()).isFalse();
        assertThat(account(true, "   ").isMfaEnrolled()).isFalse();
    }

    @Test
    void notEnrolledWhenFlagIsAbsent() {
        assertThat(account(false, "chiffre").isMfaEnrolled()).isFalse();
        assertThat(account(null, "chiffre").isMfaEnrolled()).isFalse();
        assertThat(account(null, null).isMfaEnrolled()).isFalse();
    }
}
