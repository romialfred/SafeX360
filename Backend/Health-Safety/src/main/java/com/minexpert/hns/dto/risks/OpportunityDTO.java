package com.minexpert.hns.dto.risks;

import com.minexpert.hns.entity.risks.Opportunity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OpportunityDTO {
    private Long id;
    private String title;
    private String description;
    private String category; // how it was identified / type
    private String expectedBenefit;
    private Long departmentId;
    private Long ownerId;
    private String status; // IDENTIFIED/IN_PROGRESS/REALIZED/DISMISSED
    private LocalDate targetDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Opportunity toEntity() {
        return new Opportunity(
                this.id,
                this.title,
                this.description,
                this.category,
                this.expectedBenefit,
                this.departmentId,
                this.ownerId,
                this.status,
                this.targetDate,
                this.createdAt,
                this.updatedAt);
    }
}
