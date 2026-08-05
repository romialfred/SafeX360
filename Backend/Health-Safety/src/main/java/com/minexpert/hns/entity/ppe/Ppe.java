package com.minexpert.hns.entity.ppe;

import lombok.*;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.ppe.PpeDTO;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "ppe")
public class Ppe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String category;
    @Lob
    private String description;
    private Integer minStock;
    private Integer stock;
    private String certificationStandard;
    @Enumerated(EnumType.STRING)
    private PpeStatus status;

    // ── Incrément 3 : caractéristiques TECHNIQUES ───────────────────────────────
    /** Marque. */
    private String brand;
    /** Fabricant. */
    private String manufacturer;
    /** Modèle / référence fabricant. */
    private String model;
    /** Taille ou gamme de tailles (ex. « S-XXL », « Réglable »). */
    private String size;
    /** Unité de gestion (ex. « paire », « unité », « boîte »). */
    private String unitOfMeasure;
    /** Partie du corps protégée (tête, yeux, mains…). */
    private String protectionBodyPart;
    /** Durée de vie théorique en mois (0/null = non applicable). */
    private Integer lifespanMonths;
    /** Réutilisable (true) ou usage unique / consommable (false/null). */
    private Boolean reusable;
    /** Port obligatoire (true) ou facultatif. */
    private Boolean mandatory;

    // ── Incrément 3 : informations COMMERCIALES ─────────────────────────────────
    /** Prix de référence indicatif (valorisation / budget). */
    private Double referencePrice;
    /** Devise du prix de référence (ex. « XOF », « EUR »). */
    private String currency;
    /** Fournisseur principal (référentiel structuré à l'incrément dédié ; texte pour l'instant). */
    private String preferredSupplier;
    /** Référence article chez le fournisseur. */
    private String supplierReference;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Cloisonnement par mine (companyId). Alimenté par le CompanyScopeFilter via le controller.
    private Long companyId;

    /**
     * Verrou optimiste. Deux approbations concurrentes qui décrémentent le même
     * EPI ne peuvent plus s'écraser silencieusement (lost update) : la seconde
     * échoue proprement (OptimisticLockException) au lieu de laisser passer un
     * stock incohérent. Sur les lignes existantes, la colonne démarre à null et
     * Hibernate l'initialise au premier écrit — aucune reprise de données requise.
     */
    @Version
    private Long version;

    public Ppe(Long id) {
        this.id = id;
    }

    public PpeDTO toDTO() {
        // Builder plutôt que constructeur positionnel : l'ajout d'un champ ne casse
        // plus l'arité (piège Lombok @AllArgsConstructor rencontré aux incréments 1-2).
        return PpeDTO.builder()
                .id(id).name(name).category(category).description(description)
                .minStock(minStock).stock(stock).certificationStandard(certificationStandard)
                .status(status)
                .brand(brand).manufacturer(manufacturer).model(model).size(size)
                .unitOfMeasure(unitOfMeasure).protectionBodyPart(protectionBodyPart)
                .lifespanMonths(lifespanMonths).reusable(reusable).mandatory(mandatory)
                .referencePrice(referencePrice).currency(currency)
                .preferredSupplier(preferredSupplier).supplierReference(supplierReference)
                .createdAt(createdAt).updatedAt(updatedAt).companyId(companyId)
                .build();
    }
}
