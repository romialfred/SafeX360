package com.minexpert.hns.repository.incident;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.incident.WorkedHoursEntry;

public interface WorkedHoursEntryRepository extends JpaRepository<WorkedHoursEntry, Long> {

    List<WorkedHoursEntry> findByCompanyIdAndYearOrderByMonthAsc(Long companyId, Integer year);

    Optional<WorkedHoursEntry> findByCompanyIdAndYearAndMonthAndDepartmentId(
            Long companyId, Integer year, Integer month, Long departmentId);

    Optional<WorkedHoursEntry> findByCompanyIdAndYearAndMonthAndSubcontractorName(
            Long companyId, Integer year, Integer month, String subcontractorName);

    /** Heures totales d'une année, cloisonnées mine (dénominateur des taux). */
    @Query("SELECT COALESCE(SUM(w.hours), 0) FROM WorkedHoursEntry w "
            + "WHERE w.year = :year AND (:companyId IS NULL OR w.companyId = :companyId)")
    Double sumHoursForYear(@Param("year") int year, @Param("companyId") Long companyId);

    /** Heures par MOIS d'une année (série mensuelle → variations sur les tuiles). */
    @Query("SELECT w.month AS month, COALESCE(SUM(w.hours), 0) AS total FROM WorkedHoursEntry w "
            + "WHERE w.year = :year AND (:companyId IS NULL OR w.companyId = :companyId) "
            + "GROUP BY w.month")
    List<MonthHours> sumHoursByMonthForYear(@Param("year") int year, @Param("companyId") Long companyId);

    interface MonthHours {
        Integer getMonth();

        Double getTotal();
    }
}
