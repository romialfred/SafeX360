package com.hrms.entity.Timesheet;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.hrms.dto.Status;
import com.hrms.dto.Timesheet.TeamManagerDTO;
import com.hrms.entity.Employee;
import com.hrms.enums.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeamManager {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    @JsonBackReference
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    private Status status;

    public TeamManager(Long id) {
        this.id = id;
    }

    public TeamManagerDTO toDTO() {
        return new TeamManagerDTO(this.id, null,
                this.employee != null ? this.employee.toDTO() : null, this.role, this.status);
    }
}
