package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.EvacPriorityLevel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Personne à évacuer en priorité (registre VIP de la salle de crise).
 *
 * <p>Table {@code emergency_priority_person}. Désigne, par mine, les personnes
 * dont l'évacuation doit être suivie de près (P1 = VIP prioritaire absolu).
 * Registre PERSISTANT (indépendant d'une alerte) : une personne reste VIP d'une
 * évacuation à l'autre. Unicité (company_id, employee_id) : une seule priorité
 * par personne et par mine.</p>
 */
@Entity
@Table(name = "emergency_priority_person",
       uniqueConstraints = @UniqueConstraint(name = "uk_priority_person_company_emp",
                                             columnNames = {"company_id", "employee_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvacuationPriorityPerson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false, length = 4)
    private EvacPriorityLevel level;

    /** Libellé de rôle / fonction (ex. « Directeur Général », « Visiteur officiel »). */
    @Column(name = "role_label", length = 150)
    private String roleLabel;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
