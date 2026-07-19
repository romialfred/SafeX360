package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.YearMonth;
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

    /** Résolution juridictionnelle injectée en production ; null uniquement dans les tests legacy. */
    private RegulatoryLimitResolver regulatoryLimitResolver;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setRegulatoryLimitResolver(RegulatoryLimitResolver regulatoryLimitResolver) {
        this.regulatoryLimitResolver = regulatoryLimitResolver;
    }

    /**
     * Auto-ouverture d'un dossier de surexposition pour les alertes de niveau >= ACTION.
     * Injecte en setter (et non en constructeur) pour preserver la signature historique
     * de {@code @RequiredArgsConstructor} attendue par {@link ThresholdEngineTest}.
     * Peut etre null en mode test ou bootstrap.
     */
    private OverexposureCaseService overexposureCaseService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setOverexposureCaseService(OverexposureCaseService overexposureCaseService) {
        this.overexposureCaseService = overexposureCaseService;
    }

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
        // Le referentiel juridictionnel PRIME quand une regle approuvee existe ;
        // mais tant que ce referentiel — table neuve, donc vide au deploiement —
        // n'est pas alimente ET approuve, on RETOMBE sur la limite configuree du
        // seuil. L'`orElse(null)` initial eteignait silencieusement toutes les
        // alertes de niveau reglementaire existantes le jour du deploiement :
        // une surveillance de securite ne se degrade pas par effet de bord.
        Double approvedRegulatoryLimit = regulatoryLimitResolver == null
                ? t.getRegulatoryLimit()
                : regulatoryLimitResolver.resolve(mineId, personCategory, grandeur,
                        applicableDate(record.getPeriod())).orElse(t.getRegulatoryLimit());
        AlertLevel level = computeLevel(value, t, approvedRegulatoryLimit);
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

        // Phase 5 — auto-ouverture du dossier de surexposition pour level >= ACTION.
        // L'idempotence cote OverexposureCaseService garantit qu'on ne re-ouvre pas un case
        // deja OPEN/INVESTIGATING pour la meme alerte (par alertId). Best-effort : en cas
        // d'IllegalStateException (case existant), on logge l'audit et on continue.
        if (overexposureCaseService != null
                && level.ordinal() >= AlertLevel.ACTION.ordinal()) {
            try {
                String cause = String.format("Auto-open : %s=%s, level=%s, thresholdId=%d",
                        grandeur.name(), value, level.name(), t.getId());
                Long openedBy = record.getRecordedBy() != null ? record.getRecordedBy() : 0L;
                Long caseId = overexposureCaseService.openCase(
                        worker.getId(), saved.getId(), openedBy, cause, level);
                if (auditService != null) {
                    auditService.log("AUTO_OPEN_OVEREXPOSURE", "OverexposureCase", caseId,
                            openedBy, null,
                            String.format("{\"alertId\":%d,\"workerId\":%d,\"level\":\"%s\"}",
                                    saved.getId(), worker.getId(), level.name()));
                }
            } catch (IllegalStateException duplicateCase) {
                // Case deja existant pour cette alerte : tracage uniquement.
                if (auditService != null) {
                    auditService.log("AUTO_OPEN_OVEREXPOSURE_SKIPPED", "ExposureAlert",
                            saved.getId(), 0L, null,
                            String.format("{\"reason\":\"%s\"}",
                                    duplicateCase.getMessage().replace("\"", "'")));
                }
            }
        }
    }

    /**
     * Calcule le niveau d'alerte a partir de la valeur et du seuil. Renvoie null si aucun
     * niveau n'est franchi (NONE).
     *
     * <p>Algorithme : on calcule un ratio uniquement avec la limite juridictionnelle approuvée.
     * En son absence, seuls les niveaux opérationnels action/investigation restent évalués.
     */
    private AlertLevel computeLevel(double value, Threshold t, Double limit) {

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

    private LocalDate applicableDate(String period) {
        if (period == null || period.isBlank()) return null;
        try {
            if (period.matches("\\d{4}-\\d{2}")) {
                return YearMonth.parse(period).atEndOfMonth();
            }
            if (period.matches("\\d{4}-Q[1-4]")) {
                int year = Integer.parseInt(period.substring(0, 4));
                int quarter = Integer.parseInt(period.substring(6, 7));
                return YearMonth.of(year, quarter * 3).atEndOfMonth();
            }
        } catch (RuntimeException ignored) {
            // La validation de format reste au service de saisie.
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
