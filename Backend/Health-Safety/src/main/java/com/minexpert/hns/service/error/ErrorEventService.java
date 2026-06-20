package com.minexpert.hns.service.error;

import java.util.List;

import com.minexpert.hns.dto.error.CausalAnalysisDTO;
import com.minexpert.hns.dto.error.CauseDTO;
import com.minexpert.hns.dto.error.ErrorClassificationDTO;
import com.minexpert.hns.dto.error.ErrorEventDTO;
import com.minexpert.hns.dto.error.ErrorEventHistoryDTO;
import com.minexpert.hns.dto.error.ErrorKpiDTO;
import com.minexpert.hns.dto.error.JustCultureAssessmentDTO;
import com.minexpert.hns.dto.error.StatusUpdateRequest;
import com.minexpert.hns.enums.ErrorEventStatus;
import com.minexpert.hns.exception.HSException;

/**
 * Service metier du module Gestion des Erreurs : cycle de vie de l'evenement
 * erreur et de ses sous-objets (classification, analyse causale, culture juste,
 * historique) ainsi que les agregats KPI.
 */
public interface ErrorEventService {

    // ─── Evenement erreur ────────────────────────────────────────────────────

    ErrorEventDTO create(Long companyId, ErrorEventDTO dto) throws HSException;

    ErrorEventDTO updateStatus(Long companyId, Long id, StatusUpdateRequest request) throws HSException;

    ErrorEventDTO getById(Long companyId, Long id) throws HSException;

    List<ErrorEventDTO> list(Long companyId, ErrorEventStatus status, Long eventTypeId) throws HSException;

    List<ErrorEventHistoryDTO> getHistory(Long companyId, Long id) throws HSException;

    // ─── Classification ──────────────────────────────────────────────────────

    ErrorClassificationDTO upsertClassification(Long companyId, Long errorEventId, ErrorClassificationDTO dto)
            throws HSException;

    ErrorClassificationDTO getClassification(Long companyId, Long errorEventId) throws HSException;

    // ─── Analyse causale + causes ──────────────────────────────────────────────

    CausalAnalysisDTO addCausalAnalysis(Long companyId, Long errorEventId, CausalAnalysisDTO dto) throws HSException;

    List<CausalAnalysisDTO> listCausalAnalyses(Long companyId, Long errorEventId) throws HSException;

    CauseDTO addCause(Long companyId, Long causalAnalysisId, CauseDTO dto) throws HSException;

    List<CauseDTO> listCauses(Long companyId, Long causalAnalysisId) throws HSException;

    void deleteCause(Long companyId, Long causeId) throws HSException;

    // ─── Culture juste (Just Culture) ───────────────────────────────────────────

    JustCultureAssessmentDTO upsertJustCulture(Long companyId, Long errorEventId, JustCultureAssessmentDTO dto)
            throws HSException;

    JustCultureAssessmentDTO getJustCulture(Long companyId, Long errorEventId) throws HSException;

    // ─── KPI ─────────────────────────────────────────────────────────────────

    ErrorKpiDTO computeKpis(Long companyId) throws HSException;
}
