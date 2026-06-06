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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Membre d'une équipe de secours (LOT 48 Phase 1.c). */
@Entity
@Table(
    name = "rescue_team_member",
    uniqueConstraints = @UniqueConstraint(name = "uq_rtm", columnNames = {"team_id", "employee_id"}),
    indexes = @Index(name = "idx_rtm_employee", columnList = "employee_id")
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RescueTeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    /** « Chef d'équipe », « Médecin », « Secouriste »… */
    @Column(length = 60)
    private String role;

    @Column(name = "is_team_leader", nullable = false)
    private Boolean isTeamLeader = Boolean.FALSE;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
