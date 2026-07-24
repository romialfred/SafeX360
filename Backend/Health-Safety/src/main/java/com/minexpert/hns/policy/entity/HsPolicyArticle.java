package com.minexpert.hns.policy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Un article (engagement) de la politique SST.
 *
 * <p>Chaque article porte son texte normatif ET une EXPLICATION pédagogique
 * facultative : l'objectif est qu'un travailleur de terrain comprenne concrètement
 * ce que l'engagement signifie pour lui, pas seulement qu'il le lise. C'est le
 * cœur de la « consultation et participation » (§5.4) : une politique comprise
 * plutôt qu'affichée.
 */
@Entity
@Table(name = "hs_policy_article", indexes = {
        @Index(name = "idx_hs_policy_article_policy", columnList = "policy_id")
})
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsPolicyArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_id", nullable = false)
    private Long policyId;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /** Rang d'affichage (0-based) : l'ordre des engagements est porteur de sens. */
    @Column(name = "order_index")
    private Integer orderIndex;

    /** Titre court de l'engagement (« Respect des exigences légales »…). */
    @Column(length = 255)
    private String title;

    /** Texte de l'engagement. */
    @Column(columnDefinition = "TEXT")
    private String body;

    /** Explication pédagogique — « ce que cela veut dire concrètement ». */
    @Column(columnDefinition = "TEXT")
    private String explanation;
}
