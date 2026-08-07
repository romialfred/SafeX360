package com.minexpert.hns.config;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

/**
 * GARDE RBAC SERVEUR (audit pré-prod) — résout une clé de MODULE (catalogue
 * ModuleCatalog) à partir du chemin d'un endpoint HNS.
 *
 * <p>Sert au {@code ModuleAccessAuditFilter} qui vérifie que le module visé est
 * bien dans les droits du compte ({@code allowed_modules}). Le mapping est
 * <b>volontairement CONSERVATEUR</b> : on ne mappe QUE les chemins dont la
 * correspondance au module est certaine et 1:1. Un chemin ambigu (ex.
 * {@code /hs-activity} partagé par Réunions ET Tournées, ou {@code /corrective-action}
 * partagé par plusieurs catégories) renvoie {@code null} = « non gardé par cette
 * couche » — afin de ne JAMAIS produire de faux refus. La carte sera étoffée et
 * validée (tests 2 mines) avant tout passage en mode strict.
 *
 * <p>Les modules « gérés par mine » (dosimétrie, blast, urgences) ne figurent PAS
 * ici : ils disposent déjà de leurs propres {@code @PreAuthorize}.
 */
@Component
public class ModulePathResolver {

    /**
     * Préfixe de chemin (après strip du contexte {@code /hns}) → clé de module.
     * Ordre = plus spécifique d'abord (LinkedHashMap, premier match gagne).
     */
    private static final Map<String, String> PREFIX_TO_MODULE = buildMap();

    private static Map<String, String> buildMap() {
        Map<String, String> m = new LinkedHashMap<>();
        // Incidents & investigations
        m.put("/incident", "incidentManagement");
        m.put("/lagging", "incidentManagement");
        m.put("/investigation", "investigations");
        m.put("/non-conformity", "nonConformity");
        m.put("/pending-action", "pendingActions");
        // Risques
        m.put("/risk-register", "riskRegister");
        m.put("/risk-assessment", "riskAssessment");
        m.put("/risk-overview", "riskOverview");
        m.put("/chemical-risks", "chemicalRegister");
        // Inspections (tous les chemins d'inspection = module inspections)
        m.put("/general-inspections", "inspections");
        m.put("/inspection-process", "inspections");
        m.put("/inspection-report", "inspections");
        m.put("/inspection-history", "inspections");
        m.put("/inspection-template", "inspections");
        m.put("/inspection", "inspections");
        m.put("/equipment", "equipmentRegistry");
        // Audits
        m.put("/audit-program", "auditProgram");
        m.put("/audit-plan", "auditPlan");
        m.put("/audit-report", "audits");
        m.put("/audit-history", "audits");
        m.put("/audit-iso", "audits");
        m.put("/audit-area", "audits");
        m.put("/auditor", "audits");
        m.put("/audit", "audits");
        // Conformité réglementaire (personnel + registres mine)
        m.put("/compliance-requirement", "requirements");
        m.put("/position-assignment", "positionAssignments");
        m.put("/compliance-docs", "documents");
        m.put("/compliance/dashboard", "complianceDashboard");
        m.put("/exploitation-license", "regulatoryLicenses");
        m.put("/work-authorization", "workAuthorizations");
        m.put("/mandatory-inspection", "mandatoryInspections");
        // Communication
        m.put("/communication", "employeeComm");
        m.put("/comm-dashboard", "commDashboard");
        m.put("/notification", "notifications");
        // Gestion des erreurs
        m.put("/error", "errorManagement");
        // Performance / indicateurs
        m.put("/hs-indicator", "targetForecast");
        // NB : volontairement NON mappés (ambigus / partagés) :
        //   /hs-activity, /activity, /activity-report (Réunions ⟷ Tournées),
        //   /corrective-action, /recommendation, /action-plan (multi-catégories),
        //   /ppe* (sous-modules multiples), /document* (documentation multiple),
        //   /media, /me, /auth, /worked-hours, /users, /modules (admin gardé),
        //   /dosimetry, /blast, /emergency (gardés par @PreAuthorize dédiés).
        return m;
    }

    /** Clé de module pour un URI de requête, ou {@code null} si non gardé ici. */
    public String moduleKeyForPath(String requestUri) {
        if (requestUri == null) {
            return null;
        }
        String path = requestUri.toLowerCase(java.util.Locale.ROOT);
        // Retire un éventuel préfixe de contexte /hns.
        int hns = path.indexOf("/hns/");
        if (hns >= 0) {
            path = path.substring(hns + 4);
        }
        for (Map.Entry<String, String> e : PREFIX_TO_MODULE.entrySet()) {
            if (path.startsWith(e.getKey())) {
                return e.getValue();
            }
        }
        return null;
    }
}
