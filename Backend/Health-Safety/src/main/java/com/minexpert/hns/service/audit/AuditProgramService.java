package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.AuditProgramDTO;
import com.minexpert.hns.dto.audit.AuditProgramKpisDTO;
import com.minexpert.hns.dto.audit.RiskSuggestionDTO;
import com.minexpert.hns.exception.HSException;

/**
 * LOT 52 — Gestion du programme d'audit annuel (ISO 19011:2018 §5).
 */
public interface AuditProgramService {

    Long createProgram(AuditProgramDTO programDTO) throws HSException;

    void updateProgram(AuditProgramDTO programDTO, Long companyId) throws HSException;

    AuditProgramDTO getProgram(Long id) throws HSException;

    List<AuditProgramDTO> getAllPrograms(Long companyId) throws HSException;

    void approveProgram(Long id, Long approvedBy, Long companyId) throws HSException;

    void deleteProgram(Long id, Long companyId) throws HSException;

    /**
     * Priorisation basée risques (ISO 19011 §5.4.2) : pour chaque domaine
     * d'audit, score = NC ouvertes × 2 + mois depuis le dernier audit clôturé
     * (plafonné à 24), avec fréquence suggérée.
     */
    List<RiskSuggestionDTO> getRiskSuggestions(Long programId) throws HSException;

    /** Indicateurs de pilotage du programme (ISO 19011 §5.6). */
    AuditProgramKpisDTO getProgramKpis(Long programId) throws HSException;
}
