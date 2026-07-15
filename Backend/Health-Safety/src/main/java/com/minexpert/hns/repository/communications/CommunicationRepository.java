package com.minexpert.hns.repository.communications;

import com.minexpert.hns.entity.communications.Communication;
import com.minexpert.hns.repository.communications.projection.CommunicationCategoryCountView;
import com.minexpert.hns.repository.communications.projection.CommunicationDepartmentCountView;
import com.minexpert.hns.repository.communications.projection.CommunicationSummaryView;
import com.minexpert.hns.repository.communications.projection.CommunicationTypeCountView;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommunicationRepository extends JpaRepository<Communication, Long> {
    List<Communication> findByDepartmentId(Long departmentId);

    // ── Cloisonnement par mine (companyId). null = pas de filtre. ───────────

    @Query("SELECT c FROM Communication c WHERE c.departmentId = :departmentId "
            + "AND (:companyId IS NULL OR c.companyId = :companyId)")
    List<Communication> findByDepartmentIdAndCompany(@Param("departmentId") Long departmentId,
            @Param("companyId") Long companyId);

    @Query("""
            SELECT c.id AS id,
                   c.category AS category,
                   c.createdAt AS createdAt,
                   c.departmentId AS departmentId,
                   c.expiresAt AS expiresAt,
                   c.recipients AS recipients,
                   c.senderName AS senderName,
                   c.title AS title,
                   c.type AS type,
                   z.id AS zoneId,
                   c.urgency AS urgency,
                   ct AS schedule
            FROM Communication c
            LEFT JOIN c.zone z
            LEFT JOIN CommTime ct ON ct.communication = c
            WHERE (:companyId IS NULL OR c.companyId = :companyId)
            ORDER BY c.createdAt DESC
            """)
    List<CommunicationSummaryView> findSummaries(@Param("companyId") Long companyId,
            Pageable pageable);

    default List<CommunicationSummaryView> findAllSummaries(Long companyId) {
        return findSummaries(companyId, Pageable.unpaged());
    }

    @Query("""
            SELECT c.type AS type,
                   COUNT(c) AS total
            FROM Communication c
            WHERE (:companyId IS NULL OR c.companyId = :companyId)
            GROUP BY c.type
            ORDER BY COUNT(c) DESC
            """)
    List<CommunicationTypeCountView> countByType(@Param("companyId") Long companyId);

    @Query("""
            SELECT c.category AS category,
                   COUNT(c) AS total
            FROM Communication c
            WHERE (:companyId IS NULL OR c.companyId = :companyId)
            GROUP BY c.category
            ORDER BY COUNT(c) DESC
            """)
    List<CommunicationCategoryCountView> countByCategory(@Param("companyId") Long companyId);

    @Query("""
            SELECT c.departmentId AS departmentId,
                   COUNT(c) AS total
            FROM Communication c
            WHERE (:companyId IS NULL OR c.companyId = :companyId)
            GROUP BY c.departmentId
            ORDER BY COUNT(c) DESC
            """)
    List<CommunicationDepartmentCountView> countByDepartment(@Param("companyId") Long companyId);
}
