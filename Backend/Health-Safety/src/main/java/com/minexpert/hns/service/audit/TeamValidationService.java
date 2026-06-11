package com.minexpert.hns.service.audit;

import com.minexpert.hns.dto.audit.ValidateTeamRequest;
import com.minexpert.hns.dto.audit.ValidateTeamResponse;
import com.minexpert.hns.exception.HSException;

/**
 * LOT 52 — Validation de la composition d'une équipe d'audit
 * (ISO 19011:2018 §5.4.4 — sélection de l'équipe / §7 — compétences).
 */
public interface TeamValidationService {

    /**
     * Vérifie : (a) le responsable d'audit est qualifié lead, (b) aucun
     * auditeur n'appartient à un département audité (indépendance),
     * (c) les certifications du responsable ne sont pas expirées.
     */
    ValidateTeamResponse validateTeam(ValidateTeamRequest request) throws HSException;
}
