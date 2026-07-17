package com.minexpert.hns.service.indicator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.indicator.IndicatorPlanDTO;
import com.minexpert.hns.dto.indicator.IndicatorPlanEntryDTO;
import com.minexpert.hns.entity.indicator.HsIndicator;
import com.minexpert.hns.entity.indicator.IndicatorPlan;
import com.minexpert.hns.entity.indicator.IndicatorPlanEntry;
import com.minexpert.hns.enums.IndicatorDirection;
import com.minexpert.hns.enums.IndicatorFrequency;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.indicator.HsIndicatorRepository;
import com.minexpert.hns.repository.indicator.IndicatorPlanEntryRepository;
import com.minexpert.hns.repository.indicator.IndicatorPlanRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service des plans de cibles/previsions. Points de rigueur :
 *  - les periodes (nombre + etiquettes) sont TOUJOURS derivees de la frequence
 *    de l'indicateur cote serveur ; on n'accepte jamais la structure du client
 *    telle quelle (elle pourrait etre incoherente ou falsifiee) ;
 *  - variancePct et status sont calcules serveur, en tenant compte de la
 *    direction (moins/plus = mieux) ;
 *  - upsert transactionnel : un seul plan par (mine, indicateur, annee).
 */
@Service
@Transactional
@RequiredArgsConstructor
public class IndicatorPlanServiceImpl implements IndicatorPlanService {

    private static final String[] MONTHS = {
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    };
    private static final String[] QUARTERS = {"Q1", "Q2", "Q3", "Q4"};

    private final IndicatorPlanRepository planRepository;
    private final IndicatorPlanEntryRepository entryRepository;
    private final HsIndicatorRepository indicatorRepository;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    private HsIndicator loadIndicator(Long companyId, Long indicatorId) throws HSException {
        if (indicatorId == null) {
            throw new HSException("INDICATOR_NOT_FOUND");
        }
        return indicatorRepository.findByIdWithCompanyContext(indicatorId, companyId)
                .orElseThrow(() -> new HSException("INDICATOR_NOT_FOUND"));
    }

    /** Etiquettes canoniques (neutres) des periodes selon la frequence. */
    private String[] periodLabels(IndicatorFrequency frequency) {
        if (frequency == IndicatorFrequency.QUARTERLY) {
            return QUARTERS;
        }
        if (frequency == IndicatorFrequency.ANNUAL) {
            return new String[]{"Year"};
        }
        return MONTHS;
    }

    /** Statut d'une periode selon la direction (null actual => PENDING). */
    private String computeStatus(Double target, Double actual, IndicatorDirection direction) {
        if (actual == null || target == null) {
            return "PENDING";
        }
        boolean onTarget = (direction == IndicatorDirection.HIGHER_IS_BETTER)
                ? actual >= target
                : actual <= target;
        return onTarget ? "ON_TARGET" : "OFF_TARGET";
    }

    private Double computeVariance(Double target, Double actual) {
        if (actual == null || target == null || target == 0d) {
            return null;
        }
        return (actual - target) / Math.abs(target) * 100d;
    }

    /** Pose variancePct + status sur chaque periode (lecture). */
    private void enrich(IndicatorPlanDTO dto, IndicatorDirection direction) {
        for (IndicatorPlanEntryDTO e : dto.getEntries()) {
            e.setVariancePct(computeVariance(e.getTarget(), e.getActual()));
            e.setStatus(computeStatus(e.getTarget(), e.getActual(), direction));
        }
    }

    private void applyIndicatorMeta(IndicatorPlanDTO dto, HsIndicator indicator) {
        dto.setIndicatorCode(indicator.getCode());
        dto.setIndicatorName(indicator.getName());
        dto.setUnit(indicator.getUnit());
        dto.setFrequency(indicator.getFrequency());
        dto.setDirection(indicator.getDirection());
        dto.setHasForecast(indicator.getHasForecast());
    }

    @Override
    public IndicatorPlanDTO getPlan(Long companyId, Long indicatorId, Integer year) throws HSException {
        ensureCompanyIdProvided(companyId);
        if (year == null) {
            throw new HSException("INDICATOR_PLAN_YEAR_REQUIRED");
        }
        HsIndicator indicator = loadIndicator(companyId, indicatorId);

        IndicatorPlanDTO dto = new IndicatorPlanDTO();
        dto.setIndicatorId(indicatorId);
        dto.setYear(year);
        dto.setCompanyId(companyId);
        applyIndicatorMeta(dto, indicator);

        IndicatorPlan plan = planRepository.findByContext(companyId, indicatorId, year).orElse(null);
        String[] labels = periodLabels(indicator.getFrequency());

        if (plan == null) {
            // Squelette non persiste : une periode vide par intervalle.
            List<IndicatorPlanEntryDTO> skeleton = new ArrayList<>();
            for (int i = 0; i < labels.length; i++) {
                IndicatorPlanEntryDTO e = new IndicatorPlanEntryDTO();
                e.setPeriodIndex(i + 1);
                e.setPeriodLabel(labels[i]);
                e.setCompanyId(companyId);
                skeleton.add(e);
            }
            dto.setEntries(skeleton);
        } else {
            dto.setId(plan.getId());
            // On repart des periodes canoniques et on greffe les valeurs stockees
            // (par periodIndex) : robuste si la frequence a change depuis.
            Map<Integer, IndicatorPlanEntry> stored = new HashMap<>();
            for (IndicatorPlanEntry e : entryRepository.findByPlanIdOrderByPeriodIndexAsc(plan.getId())) {
                stored.put(e.getPeriodIndex(), e);
            }
            List<IndicatorPlanEntryDTO> entries = new ArrayList<>();
            for (int i = 0; i < labels.length; i++) {
                int idx = i + 1;
                IndicatorPlanEntry src = stored.get(idx);
                IndicatorPlanEntryDTO e = src != null ? src.toDTO() : new IndicatorPlanEntryDTO();
                e.setPlanId(plan.getId());
                e.setPeriodIndex(idx);
                e.setPeriodLabel(labels[i]);
                e.setCompanyId(companyId);
                entries.add(e);
            }
            dto.setEntries(entries);
        }
        enrich(dto, indicator.getDirection());
        return dto;
    }

    @Override
    public IndicatorPlanDTO savePlan(Long companyId, IndicatorPlanDTO dto) throws HSException {
        ensureCompanyIdProvided(companyId);
        if (dto == null || dto.getYear() == null) {
            throw new HSException("INDICATOR_PLAN_YEAR_REQUIRED");
        }
        HsIndicator indicator = loadIndicator(companyId, dto.getIndicatorId());

        IndicatorPlan plan = planRepository.findByContext(companyId, dto.getIndicatorId(), dto.getYear())
                .orElseGet(IndicatorPlan::new);
        boolean isNew = plan.getId() == null;
        plan.setIndicatorId(indicator.getId());
        plan.setYear(dto.getYear());
        plan.setCompanyId(companyId);
        LocalDateTime now = LocalDateTime.now();
        if (isNew) {
            plan.setCreatedAt(now);
        }
        plan.setUpdatedAt(now);
        plan = planRepository.save(plan);

        // Remplacement complet des periodes, re-derivees de la frequence serveur.
        entryRepository.deleteByPlanId(plan.getId());
        String[] labels = periodLabels(indicator.getFrequency());
        Map<Integer, IndicatorPlanEntryDTO> byIndex = new HashMap<>();
        if (dto.getEntries() != null) {
            for (IndicatorPlanEntryDTO e : dto.getEntries()) {
                if (e.getPeriodIndex() != null) {
                    byIndex.put(e.getPeriodIndex(), e);
                }
            }
        }
        List<IndicatorPlanEntry> toSave = new ArrayList<>();
        for (int i = 0; i < labels.length; i++) {
            int idx = i + 1;
            IndicatorPlanEntryDTO src = byIndex.get(idx);
            IndicatorPlanEntry e = new IndicatorPlanEntry();
            e.setPlanId(plan.getId());
            e.setPeriodIndex(idx);
            e.setPeriodLabel(labels[i]);
            e.setTarget(src != null ? src.getTarget() : null);
            e.setForecast(src != null ? src.getForecast() : null);
            e.setActual(src != null ? src.getActual() : null);
            e.setCompanyId(companyId);
            toSave.add(e);
        }
        entryRepository.saveAll(toSave);

        // Renvoie la vue recalculee (source de verite).
        return getPlan(companyId, indicator.getId(), dto.getYear());
    }
}
