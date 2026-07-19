package com.minexpert.hns.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.Test;

class ServiceIdentityFilterTest {
    @Test
    void hrmsPermissionIdentityCannotReachBlastDosimetryOrUnscopedWrites() {
        ServiceIdentity hrms = new ServiceIdentity("safex-hrms", "safex-hns",
                Set.of("hns:permissions:write"), "jti");
        assertThat(ServiceIdentityFilter.isAllowed(hrms, "POST", "/hns/users/permissions/init-for-account")).isTrue();
        assertThat(ServiceIdentityFilter.isAllowed(hrms, "POST", "/hns/blast/confirm/7")).isFalse();
        assertThat(ServiceIdentityFilter.isAllowed(hrms, "GET", "/hns/dosimetry/medical-visits")).isFalse();
        assertThat(ServiceIdentityFilter.isAllowed(hrms, "POST", "/hns/incidents/create")).isFalse();
    }

    @Test
    void readScopeCannotMutatePermissionProfiles() {
        ServiceIdentity hrmsRead = new ServiceIdentity("safex-hrms", "safex-hns",
                Set.of("hns:permissions:read"), "jti");
        assertThat(ServiceIdentityFilter.isAllowed(hrmsRead, "GET", "/hns/users/permissions/by-account/7")).isTrue();
        assertThat(ServiceIdentityFilter.isAllowed(hrmsRead, "DELETE", "/hns/users/permissions/by-account/7")).isFalse();
    }
}
