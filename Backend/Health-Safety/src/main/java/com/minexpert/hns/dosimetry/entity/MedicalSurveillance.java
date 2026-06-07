package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.minexpert.hns.dosimetry.util.AESEncryptionConverter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Suivi medical d'un travailleur expose.
 *
 * <p><b>CONFIDENTIEL :</b> le champ restrictedClinicalDetails contient des informations
 * cliniques sensibles (diagnostic, restrictions medicales precises). Il est <b>chiffre au
 * repos</b> via un converter AES, et son acces en lecture/ecriture est strictement reserve au
 * role MEDECIN. Les autres roles (RPO, manager HSE, etc.) ne doivent JAMAIS exposer ce champ
 * dans une reponse API ou un export.
 *
 * <p>type : HIRE | PERIODIC | RETURN | DOSE_TRIGGERED
 * <p>fitness : FIT | FIT_WITH_RESTRICTIONS | UNFIT
 */
@Entity
@Table(name = "dosimetry_medical_surveillance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalSurveillance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private ExposedWorker worker;

    @Column(name = "type", nullable = false, length = 32)
    private String type;

    @Column(name = "fitness", nullable = false, length = 32)
    private String fitness;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Column(name = "next_due_date")
    private LocalDate nextDueDate;

    // DONNEE SENSIBLE CHIFFREE - acces restreint au role MEDECIN uniquement.
    // Chiffree AES-256-GCM au repos via AESEncryptionConverter (cf. safex.encryption.key).
    @Convert(converter = AESEncryptionConverter.class)
    @Column(name = "restricted_clinical_details", columnDefinition = "TEXT")
    private String restrictedClinicalDetails;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;
}
