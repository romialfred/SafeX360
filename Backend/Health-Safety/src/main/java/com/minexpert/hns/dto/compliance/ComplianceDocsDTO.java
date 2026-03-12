package com.minexpert.hns.dto.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.compliance.ComplianceDocs;
import com.minexpert.hns.entity.compliance.Requirement;
import com.minexpert.hns.enums.DocStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ComplianceDocsDTO {
    private Long id;
    private MediaDTO media;
    private Long requirementId;
    private Long employeeId;
    private LocalDate expiryDate;
    private String comment;
    private DocStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ComplianceDocs toEntity() {
        return new ComplianceDocs(id, media != null ? media.toEntity() : null,
                requirementId != null ? new Requirement(requirementId) : null,
                employeeId, expiryDate, comment, status, createdAt, updatedAt);
    }
}
