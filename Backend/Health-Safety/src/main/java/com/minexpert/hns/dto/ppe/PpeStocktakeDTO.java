package com.minexpert.hns.dto.ppe;

import com.minexpert.hns.entity.ppe.PpeStocktakeStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Inventaire physique côté transport (en-tête + lignes). Le client envoie les lignes
 * comptées ; le serveur fige {@code systemQuantity} lui-même (il ne fait jamais
 * confiance au stock système transmis par le client).
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PpeStocktakeDTO {
    private Long id;
    private String reference;
    private PpeStocktakeStatus status;
    private String notes;
    private Long countedBy;
    private LocalDateTime createdAt;
    private LocalDateTime validatedAt;
    private Long companyId;

    /** Lignes comptées (bénéficiaire = EPI + quantité comptée). */
    private List<PpeStocktakeLineDTO> lines;
}
