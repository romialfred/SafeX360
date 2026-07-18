package com.minexpert.hns.entity.indicator;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.indicator.HsIndicatorDTO;
import com.minexpert.hns.enums.IndicatorCategory;
import com.minexpert.hns.enums.IndicatorDirection;
import com.minexpert.hns.enums.IndicatorFrequency;

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
 * Definition d'un indicateur HSE (referentiel de performance, ISO 45001 9.1).
 * Cloisonne par mine (companyId). La table est creee par Hibernate
 * (ddl-auto=update) - aucune migration manuelle requise.
 *
 * Enums en @Enumerated(EnumType.STRING) (convention du repo depuis la migration
 * ORDINAL -> STRING). companyId est declare EN DERNIER : le constructeur
 * positionnel Lombok et toDTO()/toEntity() dependent de cet ordre.
 */
@Entity
@Table(
        name = "hs_indicator",
        indexes = {
                // On écrit le nom PHYSIQUE (company_id) par cohérence avec le reste
                // du fichier. NB : le camelCase fonctionne aussi — Hibernate applique
                // la stratégie de nommage au columnList (vérifié : l'annotation
                // "plannedDate" de GeneralInspection a bien produit un index sur
                // la colonne planned_date). Les deux formes sont donc valides.
                @Index(name = "idx_indicator_company", columnList = "company_id"),
                @Index(name = "idx_indicator_category", columnList = "category"),
                @Index(name = "idx_indicator_code", columnList = "code")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsIndicator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 64)
    private String code;

    @Column(length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String definition;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private IndicatorCategory category;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private IndicatorFrequency frequency;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private IndicatorDirection direction;

    private Boolean hasForecast;

    @Column(length = 64)
    private String unit;

    private Boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Mine proprietaire (cloisonnement). Renseigne a la creation. Nullable pour legacy. */
    private Long companyId;

    public HsIndicator(Long id) {
        this.id = id;
    }

    public HsIndicatorDTO toDTO() {
        return new HsIndicatorDTO(id, code, name, definition, category, frequency, direction,
                hasForecast, unit, active, createdAt, updatedAt, companyId);
    }
}
