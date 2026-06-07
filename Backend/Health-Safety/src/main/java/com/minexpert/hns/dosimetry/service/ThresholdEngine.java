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
 * actif de la mine pour la categorie de personne du worker. 5 niveaux d'evaluation :
 * <ul>
 *   <li>ratio &gt;= 1.0 (regulatoryLimit atteint) -&gt; {@link AlertLevel#EXCEEDED}</li>
 *   <li>ratio &gt;= warnPercentages[hi]/100 (ex. 90%) -&gt; {@link AlertLevel#ACTION}</li>
 *   <li>ratio &gt;= warnPercentages[lo]/100 (ex. 75%) -&gt; {@link AlertLevel#INVESTIGATION}</li>
 *   <li>ratio &gt;= 0.5 (50% par defaut)             -&gt; {@link AlertLevel#APPROACH}</li>
 *   <li>sinon : aucune alerte (NONE)</li>
 * </ul>
 *
 * <p><b>Idempotence :</b> pour un triplet (workerId, grandeur, level) donne, le moteur ne cree
 * PAS de nouvelle alerte ACTIVE si une alerte ACTIVE non-acknowledged existe deja. Le frontend
 * voit ainsi une seule entree par cas non resolu et evite le spam d'alertes lors de re-evaluations
 * (ex. recompute apres seed, supersede d'un record deja superseuil).
 *
 * <p>Renvoie la liste des alertes NOUVELLEMENT creees et persistees (peut etre vide).
 */
@Component
@Transactional
@RequiredArgsConstructor
public class ThresholdEngine {

    private final ThresholdRepository thresholdRepository;
    private final ExposureAlertRepository exposureAlertRepository;
    private final DosimetryAuditService auditService;

    /**
     * Methode legacy : delegue a evaluateAndCreateAlerts(record). Conservee pour les tests et
     * appelants existants.
     */
    public List<ExposureAlert> check(DoseRecord record) {
        return evaluateAndCreateAlerts(record);
    }

    /**
     * Evalue le DoseRecord donne contre les seuils actifs et cree (avec idempotence) les
     * alertes ExposureAlert correspondantes.
     */
    public List<ExposureAlert> evaluateAndCreateAlerts(DoseRecord record) {
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
        AlertLevel level = computeLevel(value, t);
        if (level == null) return;

        // Idempotence : pas de doublon si une alerte ACTIVE non-acknowledged existe deja pour
        // (worker, grandeur, level).
        Optional<ExposureAlert> existing = exposureAlertRepository.findActiveByWorkerGrandeurLevel(
                worker.getId(), grandeur, level, AlertStatus.ACTIVE);
        if (existing.isPresent()) {
            return;
        }

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
        ExposureAlert saved = exposureAlertRepository.save(alert);
        out.add(saved);

        // Audit log par alerte creee (best-effort, transaction independante).
        if (auditService != null) {
            String details = String.format(
                    "{\"workerId\":%d,\"grandeur\":\"%s\",\"level\":\"%s\",\"value\":%s,"
                            + "\"thresholdId\":%d,\"recordId\":%s}",
                    worker.getId(), grandeur.name(), level.name(),
                    value, t.getId(),
                    record.getId() != null ? record.getId().toString() : "null");
            auditService.log("ALERT_CREATED", "ExposureAlert", saved.getId(),
                    record.getRecordedBy() != null ? record.getRecordedBy() : 0L,
                    null, details);
        }
    }

    /**
     * Calcule le niveau d'alerte a partir de la valeur et du seuil. Renvoie null si aucun
     * niveau n'est franchi (NONE).
     *
     * <p>Algorithme : on calcule un ratio = value / regulatoryLimit. Si pas de regulatoryLimit
     * configure, on tombe en fallback sur actionLevel / investigationLevel (compat. legacy).
     */
    private AlertLevel computeLevel(double value, Threshold t) {
        Double limit = t.getRegulatoryLimit();

        // Cas 1 : regulatoryLimit defini -> on raisonne en ratio.
        if (limit != null && limit > 0) {
            double ratio = value / limit;
            if (ratio >= 1.0) return AlertLevel.EXCEEDED;

            int[] warnPcts = parseWarnPercentages(t.getWarnPercentages());
            // warnPercentages[1] = niveau haut (ex. 90) -> ACTION
            // warnPercentages[0] = niveau bas  (ex. 75) -> INVESTIGATION
            if (warnPcts.length >= 2 && ratio >= warnPcts[1] / 100.0) return AlertLevel.ACTION;
            if (warnPcts.length >= 1 && ratio >= warnPcts[0] / 100.0) return AlertLevel.INVESTIGATION;
            if (ratio >= 0.5) return AlertLevel.APPROACH;
            return null;
        }

        // Cas 2 : pas de regulatoryLimit -> fallback sur les seuils directs (legacy).
        if (t.getActionLevel() != null && value >= t.getActionLevel()) return AlertLevel.ACTION;
        if (t.getInvestigationLevel() != null && value >= t.getInvestigationLevel()) {
            return AlertLevel.INVESTIGATION;
        }
        return null;
    }

    /**
     * Parse warnPercentages "[75,90]" -> [75, 90] (trie ASC). Garantit que l'element [0] est
     * le pourcentage le plus bas (= INVESTIGATION) et [1] le plus haut (= ACTION). Tolere les
     * entrees vides / mal formees (retourne array vide).
     */
    private int[] parseWarnPercentages(String warnPercentages) {
        if (warnPercentages == null || warnPercentages.isBlank()) return new int[0];
        String cleaned = warnPercentages.replace("[", "").replace("]", "").replace(" ", "");
        if (cleaned.isEmpty()) return new int[0];
        List<Integer> values = new ArrayList<>();
        for (String token : Arrays.asList(cleaned.split(","))) {
            try {
                values.add(Integer.parseInt(token.trim()));
            } catch (NumberFormatException ignored) {
                // skip token
            }
        }
        if (values.isEmpty()) return new int[0];
        values.sort(Integer::compareTo);
        int[] result = new int[values.size()];
        for (int i = 0; i < values.size(); i++) result[i] = values.get(i);
        return result;
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
