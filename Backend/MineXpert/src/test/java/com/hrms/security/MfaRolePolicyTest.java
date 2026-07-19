package com.hrms.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class MfaRolePolicyTest {

    private final MfaRolePolicy policy = new MfaRolePolicy();

    @ParameterizedTest
    @ValueSource(strings = {"SYSTEM_ADMINISTRATOR", "Administrator", "HEALTH_SAFETY_COORDINATOR",
            "HSE_MANAGER", "Medecin", "PCR_RPO", "Responsable dynamitage", "BLAST_OFFICER"})
    void requiresMfaForPrivilegedRoles(String role) {
        assertThat(policy.requiresMfa(role)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"EMPLOYEE", "AUDITOR", "INCIDENT_INVESTIGATOR", ""})
    void doesNotInventPrivilegeForOtherRoles(String role) {
        assertThat(policy.requiresMfa(role)).isFalse();
    }
}
