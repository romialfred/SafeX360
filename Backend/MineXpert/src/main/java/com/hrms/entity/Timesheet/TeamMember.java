package com.hrms.entity.Timesheet;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.hrms.dto.Status;
import com.hrms.dto.Timesheet.TeamMemberDTO;
import com.hrms.entity.Employee;
import com.hrms.enums.Shifts;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
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
public class TeamMember {
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
    private Shifts shift;
    @Enumerated(EnumType.STRING)
    private Status status;

    public TeamMember(Long id) {
        this.id = id;
    }

    public TeamMemberDTO toDTO() {
        return new TeamMemberDTO(this.id, null,
                this.employee != null ? this.employee.toDTO() : null, this.shift, this.status);
    }
}
