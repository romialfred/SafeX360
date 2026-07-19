package com.minexpert.hns.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import com.minexpert.hns.security.ServiceIdentity;

class GatewayRequestAuthorizationFilterTest {

    private final GatewayRequestAuthorizationFilter filter = new GatewayRequestAuthorizationFilter(
            new GatewayRequestContext(), new GatewayAuthorizationMatrix());

    @Test
    void employeeReadInsideAssignedMineIsAllowed() throws Exception {
        MockHttpServletRequest request = userRequest("GET", "/hns/incidents/get/12", "EMPLOYEE", "7");
        request.addParameter("companyId", "7");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean();

        filter.doFilterInternal(request, response, (req, res) -> called.set(true));

        assertTrue(called.get());
        assertEquals(200, response.getStatus());
    }

    @Test
    void sameRoleAndIdAreDeniedForAnotherMine() throws Exception {
        MockHttpServletRequest request = userRequest("GET", "/hns/incidents/get/12", "HSE_MANAGER", "7");
        request.addParameter("companyId", "8");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean();

        filter.doFilterInternal(request, response, (req, res) -> called.set(true));

        assertFalse(called.get());
        assertEquals(403, response.getStatus());
    }

    @Test
    void employeeMutationAndExportAreDenied() throws Exception {
        MockHttpServletRequest update = userRequest("PUT", "/hns/incidents/update", "EMPLOYEE", "7");
        update.addParameter("companyId", "7");
        MockHttpServletResponse updateResponse = new MockHttpServletResponse();
        filter.doFilterInternal(update, updateResponse, (req, res) -> { });
        assertEquals(403, updateResponse.getStatus());

        MockHttpServletRequest export = userRequest("GET", "/hns/audit/report/pdf/12", "EMPLOYEE", "7");
        export.addParameter("companyId", "7");
        MockHttpServletResponse exportResponse = new MockHttpServletResponse();
        filter.doFilterInternal(export, exportResponse, (req, res) -> { });
        assertEquals(403, exportResponse.getStatus());
    }

    @Test
    void forgedAdminHeadersWithoutTrustedSecretAreRejected() throws Exception {
        MockHttpServletRequest request = userRequest("GET", "/hns/incidents", "ADMIN", "7");
        request.removeAttribute(ServiceIdentity.REQUEST_ATTRIBUTE);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean();

        filter.doFilterInternal(request, response, (req, res) -> called.set(true));

        assertFalse(called.get());
        assertEquals(401, response.getStatus());
    }

    @Test
    void hrmsInternalScopeIsLimitedToPermissionEndpoints() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/hns/users/permissions/init-for-account");
        request.setAttribute(ServiceIdentity.REQUEST_ATTRIBUTE, new ServiceIdentity(
                "safex-hrms", "safex-hns", java.util.Set.of("hns:permissions:write"), "hrms-jti"));
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean();

        filter.doFilterInternal(request, response, (req, res) -> called.set(true));

        assertTrue(called.get());

        MockHttpServletRequest lateral = new MockHttpServletRequest("POST", "/hns/blast/confirm/7");
        lateral.setAttribute(ServiceIdentity.REQUEST_ATTRIBUTE, new ServiceIdentity(
                "safex-hrms", "safex-hns", java.util.Set.of("hns:permissions:write"), "other-jti"));
        MockHttpServletResponse lateralResponse = new MockHttpServletResponse();
        filter.doFilterInternal(lateral, lateralResponse, (req, res) -> { });
        assertEquals(403, lateralResponse.getStatus());
    }

    @Test
    void parallelModulesWithSpecializedRbacAreNotReclassified() {
        assertTrue(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/hns/emergency/sos/1")));
        assertTrue(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/hns/blast/1")));
        assertTrue(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/hns/blast-setting/get")));
        assertTrue(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/hns/dosimetry/report")));
    }

    @Test
    void accountPermissionReadIsSelfOrAdministratorOnly() throws Exception {
        MockHttpServletRequest own = userRequest(
                "GET", "/hns/users/permissions/by-account/41", "EMPLOYEE", "7");
        MockHttpServletResponse ownResponse = new MockHttpServletResponse();
        AtomicBoolean ownCalled = new AtomicBoolean();
        filter.doFilterInternal(own, ownResponse, (req, res) -> ownCalled.set(true));
        assertTrue(ownCalled.get());

        MockHttpServletRequest other = userRequest(
                "GET", "/hns/users/permissions/by-account/42", "EMPLOYEE", "7");
        MockHttpServletResponse otherResponse = new MockHttpServletResponse();
        filter.doFilterInternal(other, otherResponse, (req, res) -> { });
        assertEquals(403, otherResponse.getStatus());

        MockHttpServletRequest administration = userRequest(
                "GET", "/hns/users/permissions/getAll", "HSE_MANAGER", "7");
        MockHttpServletResponse administrationResponse = new MockHttpServletResponse();
        filter.doFilterInternal(administration, administrationResponse, (req, res) -> { });
        assertEquals(403, administrationResponse.getStatus());
    }

    private static MockHttpServletRequest userRequest(String method, String path, String role,
            String companies) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setAttribute(ServiceIdentity.REQUEST_ATTRIBUTE, new ServiceIdentity(
                "safex-gateway", "safex-hns", java.util.Set.of("hns:proxy"), "gateway-jti"));
        request.addHeader(GatewayRequestContext.HEADER_USER_ID, "41");
        request.addHeader(GatewayRequestContext.HEADER_ROLE, role);
        request.addHeader(GatewayRequestContext.HEADER_PERMISSIONS, "INSPECTION_VIEW");
        request.addHeader(GatewayRequestContext.HEADER_COMPANIES, companies);
        request.addHeader(GatewayRequestContext.HEADER_ALL_MINES, "false");
        return request;
    }
}
