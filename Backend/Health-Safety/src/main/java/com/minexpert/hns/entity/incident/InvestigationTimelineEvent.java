package com.minexpert.hns.entity.incident;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Événement de la frise chronologique d'une enquête (ISO 45001 §10.2 · méthode
 * ECFC — Events &amp; Causal Factors Charting). Reconstruit la séquence des faits :
 * chaque ligne est soit un ÉVÉNEMENT (ce qui s'est passé), soit une CONDITION
 * (état ambiant), soit une BARRIÈRE (contrôle censé intervenir) — marquée
 * défaillante le cas échéant. Ordonnée par {@code occurredAt} puis {@code sequenceOrder}.
 *
 * Lien souple (Long investigationId) + companyId pour cloisonnement, cohérent HNS.
 */
@Entity
@Table(name = "investigation_timeline_event", indexes = {
        @Index(name = "idx_inv_timeline_investigation", columnList = "investigation_id"),
})
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvestigationTimelineEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "investigation_id")
    private Long investigationId;

    /** Horodatage du fait (nullable si seule la séquence relative est connue). */
    @Column(name = "occurred_at")
    private LocalDateTime occurredAt;

    /** Rang de tri secondaire quand plusieurs faits partagent le même instant. */
    @Column(name = "sequence_order")
    private Integer sequenceOrder;

    /** EVENT / CONDITION / BARRIER (souple, pas d'enum figé). */
    @Column(name = "event_type", length = 16)
    private String eventType;

    @Column(name = "description", length = 2000)
    private String description;

    /** Barrière/contrôle censé agir ici — marqué défaillant (pour type BARRIER). */
    @Column(name = "barrier_failed")
    private Boolean barrierFailed;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
