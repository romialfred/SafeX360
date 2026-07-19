package com.minexpert.hns.entity.parameters;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.parameters.AuditorCertificationDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — Qualification d'un auditeur interne (ISO 19011:2026 — compétences).
 *
 * <p>Permet de tracer les qualifications formelles (ex. IRCA Lead Auditor,
 * formation ISO 45001) avec leur date d'expiration, exploitée par la
 * validation d'équipe d'audit.
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditorCertification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK logique vers {@link InternalAuditor}. */
    @Column(name = "internal_auditor_id", nullable = false)
    private Long internalAuditorId;

    private String name;
    private String issuer;
    private LocalDate obtainedDate;
    private LocalDate expiryDate;
    private LocalDateTime createdAt;

    public AuditorCertification(Long id) {
        this.id = id;
    }

    public AuditorCertificationDTO toDTO() {
        return new AuditorCertificationDTO(id, internalAuditorId, name, issuer,
                obtainedDate, expiryDate, createdAt);
    }
}
