package com.minexpert.hns.dto.ppe;

import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeRequest;
import com.minexpert.hns.entity.ppe.PpeRequestStatus;
import com.minexpert.hns.utility.StringListConverter;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class PpeRequestDTO {
    private Long id;
    private List<Long> empIds;
    private List<Long> ppeIds;
    private LocalDate desiredDate;
    private String priority;
    private String reason;
    private String comment;
    private PpeRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deliveredAt;
    private Long companyId;

    /**
     * Incrément 2 — LIGNES de la demande : un élément par (bénéficiaire, EPI) avec
     * sa quantité propre. Remplace le couple emp_ids/ppe_ids (listes plates, même
     * EPI pour tous, 1 unité) : « employé A → 2 gants, employé B → 1 casque ».
     * Champ de transport (non persisté sur l'en-tête) ; les listes plates ci-dessus
     * restent synchronisées pour compatibilité ascendante des anciens lecteurs.
     */
    private List<PpeEmpDTO> lines;

    public PpeRequest toEntity() {
        return new PpeRequest(id, StringListConverter.listToString(empIds), StringListConverter.listToString(ppeIds),
                desiredDate, priority, reason, comment, status,
                createdAt,
                updatedAt, deliveredAt, companyId);
    }

}
