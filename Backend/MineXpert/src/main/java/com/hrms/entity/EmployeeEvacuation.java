package com.hrms.entity;

import java.time.LocalDateTime;

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
 * Paramètres d'évacuation d'un employé (SIRH).
 *
 * <p>Table {@code employee_evacuation}, une ligne par employé (unique). Porte la
 * priorité d'évacuation et le point de rassemblement affecté. Le point de
 * rassemblement référence un {@code assembly_point} du module HSE (Health-Safety)
 * par son id (référence inter-service, pas de FK).</p>
 */
@Entity
@Table(name = "employee_evacuation",
       uniqueConstraints = @UniqueConstraint(name = "uk_employee_evacuation_emp", columnNames = "employee_id"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeEvacuation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "company_id")
    private Long companyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level", length = 4)
    private EvacuationPriorityLevel priorityLevel;

    @Column(name = "assembly_point_id")
    private Long assemblyPointId;

    /** Besoins particuliers (ex. PMR, assistance médicale) — texte libre. */
    @Column(name = "special_needs", length = 255)
    private String specialNeeds;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
