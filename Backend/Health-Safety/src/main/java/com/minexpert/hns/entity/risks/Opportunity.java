package com.minexpert.hns.entity.risks;

import com.minexpert.hns.dto.risks.OpportunityDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ISO 45001 — OH&S opportunities (§6.1.2.3).
 */
@Entity
@Table(name = "opportunity")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Opportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title")
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    // how it was identified / type
    @Column(name = "category")
    private String category;

    @Column(name = "expected_benefit", length = 1000)
    private String expectedBenefit;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "owner_id")
    private Long ownerId;

    // IDENTIFIED / IN_PROGRESS / REALIZED / DISMISSED
    @Column(name = "status")
    private String status;

    @Column(name = "target_date")
    private LocalDate targetDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Cloisonnement par mine (companyId) — en DERNIER pour @AllArgsConstructor
    @Column(name = "company_id")
    private Long companyId;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "IDENTIFIED";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public OpportunityDTO toDTO() {
        return new OpportunityDTO(
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
                this.updatedAt,
                this.companyId);
    }
}
