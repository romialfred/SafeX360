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
        private CorrectiveActionService correctiveActionService;

        @Autowired
        private MediaService mediaService;

        @Autowired
        private com.minexpert.hns.service.audit.ChangeLogService changeLogService;

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
                // Etats terminaux : COMPLETED / CANCELLED / VERIFIED (efficacite
                // prouvee §10.2) ne se font plus avancer par la voie progression.
                if (correctiveAction.getStatus() == ActionStatus.COMPLETED
                                || correctiveAction.getStatus() == ActionStatus.CANCELLED
                                || correctiveAction.getStatus() == ActionStatus.VERIFIED) {
                        throw new HSException("ACTION_ALREADY_CLOSED");
                }
                // Cette voie (avancement) doit respecter la MEME machine a etats que
                // /update : on ne saute pas d'etat par la porte "progression".
                ActionStatus current = correctiveAction.getStatus();
                ActionStatus target = actionProcessDTO.getStatus();
                if (target != null && target != current) {
                        correctiveActionService.assertActionTransition(current, target);
                        // Reprise d'une action ROUVERTE : le verdict d'inefficacite qui
                        // l'avait rouverte ne s'applique plus a cette NOUVELLE tentative.
                        // On efface la revue precedente pour qu'une re-completion exige une
                        // revue d'efficacite fraiche (sinon getEffectiveness renverrait
                        // toujours l'ancien verdict et bloquerait la nouvelle verification).
                        if (current == ActionStatus.REOPENED) {
                                correctiveAction.setEffectivenessVerdict(null);
                                correctiveAction.setEffectivenessComment(null);
                                correctiveAction.setEffectivenessReviewedBy(null);
                                correctiveAction.setEffectivenessReviewedAt(null);
                                correctiveAction.setResidualProbability(null);
                                correctiveAction.setResidualSeverity(null);
                        }
                        correctiveAction.setStatus(target);
                }
                correctiveAction.setProgress(actionProcessDTO.getProgress());
                correctiveActionRepository.save(correctiveAction);
                // Journal d'audit (ISO 45001 §7.5.3) : transition de statut par la voie
                // avancement (acteur = utilisateur authentifie, derive dans le service).
                if (target != null && target != current) {
                        changeLogService.record(
                                com.minexpert.hns.service.audit.ChangeLogService.CORRECTIVE_ACTION,
                                correctiveAction.getId(), correctiveAction.getCompanyId(),
                                "status", current != null ? current.name() : null, target.name());
                }
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
