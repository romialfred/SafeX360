package com.minexpert.hns.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import jakarta.servlet.ServletRequest;
import com.minexpert.hns.security.ServiceIdentity;

class CompanyScopeFilterSecurityTest {

    private final CompanyScopeFilter filter = new CompanyScopeFilter(new GatewayRequestContext());

    @Test
    void assignedMineIsAllowedAndOtherMineIsDenied() throws Exception {
        MockHttpServletRequest allowed = userRequest("7,9", false);
        allowed.addParameter("companyId", "9");
        MockHttpServletResponse allowedResponse = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean();
        filter.doFilterInternal(allowed, allowedResponse, (req, res) -> called.set(true));
        assertTrue(called.get());

        MockHttpServletRequest denied = userRequest("7,9", false);
        denied.addParameter("companyId", "10");
        MockHttpServletResponse deniedResponse = new MockHttpServletResponse();
        called.set(false);
        filter.doFilterInternal(denied, deniedResponse, (req, res) -> called.set(true));
        assertFalse(called.get());
        assertEquals(403, deniedResponse.getStatus());
    }

    @Test
    void missingCompanyIsClampedToFirstAssignedMine() throws Exception {
        MockHttpServletRequest request = userRequest("7,9", false);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<ServletRequest> forwarded = new AtomicReference<>();

        filter.doFilterInternal(request, response, (req, res) -> forwarded.set(req));

        assertEquals("7", forwarded.get().getParameter("companyId"));
    }

    @Test
    void duplicateCompanyParametersAreRejectedToPreventParameterPollution() throws Exception {
        MockHttpServletRequest request = userRequest("7,9", false);
        request.addParameter("companyId", "7", "9");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, (req, res) -> { });

        assertEquals(403, response.getStatus());
    }

    @Test
    void allMinesClaimWorksOnlyWithTrustedGatewaySecret() throws Exception {
        MockHttpServletRequest trusted = userRequest("", true);
        trusted.addParameter("companyId", "999");
        MockHttpServletResponse trustedResponse = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean();
        filter.doFilterInternal(trusted, trustedResponse, (req, res) -> called.set(true));
        assertTrue(called.get());

        MockHttpServletRequest forged = userRequest("", true);
        forged.removeAttribute(ServiceIdentity.REQUEST_ATTRIBUTE);
        MockHttpServletResponse forgedResponse = new MockHttpServletResponse();
        called.set(false);
        filter.doFilterInternal(forged, forgedResponse, (req, res) -> called.set(true));
        assertFalse(called.get());
        assertEquals(401, forgedResponse.getStatus());
    }

    @Test
    void companyIdZeroIsTreatedAsAbsentAndClampedForScopedUser() throws Exception {
        // Sentinelle « vue consolidee » (companyId=0) pour un compte cloisonne :
        // NE DOIT PAS renvoyer 403 (ancien bug de planification), mais retomber
        // sur le clamp vers la 1re mine assignee.
        MockHttpServletRequest request = userRequest("7,9", false);
        request.addParameter("companyId", "0");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<ServletRequest> forwarded = new AtomicReference<>();

        filter.doFilterInternal(request, response, (req, res) -> forwarded.set(req));

        assertEquals(200, response.getStatus());
        assertEquals("7", forwarded.get().getParameter("companyId"));
    }

    @Test
    void companyIdZeroIsStrippedForAllMinesUser() throws Exception {
        // Pour un compte allMines en vue consolidee, companyId=0 est RETIRE : le
        // controleur doit le voir absent (et non « 0 », qui empoisonnerait l'aval).
        MockHttpServletRequest request = userRequest("", true);
        request.addParameter("companyId", "0");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<ServletRequest> forwarded = new AtomicReference<>();

        filter.doFilterInternal(request, response, (req, res) -> forwarded.set(req));

        assertEquals(200, response.getStatus());
        assertEquals(null, forwarded.get().getParameter("companyId"));
    }

    @Test
    void userWithoutAssignedMineIsDeniedByDefault() throws Exception {
        MockHttpServletRequest request = userRequest("", false);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, (req, res) -> { });

        assertEquals(403, response.getStatus());
    }

    private static MockHttpServletRequest userRequest(String companies, boolean allMines) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/hns/incidents/getAll");
        request.setAttribute(ServiceIdentity.REQUEST_ATTRIBUTE, new ServiceIdentity(
                "safex-gateway", "safex-hns", java.util.Set.of("hns:proxy"), "gateway-jti"));
        request.addHeader(GatewayRequestContext.HEADER_USER_ID, "41");
        request.addHeader(GatewayRequestContext.HEADER_ROLE, "HSE_MANAGER");
        request.addHeader(GatewayRequestContext.HEADER_PERMISSIONS, "INSPECTION_VIEW");
        request.addHeader(GatewayRequestContext.HEADER_COMPANIES, companies);
        request.addHeader(GatewayRequestContext.HEADER_ALL_MINES, String.valueOf(allMines));
        return request;
    }
}
