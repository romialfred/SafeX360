package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.ActionProcessDTO;
import com.minexpert.hns.dto.response.ActionProcessResponse;
import com.minexpert.hns.entity.incident.ActionProcess;
import com.minexpert.hns.entity.incident.CorrectiveAction;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.ActionProcessRepository;
import com.minexpert.hns.repository.incident.CorrectiveActionRepository;
import com.minexpert.hns.service.MediaService;

@Service
@Transactional
public class ActionProcessServiceImpl implements ActionProcessService {

        public static final String CACHE_ACTION_PROCESSES_BY_ACTION = "actionProcessesByAction";

        @Autowired
        private ActionProcessRepository actionProcessRepository;

        @Autowired
        private CorrectiveActionRepository correctiveActionRepository;

        @Autowired
        private MediaService mediaService;

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = CACHE_ACTION_PROCESSES_BY_ACTION, key = "#actionProcessDTO.correctiveActionId"),
                        @CacheEvict(cacheNames = CorrectiveActionServiceImpl.CACHE_CORRECTIVE_ACTION_BY_ID, key = "#actionProcessDTO.correctiveActionId"),
                        @CacheEvict(cacheNames = {
                                        CorrectiveActionServiceImpl.CACHE_CORRECTIVE_ACTION_DTOS_BY_INCIDENT,
                                        CorrectiveActionServiceImpl.CACHE_CORRECTIVE_ACTION_RESPONSES_BY_INCIDENT,
                                        CorrectiveActionServiceImpl.CACHE_CORRECTIVE_ACTIONS_BY_INSPECTION,
                                        CorrectiveActionServiceImpl.CACHE_CORRECTIVE_ACTIONS_BY_ACTIVITY,
                                        CorrectiveActionServiceImpl.CACHE_CORRECTIVE_ACTIONS_BY_DEPARTMENT,
                                        CorrectiveActionServiceImpl.CACHE_CORRECTIVE_ACTIONS_BY_NON_CONFORMITY,
                                        CorrectiveActionServiceImpl.CACHE_CORRECTIVE_ACTIONS_ALL,
                                        CorrectiveActionServiceImpl.CACHE_CORRECTIVE_ACTIONS_ADHOC_ALL,
                                        CorrectiveActionServiceImpl.CACHE_CORRECTIVE_ACTIONS_ADHOC_PENDING,
                                        CorrectiveActionServiceImpl.CACHE_CORRECTIVE_ACTIONS_PENDING
                        }, allEntries = true)
        })
        public Long addActionProcess(ActionProcessDTO actionProcessDTO, Long companyId) throws HSException {
                CorrectiveAction correctiveAction = correctiveActionRepository
                                .findById(actionProcessDTO.getCorrectiveActionId())
                                .orElseThrow(() -> new HSException("CORRECTIVE_ACTION_NOT_FOUND"));
                // Cloisonnement par mine : refuse de faire avancer/muter une action
                // corrective (progression, statut) appartenant à une autre mine.
                if (companyId != null && !companyId.equals(correctiveAction.getCompanyId())) {
                        throw new HSException("CORRECTIVE_ACTION_NOT_FOUND");
                }
                if (correctiveAction.getStatus() == ActionStatus.COMPLETED
                                || correctiveAction.getStatus() == ActionStatus.CANCELLED) {
                        throw new HSException("ACTION_ALREADY_CLOSED");
                }
                correctiveAction.setProgress(actionProcessDTO.getProgress());
                correctiveAction.setStatus(actionProcessDTO.getStatus());
                correctiveActionRepository.save(correctiveAction);
                ActionProcess actionProcess = actionProcessDTO.toEntity();
                actionProcess.setDocs(mediaService.saveAllMedia(actionProcessDTO.getDocs()));
                actionProcess.setCreatedAt(LocalDateTime.now());
                return actionProcessRepository.save(actionProcess).getId();
        }

        @Override
        @Cacheable(cacheNames = CACHE_ACTION_PROCESSES_BY_ACTION, key = "#actionId")
        public List<ActionProcessResponse> getActionProcessByActionId(Long actionId) throws HSException {
                List<ActionProcess> actionProcesses = actionProcessRepository.findByActionId(actionId);

                List<ActionProcessResponse> actionProcessResponses = actionProcesses.stream()
                                .map(actionProcess -> {
                                        ActionProcessResponse actionProcessResponse = actionProcess.toResponse();
                                        actionProcessResponse.setDocs(
                                                        mediaService.getAllMediaByArray(actionProcess.getDocs()));
                                        return actionProcessResponse;
                                })
                                .collect(Collectors.toList());
                return actionProcessResponses;

        }

}
