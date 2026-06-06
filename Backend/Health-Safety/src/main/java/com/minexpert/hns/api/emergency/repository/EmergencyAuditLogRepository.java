package com.minexpert.hns.api.emergency.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.api.emergency.entity.EmergencyAuditLog;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;

/**
 * Accès BDD au journal d'audit immuable Emergency.
 *
 * <p>Pas d'écriture autre que {@code save(EmergencyAuditLog)} (création seule).
 * Les UPDATE/DELETE sont bloqués au niveau base (triggers) et au niveau JPA
 * ({@code @Immutable}).</p>
 */
public interface EmergencyAuditLogRepository extends JpaRepository<EmergencyAuditLog, Long> {

    Page<EmergencyAuditLog> findByCompanyIdOrderByCreatedAtDesc(Long companyId, Pageable pageable);

    Page<EmergencyAuditLog> findByEventTypeOrderByCreatedAtDesc(EmergencyAuditEventType type, Pageable pageable);

    @Query("SELECT a FROM EmergencyAuditLog a " +
           "WHERE (:companyId IS NULL OR a.companyId = :companyId) " +
           "AND a.createdAt BETWEEN :from AND :to " +
           "ORDER BY a.createdAt DESC")
    List<EmergencyAuditLog> findInRange(@Param("companyId") Long companyId,
                                        @Param("from") LocalDateTime from,
                                        @Param("to") LocalDateTime to);
}
