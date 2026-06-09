package com.minexpert.hns.dto.compliance;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.compliance.Requirement;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequirementDTO {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String renewalFrequency;
    private String docType;
    private String referenceCode;
    private String legalSource;
    private String authority;
    private String criticality;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Requirement toEntity() {
        return new Requirement(id, title, description, category, renewalFrequency, docType,
                referenceCode, legalSource, authority, criticality, status, createdAt, updatedAt);
    }
}
