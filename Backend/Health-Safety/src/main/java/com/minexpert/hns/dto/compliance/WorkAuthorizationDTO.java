package com.minexpert.hns.dto.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.entity.compliance.WorkAuthorization;
import com.minexpert.hns.enums.Status;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class WorkAuthorizationDTO {

    private Long id;
    private Long companyId;
    private String authorizationType;
    private String reference;
    private String title;
    private String zone;
    private Long requestedByEmployeeId;
    private Long approvedByEmployeeId;
    private LocalDate issueDate;
    private LocalDate validFrom;
    private LocalDate validTo;
    private String riskLevel;
    private String precautions;

    private Long mediaId;
    private String mediaName;
    private MediaDTO media;

    private String notes;
    private Status status;

    private String conformity;
    private Long daysToEnd;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WorkAuthorization toEntity() {
        WorkAuthorization e = new WorkAuthorization();
        e.setId(id);
        e.setCompanyId(companyId);
        e.setAuthorizationType(authorizationType);
        e.setReference(reference);
        e.setTitle(title);
        e.setZone(zone);
        e.setRequestedByEmployeeId(requestedByEmployeeId);
        e.setApprovedByEmployeeId(approvedByEmployeeId);
        e.setIssueDate(issueDate);
        e.setValidFrom(validFrom);
        e.setValidTo(validTo);
        e.setRiskLevel(riskLevel);
        e.setPrecautions(precautions);
        e.setNotes(notes);
        e.setStatus(status);
        e.setCreatedAt(createdAt);
        e.setUpdatedAt(updatedAt);
        if (mediaId != null) {
            Media m = new Media();
            m.setId(mediaId);
            e.setMedia(m);
        }
        return e;
    }
}
