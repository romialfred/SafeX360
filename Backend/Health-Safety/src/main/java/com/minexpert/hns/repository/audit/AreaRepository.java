package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.audit.AreaDetails;
import com.minexpert.hns.entity.audit.Area;
import com.minexpert.hns.enums.AuditStatus;

public interface AreaRepository extends CrudRepository<Area, Long> {
    List<Area> findByAudit_Id(Long auditId);

    @Query("SELECT a.id AS id, a.auditArea.name AS areaName, a.auditArea.id AS areaId, a.purpose AS purpose "
            + "FROM Area a WHERE a.audit.id = ?1")
    List<AreaDetails> findDetailsByAuditId(Long auditId);

    /**
     * LOT 52 — Dernière date de fin d'audit clôturé par domaine couvert via les
     * zones d'exécution (complément du périmètre direct de l'audit).
     */
    @Query("SELECT a.auditArea.id, MAX(a.audit.endDate) FROM Area a "
            + "WHERE a.audit.status = :status AND a.audit.endDate IS NOT NULL GROUP BY a.auditArea.id")
    List<Object[]> findLastEndDateByAreaAndStatus(@Param("status") AuditStatus status);

}
