package com.minexpert.hns.entity.incident;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Déposition / témoignage recueilli au cours d'une enquête (ISO 45001 §10.2 —
 * bonnes pratiques ICAM/ICMM). Distinct de la simple LISTE des témoins de
 * l'incident (identifiants aplatis) : porte le CONTENU du témoignage, qui, quand
 * et par qui il a été recueilli.
 *
 * Lien souple (Long investigationId) + companyId pour cloisonnement.
 */
@Entity
@Table(name = "witness_statement", indexes = {
        @Index(name = "idx_witness_statement_investigation", columnList = "investigation_id"),
})
@Data
@AllArgsConstructor
@NoArgsConstructor
public class WitnessStatement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "investigation_id")
    private Long investigationId;

    /** Employé témoin (HRMS) — nullable (tiers/sous-traitant). */
    @Column(name = "witness_employee_id")
    private Long witnessEmployeeId;

    /** Nom libre du témoin (tiers, ou repli si l'employé n'est pas résolu). */
    @Column(name = "witness_name")
    private String witnessName;

    /** Rôle / lien avec l'événement (témoin direct, premier intervenant…). */
    @Column(name = "witness_role")
    private String witnessRole;

    @Lob
    @Column(name = "statement")
    private String statement;

    /** Quand le témoignage a été recueilli. */
    @Column(name = "taken_at")
    private LocalDateTime takenAt;

    /** Qui l'a recueilli (empId authentifié, non répudiable). */
    @Column(name = "taken_by")
    private Long takenBy;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
