package com.minexpert.hns.dto.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.entity.compliance.RegulatoryObligation;
import com.minexpert.hns.enums.Status;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class RegulatoryObligationDTO {

    private Long id;
    private Long companyId;
    private String category;
    private String reference;
    private String title;
    private String article;
    private String domain;
    private String authority;
    private String description;
    private String complianceStatus;
    private String actionRequired;
    private LocalDate applicableSince;
    private LocalDate lastReviewDate;
    private LocalDate nextReviewDate;
    private Long responsibleEmployeeId;

    private Long mediaId;
    private String mediaName;
    private MediaDTO media;

    private String notes;
    private Status status;

    private String conformity;
    private Boolean reviewOverdue;
    private Long daysToReview;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public RegulatoryObligation toEntity() {
        RegulatoryObligation e = new RegulatoryObligation();
        e.setId(id);
        e.setCompanyId(companyId);
        e.setCategory(category);
        e.setReference(reference);
        e.setTitle(title);
        e.setArticle(article);
        e.setDomain(domain);
        e.setAuthority(authority);
        e.setDescription(description);
        e.setComplianceStatus(complianceStatus);
        e.setActionRequired(actionRequired);
        e.setApplicableSince(applicableSince);
        e.setLastReviewDate(lastReviewDate);
        e.setNextReviewDate(nextReviewDate);
        e.setResponsibleEmployeeId(responsibleEmployeeId);
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
