package com.minexpert.hns.entity.incident;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.enums.LessonStatus;

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
public class LessonLearned {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDate date;
    private Long employeeId;
    private String category;
    @Enumerated(EnumType.STRING)
    private LessonStatus status;
    private String description;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Lien federateur (souple) vers un evenement erreur (module Gestion des
    // Erreurs). Reference Long nullable, volontairement non mappee en ManyToOne.
    @Column(name = "error_event_id")
    private Long errorEventId;
}
