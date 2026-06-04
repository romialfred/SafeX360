package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.CorrectiveActionDTO;
import com.minexpert.hns.dto.response.CorrectiveActionResponse;
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

}
