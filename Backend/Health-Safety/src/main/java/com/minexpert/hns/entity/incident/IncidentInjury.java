package com.minexpert.hns.entity.incident;

import java.time.LocalDateTime;

import com.minexpert.hns.enums.InjuryOutcome;

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
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lésion d'UNE personne lors d'un incident (ISO 45001 §9.1.1 — taxonomie ILO/OSHA).
 * Un incident peut blesser plusieurs personnes ; chacune porte son issue normalisée
 * ({@link InjuryOutcome}), la nature de la lésion, la partie du corps et les jours
 * perdus — alimentant LTIFR / TRIFR / taux de gravité.
 *
 * Liens souples (Long) + companyId pour cloisonnement, cohérent avec le reste du HNS.
 */
@Entity
@Table(name = "incident_injury", indexes = {
        @Index(name = "idx_incident_injury_incident", columnList = "incident_id"),
})
@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentInjury {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "incident_id")
    private Long incidentId;

    /** Employé concerné (HRMS) — nullable (tiers/sous-traitant). */
    @Column(name = "employee_id")
    private Long employeeId;

    /** Nom libre du concerné (tiers, ou secours si l'employé n'est pas résolu). */
    @Column(name = "person_name")
    private String personName;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", length = 16)
    private InjuryOutcome outcome;

    @Column(name = "nature_of_injury")
    private String natureOfInjury;

    @Column(name = "body_part")
    private String bodyPart;

    /** Jours perdus (LTI) — alimente le taux de gravité. */
    @Column(name = "lost_days")
    private Integer lostDays;

    @Column(name = "company_id")
    private Long companyId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
