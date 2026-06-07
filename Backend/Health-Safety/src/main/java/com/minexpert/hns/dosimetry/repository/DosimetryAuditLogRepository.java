package com.minexpert.hns.dosimetry.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;

/**
 * DosimetryAuditLog est append-only (cf. triggers SQL BEFORE UPDATE/DELETE).
 * Aucune methode de mutation ne doit etre exposee ici, seulement save (insert) et lectures.
 */
@Repository
public interface DosimetryAuditLogRepository extends JpaRepository<DosimetryAuditLog, Long> {

    List<DosimetryAuditLog> findByUserId(Long userId);

    List<DosimetryAuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId);

    List<DosimetryAuditLog> findByAction(String action);

    List<DosimetryAuditLog> findByTimestampBetween(LocalDateTime from, LocalDateTime to);
}
