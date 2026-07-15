package com.minexpert.hns.entity.planning;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.enums.ActivityCategory;
import com.minexpert.hns.dto.planning.ActivityDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "activity")
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private LocalDate month;
    private LocalDateTime dateTime;
    private Long responsibleId;
    @Enumerated(EnumType.STRING)
    private ActivityCategory category;
    @Enumerated(EnumType.STRING)
    private ActivityStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Cloisonnement par mine (convention plateforme SafeX). NULLABLE et repli
     * "null = global" : les activites seedees globalement (companyId null)
     * restent visibles de toutes les mines (retrocompat dropdown TDM global).
     */
    private Long companyId;

    public Activity(Long id) {
        this.id = id;
    }

    public ActivityDTO toDTO() {
        return new ActivityDTO(
                this.id,
                this.title,
                this.month,
                this.dateTime,
                this.responsibleId,
                this.category,
                this.status,
                this.createdAt,
                this.updatedAt,
                this.companyId);
    }
}
