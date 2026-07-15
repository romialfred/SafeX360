package com.minexpert.hns.entity.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.audit.RecommendationDTO;
import com.minexpert.hns.enums.RecommendationStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
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
public class Recommendation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private Audit audit;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "observation_id")
    private Observation observation;
    @Lob
    private String description;
    private String priority;
    private Long actionManagerId;
    @Lob
    private String correctiveAction;
    private LocalDate deadline;
    private Integer progress;
    @Enumerated(EnumType.STRING)
    private RecommendationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Cloisonnement par mine : hérité de l'audit de rattachement. */
    private Long companyId;

    public Recommendation(Long id) {
        this.id = id;
    }

    public RecommendationDTO toDTO() {
        return new RecommendationDTO(this.id, this.title, this.audit != null ? this.audit.getId() : null,
                this.observation != null ? this.observation.getId() : null, this.description, this.priority,
                this.actionManagerId, this.correctiveAction, this.deadline,
                this.progress, this.status, this.createdAt, this.updatedAt, this.companyId);
    }

}
