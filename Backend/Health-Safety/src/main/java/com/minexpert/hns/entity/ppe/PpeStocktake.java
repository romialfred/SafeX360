package com.minexpert.hns.entity.ppe;

import com.minexpert.hns.dto.ppe.PpeStocktakeDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Inventaire physique EPI — EN-TÊTE d'une session de comptage contradictoire.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI (refonte EPI, incrément 5)
 * ─────────────────────────────────────────────────────────────────────────────
 * Le stock système peut dériver du réel (casse, perte, erreur de saisie). L'inventaire
 * matérialise le comptage terrain : chaque ligne compare la quantité SYSTÈME (figée au
 * moment du comptage) à la quantité COMPTÉE. À la validation, l'écart est réconcilié par
 * un mouvement d'ajustement passé dans le MÊME journal que le reste (jamais de mutation
 * directe) — l'invariant {@code Ppe.stock == SUM(mouvements)} reste donc vrai.
 *
 * Cloisonné par mine (companyId) ; @Version pour le verrou optimiste à la validation.
 */
@Entity
@Table(name = "ppe_stocktake", indexes = {
        @Index(name = "idx_ppe_stocktake_company", columnList = "company_id")
})
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PpeStocktake {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Référence lisible (ex. « INV-2026-08 » ou libellé libre). */
    @Column(length = 100)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PpeStocktakeStatus status;

    /** Observations générales de la session (contexte, opérateur, zone…). */
    @Column(length = 500)
    private String notes;

    /** Utilisateur ayant réalisé le comptage, si connu. */
    @Column(name = "counted_by")
    private Long countedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** Horodatage de clôture (passage VALIDATED). */
    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    /** Cloisonnement par mine. */
    @Column(name = "company_id")
    private Long companyId;

    @Version
    private Long version;

    public PpeStocktakeDTO toDTO() {
        return PpeStocktakeDTO.builder()
                .id(id)
                .reference(reference)
                .status(status)
                .notes(notes)
                .countedBy(countedBy)
                .createdAt(createdAt)
                .validatedAt(validatedAt)
                .companyId(companyId)
                .build();
    }
}
