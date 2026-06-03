package com.minexpert.hns.repository.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.InvestigationSummary;
import com.minexpert.hns.entity.incident.Investigation;
import com.minexpert.hns.enums.InvestigationStatus;

public interface InvestigationRepository extends CrudRepository<Investigation, Long> {
    @Query("""
            SELECT inv
            FROM incident_investigation inv
            WHERE inv.incident.id = :incidentId
                AND (:companyId IS NULL OR inv.companyId = :companyId)
            """)
    Optional<Investigation> findByIncidentIdWithCompanyContext(@Param("incidentId") Long incidentId,
            @Param("companyId") Long companyId);

    @Query("""
            SELECT inv
            FROM incident_investigation inv
            WHERE inv.id = :id
                    AND (:companyId IS NULL OR inv.companyId = :companyId)
            """)
    Optional<Investigation> findByIdWithCompanyContext(@Param("id") Long id,
            @Param("companyId") Long companyId);

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
                i.progress AS progress,
                i.companyId AS companyId
                FROM incident_investigation i
                JOIN i.incident inc
            WHERE (:companyId IS NULL OR i.companyId = :companyId)
            """)
    List<InvestigationSummary> findAllInvestigationSummaries(@Param("companyId") Long companyId);

    long countByStatusAndIncident_CompanyIdAndIncident_DepartmentIdAndUpdatedAtGreaterThanEqual(
            InvestigationStatus status,
            Long companyId,
            Long departmentId,
            LocalDateTime fromDate);

    long countByStatusAndIncident_DepartmentIdAndUpdatedAtGreaterThanEqual(InvestigationStatus status,
            Long departmentId,
            LocalDateTime fromDate);
}
