package com.minexpert.hns.inspections.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Decision d'approbation/rejet d'un membre de l'equipe sur une inspection
 * SUBMITTED. Le service exige un commentaire en cas de REJECT.
 */
@Data
@NoArgsConstructor
public class ApprovalDTO {

    private Long id;

    private Long approverId;

    @NotBlank(message = "La decision est obligatoire (APPROVE|REJECT)")
    @Size(max = 16)
    private String decision;

    @Size(max = 1000)
    private String comment;

    private LocalDateTime decidedAt;

    /** Nom complet de l'approbateur (lecture seule, denormalise par le service). */
    private String approverName;
}
