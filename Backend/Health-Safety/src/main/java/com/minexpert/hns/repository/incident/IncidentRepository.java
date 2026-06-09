package com.minexpert.hns.repository.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.IncidentResponse;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.repository.incident.projection.MonthlyClosureSummary;

public interface IncidentRepository extends CrudRepository<Incident, Long> {
    Optional<Incident> findByIdAndCompanyId(Long id, Long companyId);

    @Query("SELECT i FROM Incident i WHERE i.id = :id AND (:companyId IS NULL OR i.companyId = :companyId)")
    Optional<Incident> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);

    @Query("SELECT i.id as id, i.title AS title, i.location AS location, i.occurredAt AS occurredAt, i.status AS status FROM Incident i WHERE (:companyId IS NULL OR i.companyId = :companyId)")
    List<IncidentResponse> findAllIncidents(@Param("companyId") Long companyId);

    @Query(value = """
                            SELECT
                                i.id AS id,
                                i.title AS title,
                                i.department_id as departmentId,
                                i.occurred_at AS incidentDate,
                                i.reporter_id AS reporterId,
                                i.source AS source,
                                i.ai_confidence AS aiConfidence,
                               CASE i.status
                WHEN 0 THEN 'PENDING'
                WHEN 1 THEN 'REPORTED'
                WHEN 2 THEN 'INVESTIGATION'
                WHEN 3 THEN 'INVESTIGATION_COMPLETED'
                WHEN 4 THEN 'CORRECTIVE_ACTIONS'
                WHEN 5 THEN 'CLOSED'
                WHEN 6 THEN 'REJECTED'
                ELSE 'UNKNOWN'
            END AS status,
                                severity_info.level AS maxSeverityLevel,
                                severity_info.name AS severityLevelName,
                                severity_info.incident_category_name AS incidentCategoryName
                            FROM incident i
                            LEFT JOIN (
                                SELECT
                                    idt.incident_id,
                                    sl.level,
                                    sl.name,
                                    ic.name AS incident_category_name
                                FROM incident_detail idt
                                JOIN severity_level sl ON idt.severity_level_id = sl.id
                                JOIN incident_category ic ON sl.incident_category_id = ic.id
                                WHERE (idt.incident_id, sl.level) IN (
                                    SELECT
                                        idt2.incident_id,
                                        MAX(sl2.level)
                                    FROM incident_detail idt2
                                    JOIN severity_level sl2 ON idt2.severity_level_id = sl2.id
                                    GROUP BY idt2.incident_id
                                )
                            ) AS severity_info ON severity_info.incident_id = i.id
                            WHERE (:companyId IS NULL OR i.company_id = :companyId)
                        """, nativeQuery = true)
    List<IncidentResponse> findAllIncidentsWithMaxSeverity(@Param("companyId") Long companyId);

    @Query(value = """
                            SELECT
                                i.id AS id,
                                i.title AS title,
                                i.occurred_at AS incidentDate,
                                CASE i.status
                WHEN 0 THEN 'PENDING'
                WHEN 1 THEN 'REPORTED'
                WHEN 2 THEN 'INVESTIGATION'
                WHEN 3 THEN 'INVESTIGATION_COMPLETED'
                WHEN 4 THEN 'CORRECTIVE_ACTIONS'
                WHEN 5 THEN 'CLOSED'
                WHEN 6 THEN 'REJECTED'
                ELSE 'UNKNOWN'
            END AS status,
                                severity_info.level AS maxSeverityLevel,
                                severity_info.name AS severityLevelName,
                                severity_info.incident_category_name AS incidentCategoryName
                            FROM incident i
                            LEFT JOIN (
                                SELECT
                                    idt.incident_id,
                                    sl.level,
                                    sl.name,
                                    ic.name AS incident_category_name
                                FROM incident_detail idt
                                JOIN severity_level sl ON idt.severity_level_id = sl.id
                                JOIN incident_category ic ON sl.incident_category_id = ic.id
                                WHERE (idt.incident_id, sl.level) IN (
                                    SELECT
                                        idt2.incident_id,
                                        MAX(sl2.level)
                                    FROM incident_detail idt2
                                    JOIN severity_level sl2 ON idt2.severity_level_id = sl2.id
                                    GROUP BY idt2.incident_id
                                )
                            ) AS severity_info ON severity_info.incident_id = i.id
                                                        WHERE (:companyId IS NULL OR i.company_id = :companyId)
                                                            AND severity_info.level > 3
                        """, nativeQuery = true)
    List<IncidentResponse> findIncidentsWithSeverityAboveThree(@Param("companyId") Long companyId);

    @Query("SELECT i.id as id, i.title AS title, i.location.name AS location,  i.occurredAt AS incidentDate,i.status as status, i.number as number , i.discoveryTime as discoveryDate, i.reporterId as reporterId FROM Incident i where i.id=:id AND (:companyId IS NULL OR i.companyId = :companyId)")
    Optional<IncidentResponse> findByIncidentId(@Param("id") Long id, @Param("companyId") Long companyId);

    @Query("SELECT i FROM Incident i WHERE FUNCTION('YEAR', i.createdAt) = :year AND (:companyId IS NULL OR i.companyId = :companyId) ORDER BY i.id DESC")
    List<Incident> findTopByYearOrderByIdDesc(@Param("year") int year, @Param("companyId") Long companyId,
            Pageable pageable);

    @Query("""
            SELECT FUNCTION('MONTH', COALESCE(i.occurredAt, i.createdAt)) AS month,
                   COUNT(i.id) AS totalIncidents,
                   SUM(CASE WHEN i.status = com.minexpert.hns.enums.IncidentStatus.CLOSED THEN 1 ELSE 0 END) AS closedIncidents
            FROM Incident i
                        WHERE FUNCTION('YEAR', COALESCE(i.occurredAt, i.createdAt)) = :year
                            AND (:companyId IS NULL OR i.companyId = :companyId)
            GROUP BY FUNCTION('MONTH', COALESCE(i.occurredAt, i.createdAt))
            """)
    List<MonthlyClosureSummary> findMonthlyClosureSummaryByYear(@Param("year") int year,
            @Param("companyId") Long companyId);

    long countByCompanyIdAndDepartmentIdAndCreatedAtGreaterThanEqual(Long companyId, Long departmentId,
            LocalDateTime fromDate);

    long countByDepartmentIdAndCreatedAtGreaterThanEqual(Long departmentId, LocalDateTime fromDate);
}
