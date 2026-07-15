package com.minexpert.hns.entity.inspections;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.enums.IncidentStatus;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.entity.GeneralInspection;

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
public class InspectionHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long ownerId;
    private LocalDate date;
    @Enumerated(EnumType.STRING)
    private InspectionStatus status;
    private String comment;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private GeneralInspection inspection;
    private LocalDateTime createdAt;
    /** Mine propriétaire (cloisonnement). Renseigné à la création depuis la requête / l'inspection parente. */
    private Long companyId;
}
