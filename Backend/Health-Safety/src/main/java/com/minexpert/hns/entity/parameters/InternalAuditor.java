package com.minexpert.hns.entity.parameters;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.enums.Status;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class InternalAuditor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long employeeId;
    private Long companyId;
    private String role;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ─── LOT 52 — Compétences auditeurs (ISO 19011:2018 §7) ────────────────

    /** Qualifications / formations (texte libre). */
    @Column(length = 1024)
    private String qualifications;

    /** Domaines d'audit maîtrisés (ex. "SST, Environnement"). */
    @Column(length = 512)
    private String domains;

    /** Langues de travail (ex. "Français, Anglais"). */
    @Column(length = 255)
    private String languages;

    /** Qualifié responsable d'audit (lead auditor). */
    private Boolean leadQualified;

    /** Département de rattachement — sert au contrôle d'indépendance. */
    private Long departmentId;

    /** Dernière évaluation de performance d'auditeur. */
    private LocalDate lastEvaluationDate;

    /** Score de la dernière évaluation (1 à 5). */
    private Integer lastEvaluationScore;
}
