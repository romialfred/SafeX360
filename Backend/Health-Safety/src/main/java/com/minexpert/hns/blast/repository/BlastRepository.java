package com.minexpert.hns.blast.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.enums.BlastStatus;

@Repository
public interface BlastRepository extends JpaRepository<Blast, Long> {

    Optional<Blast> findByReference(String reference);

    boolean existsByReference(String reference);

    List<Blast> findByMineIdAndStatusIn(Long mineId, Collection<BlastStatus> statuses);

    /**
     * Tirs dont l'heure prevue tombe entre {@code from} et {@code to}, dans un
     * ensemble de statuts donnes (ex. les tirs CONFIRMED a venir dans 24h).
     */
    @Query("SELECT b FROM Blast b WHERE b.mineId = :mineId "
            + "AND b.scheduledAt BETWEEN :from AND :to "
            + "AND b.status IN :statuses "
            + "ORDER BY b.scheduledAt ASC")
    List<Blast> findScheduledBetween(@Param("mineId") Long mineId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("statuses") Collection<BlastStatus> statuses);

    /**
     * Tirs prevus avant un instant donne, dans un ensemble de statuts (utilise
     * par le scheduler pour reprogrammer / lever des alertes).
     */
    @Query("SELECT b FROM Blast b WHERE b.scheduledAt <= :cutoff "
            + "AND b.status IN :statuses ORDER BY b.scheduledAt ASC")
    List<Blast> findScheduledBefore(@Param("cutoff") LocalDateTime cutoff,
            @Param("statuses") Collection<BlastStatus> statuses);

    /**
     * Tirs actifs du jour (CONFIRMED, IMMINENT, FIRED, MISFIRE) pour la mine donnee.
     */
    @Query("SELECT b FROM Blast b WHERE b.mineId = :mineId "
            + "AND b.scheduledAt BETWEEN :startOfDay AND :endOfDay "
            + "AND b.status IN ("
            + "  com.minexpert.hns.blast.enums.BlastStatus.CONFIRMED, "
            + "  com.minexpert.hns.blast.enums.BlastStatus.IMMINENT, "
            + "  com.minexpert.hns.blast.enums.BlastStatus.FIRED, "
            + "  com.minexpert.hns.blast.enums.BlastStatus.MISFIRE) "
            + "ORDER BY b.scheduledAt ASC")
    List<Blast> findActiveBlastsToday(@Param("mineId") Long mineId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    List<Blast> findByMineIdOrderByScheduledAtDesc(Long mineId);
}
