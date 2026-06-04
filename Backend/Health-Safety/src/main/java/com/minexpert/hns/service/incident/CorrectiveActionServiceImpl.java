package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.CorrectiveActionDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.CorrectiveActionResponse;
import com.minexpert.hns.entity.incident.CorrectiveAction;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.CorrectiveActionRepository;

@Service
@Transactional
public class CorrectiveActionServiceImpl implements CorrectiveActionService {

    @Autowired
    private CorrectiveActionRepository correctiveActionRepository;

    @Autowired
    private HrmsClient hrmsClient;

    @Override
    public List<CorrectiveActionDTO> getCorrectiveActionsByIncidentId(Long incidentId) throws HSException {
        return ((List<CorrectiveAction>) correctiveActionRepository.findByIncidentId(incidentId)).stream()
                .map(CorrectiveAction::toDTO)
                .toList();

    }

    @Override
    public void deleteCorrectiveAction(Long id) throws HSException {
        correctiveActionRepository.deleteById(id);
    }

    @Override
    public List<CorrectiveActionResponse> getAllActions() throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository.findAllActions();

        List<Long> empIds = actions.stream().map(CorrectiveActionResponse::getAssignedEmployeeId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToDtoMap = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        actions.forEach(action -> {
            if (action.getAssignedEmployeeId() != null) {
                action.setAssignedEmployeeName(empIdToDtoMap.get(action.getAssignedEmployeeId()));
            }
        });
        return actions;

    }

    @Override
    public List<CorrectiveActionResponse> getAllAdhocActions() throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository.findAdhocActions();

        List<Long> empIds = actions.stream().map(CorrectiveActionResponse::getAssignedEmployeeId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToDtoMap = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        actions.forEach(action -> {
            if (action.getAssignedEmployeeId() != null) {
                action.setAssignedEmployeeName(empIdToDtoMap.get(action.getAssignedEmployeeId()));
            }
        });
        return actions;
    }

    @Override
    public List<CorrectiveActionResponse> getAllPendingAdhocActions() throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository
                .findAdhocActionsByStatus(ActionStatus.PENDING);

        List<Long> empIds = actions.stream().map(CorrectiveActionResponse::getAssignedEmployeeId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToDtoMap = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        actions.forEach(action -> {
            if (action.getAssignedEmployeeId() != null) {
                action.setAssignedEmployeeName(empIdToDtoMap.get(action.getAssignedEmployeeId()));
            }
        });
        return actions;
    }

    @Override
    public List<CorrectiveActionResponse> getActionsByIncidentId(Long incidentId) throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository.findActionsByIncidentId(incidentId);
        List<Long> empIds = actions.stream().map(CorrectiveActionResponse::getAssignedEmployeeId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToDtoMap = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        actions.forEach(action -> {
            if (action.getAssignedEmployeeId() != null) {
                action.setAssignedEmployeeName(empIdToDtoMap.get(action.getAssignedEmployeeId()));
            }
        });
        return actions;
    }

    @Override
    public Long addCorrectiveAction(CorrectiveActionDTO correctiveActionDTO) throws HSException {
        CorrectiveAction correctiveAction = correctiveActionDTO.toEntity();
        correctiveAction.setCreatedAt(LocalDateTime.now());
        correctiveAction.setUpdatedAt(LocalDateTime.now());
        correctiveAction.setProgress(0);
        correctiveActionRepository.save(correctiveAction);
        return correctiveAction.getId();
    }

    @Override
    public List<CorrectiveActionResponse> getActionsByInspectionId(Long inspectionId) throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository.findActionsByInspectionId(inspectionId);
        List<Long> empIds = actions.stream().map(CorrectiveActionResponse::getAssignedEmployeeId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToDtoMap = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        actions.forEach(action -> {
            if (action.getAssignedEmployeeId() != null) {
                action.setAssignedEmployeeName(empIdToDtoMap.get(action.getAssignedEmployeeId()));
            }
        });
        return actions;
    }

    @Override
    public List<CorrectiveActionResponse> getActionsByActivityId(Long activityId) throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository.findActionsByActivityId(activityId);
        List<Long> empIds = actions.stream().map(CorrectiveActionResponse::getAssignedEmployeeId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToDtoMap = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        actions.forEach(action -> {
            if (action.getAssignedEmployeeId() != null) {
                action.setAssignedEmployeeName(empIdToDtoMap.get(action.getAssignedEmployeeId()));
            }
        });
        return actions;
    }

    @Override
    public List<CorrectiveActionResponse> getActionsByDepartmentId(Long departmentId) throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository.findActionsByDepartmentId(departmentId);
        if (actions.isEmpty()) {
            return actions;
        }
        List<Long> empIds = actions.stream().map(CorrectiveActionResponse::getAssignedEmployeeId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToDtoMap = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        actions.forEach(action -> {
            if (action.getDepartmentId() == null) {
                action.setDepartmentId(departmentId);
            }
            if (action.getAssignedEmployeeId() != null) {
                action.setAssignedEmployeeName(empIdToDtoMap.get(action.getAssignedEmployeeId()));
            }
        });
        return actions;
    }

    @Override
    public void updateCorrectiveAction(CorrectiveActionDTO correctiveActionDTO) throws HSException {
        CorrectiveAction correctiveAction = correctiveActionRepository.findById(correctiveActionDTO.getId())
                .orElseThrow(() -> new HSException("CORRECTIVE_ACTION_NOT_FOUND"));
        correctiveAction.setActionName(correctiveActionDTO.getActionName());
        correctiveAction.setDescription(correctiveActionDTO.getDescription());
        correctiveAction.setAssignedEmployeeId(correctiveActionDTO.getAssignedEmployeeId());
        correctiveAction.setDepartmentId(correctiveActionDTO.getDepartmentId());
        correctiveAction.setOwnerId(correctiveActionDTO.getOwnerId());
        correctiveAction.setDeadline(correctiveActionDTO.getDeadline());
        correctiveAction.setStatus(correctiveActionDTO.getStatus());
        correctiveAction.setUpdatedAt(LocalDateTime.now());
        correctiveActionRepository.save(correctiveAction);
    }

    @Override
    public void approveAction(Long id) throws HSException {
        CorrectiveAction correctiveAction = correctiveActionRepository.findById(id)
                .orElseThrow(() -> new HSException("CORRECTIVE_ACTION_NOT_FOUND"));
        correctiveAction.setStatus(ActionStatus.IN_PROGRESS);
        correctiveAction.setUpdatedAt(LocalDateTime.now());
        correctiveActionRepository.save(correctiveAction);
    }

    @Override
    public void cancelAction(Long id) throws HSException {
        CorrectiveAction correctiveAction = correctiveActionRepository.findById(id)
                .orElseThrow(() -> new HSException("CORRECTIVE_ACTION_NOT_FOUND"));
        correctiveAction.setStatus(ActionStatus.CANCELLED);
        correctiveAction.setUpdatedAt(LocalDateTime.now());
        correctiveActionRepository.save(correctiveAction);
    }

    @Override
    public List<CorrectiveActionResponse> getActionsByNonConformityId(Long nonConformityId) throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository
                .findActionsByNonConformityId(nonConformityId);
        List<Long> empIds = actions.stream().map(CorrectiveActionResponse::getAssignedEmployeeId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToDtoMap = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        actions.forEach(action -> {
            if (action.getAssignedEmployeeId() != null) {
                action.setAssignedEmployeeName(empIdToDtoMap.get(action.getAssignedEmployeeId()));
            }
        });
        return actions;
    }

    @Override
    public List<Long> saveOrUpdateCorrectiveActions(List<CorrectiveActionDTO> correctiveActionDTOs) throws HSException {
        List<Long> ids = new java.util.ArrayList<>();
        for (CorrectiveActionDTO dto : correctiveActionDTOs) {
            if (dto.getId() == null) {
                ids.add(addCorrectiveAction(dto));
            } else {
                updateCorrectiveAction(dto);
                ids.add(dto.getId());
            }
        }
        return ids;
    }

    @Override
    public CorrectiveActionResponse getCorrectiveActionById(Long id) throws HSException {
        CorrectiveActionResponse action = correctiveActionRepository.getCorrectiveActionById(id);
        if (action == null) {
            throw new HSException("CORRECTIVE_ACTION_NOT_FOUND");
        }

        if (action.getAssignedEmployeeId() != null) {
            List<EmployeeNameDTO> empNames = hrmsClient
                    .getEmployeeNameByIds(java.util.List.of(action.getAssignedEmployeeId()));
            if (empNames != null && !empNames.isEmpty()) {
                action.setAssignedEmployeeName(empNames.get(0).getName());
            }
        }
        return action;
    }

    @Override
    public List<CorrectiveActionResponse> getAllPendingActions() throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository
                .findAllActionsByStatus(ActionStatus.PENDING);
        List<Long> empIds = actions.stream()
                .map(CorrectiveActionResponse::getAssignedEmployeeId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToDtoMap = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        actions.forEach(action -> {
            if (action.getAssignedEmployeeId() != null) {
                action.setAssignedEmployeeName(empIdToDtoMap.get(action.getAssignedEmployeeId()));
            }
        });
        return actions;
    }

}
