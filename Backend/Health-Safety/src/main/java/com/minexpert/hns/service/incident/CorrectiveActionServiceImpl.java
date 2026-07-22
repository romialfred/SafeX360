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
import com.minexpert.hns.service.audit.ChangeLogService;
import com.minexpert.hns.dto.CorrectiveActionDTO;
import com.minexpert.hns.dto.EffectivenessReviewDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.CorrectiveActionResponse;
import com.minexpert.hns.dto.response.EffectivenessDTO;
import com.minexpert.hns.entity.incident.CorrectiveAction;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.enums.EffectivenessVerdict;
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

    @Autowired
    private ChangeLogService changeLogService;

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

        ActionStatus target = correctiveActionDTO.getStatus();
        // VERIFIED / REOPENED ne se posent QUE via la revue d'efficacite (§10.2),
        // qui enregistre verdict + verificateur + risque residuel. Les atteindre par
        // /update laisserait une action « Verifiee efficace » SANS aucune preuve
        // d'efficacite (etat incoherent : verdict null sur statut VERIFIED).
        if (target == ActionStatus.VERIFIED || target == ActionStatus.REOPENED) {
            throw new HSException("EFFECTIVENESS_STATUS_NOT_SETTABLE_HERE");
        }
        if (target != null && target != correctiveAction.getStatus()) {
            assertActionTransition(correctiveAction.getStatus(), target);
        }

        correctiveAction.setActionName(correctiveActionDTO.getActionName());
        correctiveAction.setDescription(correctiveActionDTO.getDescription());
        correctiveAction.setAssignedEmployeeId(correctiveActionDTO.getAssignedEmployeeId());
        correctiveAction.setDepartmentId(correctiveActionDTO.getDepartmentId());
        correctiveAction.setOwnerId(correctiveActionDTO.getOwnerId());
        correctiveAction.setDeadline(correctiveActionDTO.getDeadline());
        // On ne pose le statut que s'il est FOURNI : un DTO a status=null (ex. edition
        // de champs en lot) ecrivait sinon status=NULL, sortant l'action de la machine
        // a etats. Absent => on preserve le statut courant.
        ActionStatus previous = correctiveAction.getStatus();
        if (target != null) {
            correctiveAction.setStatus(target);
        }
        // Classification (§8.1.2/§10.2) editable en mode PARTIEL : on n'ecrit que si
        // fourni — les voies qui ne l'envoient pas (page de progression) la preservent.
        if (correctiveActionDTO.getControlHierarchy() != null) {
            correctiveAction.setControlHierarchy(correctiveActionDTO.getControlHierarchy());
        }
        if (correctiveActionDTO.getActionType() != null) {
            correctiveAction.setActionType(correctiveActionDTO.getActionType());
        }
        if (correctiveActionDTO.getPriority() != null) {
            correctiveAction.setPriority(correctiveActionDTO.getPriority());
        }
        if (correctiveActionDTO.getCauseId() != null) {
            correctiveAction.setCauseId(correctiveActionDTO.getCauseId());
        }
        correctiveAction.setUpdatedAt(LocalDateTime.now());
        correctiveAction.setCompanyId(companyId);
        correctiveActionRepository.save(correctiveAction);
        // Journal d'audit : seule une VRAIE transition de statut est tracée.
        if (target != null && target != previous) {
            changeLogService.record(ChangeLogService.CORRECTIVE_ACTION, correctiveActionDTO.getId(), companyId,
                    "status", previous != null ? previous.name() : null, target.name());
        }
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
        ActionStatus previous = correctiveAction.getStatus();
        assertActionTransition(previous, ActionStatus.IN_PROGRESS);
        correctiveAction.setStatus(ActionStatus.IN_PROGRESS);
        correctiveAction.setUpdatedAt(LocalDateTime.now());
        correctiveActionRepository.save(correctiveAction);
        changeLogService.record(ChangeLogService.CORRECTIVE_ACTION, id, correctiveAction.getCompanyId(),
                "status", previous != null ? previous.name() : null, ActionStatus.IN_PROGRESS.name());
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
        ActionStatus previous = correctiveAction.getStatus();
        assertActionTransition(previous, ActionStatus.CANCELLED);
        correctiveAction.setStatus(ActionStatus.CANCELLED);
        correctiveAction.setUpdatedAt(LocalDateTime.now());
        correctiveActionRepository.save(correctiveAction);
        changeLogService.record(ChangeLogService.CORRECTIVE_ACTION, id, correctiveAction.getCompanyId(),
                "status", previous != null ? previous.name() : null, ActionStatus.CANCELLED.name());
    }

    private static final Map<ActionStatus, Set<ActionStatus>> ACTION_TRANSITIONS = Map.of(
            ActionStatus.PENDING, Set.of(ActionStatus.IN_PROGRESS, ActionStatus.CANCELLED),
            ActionStatus.IN_PROGRESS, Set.of(ActionStatus.COMPLETED, ActionStatus.CANCELLED),
            // ISO 45001 10.2 e : apres COMPLETED, la revue d'efficacite tranche
            // VERIFIED (efficace) ou REOPENED (inefficace -> a reprendre).
            ActionStatus.COMPLETED, Set.of(ActionStatus.VERIFIED, ActionStatus.REOPENED),
            // Action rouverte : elle repart. On autorise la reprise (IN_PROGRESS) ET
            // la re-terminaison directe (COMPLETED, via la voie avancement qui pose
            // statut+progression en un appel) — sans quoi une action rouverte serait
            // une impasse, ne pouvant jamais etre re-terminee ni re-verifiee.
            ActionStatus.REOPENED, Set.of(ActionStatus.IN_PROGRESS, ActionStatus.COMPLETED, ActionStatus.CANCELLED),
            ActionStatus.VERIFIED, Set.of(),
            ActionStatus.CANCELLED, Set.of()
    );

    @Override
    public void assertActionTransition(ActionStatus current, ActionStatus target) throws HSException {
        if (!ACTION_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
            throw new HSException("INVALID_STATUS_TRANSITION");
        }
    }

    /** Composante d'une matrice de risque 5×5 : nulle (non renseignee) ou 1..5. */
    private void assertRiskComponentInRange(Integer value) throws HSException {
        if (value != null && (value < 1 || value > 5)) {
            throw new HSException("RISK_COMPONENT_OUT_OF_RANGE");
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
    public List<CorrectiveActionDTO> getByRiskControl(Long companyId, Long riskControlId) throws HSException {
        List<CorrectiveAction> actions = correctiveActionRepository.findByRiskControlId(companyId, riskControlId);
        return actions.stream().map(CorrectiveAction::toDTO).toList();
    }

    // ── ISO 45001 §10.2 e — Revue d'efficacité ──────────────────────────────

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
    public EffectivenessDTO reviewEffectiveness(Long companyId, Long id, Long actorId, EffectivenessReviewDTO dto)
            throws HSException {
        CorrectiveAction action = loadActionForCompany(companyId, id);
        if (action.getStatus() != ActionStatus.COMPLETED) {
            // On ne juge l'efficacite que d'une action terminee (l'action n'a pas
            // encore ete « faite », on ne peut donc pas verifier qu'elle « marche »).
            throw new HSException("EFFECTIVENESS_REVIEW_REQUIRES_COMPLETED");
        }
        if (dto == null || dto.getVerdict() == null) {
            throw new HSException("EFFECTIVENESS_VERDICT_REQUIRED");
        }
        // Borne serveur du risque residuel (le front clampe deja, mais un appel
        // direct pourrait stocker une valeur hors 1..5 -> bande de risque aberrante).
        assertRiskComponentInRange(dto.getResidualProbability());
        assertRiskComponentInRange(dto.getResidualSeverity());
        // Seul INEFFECTIVE rouvre l'action. EFFECTIVE **et** PARTIALLY_EFFECTIVE la
        // passent VERIFIED (terminal) : « partiellement efficace » clôt l'action mais
        // le verdict et le risque résiduel restent tracés/affichés (chip amber). Une
        // relance formelle d'une action partielle relève d'une action LIÉE (Phase 2).
        ActionStatus target = dto.getVerdict() == EffectivenessVerdict.INEFFECTIVE
                ? ActionStatus.REOPENED : ActionStatus.VERIFIED;
        assertActionTransition(action.getStatus(), target);
        ActionStatus previousStatus = action.getStatus();

        action.setEffectivenessVerdict(dto.getVerdict());
        action.setEffectivenessComment(dto.getComment());
        action.setResidualProbability(dto.getResidualProbability());
        action.setResidualSeverity(dto.getResidualSeverity());
        // Verificateur non repudiable : l'utilisateur AUTHENTIFIE prime sur le param
        // client (repli sur actorId pour un eventuel appel systeme sans SecurityContext).
        Long authActor = com.minexpert.hns.utility.AuthUtils.currentActorId();
        action.setEffectivenessReviewedBy(authActor != null ? authActor : actorId);
        action.setEffectivenessReviewedAt(LocalDateTime.now());
        action.setStatus(target);
        if (target == ActionStatus.REOPENED) {
            // Action jugee inefficace : elle repart, la progression est remise a zero.
            action.setProgress(0);
        }
        action.setUpdatedAt(LocalDateTime.now());
        correctiveActionRepository.save(action);
        // Journal d'audit (ISO 45001 §7.5.3 / §10.2 e) : verdict d'efficacité + transition.
        changeLogService.record(ChangeLogService.CORRECTIVE_ACTION, id, action.getCompanyId(),
                "effectivenessVerdict", null, dto.getVerdict() != null ? dto.getVerdict().name() : null);
        changeLogService.record(ChangeLogService.CORRECTIVE_ACTION, id, action.getCompanyId(),
                "status", previousStatus != null ? previousStatus.name() : null, target.name());
        return toEffectivenessDTO(action);
    }

    @Override
    public EffectivenessDTO getEffectiveness(Long companyId, Long id) throws HSException {
        CorrectiveAction action = loadActionForCompany(companyId, id);
        return toEffectivenessDTO(action);
    }

    @Override
    public java.util.List<com.minexpert.hns.repository.incident.projection.HierarchyCount> getControlHierarchyCounts(
            Long companyId) {
        return correctiveActionRepository.countByControlHierarchy(companyId);
    }

    private EffectivenessDTO toEffectivenessDTO(CorrectiveAction a) {
        String name = null;
        if (a.getEffectivenessReviewedBy() != null) {
            try {
                List<EmployeeNameDTO> ns = hrmsClient
                        .getEmployeeNameByIds(java.util.List.of(a.getEffectivenessReviewedBy()));
                if (ns != null && !ns.isEmpty()) {
                    name = ns.get(0).getName();
                }
            } catch (Exception ignore) {
                // resolution du nom best-effort — ne bloque jamais la revue.
            }
        }
        return EffectivenessDTO.builder()
                .correctiveActionId(a.getId())
                .status(a.getStatus())
                .verdict(a.getEffectivenessVerdict())
                .reviewedBy(a.getEffectivenessReviewedBy())
                .reviewedByName(name)
                .reviewedAt(a.getEffectivenessReviewedAt())
                .comment(a.getEffectivenessComment())
                .residualProbability(a.getResidualProbability())
                .residualSeverity(a.getResidualSeverity())
                .reviewed(a.getEffectivenessVerdict() != null)
                .build();
    }

}
