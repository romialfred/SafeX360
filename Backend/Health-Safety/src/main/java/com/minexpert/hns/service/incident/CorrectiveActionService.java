package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.CorrectiveActionDTO;
import com.minexpert.hns.dto.EffectivenessReviewDTO;
import com.minexpert.hns.dto.response.CorrectiveActionResponse;
import com.minexpert.hns.dto.response.EffectivenessDTO;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.exception.HSException;

public interface CorrectiveActionService {

    Long addCorrectiveAction(Long companyId, CorrectiveActionDTO correctiveActionDTO) throws HSException;

    List<CorrectiveActionDTO> getCorrectiveActionsByIncidentId(Long companyId, Long incidentId) throws HSException;

    void deleteCorrectiveAction(Long companyId, Long id) throws HSException;

    List<CorrectiveActionResponse> getAllActions(Long companyId) throws HSException;

    List<CorrectiveActionResponse> getAllAdhocActions(Long companyId) throws HSException;

    List<CorrectiveActionResponse> getAllPendingAdhocActions(Long companyId) throws HSException;

    // Retrieve all corrective actions with PENDING status
    List<CorrectiveActionResponse> getAllPendingActions(Long companyId) throws HSException;

    List<CorrectiveActionResponse> getActionsByIncidentId(Long companyId, Long incidentId) throws HSException;

    List<CorrectiveActionResponse> getActionsByInspectionId(Long companyId, Long inspectionId) throws HSException;

    List<CorrectiveActionResponse> getActionsByActivityId(Long companyId, Long activityId) throws HSException;

    List<CorrectiveActionResponse> getActionsByDepartmentId(Long companyId, Long departmentId) throws HSException;

    List<CorrectiveActionResponse> getActionsByNonConformityId(Long companyId, Long nonConformityId) throws HSException;

    void updateCorrectiveAction(Long companyId, CorrectiveActionDTO correctiveActionDTO) throws HSException;

    List<Long> saveOrUpdateCorrectiveActions(Long companyId, List<CorrectiveActionDTO> correctiveActionDTOs)
            throws HSException;

    CorrectiveActionResponse getCorrectiveActionById(Long companyId, Long id) throws HSException;

    void approveAction(Long companyId, Long id) throws HSException;

    void cancelAction(Long companyId, Long id) throws HSException;

    List<CorrectiveActionDTO> getByRiskControl(Long companyId, Long riskControlId) throws HSException;

    /**
     * Garde de transition de la machine à états des actions correctives, exposée
     * pour que la voie « avancement » (ActionProcess) respecte les mêmes règles
     * que /update (pas de saut d'état par la porte progression).
     */
    void assertActionTransition(ActionStatus current, ActionStatus target) throws HSException;

    /**
     * ISO 45001 §10.2 e — enregistre la revue d'efficacité d'une action TERMINÉE :
     * verdict, vérificateur, date, risque résiduel. Efficace → VERIFIED ; inefficace
     * → REOPENED (l'action repart).
     */
    EffectivenessDTO reviewEffectiveness(Long companyId, Long id, Long actorId, EffectivenessReviewDTO dto)
            throws HSException;

    /** État courant de la revue d'efficacité d'une action (peut être « non revue »). */
    EffectivenessDTO getEffectiveness(Long companyId, Long id) throws HSException;

    /** Répartition des actions par niveau de hiérarchie de maîtrise (§8.1.2). */
    java.util.List<com.minexpert.hns.repository.incident.projection.HierarchyCount> getControlHierarchyCounts(
            Long companyId);

}
