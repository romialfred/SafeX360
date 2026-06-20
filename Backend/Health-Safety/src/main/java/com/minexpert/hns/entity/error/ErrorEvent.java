package com.minexpert.hns.entity.error;

import java.time.LocalDateTime;

import com.minexpert.hns.enums.CriticalityLevel;
import com.minexpert.hns.enums.ErrorEventStatus;
import com.minexpert.hns.enums.ErrorSourceModule;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Evenement erreur — entite centrale du module Gestion des Erreurs.
 *
 * Regle d'anonymat (stricte) : si {@code isAnonymous == true}, le champ
 * {@code declaredBy} DOIT rester null. La couche service garantit cet invariant
 * et ne renseigne jamais l'identifiant du declarant dans ce cas.
 */
@Entity
@Table(name = "error_event")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Reference fonctionnelle generee (ex. ERR-2026-0001). */
    @Column(name = "reference", length = 32, unique = true)
    private String reference;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /** FK logique vers ErrorEventType (referentiel parametrable). */
    @Column(name = "event_type_id")
    private Long eventTypeId;

    private String title;
    @Lob
    private String description;

    private LocalDateTime occurredAt;
    private LocalDateTime declaredAt;

    /** Identifiant employe/compte du declarant. Toujours null si anonyme. */
    @Column(name = "declared_by")
    private Long declaredBy;

    @Column(name = "is_anonymous")
    private boolean isAnonymous;

    @Column(name = "zone_id")
    private Long zoneId;

    /** FK logique vers ErrorSeverity (gravite reelle constatee). */
    @Column(name = "actual_severity_id")
    private Long actualSeverityId;
    /** FK logique vers ErrorSeverity (gravite potentielle / scenario aggrave). */
    @Column(name = "potential_severity_id")
    private Long potentialSeverityId;
    /** FK logique vers ErrorProbability. */
    @Column(name = "probability_id")
    private Long probabilityId;

    /** Criticite calculee (severite x probabilite via la matrice). */
    @Enumerated(EnumType.STRING)
    @Column(name = "criticality_level", length = 16)
    private CriticalityLevel criticalityLevel;

    /** Potentiel SIF (Serious Injury or Fatality) — High Potential. */
    @Column(name = "is_hipo")
    private boolean isHipo;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private ErrorEventStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_module", length = 16)
    private ErrorSourceModule sourceModule;

    /** Lien federateur (souple) vers un incident existant. */
    @Column(name = "linked_incident_id")
    private Long linkedIncidentId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ErrorEvent(Long id) {
        this.id = id;
    }
}
