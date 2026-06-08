package com.minexpert.hns.blast.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.BlastType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tir de mine (entite principale du module Blast Management).
 *
 * <p>Le cycle de vie est porte par {@link BlastStatus}. Les modifications de
 * l'heure ou du perimetre apres confirmation requierent une raison tracee
 * (voir {@link BlastStatusEvent}) et un recalcul de la chaine de notifications.
 *
 * <p>FK virtuelle {@code blasterId / hseLeadId / mineId} -&gt; module RH /
 * referentiel mines (resolus applicativement).
 */
@Entity
@Table(name = "blast",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_blast_reference", columnNames = {"reference"})
        },
        indexes = {
                @Index(name = "idx_blast_mine_status_scheduled",
                        columnList = "mine_id, status, scheduled_at"),
                @Index(name = "idx_blast_scheduled_at", columnList = "scheduled_at"),
                @Index(name = "idx_blast_blaster", columnList = "blaster_id"),
                @Index(name = "idx_blast_hse_lead", columnList = "hse_lead_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Blast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Reference fonctionnelle bilingue type {@code BLT-2026-0142}. */
    @Column(name = "reference", nullable = false, length = 64)
    private String reference;

    /** Heure de tir prevue, exprimee dans le fuseau du site ({@link #timezone}). */
    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    /** Fuseau du site (ex. {@code Africa/Ouagadougou}). */
    @Column(name = "timezone", nullable = false, length = 64)
    private String timezone;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    private BlastType type;

    @Column(name = "pit", length = 64)
    private String pit;

    @Column(name = "bench", length = 64)
    private String bench;

    @Column(name = "block", length = 64)
    private String block;

    @Column(name = "lat")
    private Double lat;

    @Column(name = "lng")
    private Double lng;

    /**
     * Voies d'acces a fermer / signalisation a poser. Texte libre.
     * Ajoute en V015 (P2.1) pour corriger une perte de donnees silencieuse.
     */
    @Column(name = "access_concerned", columnDefinition = "TEXT")
    private String accessConcerned;

    /**
     * Liste des points de rassemblement couvrants. Texte libre (CSV de
     * libelles ou d'IDs assembly_point selon l'usage operationnel).
     */
    @Column(name = "assembly_points", columnDefinition = "TEXT")
    private String assemblyPoints;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private BlastStatus status;

    @Column(name = "exclusion_radius_m")
    private Double exclusionRadiusM;

    /** Composition de l'equipe de tir (boutefeux assistants, aides). */
    @Column(name = "team", length = 255)
    private String team;

    /** Limite reglementaire de vitesse particulaire de pic (mm/s). */
    @Column(name = "ppv_limit")
    private Double ppvLimit;

    /** Recepteurs sensibles (hopital, ligne HT, monuments...). */
    @Column(name = "sensitive_receivers", columnDefinition = "TEXT")
    private String sensitiveReceivers;

    /** Notes sur les pieces jointes (permis, JSA, schemas...). */
    @Column(name = "attachments_note", columnDefinition = "TEXT")
    private String attachmentsNote;

    /** Notes libres de fin de fiche (observations, restrictions, consignes). */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /** Boutefeu agree en charge (Employee.id du module RH). */
    @Column(name = "blaster_id")
    private Long blasterId;

    /** Responsable HSE du tir (Employee.id). */
    @Column(name = "hse_lead_id")
    private Long hseLeadId;

    /** Zone couverte par l'Alerte Generale a T-10 (ex. "FOSSE_NORD", "SITE_ENTIER"). */
    @Column(name = "alarm_zone_scope", length = 128)
    private String alarmZoneScope;

    @Column(name = "mine_id", nullable = false)
    private Long mineId;

    /**
     * Horodatage de resolution d'un MISFIRE (null tant qu'un rate n'a pas ete leve).
     * Tant que ce champ est null sur un tir en statut MISFIRE, la transition vers
     * ALL_CLEAR est interdite.
     */
    @Column(name = "misfire_resolved_at")
    private LocalDateTime misfireResolvedAt;

    @Version
    @Column(name = "version", nullable = false)
    private int version;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    // ── Relations ──────────────────────────────────────────────────────────

    @OneToOne(mappedBy = "blast", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, orphanRemoval = true)
    private BlastPlan plan;

    @OneToMany(mappedBy = "blast", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<BlastGuard> guards = new ArrayList<>();

    @OneToMany(mappedBy = "blast", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<BlastRecipient> recipients = new ArrayList<>();

    @OneToMany(mappedBy = "blast", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<BlastNotificationJob> notificationJobs = new ArrayList<>();
}
