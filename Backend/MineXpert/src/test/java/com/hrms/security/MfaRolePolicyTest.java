package com.hrms.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class MfaRolePolicyTest {

    private final MfaRolePolicy policy = new MfaRolePolicy();

    // 2FA OBLIGATOIRE POUR TOUS : tout rôle impose la MFA (privilégié ou non).
    @ParameterizedTest
    @ValueSource(strings = {"SYSTEM_ADMINISTRATOR", "Administrator", "HEALTH_SAFETY_COORDINATOR",
            "HSE_MANAGER", "Medecin", "PCR_RPO", "Responsable dynamitage", "BLAST_OFFICER",
            "EMPLOYEE", "AUDITOR", "INCIDENT_INVESTIGATOR", "VIEWER"})
    void requiresMfaForEveryRole(String role) {
        assertThat(policy.requiresMfa(role)).isTrue();
    }

    // FAIL-CLOSED : un rôle vide n'est PAS une dispense — sinon créer un compte
    // sans rôle suffisait à contourner l'obligation de second facteur.
    @ParameterizedTest
    @ValueSource(strings = {"", "  "})
    void requiresMfaForBlankRole(String role) {
        assertThat(policy.requiresMfa(role)).isTrue();
    }

    @Test
    void requiresMfaForNullRole() {
        assertThat(policy.requiresMfa(null)).isTrue();
    }
}
