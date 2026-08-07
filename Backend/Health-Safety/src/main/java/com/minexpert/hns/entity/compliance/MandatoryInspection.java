package com.minexpert.hns.entity.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.compliance.MandatoryInspectionDTO;
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
 * REGISTRE DES INSPECTIONS REGLEMENTAIRES D'EQUIPEMENTS — cloisonne par mine.
 *
 * <p>Suivi des controles periodiques obligatoires : cuves sous pression, appareils
 * de levage, reservoirs d'hydrocarbures, installations electriques… Chaque ligne
 * porte la periodicite, la derniere et la prochaine inspection, l'organisme agree
 * et le resultat. La conformite se derive de la prochaine echeance via
 * {@link RegulatoryConformity} (source unique).
 *
 * <p>Table {@code mandatory_inspection} creee par Hibernate {@code ddl-auto=update}.
 */
@Data
@NoArgsConstructor
@Entity
public class MandatoryInspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    /** Type d'equipement : CUVE_SOUS_PRESSION, APPAREIL_LEVAGE, RESERVOIR_HYDROCARBURE, … */
    @Column(length = 48)
    private String equipmentType;

    /** Repere / code de l'equipement (lien souple au registre des equipements). */
    @Column(length = 80)
    private String equipmentRef;

    @Column(length = 200)
    private String title;

    /** Type de controle : VGP, REQUALIFICATION, EPREUVE, CONTROLE_REGLEMENTAIRE, … */
    @Column(length = 48)
    private String inspectionType;

    /** Organisme agree ayant realise le controle (APAVE, Veritas, SOCOTEC…). */
    @Column(length = 120)
    private String inspectionBody;

    /** Periodicite reglementaire en mois. */
    private Integer frequencyMonths;

    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;

    /** Resultat : CONFORME / CONFORME_AVEC_RESERVES / NON_CONFORME. */
    @Column(length = 24)
    private String result;

    @Column(length = 64)
    private String certificateNumber;

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

    public String conformity() {
        return RegulatoryConformity.of(status, nextInspectionDate, LocalDate.now());
    }

    public MandatoryInspectionDTO toDTO() {
        MandatoryInspectionDTO dto = new MandatoryInspectionDTO();
        dto.setId(id);
        dto.setCompanyId(companyId);
        dto.setEquipmentType(equipmentType);
        dto.setEquipmentRef(equipmentRef);
        dto.setTitle(title);
        dto.setInspectionType(inspectionType);
        dto.setInspectionBody(inspectionBody);
        dto.setFrequencyMonths(frequencyMonths);
        dto.setLastInspectionDate(lastInspectionDate);
        dto.setNextInspectionDate(nextInspectionDate);
        dto.setResult(result);
        dto.setCertificateNumber(certificateNumber);
        dto.setResponsibleEmployeeId(responsibleEmployeeId);
        dto.setMediaId(media != null ? media.getId() : null);
        dto.setMediaName(media != null ? media.getName() : null);
        dto.setNotes(notes);
        dto.setStatus(status);
        dto.setConformity(conformity());
        dto.setDaysToNext(RegulatoryConformity.daysToDue(nextInspectionDate, LocalDate.now()));
        dto.setCreatedAt(createdAt);
        dto.setUpdatedAt(updatedAt);
        return dto;
    }
}
