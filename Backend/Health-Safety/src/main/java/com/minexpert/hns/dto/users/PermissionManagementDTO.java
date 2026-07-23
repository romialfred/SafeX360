package com.minexpert.hns.dto.users;

import com.minexpert.hns.entity.users.PermissionManagement;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PermissionManagementDTO {
    private Long id;
    private Long employeeId;
    private Status status;
    private UserRole role;

    private String nonConformity;
    private String inspections;
    private String meetings;
    private String managementTour;
    private String ppeOverview;
    private String ppeMonitoring;
    private String ppeRequest;
    private String incidentManagement;
    private String investigations;
    private String actionPlansInc;
    private String pendingActions;
    private String actionPlan;
    private String recommendations;
    private String adhocActions;
    private String auditPlan;
    private String audits;
    private String auditRecommendations;
    private String complianceDashboard;
    private String requirements;
    private String positionAssignments;
    private String employeeAssignments;
    private String riskOverview;
    private String riskRegister;
    private String riskAssessment;
    private String chemicalRegister;
    private String documents;
    private String documentValidation;
    private String lessonsLearned;
    private String documentManager;
    private String home;
    private String commDashboard;
    private String employeeComm;
    private String notifications;
    private String usersManagement;
    private String settings;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PermissionManagement toEntity() {
        return new PermissionManagement(
                this.id,
                this.employeeId,
                null, // accountId (ajoute LOT 49 — non porte par le DTO legacy)
                this.status,
                this.role,
                this.nonConformity,
                this.inspections,
                this.meetings,
                this.managementTour,
                this.ppeOverview,
                this.ppeMonitoring,
                this.ppeRequest,
                this.incidentManagement,
                this.investigations,
                this.actionPlansInc,
                this.pendingActions,
                this.actionPlan,
                this.recommendations,
                this.adhocActions,
                this.auditPlan,
                this.audits,
                this.auditRecommendations,
                this.complianceDashboard,
                this.requirements,
                this.positionAssignments,
                this.employeeAssignments,
                this.riskOverview,
                this.riskRegister,
                this.riskAssessment,
                this.chemicalRegister,
                this.documents,
                this.documentValidation,
                this.lessonsLearned,
                this.documentManager,
                this.home,
                this.commDashboard,
                this.employeeComm,
                this.notifications,
                this.usersManagement,
                this.settings,
                this.createdAt,
                this.updatedAt,
                // allowedModules : porte par l'API /users/permissions (CSV), pas par
                // ce DTO historique. On ne l'ecrase pas ici — null laisse la lecture
                // retomber sur les colonnes par module pour les profils legacy.
                null
        );
    }

    public static PermissionManagementDTO fromEntity(PermissionManagement pm) {
        return new PermissionManagementDTO(
                pm.getId(),
                pm.getEmployeeId(),
                pm.getStatus(),
                pm.getRole(),
                pm.getNonConformity(),
                pm.getInspections(),
                pm.getMeetings(),
                pm.getManagementTour(),
                pm.getPpeOverview(),
                pm.getPpeMonitoring(),
                pm.getPpeRequest(),
                pm.getIncidentManagement(),
                pm.getInvestigations(),
                pm.getActionPlansInc(),
                pm.getPendingActions(),
                pm.getActionPlan(),
                pm.getRecommendations(),
                pm.getAdhocActions(),
                pm.getAuditPlan(),
                pm.getAudits(),
                pm.getAuditRecommendations(),
                pm.getComplianceDashboard(),
                pm.getRequirements(),
                pm.getPositionAssignments(),
                pm.getEmployeeAssignments(),
                pm.getRiskOverview(),
                pm.getRiskRegister(),
                pm.getRiskAssessment(),
                pm.getChemicalRegister(),
                pm.getDocuments(),
                pm.getDocumentValidation(),
                pm.getLessonsLearned(),
                pm.getDocumentManager(),
                pm.getHome(),
                pm.getCommDashboard(),
                pm.getEmployeeComm(),
                pm.getNotifications(),
                pm.getUsersManagement(),
                pm.getSettings(),
                pm.getCreatedAt(),
                pm.getUpdatedAt());
    }
}

