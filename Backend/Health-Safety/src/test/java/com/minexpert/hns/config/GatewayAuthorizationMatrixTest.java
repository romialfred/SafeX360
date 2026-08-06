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
    void ppeWritesAreReservedToPpeAuthorityButReadsStayOpen() {
        // Ayants droit : admins + coordinateurs HSE écrivent l'EPI (approbation de
        // demande, distribution, validation d'inventaire, catalogue).
        for (String role : new String[] { "ADMINISTRATOR", "SYSTEM_ADMINISTRATOR",
                "HEALTH_SAFETY_COORDINATOR", "HSE_MANAGER" }) {
            assertTrue(matrix.isAllowed(role, Operation.WRITE, MineAccess.ASSIGNED, "/hns/ppe-request/approve/5"),
                    role + " doit pouvoir approuver une demande EPI");
            assertTrue(matrix.isAllowed(role, Operation.WRITE, MineAccess.ASSIGNED, "/hns/ppe-stocktake/validate/2"),
                    role + " doit pouvoir valider un inventaire EPI");
        }
        // Intrus : l'enquêteur incident, l'employé, l'auditeur et un rôle inconnu ne
        // peuvent PAS écrire l'EPI.
        for (String role : new String[] { "INCIDENT_INVESTIGATOR", "EMPLOYEE", "AUDITOR", "SUPER_USER" }) {
            assertFalse(matrix.isAllowed(role, Operation.WRITE, MineAccess.ASSIGNED, "/hns/ppe-request/approve/5"),
                    role + " ne doit PAS écrire l'EPI");
            assertFalse(matrix.isAllowed(role, Operation.WRITE, MineAccess.ASSIGNED, "/hns/ppe-stocktake/validate/2"),
                    role + " ne doit PAS valider un inventaire EPI");
        }
        // Lecture EPI (tableau de bord) : ouverte aux rôles dans le périmètre.
        assertTrue(matrix.isAllowed("EMPLOYEE", Operation.READ, MineAccess.ASSIGNED, "/hns/ppe-dashboard/summary"));
        assertTrue(matrix.isAllowed("INCIDENT_INVESTIGATOR", Operation.READ, MineAccess.ASSIGNED, "/hns/ppe/getAll"));
        // Hors périmètre de mine : refusé même pour un admin.
        assertFalse(matrix.isAllowed("ADMINISTRATOR", Operation.WRITE, MineAccess.OUT_OF_SCOPE, "/hns/ppe-request/approve/5"));
    }

    @Test
    void ppeRestrictionDoesNotRemoveIncidentInvestigatorWriteElsewhere() {
        // Garde de non-régression : la restriction EPI est CHIRURGICALE — l'enquêteur
        // incident conserve le WRITE sur tous les autres chemins.
        assertTrue(matrix.isAllowed("INCIDENT_INVESTIGATOR", Operation.WRITE, MineAccess.ASSIGNED,
                "/hns/incidents/update"));
        assertTrue(matrix.isAllowed("INCIDENT_INVESTIGATOR", Operation.WRITE, MineAccess.ASSIGNED,
                "/hns/non-conformity/update"));
    }

    @Test
    void ppeEndpointsClassifyAsWriteOrRead() {
        assertTrue(matrix.classify("POST", "/hns/ppe-request/create") == Operation.WRITE);
        assertTrue(matrix.classify("PUT", "/hns/ppe-request/deliver/3") == Operation.WRITE);
        assertTrue(matrix.classify("PUT", "/hns/ppe-request/return/3") == Operation.WRITE);
        assertTrue(matrix.classify("PUT", "/hns/ppe-stocktake/validate/1") == Operation.WRITE);
        assertTrue(matrix.classify("POST", "/hns/ppe/create") == Operation.WRITE);
        assertTrue(matrix.classify("GET", "/hns/ppe-dashboard/summary") == Operation.READ);
        assertTrue(matrix.classify("GET", "/hns/ppe/getAll") == Operation.READ);
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
