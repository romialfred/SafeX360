package com.minexpert.hns.entity.incident;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.CorrectiveActionDTO;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.activities.HsActivity;
import com.minexpert.hns.entity.nonConformity.NonConformity;
import com.minexpert.hns.enums.ActionStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
                this.riskControlId);
    }

    // Add logic to ensure only one FK is set
}
