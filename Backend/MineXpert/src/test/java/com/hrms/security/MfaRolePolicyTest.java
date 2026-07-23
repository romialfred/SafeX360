package com.hrms.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.hrms.entity.Account;

class MfaRolePolicyTest {

    private final MfaRolePolicy policy = new MfaRolePolicy();

    private Account account(String role) {
        Account a = new Account();
        a.setRole(role);
        return a;
    }

    // 2FA OBLIGATOIRE POUR TOUS : le rôle n'entre pas dans la décision.
    @ParameterizedTest
    @ValueSource(strings = {"SYSTEM_ADMINISTRATOR", "Administrator", "HEALTH_SAFETY_COORDINATOR",
            "HSE_MANAGER", "Medecin", "PCR_RPO", "Responsable dynamitage", "BLAST_OFFICER",
            "EMPLOYEE", "AUDITOR", "INCIDENT_INVESTIGATOR", "VIEWER"})
    void requiresMfaForEveryRole(String role) {
        assertThat(policy.requiresMfa(account(role))).isTrue();
    }

    // FAIL-CLOSED : un rôle vide n'est PAS une dispense — sinon créer un compte
    // sans rôle suffisait à contourner l'obligation de second facteur.
    @ParameterizedTest
    @ValueSource(strings = {"", "  "})
    void requiresMfaForBlankRole(String role) {
        assertThat(policy.requiresMfa(account(role))).isTrue();
    }

    @Test
    void requiresMfaForNullRole() {
        assertThat(policy.requiresMfa(account(null))).isTrue();
    }

    // Un compte inconnu ne peut pas être plus permissif qu'un compte connu.
    @Test
    void requiresMfaWhenAccountIsUnknown() {
        assertThat(policy.requiresMfa(null)).isTrue();
    }

    // SEULE dérogation : la dispense explicite posée par un administrateur.
    @Test
    void doesNotRequireMfaForExplicitlyExemptedAccount() {
        Account exempted = account("EMPLOYEE");
        exempted.setMfaExempt(true);
        assertThat(policy.requiresMfa(exempted)).isFalse();
    }

    // La garde dans l'AUTRE sens : retirer la dispense ré-impose le second facteur.
    @Test
    void requiresMfaAgainOnceExemptionIsRemoved() {
        Account account = account("EMPLOYEE");
        account.setMfaExempt(true);
        account.setMfaExempt(false);
        assertThat(policy.requiresMfa(account)).isTrue();
    }
}
