package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.minexpert.hns.dosimetry.dto.RegulatoryRuleResolutionDTO;
import com.minexpert.hns.dosimetry.enums.KpiCategory;
import com.minexpert.hns.dosimetry.enums.RegulatoryDoseType;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleKind;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

import lombok.RequiredArgsConstructor;

/**
 * Resout une limite reglementaire active en privilegiant la configuration de la mine,
 * puis la configuration globale. Aucun nombre n'est fabrique en cas d'absence.
 */
@Component
@RequiredArgsConstructor
public class RegulatoryLimitResolver {

    private static final double WORKER_B_CLASSIFICATION_MSV = 6.0d;

    private final RegulatoryRuleService regulatoryRuleService;

    public Optional<Double> resolveAnnualHp10(Long mineId, KpiCategory category) {
        return resolveAnnualHp10(mineId, category, LocalDate.now());
    }

    public Optional<Double> resolveAnnualHp10(Long mineId, KpiCategory category,
            LocalDate applicableOn) {
        if (category == null) return Optional.empty();
        return resolve(mineId, category.name(), ThresholdGrandeur.HP10, applicableOn);
    }

    public Optional<Double> resolve(Long mineId, String populationCategory,
            ThresholdGrandeur grandeur, LocalDate applicableOn) {
        if (mineId == null || populationCategory == null || grandeur == null
                || applicableOn == null) return Optional.empty();
        // Le modèle historique SafeX assimile actuellement companyId à la mine sélectionnée.
        // Aucun fallback global ou seuil legacy n'est utilisé : absence/conflit = vide.
        Optional<Double> resolved = regulatoryRuleService.resolveUnambiguousForMine(
                        mineId, mineId, null, populationCategory, grandeur,
                        RegulatoryDoseType.PERSONAL_EXTERNAL,
                        RegulatoryRuleKind.REGULATORY_LIMIT, 12, applicableOn)
                .map(RegulatoryRuleResolutionDTO::getValue);
        if ("WORKER_B".equalsIgnoreCase(populationCategory)
                && resolved.filter(value -> Math.abs(value - WORKER_B_CLASSIFICATION_MSV)
                        < 0.000001d).isPresent()) {
            return Optional.empty();
        }
        return resolved.filter(value -> value != null && value > 0d);
    }
}
