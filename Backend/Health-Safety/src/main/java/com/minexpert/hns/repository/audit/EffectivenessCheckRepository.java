package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.audit.EffectivenessCheck;

/**
 * LOT 52 — Accès aux vérifications d'efficacité (ISO 19011:2018 §6.6).
 */
public interface EffectivenessCheckRepository extends CrudRepository<EffectivenessCheck, Long> {

    List<EffectivenessCheck> findByVerdictIsNullOrderByDueDateAsc();

    List<EffectivenessCheck> findByRecommendation_Id(Long recommendationId);

    long countByRecommendation_Audit_IdInAndVerdictIsNull(List<Long> auditIds);
}
