package com.hrms.entity.Timesheet;

import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.hrms.dto.Timesheet.TeamDTO;
import com.hrms.entity.Company;
import com.hrms.entity.Department;
import com.hrms.enums.Day;
import com.hrms.enums.Rotations;
import com.hrms.enums.TeamStatus;
import com.hrms.enums.TeamType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String shortName;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Enumerated(EnumType.STRING)
    private Day weekStartDay;
    private LocalDate nextWeekStartDate;

    private Integer workingHours;
    private Integer maxWorkingHours;
    private String color;
    @Enumerated(EnumType.STRING)
    private TeamType type;
    private String description;
    @Enumerated(EnumType.STRING)
    private Rotations rotation;
    private Integer remainingWorkingDays;
    private Integer remainingRestDays;
    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<TeamMember> teamMembers;
    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<TeamManager> teamManagers;

    @Enumerated(EnumType.STRING)
    private TeamStatus status;

    public TeamDTO toDTO() {
        return new TeamDTO(this.id, this.name, this.shortName, this.company != null ? this.company.toDTO() : null,
                this.department != null ? this.department.toDTO() : null,
                this.weekStartDay, this.nextWeekStartDate,
                this.workingHours, this.maxWorkingHours, this.color, this.type, this.description, this.rotation, null,
                null,
                this.teamMembers != null ? this.teamMembers.stream().map(TeamMember::toDTO).toList() : null,
                this.teamManagers != null ? this.teamManagers.stream().map(TeamManager::toDTO).toList() : null, status);
    }

    public Team(Long id) {
        this.id = id;
    }
}
