package com.minexpert.hns.repository.incident;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.incident.IncidentInjury;
import com.minexpert.hns.enums.InjuryOutcome;

public interface IncidentInjuryRepository extends JpaRepository<IncidentInjury, Long> {

    List<IncidentInjury> findByIncidentId(Long incidentId);

    /**
     * Nombre de lésions d'une ANNÉE par issue, cloisonné mine. Base des taux de
     * fréquence (on compte les issues, pas les incidents : un incident peut porter
     * plusieurs lésions).
     */
    @Query("SELECT i.outcome AS outcome, COUNT(i) AS total FROM IncidentInjury i, Incident inc "
            + "WHERE inc.id = i.incidentId "
            + "AND FUNCTION('YEAR', COALESCE(inc.occurredAt, inc.createdAt)) = :year "
            + "AND (:companyId IS NULL OR i.companyId = :companyId) "
            + "GROUP BY i.outcome")
    List<OutcomeCount> countByOutcomeForYear(@Param("year") int year, @Param("companyId") Long companyId);

    /** Total des jours perdus d'une année (taux de gravité), cloisonné mine. */
    @Query("SELECT COALESCE(SUM(i.lostDays), 0) FROM IncidentInjury i, Incident inc "
            + "WHERE inc.id = i.incidentId "
            + "AND FUNCTION('YEAR', COALESCE(inc.occurredAt, inc.createdAt)) = :year "
            + "AND (:companyId IS NULL OR i.companyId = :companyId)")
    Long sumLostDaysForYear(@Param("year") int year, @Param("companyId") Long companyId);

    /** Projection issue → effectif. */
    interface OutcomeCount {
        InjuryOutcome getOutcome();

        Long getTotal();
    }
}
