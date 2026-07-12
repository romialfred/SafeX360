package com.minexpert.hns.entity.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.parameters.IncidentCategoryDTO;
import com.minexpert.hns.enums.Status;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
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
public class IncidentCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Enumerated(EnumType.STRING)
    private Status status;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentCategory(Long id) {
        this.id = id;
    }

    public IncidentCategoryDTO toDTO() {
        return new IncidentCategoryDTO(this.id, this.name, this.status, this.companyId, this.createdAt,
                this.updatedAt);
    }
}
