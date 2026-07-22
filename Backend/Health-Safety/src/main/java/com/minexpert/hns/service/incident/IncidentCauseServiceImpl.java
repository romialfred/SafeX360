package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.error.CausalAnalysisDTO;
import com.minexpert.hns.dto.error.CauseDTO;
import com.minexpert.hns.entity.error.Cause;
import com.minexpert.hns.entity.error.CausalAnalysis;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.enums.IncidentStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.error.CausalAnalysisRepository;
import com.minexpert.hns.repository.error.CauseRepository;
import com.minexpert.hns.repository.incident.IncidentRepository;

@Service
@Transactional
public class IncidentCauseServiceImpl implements IncidentCauseService {

    @Autowired
    private CausalAnalysisRepository causalAnalysisRepository;
    @Autowired
    private CauseRepository causeRepository;
    @Autowired
    private IncidentRepository incidentRepository;

    /**
     * Verifie que l'incident existe et appartient a la societe active. companyId
     * nul (vue « Toutes les Mines ») est tolere par findByIdWithCompanyContext
     * (motif :companyId IS NULL) — l'incident reste la source de verite.
     */
    private Incident requireIncident(Long companyId, Long incidentId) throws HSException {
        if (incidentId == null) {
            throw new HSException("INCIDENT_NOT_FOUND");
        }
        return incidentRepository.findByIdWithCompanyContext(incidentId, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
    }

    /**
     * Charge l'INCIDENT porteur d'une analyse (via son incidentId) et verifie le
     * cloisonnement. Rejette les analyses d'erreur (incidentId null) — etancheite
     * inter-module. Renvoie l'incident pour permettre le controle d'editabilite.
     */
    private Incident requireIncidentAnalysis(Long companyId, Long analysisId) throws HSException {
        CausalAnalysis a = causalAnalysisRepository.findById(analysisId)
                .orElseThrow(() -> new HSException("CAUSAL_ANALYSIS_NOT_FOUND"));
        if (a.getIncidentId() == null) {
            throw new HSException("CAUSAL_ANALYSIS_NOT_FOUND");
        }
        return requireIncident(companyId, a.getIncidentId());
    }

    /**
     * Verrou serveur : on ne modifie pas l'analyse causale d'un incident CLOS ou
     * REJETE (coherent avec le verrouillage de l'investigation, jusqu'ici seulement
     * cote front). Les LECTURES restent ouvertes.
     */
    private void assertEditable(Incident incident) throws HSException {
        IncidentStatus st = incident.getStatus();
        if (st == IncidentStatus.CLOSED || st == IncidentStatus.REJECTED) {
            throw new HSException("INCIDENT_LOCKED");
        }
    }

    @Override
    public CausalAnalysisDTO addAnalysis(Long companyId, Long incidentId, CausalAnalysisDTO dto) throws HSException {
        assertEditable(requireIncident(companyId, incidentId));
        if (dto == null || dto.getMethod() == null) {
            throw new HSException("CAUSAL_METHOD_REQUIRED");
        }
        CausalAnalysis a = new CausalAnalysis();
        a.setIncidentId(incidentId);
        a.setMethod(dto.getMethod());
        a.setSummary(dto.getSummary());
        a.setConductedBy(dto.getConductedBy());
        a.setConductedAt(dto.getConductedAt() != null ? dto.getConductedAt() : LocalDateTime.now());
        return CausalAnalysisDTO.fromEntity(causalAnalysisRepository.save(a));
    }

    @Override
    public List<CausalAnalysisDTO> listAnalyses(Long companyId, Long incidentId) throws HSException {
        requireIncident(companyId, incidentId);
        List<CausalAnalysisDTO> result = new ArrayList<>();
        for (CausalAnalysis a : causalAnalysisRepository.findByIncidentId(incidentId)) {
            result.add(CausalAnalysisDTO.fromEntity(a));
        }
        return result;
    }

    @Override
    public CauseDTO addCause(Long companyId, Long analysisId, CauseDTO dto) throws HSException {
        assertEditable(requireIncidentAnalysis(companyId, analysisId));
        if (dto == null || dto.getLabel() == null || dto.getLabel().isBlank()) {
            throw new HSException("CAUSE_LABEL_REQUIRED");
        }
        Cause c = new Cause();
        c.setCausalAnalysisId(analysisId);
        c.setLabel(dto.getLabel());
        c.setLevel(dto.getLevel());
        c.setCategory(dto.getCategory());
        c.setParentCauseId(dto.getParentCauseId());
        return CauseDTO.fromEntity(causeRepository.save(c));
    }

    @Override
    public List<CauseDTO> listCauses(Long companyId, Long analysisId) throws HSException {
        requireIncidentAnalysis(companyId, analysisId);
        List<CauseDTO> result = new ArrayList<>();
        for (Cause c : causeRepository.findByCausalAnalysisId(analysisId)) {
            result.add(CauseDTO.fromEntity(c));
        }
        return result;
    }

    @Override
    public List<CauseDTO> listCausesByIncident(Long companyId, Long incidentId) throws HSException {
        requireIncident(companyId, incidentId);
        List<CauseDTO> result = new ArrayList<>();
        for (CausalAnalysis a : causalAnalysisRepository.findByIncidentId(incidentId)) {
            for (Cause c : causeRepository.findByCausalAnalysisId(a.getId())) {
                result.add(CauseDTO.fromEntity(c));
            }
        }
        return result;
    }

    @Override
    public void deleteCause(Long companyId, Long causeId) throws HSException {
        Cause c = causeRepository.findById(causeId)
                .orElseThrow(() -> new HSException("CAUSE_NOT_FOUND"));
        assertEditable(requireIncidentAnalysis(companyId, c.getCausalAnalysisId()));
        causeRepository.delete(c);
    }
}
