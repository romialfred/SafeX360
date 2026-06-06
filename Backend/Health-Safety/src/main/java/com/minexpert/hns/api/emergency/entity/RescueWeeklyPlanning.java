package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Planification hebdomadaire d'urgence (LOT 48 Phase 1.c.2).
 *
 * <p>Remplace le concept de "roulement par équipe" par une planification au niveau
 * <strong>mine</strong>. Chaque semaine, on désigne l'équipe en charge du shift jour
 * et l'équipe en charge du shift nuit. La planification peut changer chaque semaine
 * (rotation des équipes).</p>
 *
 * <p>Contrainte unique {@code (company_id, week_start_date)} : 1 planification par
 * semaine par mine. La semaine commence toujours un lundi (validé côté service).</p>
 */
@Entity
@Table(
    name = "rescue_weekly_planning",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_weekly_planning",
        columnNames = {"company_id", "week_start_date"}
    ),
    indexes = {
        @Index(name = "idx_planning_company", columnList = "company_id"),
        @Index(name = "idx_planning_week",    columnList = "week_start_date")
    }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RescueWeeklyPlanning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /** Lundi de la semaine planifiée. */
    @Column(name = "week_start_date", nullable = false)
    private LocalDate weekStartDate;

    /** Équipe en charge du shift jour (06:00 → 18:00 par défaut). FK logique vers rescue_team. */
    @Column(name = "day_team_id")
    private Long dayTeamId;

    /** Équipe en charge du shift nuit (18:00 → 06:00 par défaut). FK logique vers rescue_team. */
    @Column(name = "night_team_id")
    private Long nightTeamId;

    /** Horaires personnalisés possibles (NULL = 06:00 / 18:00 / 06:00). */
    @Column(name = "day_start_hour", length = 5)
    private String dayStartHour;

    @Column(name = "day_end_hour", length = 5)
    private String dayEndHour;

    @Column(name = "night_start_hour", length = 5)
    private String nightStartHour;

    @Column(name = "night_end_hour", length = 5)
    private String nightEndHour;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
