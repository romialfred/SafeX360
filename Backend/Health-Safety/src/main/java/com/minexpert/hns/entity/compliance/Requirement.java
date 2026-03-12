package com.minexpert.hns.entity.compliance;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.compliance.RequirementDTO;
import com.minexpert.hns.enums.Status;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Requirement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String description;
    private String category;
    private String renewalFrequency;
    private String docType;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Requirement(Long id) {
        this.id = id;
    }

    public RequirementDTO toDTO() {
        return new RequirementDTO(id, title, description, category, renewalFrequency, docType, status, createdAt,
                updatedAt);
    }
}
