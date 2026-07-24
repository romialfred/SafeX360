package com.minexpert.hns.policy.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.policy.enums.HsPolicyStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Politique Santé & Sécurité au Travail (ISO 45001 §5.2).
 *
 * <p>C'est l'engagement de la direction : conditions de travail sûres, respect des
 * exigences légales, élimination des dangers, amélioration continue, consultation
 * des travailleurs. La norme exige qu'elle soit documentée, datée, <b>signée par
 * la direction</b> et communiquée. Cette entité porte l'en-tête et la signature ;
 * les articles sont des {@link HsPolicyArticle}, les prises de connaissance des
 * travailleurs (§5.4) des {@link HsPolicyAcknowledgement}.
 *
 * <p>Versionnée par mine : publier une nouvelle version archive la précédente, de
 * sorte qu'une revue de direction (§9.3) peut remonter l'historique.
 */
@Entity
@Table(name = "hs_policy", indexes = {
        @Index(name = "idx_hs_policy_company", columnList = "company_id"),
        @Index(name = "idx_hs_policy_status", columnList = "status")
})
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(length = 255)
    private String title;

    /** Préambule / déclaration d'intention en tête de politique. */
    @Column(columnDefinition = "TEXT")
    private String preamble;

    /** Numéro de version, incrémenté à chaque publication (1, 2, 3…). */
    private Integer version;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private HsPolicyStatus status;

    /** Date de prise d'effet, choisie par la direction. */
    private LocalDate effectiveDate;

    // ── Signature de la direction (ISO 45001 §5.2 — engagement de la direction) ──

    /** Nom du signataire (dirigeant). */
    @Column(name = "signatory_name", length = 255)
    private String signatoryName;

    /** Fonction du signataire (« Directeur Général », « Directeur de site »…). */
    @Column(name = "signatory_title", length = 255)
    private String signatoryTitle;

    /** Instant de signature = instant de publication. */
    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    /**
     * Identité NON RÉPUDIABLE du signataire : empId de l'utilisateur authentifié
     * qui a publié, dérivé du jeton (jamais du corps de requête). Distinct du nom
     * affiché, qui est déclaratif.
     */
    @Column(name = "signed_by_emp_id")
    private Long signedByEmpId;

    /**
     * Signature graphique : image (data-URL base64) tracée ou rendue au moment de
     * la signature. Facultative — l'engagement tient déjà par l'identité + la date +
     * l'acte explicite de publication ; l'image n'est qu'un rendu visuel.
     */
    @Column(name = "signature_image", columnDefinition = "LONGTEXT")
    private String signatureImage;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
