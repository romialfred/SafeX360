package com.hrms.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class MfaRolePolicyTest {

    private final MfaRolePolicy policy = new MfaRolePolicy();

    // 2FA OBLIGATOIRE POUR TOUS : tout rôle non vide impose la MFA (privilégié ou non).
    @ParameterizedTest
    @ValueSource(strings = {"SYSTEM_ADMINISTRATOR", "Administrator", "HEALTH_SAFETY_COORDINATOR",
            "HSE_MANAGER", "Medecin", "PCR_RPO", "Responsable dynamitage", "BLAST_OFFICER",
            "EMPLOYEE", "AUDITOR", "INCIDENT_INVESTIGATOR", "VIEWER"})
    void requiresMfaForEveryRole(String role) {
        assertThat(policy.requiresMfa(role)).isTrue();
    }

    // Seul un rôle vide / null est exempté (absence de rôle = pas de contexte MFA).
    @ParameterizedTest
    @ValueSource(strings = {"", "  "})
    void doesNotRequireMfaForBlankRole(String role) {
        assertThat(policy.requiresMfa(role)).isFalse();
    }

    @Test
    void doesNotRequireMfaForNullRole() {
        assertThat(policy.requiresMfa(null)).isFalse();
    }
}
