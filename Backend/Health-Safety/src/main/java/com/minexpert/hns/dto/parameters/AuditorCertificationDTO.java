package com.minexpert.hns.dto.parameters;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.entity.parameters.AuditorCertification;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — DTO d'une qualification d'auditeur interne (ISO 19011:2026 — compétences).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditorCertificationDTO {
    private Long id;
    private Long internalAuditorId;
    private String name;
    private String issuer;
    private LocalDate obtainedDate;
    private LocalDate expiryDate;
    private LocalDateTime createdAt;

    public AuditorCertification toEntity() {
        return new AuditorCertification(id, internalAuditorId, name, issuer,
                obtainedDate, expiryDate, createdAt);
    }
}
