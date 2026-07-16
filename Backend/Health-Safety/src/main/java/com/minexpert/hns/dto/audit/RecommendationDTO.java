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

    /** Cloisonnement par mine : hérité de l'audit de rattachement. */
    private Long companyId;

    public Recommendation toEntity() {
        // observation_id est nullable en base : une recommandation peut être créée
        // depuis l'écran d'exécution avant tout constat formalisé. Sans ce garde,
        // `new Observation(null)` produisait une association vers une entité
        // transiente (échec de flush Hibernate).
        return new Recommendation(this.id, this.title, new Audit(this.auditId),
                this.observationId != null ? new Observation(this.observationId) : null,
                this.description, this.priority, this.actionManagerId, this.correctiveAction, this.deadline,
                this.progress, this.status, this.createdAt, this.updatedAt, this.companyId);
    }
}
