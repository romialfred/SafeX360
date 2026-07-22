package com.minexpert.hns.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Statut réglementaire d'un incident (ISO 45001 §7.5.3 · E3.1) : notifiabilité à
 * l'autorité (inspection des mines), échéance statutaire et date de déclaration
 * effective. Alimente le bandeau d'échéance réglementaire côté UI.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegulatoryStatusDTO {
    private Long incidentId;
    private String number;
    private String title;
    private LocalDateTime occurredAt;
    private Boolean notifiable;
    private LocalDate regulatoryDeadline;
    private LocalDate notifiedToAuthorityAt;
}
