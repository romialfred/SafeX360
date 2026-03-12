package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.InvestigationProcessDTO;
import com.minexpert.hns.entity.incident.Investigation;
import com.minexpert.hns.entity.incident.InvestigationProcess;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.InvestigationProcessRepository;
import com.minexpert.hns.repository.incident.InvestigationRepository;
import com.minexpert.hns.service.MediaService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class InvestigationProcessServiceImpl implements InvestigationProcessService {

    private final InvestigationProcessRepository investigationProcessRepository;

    private final InvestigationRepository investigationRepository;
    private final MediaService mediaService;

    @Override
    public Long addInvestigationProcess(InvestigationProcessDTO investigationProcessDTO) throws HSException {
        Investigation investigation = investigationRepository.findById(investigationProcessDTO.getInvestigationId())
                .orElseThrow(() -> new HSException("INVESTIGATION_NOT_FOUND"));
        investigation.setProgress(investigationProcessDTO.getProgress());
        investigation.setStatus(investigationProcessDTO.getStatus());
        investigationRepository.save(investigation);

        investigationProcessDTO.setCreatedAt(LocalDateTime.now());
        InvestigationProcess investigationProcess = investigationProcessDTO.toEntity();
        investigationProcess.setDocs(mediaService.saveAllMedia(investigationProcessDTO.getDocs()));
        return investigationProcessRepository.save(investigationProcess).getId();
    }

    @Override
    public List<InvestigationProcessDTO> getInvestigationProcessesByInvestigationId(Long investigationId)
            throws HSException {
        List<InvestigationProcess> investigationProcesses = investigationProcessRepository
                .findByInvestigation_Id(investigationId);
        return investigationProcesses.stream().map(process -> {
            InvestigationProcessDTO dto = process.toDTO();
            dto.setDocs(mediaService.getAllMediaByArray(process.getDocs()));
            return dto;
        }).toList();
    }

}
