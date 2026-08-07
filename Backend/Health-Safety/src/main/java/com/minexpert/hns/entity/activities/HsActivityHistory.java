package com.minexpert.hns.entity.activities;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.enums.ActivityStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsActivityHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long ownerId;
    private LocalDate date;
    @Enumerated(EnumType.STRING)
    private ActivityStatus status;
    private String comment;
    /** Note qualite saisie a la cloture (1-10). LOT audit pre-prod : etait perdue. */
    private Integer evaluation;
    /** Rapport de cloture (texte libre). LOT audit pre-prod : etait perdu. */
    @Column(length = 4000)
    private String closingReport;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hs_activity_id", nullable = false)
    private HsActivity hsActivity;
    private LocalDateTime createdAt;
}
