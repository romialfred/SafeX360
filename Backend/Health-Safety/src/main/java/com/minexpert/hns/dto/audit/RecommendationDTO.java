package com.minexpert.hns.dto.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.audit.Observation;
import com.minexpert.hns.entity.audit.Recommendation;
import com.minexpert.hns.enums.RecommendationStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecommendationDTO {
    private Long id;
    private String title;
    private Long auditId;
    private Long observationId;
    private String description;
    private String priority;
    private Long actionManagerId;
    private String correctiveAction;
    private LocalDate deadline;
    private Integer progress;
    private RecommendationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Recommendation toEntity() {
        return new Recommendation(this.id, this.title, new Audit(this.auditId), new Observation(this.observationId),
                this.description, this.priority, this.actionManagerId, this.correctiveAction, this.deadline,
                this.progress, this.status, this.createdAt, this.updatedAt);
    }
}
