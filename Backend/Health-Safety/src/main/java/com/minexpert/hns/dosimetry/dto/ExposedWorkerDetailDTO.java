package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;
import java.util.List;

import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.DoseSpecialStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Fiche 360 d'un travailleur expose : identite, classification, profils d'exposition,
 * historique des doses (DESC), cumuls, dosimetres affectes, surveillance medicale,
 * qualifications, alertes et seuils applicables.
 *
 * <p>Ce DTO est consomme par la vue Detail du Registre. Le service backend ne retourne le
 * MedicalSurveillanceDTO complet (avec restrictedClinicalDetails) que si l'utilisateur appelant
 * porte le role MEDECIN ; pour les autres, le champ {@code restrictedClinicalDetails} est purge
 * a null avant serialisation.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExposedWorkerDetailDTO {

    private IdentityDTO identity;
    private ClassificationDTO classification;
    private List<ExposureProfileDTO> exposureProfile;
    private List<DoseRecordDTO> doseHistory;
    private DoseCumulativeDTO cumulative;
    private List<DosimeterAssignmentDTO> dosimeters;
    private MedicalSurveillanceDTO medical;
    private List<QualificationDTO> qualifications;
    private List<ExposureAlertDTO> alerts;
    private List<ThresholdDTO> thresholds;

    /**
     * Bloc identite. Les champs RH (matricule, fullName, dateNaissance, position, department)
     * sont enrichis a partir du module Employee si disponibles, sinon restent null.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IdentityDTO {
        private Long workerId;
        private Long employeeId;
        private String matricule;
        private String fullName;
        private LocalDate dateNaissance;
        private String position;
        private String department;
    }

    /**
     * Bloc classification radioprotection : categorie A/B, raison + date, RPO referent,
     * statut special (grossesse, apprenti).
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClassificationDTO {
        private DoseCategory category;
        private String reason;
        private LocalDate date;
        private Long rpoId;
        private String rpoName;
        private DoseSpecialStatus specialStatus;
        private LocalDate specialStatusStartDate;
        private LocalDate specialStatusEndDate;
    }
}
