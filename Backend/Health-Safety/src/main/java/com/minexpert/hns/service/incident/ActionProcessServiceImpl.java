package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.ActionProcessDTO;
import com.minexpert.hns.dto.response.ActionProcessResponse;
import com.minexpert.hns.entity.incident.ActionProcess;
import com.minexpert.hns.entity.incident.CorrectiveAction;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.ActionProcessRepository;
import com.minexpert.hns.repository.incident.CorrectiveActionRepository;
import com.minexpert.hns.service.MediaService;

@Service
@Transactional
public class ActionProcessServiceImpl implements ActionProcessService {

    @Autowired
    private ActionProcessRepository actionProcessRepository;

    @Autowired
    private CorrectiveActionRepository correctiveActionRepository;

    @Autowired
    private MediaService mediaService;

    @Override
    public Long addActionProcess(ActionProcessDTO actionProcessDTO) throws HSException {
        CorrectiveAction correctiveAction = correctiveActionRepository
                .findById(actionProcessDTO.getCorrectiveActionId())
                .orElseThrow(() -> new HSException("CORRECTIVE_ACTION_NOT_FOUND"));
        correctiveAction.setProgress(actionProcessDTO.getProgress());
        correctiveAction.setStatus(actionProcessDTO.getStatus());
        correctiveActionRepository.save(correctiveAction);
        ActionProcess actionProcess = actionProcessDTO.toEntity();
        actionProcess.setDocs(mediaService.saveAllMedia(actionProcessDTO.getDocs()));
        actionProcess.setCreatedAt(LocalDateTime.now());
        return actionProcessRepository.save(actionProcess).getId();
    }

    @Override
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
