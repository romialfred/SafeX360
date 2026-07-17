package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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

    public static final String CACHE_CORRECTIVE_ACTION_DTOS_BY_INCIDENT = "correctiveActionDtosByIncident";
    public static final String CACHE_CORRECTIVE_ACTION_RESPONSES_BY_INCIDENT = "correctiveActionResponsesByIncident";
    public static final String CACHE_CORRECTIVE_ACTIONS_BY_INSPECTION = "correctiveActionsByInspection";
    public static final String CACHE_CORRECTIVE_ACTIONS_BY_ACTIVITY = "correctiveActionsByActivity";
    public static final String CACHE_CORRECTIVE_ACTIONS_BY_DEPARTMENT = "correctiveActionsByDepartment";
    public static final String CACHE_CORRECTIVE_ACTIONS_BY_NON_CONFORMITY = "correctiveActionsByNonConformity";
    public static final String CACHE_CORRECTIVE_ACTIONS_ALL = "correctiveActionsAll";
    public static final String CACHE_CORRECTIVE_ACTIONS_ADHOC_ALL = "correctiveActionsAdhocAll";
    public static final String CACHE_CORRECTIVE_ACTIONS_ADHOC_PENDING = "correctiveActionsAdhocPending";
    public static final String CACHE_CORRECTIVE_ACTION_BY_ID = "correctiveActionById";
    public static final String CACHE_CORRECTIVE_ACTIONS_PENDING = "correctiveActionsPendingAll";

    @Autowired
    private CorrectiveActionRepository correctiveActionRepository;

    @Autowired
    private HrmsClient hrmsClient;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    private CorrectiveAction loadActionForCompany(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        CorrectiveAction action = correctiveActionRepository.findById(id)
                .orElseThrow(() -> new HSException("CORRECTIVE_ACTION_NOT_FOUND"));
        if (companyId != null && !companyId.equals(action.getCompanyId())) {
            throw new HSException("CORRECTIVE_ACTION_NOT_FOUND");
        }
        return action;
    }

    @Override
    @Cacheable(cacheNames = CACHE_CORRECTIVE_ACTION_DTOS_BY_INCIDENT, key = "#companyId != null ? (#companyId + '-' + #incidentId) : 'ALL-' + #incidentId")
    public List<CorrectiveActionDTO> getCorrectiveActionsByIncidentId(Long companyId, Long incidentId)
            throws HSException {
        List<CorrectiveAction> actions = correctiveActionRepository.findByIncidentId(companyId, incidentId);
        return actions.stream().map(CorrectiveAction::toDTO).toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = {
                    CACHE_CORRECTIVE_ACTION_DTOS_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTION_RESPONSES_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_INSPECTION,
                    CACHE_CORRECTIVE_ACTIONS_BY_ACTIVITY,
                    CACHE_CORRECTIVE_ACTIONS_BY_DEPARTMENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_NON_CONFORMITY,
                    CACHE_CORRECTIVE_ACTIONS_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_PENDING,
                    CACHE_CORRECTIVE_ACTION_BY_ID,
                    CACHE_CORRECTIVE_ACTIONS_PENDING
            }, allEntries = true)
    })
    public void deleteCorrectiveAction(Long companyId, Long id) throws HSException {
        CorrectiveAction action = loadActionForCompany(companyId, id);
        correctiveActionRepository.delete(action);
    }

    @Override
    @Cacheable(cacheNames = CACHE_CORRECTIVE_ACTIONS_ALL, key = "#companyId != null ? #companyId : 'ALL'")
    public List<CorrectiveActionResponse> getAllActions(Long companyId) throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository.findAllActions(companyId);

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
    @Cacheable(cacheNames = CACHE_CORRECTIVE_ACTIONS_ADHOC_ALL, key = "#companyId != null ? #companyId : 'ALL'")
    public List<CorrectiveActionResponse> getAllAdhocActions(Long companyId) throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository.findAdhocActions(companyId);

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
    @Cacheable(cacheNames = CACHE_CORRECTIVE_ACTIONS_ADHOC_PENDING, key = "#companyId != null ? #companyId : 'ALL'")
    public List<CorrectiveActionResponse> getAllPendingAdhocActions(Long companyId) throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository
                .findAdhocActionsByStatus(companyId, ActionStatus.PENDING);

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
    @Cacheable(cacheNames = CACHE_CORRECTIVE_ACTION_RESPONSES_BY_INCIDENT, key = "#companyId != null ? (#companyId + '-' + #incidentId) : 'ALL-' + #incidentId")
    public List<CorrectiveActionResponse> getActionsByIncidentId(Long companyId, Long incidentId)
            throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository.findActionsByIncidentId(companyId,
                incidentId);
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
    @Caching(evict = {
            @CacheEvict(cacheNames = {
                    CACHE_CORRECTIVE_ACTION_DTOS_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTION_RESPONSES_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_INSPECTION,
                    CACHE_CORRECTIVE_ACTIONS_BY_ACTIVITY,
                    CACHE_CORRECTIVE_ACTIONS_BY_DEPARTMENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_NON_CONFORMITY,
                    CACHE_CORRECTIVE_ACTIONS_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_PENDING,
                    CACHE_CORRECTIVE_ACTION_BY_ID,
                    CACHE_CORRECTIVE_ACTIONS_PENDING
            }, allEntries = true)
    })
    public Long addCorrectiveAction(Long companyId, CorrectiveActionDTO correctiveActionDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        correctiveActionDTO.setCompanyId(companyId);
        CorrectiveAction correctiveAction = correctiveActionDTO.toEntity();
        LocalDateTime now = LocalDateTime.now();

        // Matrice des processus (spec 4) : « Echeance >= date de creation » pour une
        // action corrective. createdAt etait pose sans jamais confronter deadline :
        // une action pouvait naitre deja OVERDUE, ce qui vide de son sens le pilotage
        // des actions (ISO 45001 10.2).
        if (correctiveAction.getDeadline() != null
                && correctiveAction.getDeadline().isBefore(now.toLocalDate())) {
            throw new HSException("ACTION_DEADLINE_BEFORE_CREATION");
        }

        correctiveAction.setCreatedAt(now);
        correctiveAction.setUpdatedAt(now);
        // Statut initial IMPOSE par le serveur (spec 2.3 : un objet nait dans son etat
        // initial, un statut transite ensuite via assertActionTransition). Le statut du
        // DTO etait repris tel quel : un POST {"status":"COMPLETED"} creait une action
        // nee terminee, sans aucune transition tracee, avec progress = 0.
        correctiveAction.setStatus(ActionStatus.PENDING);
        correctiveAction.setProgress(0);
        correctiveAction.setCompanyId(companyId);
        correctiveActionRepository.save(correctiveAction);
        return correctiveAction.getId();
    }

    @Override
    @Cacheable(cacheNames = CACHE_CORRECTIVE_ACTIONS_BY_INSPECTION, key = "#companyId != null ? (#companyId + '-' + #inspectionId) : 'ALL-' + #inspectionId")
    public List<CorrectiveActionResponse> getActionsByInspectionId(Long companyId, Long inspectionId)
            throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository
                .findActionsByInspectionId(companyId, inspectionId);
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
    @Cacheable(cacheNames = CACHE_CORRECTIVE_ACTIONS_BY_ACTIVITY, key = "#companyId != null ? (#companyId + '-' + #activityId) : 'ALL-' + #activityId")
    public List<CorrectiveActionResponse> getActionsByActivityId(Long companyId, Long activityId) throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository
                .findActionsByActivityId(companyId, activityId);
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
    @Cacheable(cacheNames = CACHE_CORRECTIVE_ACTIONS_BY_DEPARTMENT, key = "#companyId != null ? (#companyId + '-' + #departmentId) : 'ALL-' + #departmentId")
    public List<CorrectiveActionResponse> getActionsByDepartmentId(Long companyId, Long departmentId)
            throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository
                .findActionsByDepartmentId(companyId, departmentId);
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
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_CORRECTIVE_ACTION_BY_ID, key = "#companyId != null ? (#companyId + '-' + #correctiveActionDTO.id) : 'ALL-' + #correctiveActionDTO.id"),
            @CacheEvict(cacheNames = {
                    CACHE_CORRECTIVE_ACTION_DTOS_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTION_RESPONSES_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_INSPECTION,
                    CACHE_CORRECTIVE_ACTIONS_BY_ACTIVITY,
                    CACHE_CORRECTIVE_ACTIONS_BY_DEPARTMENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_NON_CONFORMITY,
                    CACHE_CORRECTIVE_ACTIONS_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_PENDING,
                    CACHE_CORRECTIVE_ACTIONS_PENDING
            }, allEntries = true)
    })
    public void updateCorrectiveAction(Long companyId, CorrectiveActionDTO correctiveActionDTO) throws HSException {
        CorrectiveAction correctiveAction = loadActionForCompany(companyId, correctiveActionDTO.getId());

        if (correctiveActionDTO.getStatus() != null
                && correctiveActionDTO.getStatus() != correctiveAction.getStatus()) {
            assertActionTransition(correctiveAction.getStatus(), correctiveActionDTO.getStatus());
        }

        correctiveAction.setActionName(correctiveActionDTO.getActionName());
        correctiveAction.setDescription(correctiveActionDTO.getDescription());
        correctiveAction.setAssignedEmployeeId(correctiveActionDTO.getAssignedEmployeeId());
        correctiveAction.setDepartmentId(correctiveActionDTO.getDepartmentId());
        correctiveAction.setOwnerId(correctiveActionDTO.getOwnerId());
        correctiveAction.setDeadline(correctiveActionDTO.getDeadline());
        correctiveAction.setStatus(correctiveActionDTO.getStatus());
        correctiveAction.setUpdatedAt(LocalDateTime.now());
        correctiveAction.setCompanyId(companyId);
        correctiveActionRepository.save(correctiveAction);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_CORRECTIVE_ACTION_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = {
                    CACHE_CORRECTIVE_ACTION_DTOS_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTION_RESPONSES_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_INSPECTION,
                    CACHE_CORRECTIVE_ACTIONS_BY_ACTIVITY,
                    CACHE_CORRECTIVE_ACTIONS_BY_DEPARTMENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_NON_CONFORMITY,
                    CACHE_CORRECTIVE_ACTIONS_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_PENDING,
                    CACHE_CORRECTIVE_ACTIONS_PENDING
            }, allEntries = true)
    })
    public void approveAction(Long companyId, Long id) throws HSException {
        CorrectiveAction correctiveAction = loadActionForCompany(companyId, id);
        assertActionTransition(correctiveAction.getStatus(), ActionStatus.IN_PROGRESS);
        correctiveAction.setStatus(ActionStatus.IN_PROGRESS);
        correctiveAction.setUpdatedAt(LocalDateTime.now());
        correctiveActionRepository.save(correctiveAction);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_CORRECTIVE_ACTION_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = {
                    CACHE_CORRECTIVE_ACTION_DTOS_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTION_RESPONSES_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_INSPECTION,
                    CACHE_CORRECTIVE_ACTIONS_BY_ACTIVITY,
                    CACHE_CORRECTIVE_ACTIONS_BY_DEPARTMENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_NON_CONFORMITY,
                    CACHE_CORRECTIVE_ACTIONS_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_PENDING,
                    CACHE_CORRECTIVE_ACTIONS_PENDING
            }, allEntries = true)
    })
    public void cancelAction(Long companyId, Long id) throws HSException {
        CorrectiveAction correctiveAction = loadActionForCompany(companyId, id);
        assertActionTransition(correctiveAction.getStatus(), ActionStatus.CANCELLED);
        correctiveAction.setStatus(ActionStatus.CANCELLED);
        correctiveAction.setUpdatedAt(LocalDateTime.now());
        correctiveActionRepository.save(correctiveAction);
    }

    private static final Map<ActionStatus, Set<ActionStatus>> ACTION_TRANSITIONS = Map.of(
            ActionStatus.PENDING, Set.of(ActionStatus.IN_PROGRESS, ActionStatus.CANCELLED),
            ActionStatus.IN_PROGRESS, Set.of(ActionStatus.COMPLETED, ActionStatus.CANCELLED),
            ActionStatus.COMPLETED, Set.of(),
            ActionStatus.CANCELLED, Set.of()
    );

    private void assertActionTransition(ActionStatus current, ActionStatus target) throws HSException {
        if (!ACTION_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
            throw new HSException("INVALID_STATUS_TRANSITION");
        }
    }

    @Override
    @Cacheable(cacheNames = CACHE_CORRECTIVE_ACTIONS_BY_NON_CONFORMITY, key = "#companyId != null ? (#companyId + '-' + #nonConformityId) : 'ALL-' + #nonConformityId")
    public List<CorrectiveActionResponse> getActionsByNonConformityId(Long companyId, Long nonConformityId)
            throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository
                .findActionsByNonConformityId(companyId, nonConformityId);
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
    @Caching(evict = {
            @CacheEvict(cacheNames = {
                    CACHE_CORRECTIVE_ACTION_DTOS_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTION_RESPONSES_BY_INCIDENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_INSPECTION,
                    CACHE_CORRECTIVE_ACTIONS_BY_ACTIVITY,
                    CACHE_CORRECTIVE_ACTIONS_BY_DEPARTMENT,
                    CACHE_CORRECTIVE_ACTIONS_BY_NON_CONFORMITY,
                    CACHE_CORRECTIVE_ACTIONS_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_ALL,
                    CACHE_CORRECTIVE_ACTIONS_ADHOC_PENDING,
                    CACHE_CORRECTIVE_ACTION_BY_ID,
                    CACHE_CORRECTIVE_ACTIONS_PENDING
            }, allEntries = true)
    })
    public List<Long> saveOrUpdateCorrectiveActions(Long companyId, List<CorrectiveActionDTO> correctiveActionDTOs)
            throws HSException {
        ensureCompanyIdProvided(companyId);
        List<Long> ids = new java.util.ArrayList<>();
        for (CorrectiveActionDTO dto : correctiveActionDTOs) {
            if (dto.getId() == null) {
                ids.add(addCorrectiveAction(companyId, dto));
            } else {
                updateCorrectiveAction(companyId, dto);
                ids.add(dto.getId());
            }
        }
        return ids;
    }

    @Override
    @Cacheable(cacheNames = CACHE_CORRECTIVE_ACTION_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public CorrectiveActionResponse getCorrectiveActionById(Long companyId, Long id) throws HSException {
        CorrectiveActionResponse action = correctiveActionRepository.getCorrectiveActionById(companyId, id);
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
    @Cacheable(cacheNames = CACHE_CORRECTIVE_ACTIONS_PENDING, key = "#companyId != null ? #companyId : 'ALL'")
    public List<CorrectiveActionResponse> getAllPendingActions(Long companyId) throws HSException {
        List<CorrectiveActionResponse> actions = correctiveActionRepository
                .findAllActionsByStatus(companyId, ActionStatus.PENDING);
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

    @Override
    public List<CorrectiveActionDTO> getByRiskControl(Long riskControlId) throws HSException {
        List<CorrectiveAction> actions = correctiveActionRepository.findByRiskControlId(riskControlId);
        return actions.stream().map(CorrectiveAction::toDTO).toList();
    }

}
