package com.minexpert.hns.entity.audit;

import com.minexpert.hns.dto.audit.AuditChecklistTemplateDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — Question type de checklist d'audit par référentiel
 * (ISO_45001 / ISO_14001 / ISO_9001).
 *
 * <p>Les templates actifs sont copiés en {@link AuditChecklistItem} lors de
 * l'initialisation de la checklist d'un audit.
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditChecklistTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Référentiel : ISO_45001, ISO_14001 ou ISO_9001. */
    private String referential;

    /** Clause exacte du référentiel (ex. "6.1.2"). */
    private String clause;

    @Lob
    private String question;

    @Lob
    private String guidance;

    private Integer orderIndex;
    private Boolean active;

    public AuditChecklistTemplate(Long id) {
        this.id = id;
    }

    public AuditChecklistTemplateDTO toDTO() {
        return new AuditChecklistTemplateDTO(id, referential, clause, question, guidance,
                orderIndex, active);
    }
}
