package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.InvestigationTimelineEventDTO;
import com.minexpert.hns.dto.WitnessStatementDTO;
import com.minexpert.hns.exception.HSException;

/**
 * Gouvernance d'enquête (ISO 45001 §10.2) — frise chronologique (ECFC) et
 * témoignages structurés. Toutes les opérations sont cloisonnées par mine via
 * l'enquête parente.
 */
public interface InvestigationGovernanceService {

    InvestigationTimelineEventDTO addTimelineEvent(Long companyId, Long investigationId,
            InvestigationTimelineEventDTO dto) throws HSException;

    List<InvestigationTimelineEventDTO> listTimelineEvents(Long companyId, Long investigationId) throws HSException;

    void deleteTimelineEvent(Long companyId, Long eventId) throws HSException;

    WitnessStatementDTO addWitnessStatement(Long companyId, Long investigationId,
            WitnessStatementDTO dto) throws HSException;

    List<WitnessStatementDTO> listWitnessStatements(Long companyId, Long investigationId) throws HSException;

    void deleteWitnessStatement(Long companyId, Long statementId) throws HSException;
}
