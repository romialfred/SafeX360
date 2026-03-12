package com.minexpert.hns.repository.risks;

import com.minexpert.hns.entity.risks.Risk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RiskRepository extends JpaRepository<Risk, Long> {

    @Query("""
        SELECT r FROM Risk r
        WHERE (:status IS NULL OR r.status = :status)
          AND (:departmentId IS NULL OR r.departmentId = :departmentId)
          AND (:ownerId IS NULL OR r.ownerId = :ownerId)
          AND (:fromDt IS NULL OR r.createdAt >= :fromDt)
          AND (:toDt IS NULL OR r.createdAt < :toDt)
          AND (
                :q IS NULL OR
                LOWER(COALESCE(r.title, '')) LIKE CONCAT('%', LOWER(:q), '%') OR
                LOWER(COALESCE(r.description, '')) LIKE CONCAT('%', LOWER(:q), '%')
          )
        ORDER BY r.createdAt ASC
    """)
    List<Risk> findByFilters(
            @Param("status") String status,
            @Param("departmentId") Long departmentId,
            @Param("ownerId") Long ownerId,
            @Param("fromDt") LocalDateTime fromDt,
            @Param("toDt") LocalDateTime toDt,
            @Param("q") String q
    );

    List<Risk> findByRiskLevelIsNotNull();
}
