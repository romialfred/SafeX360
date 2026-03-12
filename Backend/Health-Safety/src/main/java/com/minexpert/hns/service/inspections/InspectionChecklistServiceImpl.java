package com.minexpert.hns.service.inspections;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.inspections.InspectionChecklistDTO;
import com.minexpert.hns.entity.inspections.InspectionChecklist;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.MediaRepository;
import com.minexpert.hns.repository.inspections.InspectionChecklistRepository;
import com.minexpert.hns.service.MediaService;

@Service
public class InspectionChecklistServiceImpl implements InspectionChecklistService {

    @Autowired
    private InspectionChecklistRepository inspectionChecklistRepository;

    @Autowired
    private MediaRepository mediaRepository;

    @Autowired
    private MediaService mediaService;

    @Override
    public Long createChecklist(InspectionChecklistDTO checklistDTO) {
        checklistDTO.setCreatedAt(LocalDateTime.now());
        checklistDTO.setUpdatedAt(LocalDateTime.now());
        InspectionChecklist checklist = checklistDTO.toEntity();
        checklist.setDocs(checklistDTO.getDocs().stream()
                .map(media -> mediaRepository.save(media.toEntity()).getId())
                .toList().toString());
        return inspectionChecklistRepository.save(checklist).getId();
    }

    @Override
    public InspectionChecklistDTO getChecklistById(Long id) throws HSException {
        InspectionChecklist checklist = inspectionChecklistRepository.findById(id)
                .orElseThrow(() -> new HSException("CHECKLIST_NOT_FOUND"));
        InspectionChecklistDTO checklistDTO = checklist.toDTO();
        checklistDTO.setDocs(mediaService.getAllMediaByArray(checklist.getDocs()));
        return checklistDTO;
    }

    @Override
    public void updateChecklist(InspectionChecklistDTO checklistDTO) throws HSException {
        InspectionChecklist existingChecklist = inspectionChecklistRepository.findById(checklistDTO.getId())
                .orElseThrow(() -> new HSException("CHECKLIST_NOT_FOUND"));
        existingChecklist.setNonConformityLevel(checklistDTO.getNonConformityLevel());
        existingChecklist.setObservation(checklistDTO.getObservation());
        existingChecklist.setDocs(checklistDTO.getDocs().stream()
                .map(media -> mediaRepository.save(media.toEntity()).getId())
                .toList().toString());
        existingChecklist.setStatus(checklistDTO.getStatus());
        existingChecklist.setUpdatedAt(LocalDateTime.now());
        inspectionChecklistRepository.save(existingChecklist);
    }

    @Override
    public void deleteChecklist(Long id) {
        inspectionChecklistRepository.deleteById(id);
    }

    @Override
    public List<InspectionChecklistDTO> getAllChecklists() {
        List<InspectionChecklistDTO> checklists = ((List<InspectionChecklist>) inspectionChecklistRepository.findAll())
                .stream().map(x -> {
                    InspectionChecklistDTO checklistDTO = x.toDTO();
                    checklistDTO.setDocs(mediaService.getAllMediaByArray(x.getDocs()));
                    return checklistDTO;
                }).toList();
        return checklists;
    }

    @Override
    public List<InspectionChecklistDTO> getChecklistsByInspectionId(Long inspectionId) {
        List<InspectionChecklistDTO> checklists = ((List<InspectionChecklist>) inspectionChecklistRepository
                .findByGeneralInspection_Id(inspectionId)).stream().map(x -> {
                    InspectionChecklistDTO checklistDTO = x.toDTO();
                    checklistDTO.setDocs(mediaService.getAllMediaByArray(x.getDocs()));
                    return checklistDTO;
                }).toList();
        return checklists;
    }

}
