package com.minexpert.hns.dosimetry.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.OverexposureCase;
import com.minexpert.hns.dosimetry.enums.CaseStatus;

@Repository
public interface OverexposureCaseRepository extends JpaRepository<OverexposureCase, Long> {

    /**
     * worker est une relation ManyToOne, donc on filtre via worker.id (JPA path traversal).
     */
    @Query("SELECT c FROM OverexposureCase c WHERE c.worker.id = :workerId ORDER BY c.openedAt DESC")
    List<OverexposureCase> findByWorkerId(@Param("workerId") Long workerId);

    List<OverexposureCase> findByStatus(CaseStatus status);

    /**
     * Cases d'un worker dans des statuts donnes (utilise pour verifier double-open).
     */
    @Query("SELECT c FROM OverexposureCase c WHERE c.worker.id = :workerId AND c.status IN :statuses")
    List<OverexposureCase> findByWorkerIdAndStatusIn(@Param("workerId") Long workerId,
            @Param("statuses") List<CaseStatus> statuses);

    /**
     * Cases associes a une alerte dans des statuts donnes. Garantit qu'on ne re-ouvre pas
     * un case actif (OPEN/INVESTIGATING) pour une meme alerte source.
     */
    List<OverexposureCase> findByAlertIdAndStatusIn(Long alertId, List<CaseStatus> statuses);

    /**
     * Cases actifs (OPEN ou INVESTIGATING) pour une mine donnee.
     */
    @Query("SELECT c FROM OverexposureCase c WHERE c.worker.mineId = :mineId "
            + "AND c.status IN :statuses ORDER BY c.openedAt DESC")
    List<OverexposureCase> findActiveByMineId(@Param("mineId") Long mineId,
            @Param("statuses") List<CaseStatus> statuses);

    /**
     * Cases en statut donne ouvertes avant une date butoir (utilise par le scheduler).
     */
    List<OverexposureCase> findByStatusAndOpenedAtBefore(CaseStatus status, LocalDateTime cutoff);
}
