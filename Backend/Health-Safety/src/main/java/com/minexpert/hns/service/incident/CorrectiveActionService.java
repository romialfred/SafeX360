package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.CorrectiveActionDTO;
import com.minexpert.hns.dto.response.CorrectiveActionResponse;
import com.minexpert.hns.exception.HSException;

public interface CorrectiveActionService {

    public Long addCorrectiveAction(CorrectiveActionDTO correctiveActionDTO) throws HSException;

    public List<CorrectiveActionDTO> getCorrectiveActionsByIncidentId(Long incidentId) throws HSException;

    public void deleteCorrectiveAction(Long id) throws HSException;

    public List<CorrectiveActionResponse> getAllActions() throws HSException;

    public List<CorrectiveActionResponse> getAllAdhocActions() throws HSException;

    public List<CorrectiveActionResponse> getAllPendingAdhocActions() throws HSException;

    // Retrieve all corrective actions with PENDING status
    public List<CorrectiveActionResponse> getAllPendingActions() throws HSException;

    public List<CorrectiveActionResponse> getActionsByIncidentId(Long incidentId) throws HSException;

    public List<CorrectiveActionResponse> getActionsByInspectionId(Long inspectionId) throws HSException;

    public List<CorrectiveActionResponse> getActionsByActivityId(Long activityId) throws HSException;

    public List<CorrectiveActionResponse> getActionsByDepartmentId(Long departmentId) throws HSException;

    public List<CorrectiveActionResponse> getActionsByNonConformityId(Long nonConformityId) throws HSException;

    public void updateCorrectiveAction(CorrectiveActionDTO correctiveActionDTO) throws HSException;

    public List<Long> saveOrUpdateCorrectiveActions(List<CorrectiveActionDTO> correctiveActionDTOs) throws HSException;

    public CorrectiveActionResponse getCorrectiveActionById(Long id) throws HSException;

    public void approveAction(Long id) throws HSException;

    public void cancelAction(Long id) throws HSException;

}
