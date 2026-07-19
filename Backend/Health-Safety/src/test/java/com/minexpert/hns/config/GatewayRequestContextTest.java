package com.minexpert.hns.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import com.minexpert.hns.config.GatewayRequestContext.Kind;
import com.minexpert.hns.security.ServiceIdentity;

class GatewayRequestContextTest {

    private final GatewayRequestContext context = new GatewayRequestContext();

    @Test
    void forgedIdentityHeadersAreIgnoredAndRejectedWithoutTrustedSecret() {
        MockHttpServletRequest request = userRequest("ADMIN", "11", "1,2", "true");
        request.removeAttribute(ServiceIdentity.REQUEST_ATTRIBUTE);

        var resolution = context.resolve(request);

        assertEquals(Kind.INVALID, resolution.kind());
        assertEquals("UNTRUSTED_SERVICE", resolution.failureCode());
    }

    @Test
    void trustedSecretWithoutAnyUserMarkerIsAnInternalCall() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(ServiceIdentity.REQUEST_ATTRIBUTE,
                new ServiceIdentity("safex-hrms", "safex-hns", java.util.Set.of("hns:permissions:read"), "jti"));

        assertEquals(Kind.INTERNAL, context.resolve(request).kind());
    }

    @Test
    void completeTrustedUserContextIsParsedAndNormalized() {
        MockHttpServletRequest request = userRequest("hse manager", "11", "7,9", "false");

        var resolution = context.resolve(request);

        assertEquals(Kind.USER, resolution.kind());
        assertEquals(11L, resolution.user().userId());
        assertEquals("HSE_MANAGER", resolution.user().role());
        assertEquals(java.util.Set.of(7L, 9L), resolution.user().companyIds());
        assertTrue(resolution.user().permissions().contains("INSPECTION_VIEW"));
    }

    @Test
    void partialOrMalformedUserContextIsRejected() {
        MockHttpServletRequest partial = new MockHttpServletRequest();
        partial.setAttribute(ServiceIdentity.REQUEST_ATTRIBUTE, gatewayIdentity());
        partial.addHeader(GatewayRequestContext.HEADER_ROLE, "ADMIN");
        assertEquals("INCOMPLETE_USER_CONTEXT", context.resolve(partial).failureCode());

        MockHttpServletRequest malformed = userRequest("ADMIN", "11", "7,evil", "false");
        assertEquals("MALFORMED_USER_CONTEXT", context.resolve(malformed).failureCode());
    }

    private static MockHttpServletRequest userRequest(String role, String userId,
            String companies, String allMines) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(ServiceIdentity.REQUEST_ATTRIBUTE, gatewayIdentity());
        request.addHeader(GatewayRequestContext.HEADER_USER_ID, userId);
        request.addHeader(GatewayRequestContext.HEADER_ROLE, role);
        request.addHeader(GatewayRequestContext.HEADER_PERMISSIONS, "INSPECTION_VIEW");
        request.addHeader(GatewayRequestContext.HEADER_COMPANIES, companies);
        request.addHeader(GatewayRequestContext.HEADER_ALL_MINES, allMines);
        return request;
    }

    private static ServiceIdentity gatewayIdentity() {
        return new ServiceIdentity("safex-gateway", "safex-hns", java.util.Set.of("hns:proxy"), "jti");
    }
}
