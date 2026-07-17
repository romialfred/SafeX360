package com.minexpert.hns.entity.indicator;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Plan annuel de cibles/previsions d'un indicateur, pour une mine et une annee.
 * Les valeurs par periode sont portees par {@link IndicatorPlanEntry}.
 * Unicite (companyId, indicatorId, year) : un seul plan par indicateur et par an.
 */
@Entity
@Table(
        name = "indicator_plan",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_plan_company_indicator_year",
                        columnNames = {"companyId", "indicatorId", "year"})
        },
        indexes = {
                @Index(name = "idx_plan_company", columnList = "companyId"),
                @Index(name = "idx_plan_indicator", columnList = "indicatorId")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class IndicatorPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long indicatorId;

    @Column(name = "year")
    private Integer year;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Mine proprietaire (cloisonnement). */
    private Long companyId;

    public IndicatorPlan(Long id) {
        this.id = id;
    }
}
