package com.minexpert.hns.inspections.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.minexpert.hns.enums.InspectionTemplateType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload de creation/edition d'un modele d'inspection avec ses points de
 * controle imbriques.
 *
 * <p>L'ordre des checkpoints dans la liste {@code checkpoints} est preserve
 * cote service via le champ {@code displayOrder}. L'appelant peut soit
 * specifier le {@code displayOrder} explicitement, soit laisser le service
 * le calculer automatiquement (index 1, 2, 3...).</p>
 */
@Data
@NoArgsConstructor
public class InspectionTemplateDTO {

    private Long id;

    @NotBlank(message = "Le code du template est obligatoire")
    @Size(max = 64, message = "Le code doit faire au plus 64 caracteres")
    private String code;

    @NotBlank(message = "Le nom du template est obligatoire")
    @Size(max = 160, message = "Le nom doit faire au plus 160 caracteres")
    private String name;

    @Size(max = 1000)
    private String description;

    @NotNull(message = "Le type du template est obligatoire")
    private InspectionTemplateType type;

    @Size(max = 64)
    private String scopeRef;

    private Integer estimatedDurationMin;

    private Long createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Boolean active = Boolean.TRUE;

    /**
     * Points de controle du template. La liste peut etre vide a la creation
     * et completee par la suite.
     */
    @Valid
    private List<InspectionCheckpointDTO> checkpoints = new ArrayList<>();
}
