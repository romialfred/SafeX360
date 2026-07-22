package com.minexpert.hns.entity.incident;

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
 * Heures travaillées DÉTAILLÉES par mine, mois et périmètre de main-d'œuvre —
 * soit un DÉPARTEMENT (employés propres), soit un SOUS-TRAITANT (ISO 45001 §9.1.1).
 * Ces lignes sont le dénominateur RÉEL, compilé, des taux LTIFR / TRIFR / gravité :
 * la somme de toutes les lignes d'une année/mine donne les heures totales.
 *
 * Idempotence : une seule ligne par (mine, année, mois, département) et une seule
 * par (mine, année, mois, sous-traitant). Les deux contraintes cohabitent car
 * l'axe « inutilisé » est NULL (MySQL autorise plusieurs NULL sur une unique).
 */
@Entity
@Table(name = "worked_hours_entry",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_whe_dept", columnNames = { "company_id", "year", "month", "department_id" }),
                @UniqueConstraint(name = "uk_whe_sub", columnNames = { "company_id", "year", "month", "subcontractor_name" }),
        },
        indexes = { @Index(name = "idx_whe_company_year", columnList = "company_id, year") })
@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkedHoursEntry {
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

    /** DEPARTMENT | SUBCONTRACTOR — nature du périmètre de main-d'œuvre. */
    @Column(name = "labor_type", length = 16)
    private String laborType;

    /** Département concerné (HRMS) — renseigné pour laborType=DEPARTMENT, sinon null. */
    @Column(name = "department_id")
    private Long departmentId;

    /** Nom du sous-traitant — renseigné pour laborType=SUBCONTRACTOR, sinon null. */
    @Column(name = "subcontractor_name", length = 160)
    private String subcontractorName;

    @Column(name = "hours")
    private Double hours;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
