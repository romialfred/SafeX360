package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.audit.AuditChecklistItem;

/**
 * LOT 52 — Accès aux lignes de checklist instanciées par audit.
 */
public interface AuditChecklistItemRepository extends CrudRepository<AuditChecklistItem, Long> {

    List<AuditChecklistItem> findByAuditIdOrderByReferentialAscIdAsc(Long auditId);

    boolean existsByAuditIdAndReferential(Long auditId, String referential);
}
