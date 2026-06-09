package com.minexpert.hns.entity.users;

import com.minexpert.hns.dto.users.PermissionManagementDTO;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.enums.UserRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "permission_management")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionManagement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long employeeId;

    /**
     * Lien direct vers l'Account MineXpert (HRMS). C'est l'identifiant utilise par
     * le wizard de creation utilisateur SafeX 360 (cote AdminUserController MX).
     * Permet de retrouver le profil de permissions depuis le JWT cookie.
     */
    @Column(name = "account_id")
    private Long accountId;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    // Module permissions: 3-char strings: [read, write, delete]
    @Column(name = "non_conformity", length = 3)
    private String nonConformity;
    @Column(name = "inspections", length = 3)
    private String inspections;
    @Column(name = "meetings", length = 3)
    private String meetings;
    @Column(name = "management_tour", length = 3)
    private String managementTour;
    @Column(name = "ppe_overview", length = 3)
    private String ppeOverview;
    @Column(name = "ppe_monitoring", length = 3)
    private String ppeMonitoring;
    @Column(name = "ppe_request", length = 3)
    private String ppeRequest;
    @Column(name = "incident_management", length = 3)
    private String incidentManagement;
    @Column(name = "investigations", length = 3)
    private String investigations;
    @Column(name = "action_plans_inc", length = 3)
    private String actionPlansInc;
    @Column(name = "pending_actions", length = 3)
    private String pendingActions;
    @Column(name = "action_plan", length = 3)
    private String actionPlan;
    @Column(name = "recommendations", length = 3)
    private String recommendations;
    @Column(name = "adhoc_actions", length = 3)
    private String adhocActions;
    @Column(name = "audit_plan", length = 3)
    private String auditPlan;
    @Column(name = "audits", length = 3)
    private String audits;
    @Column(name = "audit_recommendations", length = 3)
    private String auditRecommendations;
    @Column(name = "compliance_dashboard", length = 3)
    private String complianceDashboard;
    @Column(name = "requirements", length = 3)
    private String requirements;
    @Column(name = "position_assignments", length = 3)
    private String positionAssignments;
    @Column(name = "employee_assignments", length = 3)
    private String employeeAssignments;
    @Column(name = "risk_overview", length = 3)
    private String riskOverview;
    @Column(name = "risk_register", length = 3)
    private String riskRegister;
    @Column(name = "risk_assessment", length = 3)
    private String riskAssessment;
    @Column(name = "chemical_register", length = 3)
    private String chemicalRegister;
    @Column(name = "documents", length = 3)
    private String documents;
    @Column(name = "document_validation", length = 3)
    private String documentValidation;
    @Column(name = "lessons_learned", length = 3)
    private String lessonsLearned;
    @Column(name = "document_manager", length = 3)
    private String documentManager;
    @Column(name = "home", length = 3)
    private String home;
    @Column(name = "comm_dashboard", length = 3)
    private String commDashboard;
    @Column(name = "employee_comm", length = 3)
    private String employeeComm;
    @Column(name = "notifications", length = 3)
    private String notifications;
    @Column(name = "users_management", length = 3)
    private String usersManagement;
    @Column(name = "settings", length = 3)
    private String settings;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public PermissionManagementDTO toDTO() {
        return new PermissionManagementDTO(
                this.id,
                this.employeeId,
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
                this.updatedAt);
    }
}

