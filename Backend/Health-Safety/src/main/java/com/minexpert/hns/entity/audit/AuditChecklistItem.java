package com.minexpert.hns.entity.audit;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.audit.AuditChecklistItemDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — Ligne de checklist instanciée pour un audit donné.
 *
 * <p>Copie d'un {@link AuditChecklistTemplate} au moment de l'initialisation,
 * puis renseignée pendant l'exécution : résultat
 * (CONFORME / NON_CONFORME / NON_APPLICABLE / A_EVALUER), commentaire,
 * preuves et constat lié éventuel.
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditChecklistItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "audit_id", nullable = false)
    private Long auditId;

    /** FK logique vers le template d'origine (null si question ajoutée à la main). */
    @Column(name = "template_id")
    private Long templateId;

    private String referential;
    private String clause;

    @Lob
    private String question;

    /** CONFORME / NON_CONFORME / NON_APPLICABLE / A_EVALUER. */
    private String result;

    @Lob
    private String comment;

    @Lob
    private String evidence;

    /** FK logique vers l'{@link Observation} créée à partir de cette ligne. */
    @Column(name = "observation_id")
    private Long observationId;

    private LocalDateTime updatedAt;

    public AuditChecklistItem(Long id) {
        this.id = id;
    }

    public AuditChecklistItemDTO toDTO() {
        return new AuditChecklistItemDTO(id, auditId, templateId, referential, clause, question,
                result, comment, evidence, observationId, updatedAt);
    }
}
