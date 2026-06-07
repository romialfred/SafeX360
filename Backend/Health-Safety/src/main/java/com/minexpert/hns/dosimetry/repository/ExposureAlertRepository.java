package com.minexpert.hns.dosimetry.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.enums.AlertStatus;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

@Repository
public interface ExposureAlertRepository extends JpaRepository<ExposureAlert, Long> {

    List<ExposureAlert> findByWorkerId(Long workerId);

    List<ExposureAlert> findByStatus(AlertStatus status);

    List<ExposureAlert> findByStatusAndWorkerId(AlertStatus status, Long workerId);

    List<ExposureAlert> findByWorkerIdAndStatus(Long workerId, AlertStatus status);

    /**
     * Idempotence du moteur d'alertes : recherche une alerte deja ACTIVE (non acknowledged) pour
     * le triplet (worker, grandeur, level). Si presente, le moteur ne re-cree pas de doublon.
     */
    @Query("SELECT a FROM ExposureAlert a WHERE a.workerId = :workerId AND a.grandeur = :grandeur "
            + "AND a.level = :level AND a.status = :status AND a.acknowledgedAt IS NULL")
    Optional<ExposureAlert> findActiveByWorkerGrandeurLevel(@Param("workerId") Long workerId,
            @Param("grandeur") ThresholdGrandeur grandeur,
            @Param("level") AlertLevel level,
            @Param("status") AlertStatus status);

    /**
     * Liste les alertes ACTIVE pour une mine donnee (jointure sur ExposedWorker par workerId).
     * Utilisee par le centre d'alerte (Phase 5) pour afficher la liste consolidee par mine.
     */
    @Query("SELECT a FROM ExposureAlert a, ExposedWorker w "
            + "WHERE a.workerId = w.id AND w.mineId = :mineId AND a.status = :status "
            + "ORDER BY a.triggeredAt DESC")
    List<ExposureAlert> findByMineIdAndStatus(@Param("mineId") Long mineId,
            @Param("status") AlertStatus status);

    /**
     * Liste les alertes au statut donne dont triggeredAt est anterieur au seuil (escalade).
     * Utilisee par NotificationScheduler pour detecter les ACTIVE > 24h non acknowledged.
     */
    List<ExposureAlert> findByStatusAndTriggeredAtBefore(AlertStatus status, LocalDateTime cutoff);
}
