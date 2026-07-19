package com.minexpert.hns.entity.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.audit.EffectivenessCheckDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — Vérification d'efficacité d'une recommandation d'audit
 * (ISO 19011:2026 — suivi des audits et amélioration du programme).
 *
 * <p>Planifiée à une échéance donnée, puis conclue par un verdict :
 * EFFICACE / PARTIELLEMENT_EFFICACE / INEFFICACE. Un verdict INEFFICACE
 * rouvre automatiquement la recommandation (IN_PROGRESS + followup auto).
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EffectivenessCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommendation_id", nullable = false)
    private Recommendation recommendation;

    private LocalDate dueDate;
    private Long evaluatorEmployeeId;

    /** null tant que non vérifié, puis EFFICACE / PARTIELLEMENT_EFFICACE / INEFFICACE. */
    private String verdict;

    @Lob
    private String comment;

    private LocalDateTime checkedAt;
    private LocalDateTime createdAt;

    /** Cloisonnement par mine : hérité de la recommandation / de l'audit de rattachement. */
    private Long companyId;

    public EffectivenessCheck(Long id) {
        this.id = id;
    }

    public EffectivenessCheckDTO toDTO() {
        return new EffectivenessCheckDTO(id,
                recommendation != null ? recommendation.getId() : null,
                null, dueDate, evaluatorEmployeeId, verdict, comment, checkedAt, createdAt, companyId);
    }
}
