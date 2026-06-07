package com.minexpert.hns.dosimetry.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.DosimetryKpiSnapshot;
import com.minexpert.hns.dosimetry.enums.KpiCategory;

/**
 * Repository des snapshots KPI Dosimetrie (Phase 8).
 *
 * <p>Conformement a la dimension {@code (mineId, snapshotDate, category)} de la table, les
 * requetes proposees servent :
 * <ul>
 *   <li>la consolidation par mine (summary dernier disponible) ;</li>
 *   <li>les series temporelles (trend mensuel) ;</li>
 *   <li>l'agregat cross-mines (comparatif).</li>
 * </ul>
 */
@Repository
public interface DosimetryKpiSnapshotRepository extends JpaRepository<DosimetryKpiSnapshot, Long> {

    Optional<DosimetryKpiSnapshot> findByMineIdAndSnapshotDateAndCategory(
            Long mineId, LocalDate snapshotDate, KpiCategory category);

    List<DosimetryKpiSnapshot> findByMineIdAndSnapshotDateOrderByCategoryAsc(
            Long mineId, LocalDate snapshotDate);

    List<DosimetryKpiSnapshot> findByMineIdAndCategoryAndSnapshotDateBetweenOrderBySnapshotDateAsc(
            Long mineId, KpiCategory category, LocalDate from, LocalDate to);

    List<DosimetryKpiSnapshot> findByMineIdAndSnapshotDateBetweenOrderBySnapshotDateAsc(
            Long mineId, LocalDate from, LocalDate to);

    /**
     * Dernieres dates de snapshot disponibles pour une mine donnee (toutes categories
     * confondues). Utilise pour resoudre "le dernier KPI dispo" quand le client ne precise
     * pas de date.
     */
    @Query("SELECT MAX(s.snapshotDate) FROM DosimetryKpiSnapshot s WHERE s.mineId = :mineId")
    Optional<LocalDate> findLatestSnapshotDate(@Param("mineId") Long mineId);

    /**
     * Dernieres dates de snapshot disponibles, toutes mines confondues.
     */
    @Query("SELECT MAX(s.snapshotDate) FROM DosimetryKpiSnapshot s")
    Optional<LocalDate> findLatestSnapshotDateGlobal();

    /**
     * Snapshots de toutes les mines pour une date donnee (vue comparative cross-tenant).
     */
    List<DosimetryKpiSnapshot> findBySnapshotDateOrderByMineIdAscCategoryAsc(LocalDate snapshotDate);
}
