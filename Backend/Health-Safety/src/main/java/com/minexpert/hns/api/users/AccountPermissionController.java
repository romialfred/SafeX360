package com.minexpert.hns.api.users;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.entity.users.PermissionManagement;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.enums.UserRole;
import com.minexpert.hns.repository.users.PermissionManagementRepository;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Controller HSE pour la gestion des permissions liees aux Accounts MineXpert.
 *
 * Endpoints exposes :
 *  - POST /users/permissions/init-for-account : cree un profil permissions pour un Account (appele par MX)
 *  - GET  /users/permissions/by-account/{id} : retourne le profil + modules autorises en CSV
 *  - POST /users/permissions/update-modules/{id} : met a jour la liste des modules autorises
 *
 * Strategie de stockage des modules (LOT 49) :
 *  - "111" = full access (read+write+delete) — module autorise
 *  - "000" ou null = pas d'acces
 *
 * Mapping role => modules par defaut (duplique de roles.tsx cote frontend pour coherence).
 */
@RestController
@RequestMapping("/users/permissions")
public class AccountPermissionController {

    private static final Logger LOG = LoggerFactory.getLogger(AccountPermissionController.class);

    @Autowired
    private PermissionManagementRepository permissionRepository;

    // ─────────────────────────────────────────────────────────────────────
    // POST /init-for-account — cree profil au moment de la creation de l'Account
    // ─────────────────────────────────────────────────────────────────────

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InitForAccountRequest {
        private Long accountId;
        private String role;
        /** CSV des moduleIds autorises (vide => derive du role). */
        private String allowedModules;
    }

    @PostMapping("/init-for-account")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> initForAccount(@RequestBody InitForAccountRequest req) {
        if (req.getAccountId() == null) {
            return badRequest("ACCOUNT_ID_REQUIRED", "accountId est requis");
        }
        if (permissionRepository.findByAccountId(req.getAccountId()).isPresent()) {
            return badRequest("PROFILE_ALREADY_EXISTS",
                    "Un profil permissions existe deja pour cet account");
        }

        // Determine la liste finale des modules autorises
        Set<String> finalModules = new HashSet<>();
        if (req.getAllowedModules() != null && !req.getAllowedModules().isBlank()) {
            Arrays.stream(req.getAllowedModules().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty())
                    .forEach(finalModules::add);
        } else {
            finalModules.addAll(defaultModulesForRole(req.getRole()));
        }

        // Cree l'entite
        PermissionManagement pm = new PermissionManagement();
        pm.setAccountId(req.getAccountId());
        pm.setStatus(Status.ACTIVE);
        pm.setRole(parseRole(req.getRole()));
        pm.setCreatedAt(LocalDateTime.now());
        pm.setUpdatedAt(LocalDateTime.now());

        // Applique le pattern "111" sur les modules autorises
        applyModuleFlags(pm, finalModules);

        PermissionManagement saved = permissionRepository.save(pm);
        LOG.info("PermissionProfile created for accountId={}, role={}, modules={}",
                req.getAccountId(), req.getRole(), finalModules.size());

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", saved.getId());
        resp.put("accountId", saved.getAccountId());
        resp.put("role", saved.getRole());
        resp.put("allowedModules", String.join(",", finalModules));
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /by-account/{id} — retourne le profil + modules en CSV
    // ─────────────────────────────────────────────────────────────────────

    @GetMapping("/by-account/{accountId}")
    public ResponseEntity<?> getByAccount(@PathVariable Long accountId) {
        return permissionRepository.findByAccountId(accountId)
                .map(pm -> {
                    Map<String, Object> resp = new HashMap<>();
                    resp.put("id", pm.getId());
                    resp.put("accountId", pm.getAccountId());
                    resp.put("role", pm.getRole());
                    resp.put("status", pm.getStatus());
                    resp.put("allowedModules", String.join(",", extractAllowedModules(pm)));
                    return ResponseEntity.ok((Object) resp);
                })
                .orElseGet(() -> {
                    // Pas de profil => retourne neutre (compte sans aucune perm HSE)
                    Map<String, Object> empty = new HashMap<>();
                    empty.put("accountId", accountId);
                    empty.put("allowedModules", "");
                    empty.put("role", null);
                    return ResponseEntity.ok((Object) empty);
                });
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE /by-account/{id} — supprime le profil de permissions (LOT 61)
    // Appelé par MineXpert lors de la suppression d'un compte. Idempotent.
    // ─────────────────────────────────────────────────────────────────────

    @DeleteMapping("/by-account/{accountId}")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> deleteByAccount(@PathVariable Long accountId) {
        permissionRepository.findByAccountId(accountId).ifPresent(permissionRepository::delete);
        Map<String, Object> resp = new HashMap<>();
        resp.put("accountId", accountId);
        resp.put("deleted", true);
        return ResponseEntity.ok(resp);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /update-modules/{id} — met a jour la liste modules autorises
    // ─────────────────────────────────────────────────────────────────────

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateModulesRequest {
        private String allowedModules; // CSV des moduleIds
        private String role; // optionnel, change le role
    }

    @PostMapping("/update-modules/{accountId}")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> updateModules(@PathVariable Long accountId,
                                           @RequestBody UpdateModulesRequest req) {
        PermissionManagement pm = permissionRepository.findByAccountId(accountId)
                .orElseGet(() -> {
                    // Cree a la volee si manquant (resilience)
                    PermissionManagement fresh = new PermissionManagement();
                    fresh.setAccountId(accountId);
                    fresh.setStatus(Status.ACTIVE);
                    fresh.setCreatedAt(LocalDateTime.now());
                    return fresh;
                });

        if (req.getRole() != null && !req.getRole().isBlank()) {
            pm.setRole(parseRole(req.getRole()));
        }

        // Reset les flags puis applique les nouveaux
        clearAllModuleFlags(pm);
        Set<String> finalModules = new HashSet<>();
        if (req.getAllowedModules() != null && !req.getAllowedModules().isBlank()) {
            Arrays.stream(req.getAllowedModules().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty())
                    .forEach(finalModules::add);
        }
        applyModuleFlags(pm, finalModules);
        pm.setUpdatedAt(LocalDateTime.now());

        permissionRepository.save(pm);

        Map<String, Object> resp = new HashMap<>();
        resp.put("accountId", accountId);
        resp.put("allowedModules", String.join(",", finalModules));
        resp.put("role", pm.getRole());
        return ResponseEntity.ok(resp);
    }

    // ─────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────

    private ResponseEntity<?> badRequest(String code, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", code);
        body.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    private UserRole parseRole(String role) {
        if (role == null) return UserRole.EMPLOYEE;
        try {
            return UserRole.valueOf(role.toUpperCase());
        } catch (Exception e) {
            return UserRole.EMPLOYEE;
        }
    }

    /**
     * Modules par defaut pour un role donne. Duplique le mapping cote frontend (roles.tsx).
     * En cas de divergence, c'est ce mapping serveur qui fait foi.
     */
    private List<String> defaultModulesForRole(String role) {
        if (role == null) return List.of("home");
        switch (role.toUpperCase()) {
            case "SYSTEM_ADMINISTRATOR":
                // Acces total a tous les modules HSE
                return Arrays.asList(
                        "home", "nonConformity", "inspections", "meetings", "managementTour",
                        "ppeOverview", "ppeMonitoring", "ppeRequest",
                        "incidentManagement", "investigations", "actionPlansInc",
                        "pendingActions", "actionPlan", "recommendations", "adhocActions",
                        "auditPlan", "audits", "auditRecommendations",
                        "complianceDashboard", "requirements", "positionAssignments", "employeeAssignments",
                        "riskOverview", "riskRegister", "riskAssessment", "chemicalRegister",
                        "documents", "documentValidation", "lessonsLearned", "documentManager",
                        "commDashboard", "employeeComm", "notifications",
                        "usersManagement", "settings"
                );
            case "HEALTH_SAFETY_COORDINATOR":
                return Arrays.asList(
                        "home", "nonConformity", "inspections", "meetings",
                        "ppeOverview", "ppeMonitoring", "ppeRequest",
                        "incidentManagement", "investigations", "actionPlansInc",
                        "pendingActions", "actionPlan", "recommendations",
                        "auditPlan", "audits",
                        "riskOverview", "riskRegister", "riskAssessment",
                        "documents", "commDashboard"
                );
            case "INCIDENT_INVESTIGATOR":
                return Arrays.asList(
                        "home", "incidentManagement", "investigations", "actionPlansInc",
                        "pendingActions", "recommendations",
                        "complianceDashboard", "documents"
                );
            case "AUDITOR":
                return Arrays.asList(
                        "home", "auditPlan", "audits", "auditRecommendations",
                        "complianceDashboard", "requirements",
                        "riskOverview", "riskRegister",
                        "documents", "documentValidation"
                );
            case "EMPLOYEE":
            default:
                return Arrays.asList(
                        "home", "incidentManagement", "nonConformity",
                        "ppeRequest", "documents"
                );
        }
    }

    /**
     * Applique le pattern "111" aux modules autorises.
     * Pour une approche ON/OFF, on stocke "111" si autorise, null sinon.
     */
    private void applyModuleFlags(PermissionManagement pm, Set<String> modules) {
        String ON = "111";
        if (modules.contains("home")) pm.setHome(ON);
        if (modules.contains("nonConformity")) pm.setNonConformity(ON);
        if (modules.contains("inspections")) pm.setInspections(ON);
        if (modules.contains("meetings")) pm.setMeetings(ON);
        if (modules.contains("managementTour")) pm.setManagementTour(ON);
        if (modules.contains("ppeOverview")) pm.setPpeOverview(ON);
        if (modules.contains("ppeMonitoring")) pm.setPpeMonitoring(ON);
        if (modules.contains("ppeRequest")) pm.setPpeRequest(ON);
        if (modules.contains("incidentManagement")) pm.setIncidentManagement(ON);
        if (modules.contains("investigations")) pm.setInvestigations(ON);
        if (modules.contains("actionPlansInc")) pm.setActionPlansInc(ON);
        if (modules.contains("pendingActions")) pm.setPendingActions(ON);
        if (modules.contains("actionPlan")) pm.setActionPlan(ON);
        if (modules.contains("recommendations")) pm.setRecommendations(ON);
        if (modules.contains("adhocActions")) pm.setAdhocActions(ON);
        if (modules.contains("auditPlan")) pm.setAuditPlan(ON);
        if (modules.contains("audits")) pm.setAudits(ON);
        if (modules.contains("auditRecommendations")) pm.setAuditRecommendations(ON);
        if (modules.contains("complianceDashboard")) pm.setComplianceDashboard(ON);
        if (modules.contains("requirements")) pm.setRequirements(ON);
        if (modules.contains("positionAssignments")) pm.setPositionAssignments(ON);
        if (modules.contains("employeeAssignments")) pm.setEmployeeAssignments(ON);
        if (modules.contains("riskOverview")) pm.setRiskOverview(ON);
        if (modules.contains("riskRegister")) pm.setRiskRegister(ON);
        if (modules.contains("riskAssessment")) pm.setRiskAssessment(ON);
        if (modules.contains("chemicalRegister")) pm.setChemicalRegister(ON);
        if (modules.contains("documents")) pm.setDocuments(ON);
        if (modules.contains("documentValidation")) pm.setDocumentValidation(ON);
        if (modules.contains("lessonsLearned")) pm.setLessonsLearned(ON);
        if (modules.contains("documentManager")) pm.setDocumentManager(ON);
        if (modules.contains("commDashboard")) pm.setCommDashboard(ON);
        if (modules.contains("employeeComm")) pm.setEmployeeComm(ON);
        if (modules.contains("notifications")) pm.setNotifications(ON);
        if (modules.contains("usersManagement")) pm.setUsersManagement(ON);
        if (modules.contains("settings")) pm.setSettings(ON);
    }

    private void clearAllModuleFlags(PermissionManagement pm) {
        pm.setHome(null);
        pm.setNonConformity(null);
        pm.setInspections(null);
        pm.setMeetings(null);
        pm.setManagementTour(null);
        pm.setPpeOverview(null);
        pm.setPpeMonitoring(null);
        pm.setPpeRequest(null);
        pm.setIncidentManagement(null);
        pm.setInvestigations(null);
        pm.setActionPlansInc(null);
        pm.setPendingActions(null);
        pm.setActionPlan(null);
        pm.setRecommendations(null);
        pm.setAdhocActions(null);
        pm.setAuditPlan(null);
        pm.setAudits(null);
        pm.setAuditRecommendations(null);
        pm.setComplianceDashboard(null);
        pm.setRequirements(null);
        pm.setPositionAssignments(null);
        pm.setEmployeeAssignments(null);
        pm.setRiskOverview(null);
        pm.setRiskRegister(null);
        pm.setRiskAssessment(null);
        pm.setChemicalRegister(null);
        pm.setDocuments(null);
        pm.setDocumentValidation(null);
        pm.setLessonsLearned(null);
        pm.setDocumentManager(null);
        pm.setCommDashboard(null);
        pm.setEmployeeComm(null);
        pm.setNotifications(null);
        pm.setUsersManagement(null);
        pm.setSettings(null);
    }

    /** Extrait la liste des modules autorises (non null et != "000"). */
    private List<String> extractAllowedModules(PermissionManagement pm) {
        java.util.List<String> result = new java.util.ArrayList<>();
        if (isAllowed(pm.getHome())) result.add("home");
        if (isAllowed(pm.getNonConformity())) result.add("nonConformity");
        if (isAllowed(pm.getInspections())) result.add("inspections");
        if (isAllowed(pm.getMeetings())) result.add("meetings");
        if (isAllowed(pm.getManagementTour())) result.add("managementTour");
        if (isAllowed(pm.getPpeOverview())) result.add("ppeOverview");
        if (isAllowed(pm.getPpeMonitoring())) result.add("ppeMonitoring");
        if (isAllowed(pm.getPpeRequest())) result.add("ppeRequest");
        if (isAllowed(pm.getIncidentManagement())) result.add("incidentManagement");
        if (isAllowed(pm.getInvestigations())) result.add("investigations");
        if (isAllowed(pm.getActionPlansInc())) result.add("actionPlansInc");
        if (isAllowed(pm.getPendingActions())) result.add("pendingActions");
        if (isAllowed(pm.getActionPlan())) result.add("actionPlan");
        if (isAllowed(pm.getRecommendations())) result.add("recommendations");
        if (isAllowed(pm.getAdhocActions())) result.add("adhocActions");
        if (isAllowed(pm.getAuditPlan())) result.add("auditPlan");
        if (isAllowed(pm.getAudits())) result.add("audits");
        if (isAllowed(pm.getAuditRecommendations())) result.add("auditRecommendations");
        if (isAllowed(pm.getComplianceDashboard())) result.add("complianceDashboard");
        if (isAllowed(pm.getRequirements())) result.add("requirements");
        if (isAllowed(pm.getPositionAssignments())) result.add("positionAssignments");
        if (isAllowed(pm.getEmployeeAssignments())) result.add("employeeAssignments");
        if (isAllowed(pm.getRiskOverview())) result.add("riskOverview");
        if (isAllowed(pm.getRiskRegister())) result.add("riskRegister");
        if (isAllowed(pm.getRiskAssessment())) result.add("riskAssessment");
        if (isAllowed(pm.getChemicalRegister())) result.add("chemicalRegister");
        if (isAllowed(pm.getDocuments())) result.add("documents");
        if (isAllowed(pm.getDocumentValidation())) result.add("documentValidation");
        if (isAllowed(pm.getLessonsLearned())) result.add("lessonsLearned");
        if (isAllowed(pm.getDocumentManager())) result.add("documentManager");
        if (isAllowed(pm.getCommDashboard())) result.add("commDashboard");
        if (isAllowed(pm.getEmployeeComm())) result.add("employeeComm");
        if (isAllowed(pm.getNotifications())) result.add("notifications");
        if (isAllowed(pm.getUsersManagement())) result.add("usersManagement");
        if (isAllowed(pm.getSettings())) result.add("settings");
        return result;
    }

    private boolean isAllowed(String flag) {
        return flag != null && !flag.equals("000") && !flag.isBlank();
    }
}
