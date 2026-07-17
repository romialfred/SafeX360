package com.minexpert.hns.dto.indicator;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.indicator.HsIndicator;
import com.minexpert.hns.enums.IndicatorCategory;
import com.minexpert.hns.enums.IndicatorDirection;
import com.minexpert.hns.enums.IndicatorFrequency;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de definition d'indicateur. Miroir plat de {@link HsIndicator} ; l'ordre
 * des champs est IDENTIQUE a l'entite (constructeur positionnel), companyId en
 * dernier.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsIndicatorDTO {
    private Long id;
    private String code;
    private String name;
    private String definition;
    private IndicatorCategory category;
    private IndicatorFrequency frequency;
    private IndicatorDirection direction;
    private Boolean hasForecast;
    private String unit;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long companyId;

    public HsIndicator toEntity() {
        return new HsIndicator(id, code, name, definition, category, frequency, direction,
                hasForecast, unit, active, createdAt, updatedAt, companyId);
    }
}
