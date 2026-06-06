package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

/**
 * Snapshot immuable d'un point de rassemblement (LOT 48 Phase 2).
 *
 * <p>Une ligne par modification : permet de tracer l'évolution complète d'un AP
 * (déplacement GPS, changement de responsable, changement de priorité, etc.).
 * Sert également de preuve ISO 45001 §9.1.2 (rétention 5 ans).</p>
 *
 * <p>Stocke le snapshot JSON complet de l'entité au moment de la modification
 * + une étiquette d'action lisible ({@code created}, {@code updated_location},
 * {@code archived}, etc.).</p>
 */
@Entity
@Immutable
@Table(
    name = "assembly_point_history",
    indexes = {
        @Index(name = "idx_ap_hist_point",   columnList = "assembly_point_id"),
        @Index(name = "idx_ap_hist_company", columnList = "company_id"),
        @Index(name = "idx_ap_hist_at",      columnList = "created_at")
    }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssemblyPointHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assembly_point_id", nullable = false)
    private Long assemblyPointId;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "action", nullable = false, length = 40)
    private String action;

    @Column(name = "actor_id")
    private Long actorId;

    /** Snapshot complet de l'AP au moment de cette action (JSON natif MySQL). */
    @Column(name = "snapshot_json", columnDefinition = "JSON")
    private String snapshotJson;

    @Column(name = "diff_summary", length = 500)
    private String diffSummary;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
