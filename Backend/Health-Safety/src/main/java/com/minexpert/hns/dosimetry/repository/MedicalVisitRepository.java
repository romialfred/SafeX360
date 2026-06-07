package com.minexpert.hns.dosimetry.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.MedicalVisit;
import com.minexpert.hns.dosimetry.enums.MedicalVisitType;
import com.minexpert.hns.dosimetry.enums.VisitStatus;

@Repository
public interface MedicalVisitRepository extends JpaRepository<MedicalVisit, Long> {

    List<MedicalVisit> findByWorkerIdOrderByScheduledDateDesc(Long workerId);

    List<MedicalVisit> findByMineIdAndStatus(Long mineId, VisitStatus status);

    List<MedicalVisit> findByMineIdAndVisitTypeAndStatus(Long mineId,
            MedicalVisitType visitType, VisitStatus status);

    /**
     * Visites programmees a venir sur une fenetre temporelle (utilise par
     * {@code getUpcomingVisits} et par le scheduler de detection de visites manquees).
     */
    @Query("SELECT v FROM MedicalVisit v WHERE v.mineId = :mineId AND v.status = :status "
            + "AND v.scheduledDate BETWEEN :from AND :to "
            + "ORDER BY v.scheduledDate ASC")
    List<MedicalVisit> findUpcomingByMine(@Param("mineId") Long mineId,
            @Param("status") VisitStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * Visites programmees dont la date est echue (utilise par le scheduler pour passer
     * en MISSED).
     */
    List<MedicalVisit> findByStatusAndScheduledDateBefore(VisitStatus status, LocalDate cutoff);

    /**
     * Recherche d'une visite POST_EXPOSURE deja planifiee pour eviter les doublons quand
     * un OverexposureCase ouvre plusieurs alertes consecutives.
     */
    @Query("SELECT v FROM MedicalVisit v WHERE v.workerId = :workerId "
            + "AND v.visitType = :type AND v.status = :status")
    List<MedicalVisit> findByWorkerAndTypeAndStatus(@Param("workerId") Long workerId,
            @Param("type") MedicalVisitType type,
            @Param("status") VisitStatus status);
}
