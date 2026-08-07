package com.minexpert.hns.entity.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.compliance.RegulatoryObligationDTO;
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
 * REGISTRE DES OBLIGATIONS REGLEMENTAIRES & CODE MINIER — cloisonne par mine.
 *
 * <p>Chaque mine suit sa conformite vis-a-vis des textes qui lui sont applicables :
 * code minier (Loi 036-2015/CNT au Burkina Faso), decrets, arretes, conventions
 * OIT, code de l'environnement/du travail, normes. La conformite est ICI une
 * EVALUATION portee par la mine (CONFORME / PARTIEL / NON_CONFORME / A_EVALUER),
 * distincte d'une simple echeance de date — completee par un cycle de revue.
 *
 * <p>Table {@code regulatory_obligation} creee par Hibernate {@code ddl-auto=update}.
 */
@Data
@NoArgsConstructor
@Entity
public class RegulatoryObligation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    /** Nature du texte : CODE_MINIER, LOI, DECRET, ARRETE, CONVENTION, CODE_TRAVAIL, … */
    @Column(length = 40)
    private String category;

    /** Reference du texte (ex. « Loi 036-2015/CNT »). */
    @Column(length = 120)
    private String reference;

    @Column(length = 220)
    private String title;

    /** Article / section visee. */
    @Column(length = 80)
    private String article;

    /** Domaine : SECURITE, ENVIRONNEMENT, TRAVAIL, EXPLOSIFS, FONCIER, FISCAL, SOCIAL. */
    @Column(length = 24)
    private String domain;

    /** Autorite de tutelle. */
    @Column(length = 140)
    private String authority;

    @Column(length = 1000)
    private String description;

    /** Evaluation de conformite de la mine : CONFORME / PARTIEL / NON_CONFORME / A_EVALUER. */
    @Column(length = 20)
    private String complianceStatus;

    /** Action requise si non conforme / partiel. */
    @Column(length = 600)
    private String actionRequired;

    private LocalDate applicableSince;
    private LocalDate lastReviewDate;
    private LocalDate nextReviewDate;

    private Long responsibleEmployeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id")
    private Media media;

    @Column(length = 600)
    private String notes;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Conformite = evaluation portee par la mine (defaut A_EVALUER). */
    public String conformity() {
        if (status == Status.INACTIVE) {
            return "SUSPENDU";
        }
        return (complianceStatus == null || complianceStatus.isBlank()) ? "A_EVALUER" : complianceStatus;
    }

    public RegulatoryObligationDTO toDTO() {
        RegulatoryObligationDTO dto = new RegulatoryObligationDTO();
        dto.setId(id);
        dto.setCompanyId(companyId);
        dto.setCategory(category);
        dto.setReference(reference);
        dto.setTitle(title);
        dto.setArticle(article);
        dto.setDomain(domain);
        dto.setAuthority(authority);
        dto.setDescription(description);
        dto.setComplianceStatus(complianceStatus);
        dto.setActionRequired(actionRequired);
        dto.setApplicableSince(applicableSince);
        dto.setLastReviewDate(lastReviewDate);
        dto.setNextReviewDate(nextReviewDate);
        dto.setResponsibleEmployeeId(responsibleEmployeeId);
        dto.setMediaId(media != null ? media.getId() : null);
        dto.setMediaName(media != null ? media.getName() : null);
        dto.setNotes(notes);
        dto.setStatus(status);
        dto.setConformity(conformity());
        dto.setReviewOverdue(nextReviewDate != null && nextReviewDate.isBefore(LocalDate.now())
                && status != Status.INACTIVE);
        dto.setDaysToReview(RegulatoryConformity.daysToDue(nextReviewDate, LocalDate.now()));
        dto.setCreatedAt(createdAt);
        dto.setUpdatedAt(updatedAt);
        return dto;
    }
}
