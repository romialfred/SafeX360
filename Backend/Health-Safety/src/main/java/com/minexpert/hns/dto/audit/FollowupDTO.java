package com.minexpert.hns.dto.audit;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.audit.Recommendation;
import com.minexpert.hns.entity.audit.RecommendationFollowup;
import com.minexpert.hns.enums.RecommendationStatus;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FollowupDTO {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private RecommendationStatus status;
    private String comment;
    private Integer progress;
    private Long recommendationId;
    private LocalDateTime createdAt;

    public RecommendationFollowup toEntity() {
        return new RecommendationFollowup(this.id, this.status, this.comment, this.progress,
                new Recommendation(recommendationId),
                this.createdAt);
    }
}
