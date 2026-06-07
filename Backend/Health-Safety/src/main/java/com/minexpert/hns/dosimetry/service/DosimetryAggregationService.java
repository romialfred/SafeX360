package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.util.List;

import com.minexpert.hns.dosimetry.dto.DosimetryDistributionDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryGlobalStatusDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryKpiSnapshotDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryMineComparisonDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryTopExposedDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryTrendPointDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryKpiSnapshot;
import com.minexpert.hns.dosimetry.enums.KpiCategory;

/**
 * Service d'agregation et exposition des KPI dosimetriques (Phase 8).
 *
 * <p>Materialise les calculs couteux sous forme de {@link DosimetryKpiSnapshot} pour eviter
 * le N+1 sur de gros parcs. Les KPI sont calcules pour chaque {@code (mineId, snapshotDate,
 * category)} et upsertes idempotentement.
 *
 * <p>Toutes les operations d'exposition se limitent a des donnees AGREGEES (pas de
 * nominatif) afin de pouvoir etre exposees sous le RBAC {@code DOSIMETRY_READ_AGGREGATE}.
 */
public interface DosimetryAggregationService {

    /**
     * Calcule l'agregat KPI pour une mine et toutes les categories pour une date donnee,
     * puis upserte les snapshots correspondants.
     *
     * @param mineId id de la mine
     * @param date   date du snapshot
     * @return nombre de snapshots crees ou mis a jour (cardinalite {@link KpiCategory})
     */
    int computeKpisForMine(Long mineId, LocalDate date);

    /**
     * Renvoie les snapshots disponibles d'une mine sur une fenetre {@code [fromDate, toDate]},
     * filtres optionnellement par {@code category}.
     */
    List<DosimetryKpiSnapshotDTO> getKpis(Long mineId, LocalDate fromDate, LocalDate toDate,
            KpiCategory category);

    /**
     * Renvoie le top N des workers les plus exposes pour une mine et une annee donnees.
     * Lecture appuyee sur DoseCumulative (calcul deja materialise).
     */
    List<DosimetryTopExposedDTO> getTopExposedWorkers(Long mineId, int limit, int year);

    /**
     * Renvoie la distribution histogramme par buckets [0-25 / 25-50 / 50-75 / 75-90 /
     * 90-100 / 100+] des doses annuelles vs. la limite reglementaire.
     */
    DosimetryDistributionDTO getDistribution(Long mineId, int year, KpiCategory category);

    /**
     * Renvoie la serie temporelle mensuelle de la metrique demandee.
     *
     * @param mineId   id mine
     * @param months   nb de mois en arriere (1..36)
     * @param category categorie filtre (nullable -&gt; toutes categories agregees)
     * @param metric   nom de la metrique (cf. {@link DosimetryTrendPointDTO})
     */
    List<DosimetryTrendPointDTO> getTrend(Long mineId, int months, KpiCategory category,
            String metric);

    /**
     * Agregat par mine pour une date donnee (cross-tenant). Sert au comparatif multi-mines.
     */
    List<DosimetryMineComparisonDTO> getMultiMineComparison(LocalDate date);

    /**
     * Etat global plateforme : somme/moyenne sur l'ensemble des mines a la derniere date
     * de snapshot disponible.
     */
    DosimetryGlobalStatusDTO getGlobalStatus();

    /**
     * Convertit une entite snapshot vers son DTO.
     */
    DosimetryKpiSnapshotDTO toDto(DosimetryKpiSnapshot entity);
}
