package com.minexpert.hns.seed;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.minexpert.hns.entity.error.ErrorCriticalityMatrix;
import com.minexpert.hns.entity.error.ErrorEventType;
import com.minexpert.hns.entity.error.ErrorProbability;
import com.minexpert.hns.entity.error.ErrorSeverity;
import com.minexpert.hns.enums.CriticalityLevel;
import com.minexpert.hns.repository.error.ErrorCriticalityMatrixRepository;
import com.minexpert.hns.repository.error.ErrorEventTypeRepository;
import com.minexpert.hns.repository.error.ErrorProbabilityRepository;
import com.minexpert.hns.repository.error.ErrorSeverityRepository;

import lombok.RequiredArgsConstructor;

/**
 * Seeder idempotent des referentiels du module Gestion des Erreurs.
 *
 * Ne seede chaque referentiel que si sa table est vide. Valeurs realistes du
 * secteur minier, libelles institutionnels en francais. Les referentiels sont
 * globaux (companyId null pour les types).
 */
@Component
@RequiredArgsConstructor
public class ErrorReferentialSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ErrorReferentialSeeder.class);

    private final ErrorEventTypeRepository eventTypeRepository;
    private final ErrorSeverityRepository severityRepository;
    private final ErrorProbabilityRepository probabilityRepository;
    private final ErrorCriticalityMatrixRepository matrixRepository;

    @Override
    public void run(ApplicationArguments args) {
        try {
            seedEventTypes();
            seedSeverities();
            seedProbabilities();
            seedCriticalityMatrix();
        } catch (Exception ex) {
            log.warn("[ErrorReferentialSeeder] Seed interrompu (non bloquant) : {}", ex.getMessage());
        }
    }

    // ─── Types d'evenement ─────────────────────────────────────────────────────

    private void seedEventTypes() {
        if (eventTypeRepository.count() > 0) {
            log.info("[ErrorReferentialSeeder] Types d'evenement deja presents — seed ignore.");
            return;
        }
        List<ErrorEventType> types = new ArrayList<>();
        types.add(type("unsafe_condition", "Situation dangereuse", "#F59F00"));
        types.add(type("unsafe_act", "Acte dangereux", "#E8590C"));
        types.add(type("near_miss", "Presqu'accident", "#FAB005"));
        types.add(type("incident", "Incident", "#FD7E14"));
        types.add(type("accident_no_lost_time", "Accident sans arret de travail", "#FA5252"));
        types.add(type("accident_lost_time", "Accident avec arret de travail", "#E03131"));
        types.add(type("accident_first_aid", "Accident de premiers soins", "#FF8787"));
        types.add(type("non_conformity", "Non-conformite", "#7048E8"));
        types.add(type("hipo_sif", "Potentiel grave (HiPo / SIF)", "#C92A2A"));
        eventTypeRepository.saveAll(types);
        log.info("[ErrorReferentialSeeder] {} types d'evenement crees.", types.size());
    }

    private ErrorEventType type(String code, String label, String colorHex) {
        ErrorEventType t = new ErrorEventType();
        t.setCompanyId(null); // referentiel global
        t.setCode(code);
        t.setLabel(label);
        t.setColorHex(colorHex);
        t.setActive(true);
        return t;
    }

    // ─── Gravites ──────────────────────────────────────────────────────────────

    private void seedSeverities() {
        if (severityRepository.count() > 0) {
            log.info("[ErrorReferentialSeeder] Gravites deja presentes — seed ignore.");
            return;
        }
        List<ErrorSeverity> sev = new ArrayList<>();
        sev.add(severity(1, "Mineur", "#40C057"));
        sev.add(severity(2, "Significatif", "#82C91E"));
        sev.add(severity(3, "Grave", "#FAB005"));
        sev.add(severity(4, "Critique", "#FD7E14"));
        sev.add(severity(5, "Catastrophique", "#E03131"));
        severityRepository.saveAll(sev);
        log.info("[ErrorReferentialSeeder] {} niveaux de gravite crees.", sev.size());
    }

    private ErrorSeverity severity(int level, String label, String colorHex) {
        ErrorSeverity s = new ErrorSeverity();
        s.setLevel(level);
        s.setLabel(label);
        s.setColorHex(colorHex);
        return s;
    }

    // ─── Probabilites ────────────────────────────────────────────────────────────

    private void seedProbabilities() {
        if (probabilityRepository.count() > 0) {
            log.info("[ErrorReferentialSeeder] Probabilites deja presentes — seed ignore.");
            return;
        }
        List<ErrorProbability> prob = new ArrayList<>();
        prob.add(probability(1, "Rare"));
        prob.add(probability(2, "Peu probable"));
        prob.add(probability(3, "Possible"));
        prob.add(probability(4, "Probable"));
        prob.add(probability(5, "Quasi certain"));
        probabilityRepository.saveAll(prob);
        log.info("[ErrorReferentialSeeder] {} niveaux de probabilite crees.", prob.size());
    }

    private ErrorProbability probability(int level, String label) {
        ErrorProbability p = new ErrorProbability();
        p.setLevel(level);
        p.setLabel(label);
        return p;
    }

    // ─── Matrice de criticite 5x5 ──────────────────────────────────────────────

    private void seedCriticalityMatrix() {
        if (matrixRepository.count() > 0) {
            log.info("[ErrorReferentialSeeder] Matrice de criticite deja presente — seed ignore.");
            return;
        }
        List<ErrorCriticalityMatrix> cells = new ArrayList<>();
        for (int s = 1; s <= 5; s++) {
            for (int p = 1; p <= 5; p++) {
                CriticalityLevel level = criticalityFor(s, p);
                ErrorCriticalityMatrix cell = new ErrorCriticalityMatrix();
                cell.setSeverityLevel(s);
                cell.setProbabilityLevel(p);
                cell.setCriticalityLevel(level);
                cell.setColorHex(colorFor(level));
                cells.add(cell);
            }
        }
        matrixRepository.saveAll(cells);
        log.info("[ErrorReferentialSeeder] Matrice de criticite 5x5 creee ({} cellules).", cells.size());
    }

    /** Croisement gravite x probabilite via le score (produit) — seuils standards. */
    private CriticalityLevel criticalityFor(int severity, int probability) {
        int score = severity * probability;
        if (score >= 15) {
            return CriticalityLevel.CRITICAL;
        }
        if (score >= 9) {
            return CriticalityLevel.HIGH;
        }
        if (score >= 4) {
            return CriticalityLevel.MEDIUM;
        }
        return CriticalityLevel.LOW;
    }

    private String colorFor(CriticalityLevel level) {
        return switch (level) {
            case LOW -> "#40C057";
            case MEDIUM -> "#FAB005";
            case HIGH -> "#FD7E14";
            case CRITICAL -> "#E03131";
        };
    }
}
