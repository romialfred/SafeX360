package com.hrms.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.Test;

class ServiceIdentityFilterTest {

    @Test
    void hnsReferenceIdentityCannotMoveLaterallyOrMutate() {
        ServiceIdentity hns = new ServiceIdentity("safex-hns", "safex-hrms",
                Set.of("hrms:reference:read"), "jti");
        assertThat(ServiceIdentityFilter.isAllowed(hns, "GET", "/hrms/employee/getByIds")).isTrue();
        assertThat(ServiceIdentityFilter.isAllowed(hns, "POST", "/hrms/employee/create")).isFalse();
        assertThat(ServiceIdentityFilter.isAllowed(hns, "GET", "/hrms/admin/users/journal")).isFalse();
        assertThat(ServiceIdentityFilter.isAllowed(hns, "GET", "/hrms/directory/settings")).isFalse();
    }

    @Test
    void scopeCannotBeReusedByAnotherIssuer() {
        ServiceIdentity forgedGatewayScope = new ServiceIdentity("safex-hns", "safex-hrms",
                Set.of("hrms:proxy"), "jti");
        ServiceIdentity gateway = new ServiceIdentity("safex-gateway", "safex-hrms",
                Set.of("hrms:proxy"), "jti-2");
        assertThat(ServiceIdentityFilter.isAllowed(forgedGatewayScope, "GET", "/hrms/admin/users/journal")).isFalse();
        assertThat(ServiceIdentityFilter.isAllowed(gateway, "GET", "/hrms/account/getAll")).isTrue();
    }
}
