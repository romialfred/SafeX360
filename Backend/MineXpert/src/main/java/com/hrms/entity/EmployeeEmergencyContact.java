package com.hrms.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Contact d'urgence d'un employé (personne à prévenir) — SIRH.
 *
 * <p>Table {@code employee_emergency_contact}, N par employé. {@code priority}
 * ordonne les contacts (1 = à joindre en premier).</p>
 */
@Entity
@Table(name = "employee_emergency_contact",
       indexes = @Index(name = "idx_emergency_contact_emp", columnList = "employee_id"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeEmergencyContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "name", length = 150)
    private String name;

    @Column(name = "relationship", length = 80)
    private String relationship;

    @Column(name = "phone", length = 40)
    private String phone;

    @Column(name = "alt_phone", length = 40)
    private String altPhone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "priority")
    private Integer priority;

    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
