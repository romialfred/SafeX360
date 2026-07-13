package com.minexpert.hns.dto.nonConformity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.nonConformity.NonConformity;
import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.enums.EventStatus;
import com.minexpert.hns.enums.EventType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NonConformityDTO {
    private Long id;
    @NotNull(message = "type is required")
    private EventType type;
    private String number;
    @NotBlank(message = "title is required")
    @Size(max = 255, message = "title must not exceed 255 characters")
    private String title;
    private LocalDate date;
    private LocalDate detectionDate;
    private Long reportedBy;

    private Long workProcessId;
    private Long locationId;
    private Long categoryId;

    private String description;
    private List<MediaDTO> evidence;
    private String requirement;
    private String detectionSource;
    private String actionTaken;
    private String severityLevel;
    private String nearMissType;
    private List<String> factors;
    private String improvement;

    private List<String> events;

    private String preventiveAction;

    private String currency;
    private Double materialCost;
    private Double laborCost;
    private Double adminFees;
    private Double expenses;
    private String details;

    private List<MediaDTO> docs;

    private List<String> indirectImpacts;
    private String comments;
    private String supportComments;

    private String lessonLearned;
    private String sharingPlan;

    private LocalDate closingDate;
    private String finalStatus;
    private Long validatorId;
    private LocalDate validationDate;
    private String validationComment;

    private String effectiveness;
    private Integer rating;
    private String risk;
    private LocalDate nextCheck;
    private String feedback;

    private String archiveNumber;
    private String retentionPeriod;
    private Long archiveLocationId;
    private Long archiveManagerId;

    private EventStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public NonConformity toEntity() {
        return new NonConformity(id, type, number, title, date, detectionDate, reportedBy,
                new WorkProcess(workProcessId), new Location(locationId), new IncidentCategory(categoryId), description,
                null, requirement,
                detectionSource, actionTaken, severityLevel, nearMissType,
                com.minexpert.hns.utility.StringListConverter.listToString(factors), improvement,
                com.minexpert.hns.utility.StringListConverter.listToString(events), preventiveAction, currency,
                materialCost,
                laborCost, adminFees, expenses,
                details, null, com.minexpert.hns.utility.StringListConverter.listToString(indirectImpacts),
                comments, supportComments,
                lessonLearned, sharingPlan, closingDate, finalStatus,
                validatorId, validationDate, validationComment,
                effectiveness, rating, risk, nextCheck,
                feedback, archiveNumber, retentionPeriod,
                null, archiveManagerId,
                status, createdAt, updatedAt);
    }
}