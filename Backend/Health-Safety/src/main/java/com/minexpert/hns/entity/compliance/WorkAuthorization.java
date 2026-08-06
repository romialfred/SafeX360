package com.minexpert.hns.entity.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.compliance.WorkAuthorizationDTO;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.service.compliance.RegulatoryConformity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * REGISTRE DES AUTORISATIONS DE TRAVAUX (permis de travail) — cloisonne par mine.
 *
 * <p>Autorisations a fenetre temporelle : excavation, travail en hauteur, forage,
 * dynamitage, travail a chaud, espace confine… Le statut (EN_COURS / PLANIFIE /
 * EXPIRE / CLOTURE) se derive de la fenetre de validite via
 * {@link RegulatoryConformity#authorizationStatus}.
 *
 * <p>Table {@code work_authorization} creee par Hibernate {@code ddl-auto=update}.
 */
@Data
@NoArgsConstructor
@Entity
public class WorkAuthorization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    /** Type : EXCAVATION, TRAVAIL_EN_HAUTEUR, FORAGE, DYNAMITAGE, TRAVAIL_A_CHAUD, … */
    @Column(length = 48)
    private String authorizationType;

    @Column(length = 64)
    private String reference;

    @Column(length = 200)
    private String title;

    /** Zone / lieu des travaux. */
    @Column(length = 160)
    private String zone;

    /** Demandeur (id employe HRMS). */
    private Long requestedByEmployeeId;

    /** Approbateur (id employe HRMS). */
    private Long approvedByEmployeeId;

    private LocalDate issueDate;
    private LocalDate validFrom;
    private LocalDate validTo;

    /** Niveau de risque : FAIBLE / MODERE / ELEVE / CRITIQUE. */
    @Column(length = 16)
    private String riskLevel;

    /** Mesures de prevention / conditions associees. */
    @Column(length = 800)
    private String precautions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id")
    private Media media;

    @Column(length = 600)
    private String notes;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String conformity() {
        return RegulatoryConformity.authorizationStatus(status, validFrom, validTo, LocalDate.now());
    }

    public WorkAuthorizationDTO toDTO() {
        WorkAuthorizationDTO dto = new WorkAuthorizationDTO();
        dto.setId(id);
        dto.setCompanyId(companyId);
        dto.setAuthorizationType(authorizationType);
        dto.setReference(reference);
        dto.setTitle(title);
        dto.setZone(zone);
        dto.setRequestedByEmployeeId(requestedByEmployeeId);
        dto.setApprovedByEmployeeId(approvedByEmployeeId);
        dto.setIssueDate(issueDate);
        dto.setValidFrom(validFrom);
        dto.setValidTo(validTo);
        dto.setRiskLevel(riskLevel);
        dto.setPrecautions(precautions);
        dto.setMediaId(media != null ? media.getId() : null);
        dto.setMediaName(media != null ? media.getName() : null);
        dto.setNotes(notes);
        dto.setStatus(status);
        dto.setConformity(conformity());
        dto.setDaysToEnd(RegulatoryConformity.daysToDue(validTo, LocalDate.now()));
        dto.setCreatedAt(createdAt);
        dto.setUpdatedAt(updatedAt);
        return dto;
    }
}
