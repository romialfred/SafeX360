package com.minexpert.hns.policy.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Prise de connaissance d'une politique SST par un travailleur (ISO 45001 §5.4 —
 * consultation et participation des travailleurs).
 *
 * <p>Non répudiable : rattachée à l'identité authentifiée (accountId + empId
 * dérivés du jeton, jamais du corps de requête) et horodatée. Une prise de
 * connaissance par personne et par politique (contrainte d'unicité) — reconfirmer
 * ne crée pas de doublon.
 *
 * <p>Le taux de prise de connaissance est un indicateur direct pour la revue de
 * direction (§9.3) : « la politique est-elle réellement diffusée et comprise ? »
 */
@Entity
@Table(name = "hs_policy_acknowledgement",
        uniqueConstraints = @UniqueConstraint(name = "uk_hs_policy_ack_person",
                columnNames = {"policy_id", "account_id"}),
        indexes = {
                @Index(name = "idx_hs_policy_ack_policy", columnList = "policy_id"),
                @Index(name = "idx_hs_policy_ack_company", columnList = "company_id")
        })
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsPolicyAcknowledgement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_id", nullable = false)
    private Long policyId;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /** Compte authentifié qui a pris connaissance (identité non répudiable). */
    @Column(name = "account_id", nullable = false)
    private Long accountId;

    /** Employé lié le cas échéant (peut être nul : compte sans fiche employé). */
    @Column(name = "emp_id")
    private Long empId;

    /** Nom affiché au moment de la prise de connaissance (lisibilité de l'audit). */
    @Column(length = 255)
    private String name;

    @Column(name = "acknowledged_at", nullable = false)
    private LocalDateTime acknowledgedAt;
}
