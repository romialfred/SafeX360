package com.minexpert.hns.blast.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.blast.enums.BlastStatus;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Evenement de transition de statut sur un tir : APPEND-ONLY.
 *
 * <p>Chaque transition (DRAFT-&gt;PLANNED, PLANNED-&gt;CONFIRMED, etc.) inscrit
 * une ligne avec l'acteur, la raison eventuelle et l'horodatage. Toutes les
 * colonnes sont {@code updatable=false} cote JPA, et des triggers BDD
 * ({@code trg_blast_status_event_no_update} et
 * {@code trg_blast_status_event_no_delete}) rejettent tout UPDATE/DELETE direct.
 *
 * <p>Reference §9 du PROMPT : "Tracabilite complete : statuts, envois, alertes,
 * tous horodates et attribues."
 */
@Entity
@Table(name = "blast_status_event",
        indexes = {
                @Index(name = "idx_blast_status_event_blast_at",
                        columnList = "blast_id, at DESC")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlastStatusEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(updatable = false)
    private Long id;

    @Column(name = "blast_id", nullable = false, updatable = false)
    private Long blastId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 32, updatable = false)
    private BlastStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 32, updatable = false)
    private BlastStatus toStatus;

    @Column(name = "actor_id", updatable = false)
    private Long actorId;

    @Column(name = "reason", columnDefinition = "TEXT", updatable = false)
    private String reason;

    @Column(name = "at", nullable = false, updatable = false)
    private LocalDateTime at;
}
