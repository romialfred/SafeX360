package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.error.CausalAnalysisDTO;
import com.minexpert.hns.dto.error.CauseDTO;
import com.minexpert.hns.exception.HSException;

/**
 * Analyse causale STRUCTURÉE d'un incident (ISO 45001 §10.2 a-b).
 *
 * Réutilise le modèle de causes déjà persisté du module Erreurs
 * ({@code causal_analysis} + {@code error_cause}) mais rattaché à un INCIDENT
 * (via {@code CausalAnalysis.incidentId}). Chaque méthode (5 pourquoi, Ishikawa,
 * arbre, ICAM) devient une analyse portant N causes hiérarchisées (niveau +
 * catégorie + parent) — requêtables et reliables à une action corrective, au
 * lieu d'être aplaties en HTML ICAM jetable.
 *
 * Cloisonnement mine : toute opération vérifie que l'incident (ou l'analyse via
 * son incident) appartient à la société active.
 */
public interface IncidentCauseService {

    CausalAnalysisDTO addAnalysis(Long companyId, Long incidentId, CausalAnalysisDTO dto) throws HSException;

    List<CausalAnalysisDTO> listAnalyses(Long companyId, Long incidentId) throws HSException;

    CauseDTO addCause(Long companyId, Long analysisId, CauseDTO dto) throws HSException;

    List<CauseDTO> listCauses(Long companyId, Long analysisId) throws HSException;

    /** Toutes les causes d'un incident, toutes analyses confondues (agrégation, picker action). */
    List<CauseDTO> listCausesByIncident(Long companyId, Long incidentId) throws HSException;

    void deleteCause(Long companyId, Long causeId) throws HSException;
}
