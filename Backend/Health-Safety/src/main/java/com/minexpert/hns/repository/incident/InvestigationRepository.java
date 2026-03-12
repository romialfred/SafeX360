package com.minexpert.hns.repository.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.response.InvestigationSummary;
import com.minexpert.hns.entity.incident.Investigation;
import com.minexpert.hns.enums.InvestigationStatus;

public interface InvestigationRepository extends CrudRepository<Investigation, Long> {
    Optional<Investigation> findByIncident_Id(Long incidentId);

    @Query("""
                SELECT
                    i.id AS id,
                    inc.id AS incidentId,
                    inc.title AS incidentTitle,
                    i.method AS method,
                    i.createdAt AS createdAt,
                    i.startDate as startDate,
                    i.endDate as endDate,
                    i.status AS status,
                    i.progress AS progress
                FROM incident_investigation i
                JOIN i.incident inc
            """)
    List<InvestigationSummary> findAllInvestigationSummaries();

    long countByStatusAndIncident_DepartmentIdAndUpdatedAtGreaterThanEqual(InvestigationStatus status,
            Long departmentId, LocalDateTime fromDate);
}
