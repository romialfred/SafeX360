package com.minexpert.hns.entity.ppe;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Mouvement de stock EPI — ligne IMMUABLE d'un journal.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CETTE ENTITÉ (audit performance/intégrité du 2026-08-05)
 * ─────────────────────────────────────────────────────────────────────────────
 * Avant, le stock était un simple champ scalaire {@code Ppe.stock} muté en direct.
 * Les sorties le décrémentaient SANS trace : impossible de reconstituer l'historique,
 * et l'agrégat divergeait déjà des entrées en production. Désormais, toute variation
 * de stock crée un mouvement ; {@code Ppe.stock} devient une projection maintenue
 * atomiquement avec le mouvement. Le stock est ainsi reconstituable et auditable.
 *
 * INVARIANT : pour un EPI, {@code Ppe.stock == SUM(ppe_stock_movement.quantity)}.
 *
 * IMMUABLE : aucun service ne modifie ni ne supprime un mouvement. Une correction se
 * fait par un NOUVEAU mouvement (contre-écriture), jamais par édition de l'existant.
 */
@Entity
@Table(name = "ppe_stock_movement", indexes = {
        @Index(name = "idx_ppe_movement_ppe", columnList = "ppe_id"),
        @Index(name = "idx_ppe_movement_company", columnList = "company_id")
})
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PpeStockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** EPI concerné (référence par id, sans relation JPA : le mouvement est un fait figé). */
    @Column(name = "ppe_id", nullable = false)
    private Long ppeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 32)
    private PpeMovementType movementType;

    /** Delta SIGNÉ appliqué au stock : positif = entrée, négatif = sortie. */
    @Column(nullable = false)
    private Integer quantity;

    /** Solde de l'EPI APRÈS ce mouvement — reconstitution et contrôle sans recalcul. */
    @Column(name = "balance_after")
    private Integer balanceAfter;

    /** Coût unitaire éventuel (réceptions), pour la valorisation future. */
    @Column(name = "unit_cost")
    private Double unitCost;

    /** Référence du document d'origine (ex. « STOCK-12 », « REQ-5 »). */
    @Column(length = 100)
    private String reference;

    /** Motif libre éventuel. */
    @Column(length = 255)
    private String reason;

    /** Utilisateur à l'origine du mouvement, si connu. */
    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** Cloisonnement par mine. */
    @Column(name = "company_id")
    private Long companyId;
}
