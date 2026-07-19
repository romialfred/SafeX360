package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.audit.EffectivenessCheck;

/**
 * LOT 52 — Accès aux vérifications d'efficacité (ISO 19011:2026 — suivi des audits).
 */
public interface EffectivenessCheckRepository extends CrudRepository<EffectivenessCheck, Long> {

    List<EffectivenessCheck> findByVerdictIsNullOrderByDueDateAsc();

    /** Cloisonnement par mine : vérifications en attente d'une mine (companyId null => toutes). */
    @Query("SELECT c FROM EffectivenessCheck c WHERE c.verdict IS NULL "
            + "AND (:companyId IS NULL OR c.companyId = :companyId) ORDER BY c.dueDate ASC")
    List<EffectivenessCheck> findPendingByCompany(@Param("companyId") Long companyId);

    List<EffectivenessCheck> findByRecommendation_Id(Long recommendationId);

    long countByRecommendation_Audit_IdInAndVerdictIsNull(List<Long> auditIds);
}
