package com.minexpert.hns.entity.compliance;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.compliance.RequirementDTO;
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

    // LOT 49 — traçabilité réglementaire (colonnes additives, ddl-auto=update)
    @Column(name = "reference_code", length = 32)
    private String referenceCode;
    @Column(name = "legal_source", length = 160)
    private String legalSource;
    @Column(length = 120)
    private String authority;
    @Column(length = 16)
    private String criticality;

    @Enumerated(EnumType.STRING)
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Requirement(Long id) {
        this.id = id;
    }

    public RequirementDTO toDTO() {
        return new RequirementDTO(id, title, description, category, renewalFrequency, docType,
                referenceCode, legalSource, authority, criticality, status, createdAt, updatedAt);
    }
}
