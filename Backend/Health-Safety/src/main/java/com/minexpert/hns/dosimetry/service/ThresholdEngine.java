package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.entity.Threshold;
import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.enums.AlertStatus;
import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.DoseSpecialStatus;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;
import com.minexpert.hns.dosimetry.repository.ExposureAlertRepository;
import com.minexpert.hns.dosimetry.repository.ThresholdRepository;

import lombok.RequiredArgsConstructor;

/**
 * Moteur d'alertes dosimetriques.
 *
 * <p>Pour chaque DoseRecord, evalue les 3 grandeurs (Hp10, Hp007, Hp3) contre le seuil
 * actif de la mine pour la categorie de personne du worker. Si la valeur depasse :
 * <ul>
 *   <li>regulatoryLimit  -> EXCEEDED</li>
 *   <li>actionLevel      -> ACTION</li>
 *   <li>investigationLevel -> INVESTIGATION</li>
 *   <li>warnPercentages * regulatoryLimit -> APPROACH</li>
 * </ul>
 * Renvoie la liste des alertes creees et persistees.
 */
@Component
@Transactional
@RequiredArgsConstructor
public class ThresholdEngine {

    private final ThresholdRepository thresholdRepository;
    private final ExposureAlertRepository exposureAlertRepository;

    public List<ExposureAlert> check(DoseRecord record) {
        List<ExposureAlert> created = new ArrayList<>();
        if (record == null || record.getWorker() == null) return created;

        ExposedWorker worker = record.getWorker();
        Long mineId = worker.getMineId();
        String personCategory = resolvePersonCategory(worker);

        evaluate(record, worker, mineId, personCategory, ThresholdGrandeur.HP10, record.getHp10(), created);
        evaluate(record, worker, mineId, personCategory, ThresholdGrandeur.HP007, record.getHp007(), created);
        evaluate(record, worker, mineId, personCategory, ThresholdGrandeur.HP3, record.getHp3(), created);

        return created;
    }

    private void evaluate(DoseRecord record, ExposedWorker worker, Long mineId,
            String personCategory, ThresholdGrandeur grandeur, Double value,
            List<ExposureAlert> out) {
        if (value == null) return;

        Optional<Threshold> opt = thresholdRepository
                .findByMineIdAndGrandeurAndPersonCategoryAndActiveTrue(mineId, grandeur, personCategory);
        if (opt.isEmpty()) {
            opt = thresholdRepository.findGlobalDefault(grandeur, personCategory);
        }
        if (opt.isEmpty()) return;

        Threshold t = opt.get();
        AlertLevel level = null;

        if (t.getRegulatoryLimit() != null && value >= t.getRegulatoryLimit()) {
            level = AlertLevel.EXCEEDED;
        } else if (t.getActionLevel() != null && value >= t.getActionLevel()) {
            level = AlertLevel.ACTION;
        } else if (t.getInvestigationLevel() != null && value >= t.getInvestigationLevel()) {
            level = AlertLevel.INVESTIGATION;
        } else if (t.getRegulatoryLimit() != null) {
            int highestPct = highestExceededWarnPct(value, t.getRegulatoryLimit(), t.getWarnPercentages());
            if (highestPct > 0) {
                level = AlertLevel.APPROACH;
            }
        }

        if (level != null) {
            ExposureAlert alert = ExposureAlert.builder()
                    .workerId(worker.getId())
                    .level(level)
                    .grandeur(grandeur)
                    .value(value)
                    .thresholdId(t.getId())
                    .triggeredAt(LocalDateTime.now())
                    .status(AlertStatus.ACTIVE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            out.add(exposureAlertRepository.save(alert));
        }
    }

    /**
     * Retourne le plus haut pourcentage de warning depasse par la valeur, ou 0 si aucun.
     * warnPercentages est un JSON array d'entiers ex. "[75,90]".
     */
    private int highestExceededWarnPct(double value, double limit, String warnPercentages) {
        if (warnPercentages == null || warnPercentages.isBlank() || limit <= 0) return 0;
        String cleaned = warnPercentages.replace("[", "").replace("]", "").replace(" ", "");
        if (cleaned.isEmpty()) return 0;
        int highest = 0;
        for (String token : Arrays.asList(cleaned.split(","))) {
            try {
                int pct = Integer.parseInt(token.trim());
                double trigger = limit * pct / 100.0;
                if (value >= trigger && pct > highest) {
                    highest = pct;
                }
            } catch (NumberFormatException ignored) {
                // skip token
            }
        }
        return highest;
    }

    /**
     * Mappe la categorie de personne en chaine attendue par Threshold.personCategory :
     * WORKER_A | WORKER_B | APPRENTICE | PREGNANCY | PUBLIC.
     */
    private String resolvePersonCategory(ExposedWorker worker) {
        if (worker.getSpecialStatus() == DoseSpecialStatus.PREGNANCY) return "PREGNANCY";
        if (worker.getSpecialStatus() == DoseSpecialStatus.APPRENTICE) return "APPRENTICE";
        if (worker.getCategory() == DoseCategory.A) return "WORKER_A";
        if (worker.getCategory() == DoseCategory.B) return "WORKER_B";
        return "PUBLIC";
    }
}
