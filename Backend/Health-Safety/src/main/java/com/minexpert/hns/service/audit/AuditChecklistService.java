package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.AuditChecklistItemDTO;
import com.minexpert.hns.dto.audit.AuditChecklistTemplateDTO;
import com.minexpert.hns.exception.HSException;

/**
 * LOT 52 — Checklists d'audit par référentiel ISO (45001 / 14001 / 9001).
 */
public interface AuditChecklistService {

    /** Questions types actives, filtrées par référentiel si fourni. */
    List<AuditChecklistTemplateDTO> getTemplates(String referential) throws HSException;

    /**
     * Initialise la checklist d'un audit en copiant les templates actifs des
     * référentiels demandés (items créés A_EVALUER). Idempotent : un
     * référentiel déjà initialisé pour l'audit est ignoré.
     *
     * @return nombre d'items créés
     */
    int initChecklist(Long auditId, List<String> referentials) throws HSException;

    List<AuditChecklistItemDTO> getChecklist(Long auditId) throws HSException;

    void updateItem(Long itemId, AuditChecklistItemDTO itemDTO) throws HSException;
}
