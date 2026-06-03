package com.minexpert.hns.entity.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.parameters.TeamMemberDTO;
import com.minexpert.hns.enums.Role;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class TeamMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long employeeId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private IncidentTeam team;
    private String notificationLevel;
    private Role role;
    private Status status;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TeamMemberDTO toDTO() {
        return new TeamMemberDTO(id, employeeId, null, team != null ? team.getId() : null,
                StringListConverter.convertToLongList(notificationLevel), role, status, companyId, createdAt,
                updatedAt);
    }
}
