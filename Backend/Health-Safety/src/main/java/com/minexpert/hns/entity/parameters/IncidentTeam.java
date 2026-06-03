package com.minexpert.hns.entity.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.parameters.IncidentTeamDTO;
import com.minexpert.hns.enums.Status;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentTeam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long departmentId;
    private String name;
    private Status status;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentTeamDTO toDTO() {
        return new IncidentTeamDTO(id, departmentId, null, name, status, companyId, createdAt, updatedAt);
    }

    public IncidentTeam(Long id) {
        this.id = id;
    }
}
