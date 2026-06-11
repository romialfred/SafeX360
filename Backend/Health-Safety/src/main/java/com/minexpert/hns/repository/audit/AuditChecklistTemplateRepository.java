package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.audit.AuditChecklistTemplate;

/**
 * LOT 52 — Accès aux questions types de checklist par référentiel ISO.
 */
public interface AuditChecklistTemplateRepository extends CrudRepository<AuditChecklistTemplate, Long> {

    List<AuditChecklistTemplate> findByActiveTrueOrderByReferentialAscOrderIndexAsc();

    List<AuditChecklistTemplate> findByReferentialAndActiveTrueOrderByOrderIndexAsc(String referential);
}
