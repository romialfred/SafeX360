package com.minexpert.hns.entity.incident;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.CorrectiveActionDTO;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.activities.HsActivity;
import com.minexpert.hns.entity.nonConformity.NonConformity;
import com.minexpert.hns.enums.ActionPriority;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.enums.ActionType;
import com.minexpert.hns.enums.ControlHierarchy;
import com.minexpert.hns.enums.EffectivenessVerdict;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CorrectiveAction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String actionName;
    private Long assignedEmployeeId;
    private Long departmentId;
    private Long ownerId;
    private LocalDate deadline;
    @Enumerated(EnumType.STRING)
    private ActionStatus status;
    @Lob
    private String description;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id")
    private Incident incident;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "general_inspection_id")
    private GeneralInspection generalInspection;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hs_activity_id")
    private HsActivity hsActivity;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "non_conformity_id")
    private NonConformity nonConformity;
    private Integer progress;
    @Column(name = "company_id", nullable = false)
    private Long companyId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Lien federateur (souple) vers un evenement erreur (module Gestion des
    // Erreurs). Reference Long nullable volontairement non mappee en ManyToOne
    // pour ne pas modifier le comportement de chargement de cette entite.
    @Column(name = "error_event_id")
    private Long errorEventId;

    // Lien federateur (souple) vers un controle du « Plan de maitrise » d'un
    // risque (module Gestion des Risques). Reference Long nullable volontairement
    // non mappee en ManyToOne pour ne pas modifier le comportement de chargement
    // de cette entite (meme precedent que errorEventId).
    @Column(name = "risk_control_id")
    private Long riskControlId;

    // Lien (souple) vers LA cause traitée par cette action (ISO 45001 §10.2 a-b) —
    // modèle de causes unifié (table error_cause). Rend la traçabilité cause→action
    // requêtable ; un même patron Long nullable que errorEventId/riskControlId.
    @Column(name = "cause_id")
    private Long causeId;

    // ── Revue d'efficacité (ISO 45001 §10.2 e) : l'action ne s'arrête plus à
    // « Terminé » ; on prouve qu'elle a fonctionné (verdict + vérificateur + date
    // + risque résiduel ré-évalué). Colonnes additives (ddl-auto=update).
    @Enumerated(EnumType.STRING)
    @Column(name = "effectiveness_verdict", length = 24)
    private EffectivenessVerdict effectivenessVerdict;

    @Column(name = "effectiveness_reviewed_by")
    private Long effectivenessReviewedBy;

    @Column(name = "effectiveness_reviewed_at")
    private LocalDateTime effectivenessReviewedAt;

    @Lob
    @Column(name = "effectiveness_comment")
    private String effectivenessComment;

    /** Risque résiduel après mesures : probabilité 1..5. */
    @Column(name = "residual_probability")
    private Integer residualProbability;

    /** Risque résiduel après mesures : gravité 1..5. */
    @Column(name = "residual_severity")
    private Integer residualSeverity;

    // ── Classification de l'action (ISO 45001 §8.1.2 / §10.2) ──
    /** Hiérarchie des mesures de maîtrise : ELIMINATION → PPE (§8.1.2). */
    @Enumerated(EnumType.STRING)
    @Column(name = "control_hierarchy", length = 16)
    private ControlHierarchy controlHierarchy;

    /** Nature : IMMEDIATE / CORRECTIVE / PREVENTIVE. */
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", length = 16)
    private ActionType actionType;

    /** Priorité P1..P3. */
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 4)
    private ActionPriority priority;

    /** Approbateur nommé (qui a validé le lancement de l'action). */
    @Column(name = "approved_by")
    private Long approvedBy;

    public CorrectiveAction(Long id) {
        this.id = id;
    }

    public CorrectiveActionDTO toDTO() {
        return new CorrectiveActionDTO(
                this.id,
                this.actionName,
                this.assignedEmployeeId,
                this.departmentId,
                this.ownerId,
                this.deadline,
                this.status,
                this.description,
                this.companyId,
                this.progress,
                null,
                null,
                null,
                null,
                this.createdAt,
                this.updatedAt,
                this.riskControlId,
                this.causeId,
                this.controlHierarchy,
                this.actionType,
                this.priority,
                this.approvedBy);
    }

    // Add logic to ensure only one FK is set
}
