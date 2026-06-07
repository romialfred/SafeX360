package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;

import lombok.RequiredArgsConstructor;

/**
 * Scheduler de calcul journalier des snapshots KPI Dosimetrie (Phase 8).
 *
 * <p>Cron : tous les jours a 03:00 (heure locale serveur). On itere sur toutes les mines
 * detectees (distinct mineId dans {@code dosimetry_exposed_worker}) et on appelle
 * {@link DosimetryAggregationService#computeKpisForMine(Long, LocalDate)} qui produit
 * un snapshot par categorie KPI (5 lignes par mine et par jour).
 *
 * <p>L'echec d'une mine ne doit pas bloquer les autres : chaque execution est isolee dans un
 * try/catch et les erreurs sont logguees avec stacktrace pour analyse APM.
 */
@Service
@RequiredArgsConstructor
public class DosimetryKpiScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(DosimetryKpiScheduler.class);

    private final DosimetryAggregationService aggregationService;
    private final ExposedWorkerRepository workerRepository;

    /**
     * Cron quotidien 03:00 - declenche le calcul de tous les snapshots KPI.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void runDailyKpiSnapshots() {
        LocalDate today = LocalDate.now();
        LOGGER.info("[DosimetryKpiScheduler] daily run start - date={}", today);
        List<Long> mineIds = workerRepository.findAll().stream()
                .map(ExposedWorker::getMineId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        if (mineIds.isEmpty()) {
            LOGGER.warn("[DosimetryKpiScheduler] no mine detected - nothing to compute.");
            return;
        }
        int totalSnapshots = 0;
        int errors = 0;
        for (Long mineId : mineIds) {
            try {
                int n = aggregationService.computeKpisForMine(mineId, today);
                totalSnapshots += n;
            } catch (Exception ex) {
                errors++;
                LOGGER.error("[DosimetryKpiScheduler] compute FAILED for mineId={} : {}",
                        mineId, ex.getMessage(), ex);
            }
        }
        LOGGER.info("[DosimetryKpiScheduler] daily run done - mines={} snapshots={} errors={}",
                mineIds.size(), totalSnapshots, errors);
    }
}
