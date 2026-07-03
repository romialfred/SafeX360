package com.minexpert.hns.dosimetry.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.DoseRecord;

/**
 * DoseRecord est append-only : aucune mise a jour des valeurs metier apres creation.
 * Les requetes "active" filtrent supersededRecordId IS NULL pour cibler la derniere edition
 * en cours de chaque (worker, period).
 */
@Repository
public interface DoseRecordRepository extends JpaRepository<DoseRecord, Long> {

    List<DoseRecord> findByWorkerId(Long workerId);

    List<DoseRecord> findByWorkerIdAndPeriod(Long workerId, String period);

    List<DoseRecord> findByWorkerIdOrderByPeriodAsc(Long workerId);

    /** Renvoie le dernier enregistrement actif (non remplace) pour un (worker, period). */
    @Query("SELECT d FROM DoseRecord d WHERE d.worker.id = :workerId AND d.period = :period AND d.supersededRecordId IS NULL")
    Optional<DoseRecord> findActiveByWorkerIdAndPeriod(@Param("workerId") Long workerId,
            @Param("period") String period);

    /** Renvoie tous les enregistrements actifs (non remplaces) pour un worker. */
    @Query("SELECT d FROM DoseRecord d WHERE d.worker.id = :workerId AND d.supersededRecordId IS NULL")
    List<DoseRecord> findActiveByWorkerId(@Param("workerId") Long workerId);

    /**
     * Renvoie tous les enregistrements actifs (non remplaces) pour un worker dont la periode
     * commence par le prefixe annee (ex. "2026"). Utilise par DoseCumulativeCalculator.
     */
    @Query("SELECT d FROM DoseRecord d WHERE d.worker.id = :workerId AND d.supersededRecordId IS NULL AND d.period LIKE CONCAT(:yearPrefix, '%')")
    List<DoseRecord> findActiveByWorkerIdAndYear(@Param("workerId") Long workerId,
            @Param("yearPrefix") String yearPrefix);

    /**
     * Renvoie toutes les versions (actives ET superseded) d'un (worker, period), ordonnees
     * par version croissante. Utilise pour l'historique d'audit du record.
     */
    @Query("SELECT d FROM DoseRecord d WHERE d.worker.id = :workerId AND d.period = :period ORDER BY d.version ASC")
    List<DoseRecord> findAllVersionsByWorkerIdAndPeriod(@Param("workerId") Long workerId,
            @Param("period") String period);

    /**
     * Met a jour UNIQUEMENT la colonne superseded_record_id pour un record donne. C'est la seule
     * colonne mutable autorisee par le trigger V004 (append-only avec exception sur le chainage).
     * On utilise une UPDATE ciblee plutot que JPA save() pour eviter que Hibernate ne tente de
     * pousser d'autres colonnes (recorded_at, updated_at, etc.) qui seraient rejetees par le
     * trigger SQL.
     *
     * @return nombre de lignes mises a jour (1 si succes, 0 sinon)
     */
    @Modifying
    @Query("UPDATE DoseRecord d SET d.supersededRecordId = :newId WHERE d.id = :originalId AND d.supersededRecordId IS NULL")
    int updateSupersededRecordId(@Param("originalId") Long originalId, @Param("newId") Long newId);

    @Query("SELECT COUNT(d) FROM DoseRecord d WHERE d.worker.id IN :workerIds "
            + "AND d.supersededRecordId IS NULL AND d.period LIKE CONCAT(:yearPrefix, '%')")
    long countActiveByWorkerIdsAndYear(@Param("workerIds") List<Long> workerIds,
            @Param("yearPrefix") String yearPrefix);
}
