package com.minexpert.hns.entity.incident;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Heures travaillées par mine et par mois (ISO 45001 §9.1.1) — dénominateur des
 * taux de fréquence LTIFR / TRIFR / gravité. Saisi par l'administration HSE.
 * Unique par (company_id, year, month) : upsert idempotent.
 */
@Entity
@Table(name = "worked_hours", uniqueConstraints = {
        @UniqueConstraint(name = "uk_worked_hours_company_period", columnNames = { "company_id", "year", "month" }),
})
@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkedHours {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "year")
    private Integer year;

    /** Mois 1..12. */
    @Column(name = "month")
    private Integer month;

    @Column(name = "hours")
    private Double hours;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
