package com.minexpert.hns.entity.nonConformity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.nonConformity.NonConformityDTO;
import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.enums.EventStatus;
import com.minexpert.hns.enums.EventType;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NonConformity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private EventType type;
    @Column(unique = true)
    private String number;
    private String title;
    private LocalDate date;
    private LocalDate detectionDate;
    private Long reportedBy;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_process_id", nullable = false)
    private WorkProcess workProcess;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private IncidentCategory category;
    @Lob
    private String description;
    private String evidence;

    private String requirement;
    private String detectionSource;

    @Lob
    private String actionTaken;
    private String severityLevel;
    private String nearMissType;
    private String factors;
    @Lob
    private String improvement;

    private String events;

    @Lob
    private String preventiveAction;

    private String currency;

    private Double materialCost;
    private Double laborCost;
    private Double adminFees;
    private Double expenses;
    @Lob
    private String details;

    private String docs;

    private String indirectImpacts;
    @Lob
    private String comments;
    @Lob
    private String supportComments;

    @Lob
    private String lessonLearned;
    @Lob
    private String sharingPlan;

    private LocalDate closingDate;
    private String finalStatus;
    private Long validatorId;
    private LocalDate validationDate;
    @Lob
    private String validationComment;

    private String effectiveness;
    private Integer rating;
    private String risk;
    private LocalDate nextCheck;
    @Lob
    private String feedback;

    private String archiveNumber;
    private String retentionPeriod;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archive_location_id", nullable = true)
    private Location archiveLocation;
    private Long archiveManagerId;
    @Enumerated(EnumType.STRING)
    private EventStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public NonConformity(Long id) {
        this.id = id;
    }

    public NonConformityDTO toDTO() {
        // Adjust the arguments below to match the actual NonConformityDTO constructor
        return new NonConformityDTO(
                id,
                type,
                number,
                title,
                date,
                detectionDate,
                reportedBy,
                workProcess != null ? workProcess.getId() : null,
                location != null ? location.getId() : null,
                category != null ? category.getId() : null,
                description,
                null,
                requirement,
                detectionSource,
                actionTaken,
                severityLevel,
                nearMissType,
                StringListConverter.convertToStringList(factors),
                improvement,
                StringListConverter.convertToStringList(events),
                preventiveAction, currency,
                materialCost,
                laborCost,
                adminFees,
                expenses,
                details,
                null,
                StringListConverter.convertToStringList(indirectImpacts),
                comments,
                supportComments,
                lessonLearned,
                sharingPlan,
                closingDate,
                finalStatus,
                validatorId,
                validationDate,
                validationComment,
                effectiveness,
                rating,
                risk,
                nextCheck,
                feedback,
                archiveNumber,
                retentionPeriod,
                archiveLocation != null ? archiveLocation.getId() : null,
                archiveManagerId,
                status,
                createdAt,
                updatedAt);
    }

    public void updateFromDTO(NonConformityDTO dto) {
        if (dto == null)
            return;
        this.title = dto.getTitle();
        this.date = dto.getDate();
        this.detectionDate = dto.getDetectionDate();
        this.reportedBy = dto.getReportedBy();
        // workProcess, location, category should be set by fetching entities by id if
        // needed
        // Here, just set to null or keep existing if not provided
        this.workProcess = new WorkProcess(dto.getWorkProcessId());
        this.location = new Location(dto.getLocationId());
        this.category = new IncidentCategory(dto.getCategoryId());

        this.description = dto.getDescription();
        this.requirement = dto.getRequirement();
        this.detectionSource = dto.getDetectionSource();
        this.actionTaken = dto.getActionTaken();
        this.severityLevel = dto.getSeverityLevel();
        this.nearMissType = dto.getNearMissType();
        this.factors = com.minexpert.hns.utility.StringListConverter.listToString(dto.getFactors());
        this.improvement = dto.getImprovement();
        this.events = com.minexpert.hns.utility.StringListConverter.listToString(dto.getEvents());
        this.preventiveAction = dto.getPreventiveAction();
        this.currency = dto.getCurrency();
        this.materialCost = dto.getMaterialCost();
        this.laborCost = dto.getLaborCost();
        this.adminFees = dto.getAdminFees();
        this.expenses = dto.getExpenses();
        this.details = dto.getDetails();
        this.indirectImpacts = com.minexpert.hns.utility.StringListConverter.listToString(dto.getIndirectImpacts());
        this.comments = dto.getComments();
        this.supportComments = dto.getSupportComments();
        this.lessonLearned = dto.getLessonLearned();
        this.sharingPlan = dto.getSharingPlan();
        this.closingDate = dto.getClosingDate();
        this.finalStatus = dto.getFinalStatus();
        this.validatorId = dto.getValidatorId();
        this.validationDate = dto.getValidationDate();
        this.validationComment = dto.getValidationComment();
        this.effectiveness = dto.getEffectiveness();
        this.rating = dto.getRating();
        this.risk = dto.getRisk();
        this.nextCheck = dto.getNextCheck();
        this.feedback = dto.getFeedback();
        this.archiveNumber = dto.getArchiveNumber();
        this.retentionPeriod = dto.getRetentionPeriod();
        // this.archiveLocation = ...
        this.archiveManagerId = dto.getArchiveManagerId();
        // createdAt and updatedAt should be handled by service, not here
    }
}
