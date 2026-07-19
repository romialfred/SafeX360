package com.minexpert.hns.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.minexpert.hns.config.GatewayAuthorizationMatrix.MineAccess;
import com.minexpert.hns.config.GatewayAuthorizationMatrix.Operation;

class GatewayAuthorizationMatrixTest {

    private final GatewayAuthorizationMatrix matrix = new GatewayAuthorizationMatrix();

    @Test
    void administratorsAndHseCoordinatorsCanPerformAllKnownOperationsInScope() {
        for (Operation operation : new Operation[] { Operation.READ, Operation.DECLARE,
                Operation.SELF_SERVICE, Operation.WRITE, Operation.EXPORT }) {
            assertTrue(matrix.isAllowed("ADMINISTRATOR", operation, MineAccess.ASSIGNED, "/hns/risk"));
            assertTrue(matrix.isAllowed("HSE_MANAGER", operation, MineAccess.ALL, "/hns/risk"));
        }
        assertTrue(matrix.isAllowed("ADMINISTRATOR", Operation.ADMINISTRATION,
                MineAccess.ASSIGNED, "/hns/users/permissions/update"));
        assertFalse(matrix.isAllowed("HSE_MANAGER", Operation.ADMINISTRATION,
                MineAccess.ASSIGNED, "/hns/users/permissions/update"));
    }

    @Test
    void employeeCanReadDeclareAndUseSelfServiceButCannotWriteOrExport() {
        assertTrue(matrix.isAllowed("EMPLOYEE", Operation.READ, MineAccess.ASSIGNED, "/hns/incidents"));
        assertTrue(matrix.isAllowed("EMPLOYEE", Operation.DECLARE, MineAccess.ASSIGNED,
                "/hns/incidents/report"));
        assertTrue(matrix.isAllowed("EMPLOYEE", Operation.SELF_SERVICE, MineAccess.ASSIGNED,
                "/hns/mobile/push-token"));
        assertFalse(matrix.isAllowed("EMPLOYEE", Operation.WRITE, MineAccess.ASSIGNED,
                "/hns/incidents/update"));
        assertFalse(matrix.isAllowed("EMPLOYEE", Operation.EXPORT, MineAccess.ASSIGNED,
                "/hns/audit/report/pdf/12"));
    }

    @Test
    void auditorWriteIsRestrictedToAuditAndInspectionWorkflows() {
        assertTrue(matrix.isAllowed("AUDITOR", Operation.WRITE, MineAccess.ASSIGNED,
                "/hns/audit/checklist/12"));
        assertTrue(matrix.isAllowed("AUDITOR", Operation.EXPORT, MineAccess.ASSIGNED,
                "/hns/audit/report/pdf/12"));
        assertFalse(matrix.isAllowed("AUDITOR", Operation.WRITE, MineAccess.ASSIGNED,
                "/hns/equipment/update"));
    }

    @Test
    void unknownRoleUnknownOperationAndOutOfScopeMineAreDeniedByDefault() {
        assertFalse(matrix.isAllowed("SUPER_USER", Operation.READ, MineAccess.ASSIGNED, "/hns/risk"));
        assertFalse(matrix.isAllowed("ADMIN", Operation.UNKNOWN, MineAccess.ASSIGNED, "/hns/risk"));
        assertFalse(matrix.isAllowed("ADMIN", Operation.READ, MineAccess.OUT_OF_SCOPE, "/hns/risk"));
        assertFalse(matrix.isAllowed("ADMIN", Operation.READ, MineAccess.NONE, "/hns/risk"));
    }

    @Test
    void requestClassifierSeparatesDeclarationsExportsAndWrites() {
        assertTrue(matrix.classify("POST", "/hns/incidents/report") == Operation.DECLARE);
        assertTrue(matrix.classify("GET", "/hns/audit/report/pdf/3") == Operation.EXPORT);
        assertTrue(matrix.classify("PUT", "/hns/incidents/update") == Operation.WRITE);
        assertTrue(matrix.classify("PUT", "/hns/users/permissions/update") == Operation.ADMINISTRATION);
        assertTrue(matrix.classify("GET", "/hns/users/permissions/getAll") == Operation.ADMINISTRATION);
        assertTrue(matrix.classify("GET", "/hns/users/permissions/by-account/41") == Operation.SELF_SERVICE);
        assertTrue(matrix.classify("TRACE", "/hns/incidents") == Operation.UNKNOWN);
    }
}
