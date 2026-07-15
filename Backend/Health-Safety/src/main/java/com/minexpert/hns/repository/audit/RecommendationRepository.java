package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.audit.RecommendationDetails;
import com.minexpert.hns.entity.audit.Recommendation;
import com.minexpert.hns.enums.RecommendationStatus;

public interface RecommendationRepository extends CrudRepository<Recommendation, Long> {
    List<Recommendation> findByAudit_Id(Long auditId);

    /** LOT 52 — recommandations de tous les audits d'un programme. */
    List<Recommendation> findByAudit_IdIn(List<Long> auditIds);

    @Query("""
                SELECT
                    r.id AS id,
                    r.title AS title,
                    a.title AS auditTitle,
                    a.id AS auditId,
                    r.priority as priority,
                    r.actionManagerId AS actionManagerId,
                    r.deadline AS deadline,
                    r.progress AS progress,
                    r.status AS status
                FROM Recommendation r
                LEFT JOIN r.audit a
                WHERE (:companyId IS NULL OR r.companyId = :companyId)
            """)
    List<RecommendationDetails> findAllRecommendationDetails(@Param("companyId") Long companyId);

    @Query("""
                SELECT
                    r.id AS id,
                    r.title AS title,
                    a.title AS auditTitle,
                    a.id AS auditId,
                    r.priority as priority,
                    r.actionManagerId AS actionManagerId,
                    r.deadline AS deadline,
                    r.progress AS progress,
                    r.status AS status
                FROM Recommendation r
                LEFT JOIN r.audit a
                WHERE r.status = :status
                AND (:companyId IS NULL OR r.companyId = :companyId)
            """)
    List<RecommendationDetails> findRecommendationDetailsByStatus(@Param("status") RecommendationStatus status,
            @Param("companyId") Long companyId);
}
