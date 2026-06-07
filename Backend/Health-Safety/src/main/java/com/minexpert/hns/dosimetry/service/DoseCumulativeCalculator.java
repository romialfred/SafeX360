package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.entity.DoseCumulative;
import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.repository.DoseCumulativeRepository;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;

import lombok.RequiredArgsConstructor;

/**
 * Moteur de calcul des cumuls dosimetriques.
 *
 * <p>Algo (uniquement sur enregistrements ACTIFS, c'est-a-dire supersededRecordId IS NULL) :
 * <ul>
 *   <li>annualHp10  = SUM(hp10) pour l'annee N (period LIKE "N%")</li>
 *   <li>annualHp007 = idem pour Hp(0,07)</li>
 *   <li>annualHp3   = idem pour Hp(3)</li>
 *   <li>rolling5yHp10 = SUM des annualHp10 pour [N-4 .. N]</li>
 *   <li>lifetimeHp10  = SUM total des hp10 actifs du worker</li>
 * </ul>
 *
 * <p>Marque @Transactional sur la classe. La methode recompute est annotee
 * @Transactional(propagation = REQUIRES_NEW) pour isoler chaque (worker, year) dans sa
 * propre transaction, evitant qu'un echec de calcul ne fasse rollback d'un lot.
 */
@Component
@Transactional
@RequiredArgsConstructor
public class DoseCumulativeCalculator {

    private final DoseRecordRepository doseRecordRepository;
    private final DoseCumulativeRepository doseCumulativeRepository;

    /**
     * Recalcule (ou cree) le DoseCumulative d'un worker pour une annee donnee.
     * Idempotent : peut etre rejoue sans effet de bord.
     *
     * @param workerId id du travailleur
     * @param year     annee de reference (ex. 2026)
     * @return DoseCumulative persiste
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public DoseCumulative recompute(Long workerId, int year) {
        // 1. Annual dose pour l'annee N (somme des enregistrements actifs)
        String yearPrefix = String.valueOf(year);
        List<DoseRecord> activeYearRecords = doseRecordRepository
                .findActiveByWorkerIdAndYear(workerId, yearPrefix);

        double annualHp10 = sum(activeYearRecords, DoseRecord::getHp10);
        double annualHp007 = sum(activeYearRecords, DoseRecord::getHp007);
        double annualHp3 = sum(activeYearRecords, DoseRecord::getHp3);

        // 2. Rolling 5y : annee N-4 -> N inclus
        double rolling5yHp10 = 0.0;
        for (int y = year - 4; y <= year; y++) {
            List<DoseRecord> r = doseRecordRepository
                    .findActiveByWorkerIdAndYear(workerId, String.valueOf(y));
            rolling5yHp10 += sum(r, DoseRecord::getHp10);
        }

        // 3. Lifetime : tous les enregistrements actifs du worker
        List<DoseRecord> allActive = doseRecordRepository.findActiveByWorkerId(workerId);
        double lifetimeHp10 = sum(allActive, DoseRecord::getHp10);

        // 4. Upsert
        DoseCumulative entity = doseCumulativeRepository
                .findByWorkerIdAndYear(workerId, year)
                .orElseGet(() -> {
                    DoseCumulative c = new DoseCumulative();
                    c.setWorkerId(workerId);
                    c.setYear(year);
                    return c;
                });

        entity.setAnnualHp10(annualHp10);
        entity.setAnnualHp007(annualHp007);
        entity.setAnnualHp3(annualHp3);
        entity.setRolling5yHp10(rolling5yHp10);
        entity.setLifetimeHp10(lifetimeHp10);
        entity.setUpdatedAt(LocalDateTime.now());

        return doseCumulativeRepository.save(entity);
    }

    private double sum(List<DoseRecord> records,
            java.util.function.Function<DoseRecord, Double> extractor) {
        double total = 0.0;
        for (DoseRecord r : records) {
            Double v = extractor.apply(r);
            if (v != null) total += v;
        }
        return total;
    }
}
