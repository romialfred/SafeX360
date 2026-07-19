package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.audit.AuditProgram;

/**
 * LOT 52 — Accès aux programmes d'audit annuels (ISO 19011:2026).
 */
public interface AuditProgramRepository extends CrudRepository<AuditProgram, Long> {

    @Query("SELECT p FROM AuditProgram p WHERE (:companyId IS NULL OR p.companyId = :companyId) "
            + "ORDER BY p.year DESC, p.id DESC")
    List<AuditProgram> findAllWithCompany(@Param("companyId") Long companyId);
}
