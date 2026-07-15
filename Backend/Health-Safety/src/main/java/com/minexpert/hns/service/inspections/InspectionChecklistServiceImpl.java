package com.minexpert.hns.service.inspections;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.inspections.InspectionChecklistDTO;
import com.minexpert.hns.entity.inspections.InspectionChecklist;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.MediaRepository;
import com.minexpert.hns.repository.inspections.InspectionChecklistRepository;
import com.minexpert.hns.service.MediaService;

@Service
@Transactional
public class InspectionChecklistServiceImpl implements InspectionChecklistService {

    @Autowired
    private InspectionChecklistRepository inspectionChecklistRepository;

    @Autowired
    private MediaRepository mediaRepository;

    @Autowired
    private MediaService mediaService;

    @Override
    @Caching(evict = {
            // @CacheEvict(cacheNames = "inspectionChecklistById", allEntries = true),
            @CacheEvict(cacheNames = "inspectionChecklistsAll", allEntries = true),
            @CacheEvict(cacheNames = "inspectionChecklistsByInspection", allEntries = true)
    })
    public Long createChecklist(InspectionChecklistDTO checklistDTO) {
        checklistDTO.setCreatedAt(LocalDateTime.now());
        checklistDTO.setUpdatedAt(LocalDateTime.now());
        InspectionChecklist checklist = checklistDTO.toEntity();
        checklist.setDocs(persistDocIds(checklistDTO.getDocs()));
        return inspectionChecklistRepository.save(checklist).getId();
    }

    @Override
    @Cacheable(cacheNames = "inspectionChecklistById", key = "#id")
    public InspectionChecklistDTO getChecklistById(Long id) throws HSException {
        InspectionChecklist checklist = inspectionChecklistRepository.findById(id)
                .orElseThrow(() -> new HSException("CHECKLIST_NOT_FOUND"));
        InspectionChecklistDTO checklistDTO = checklist.toDTO();
        checklistDTO.setDocs(mediaService.getAllMediaByArray(checklist.getDocs()));
        return checklistDTO;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "inspectionChecklistById", key = "#checklistDTO.id", condition = "#checklistDTO.id != null"),
            @CacheEvict(cacheNames = "inspectionChecklistsAll", allEntries = true),
            @CacheEvict(cacheNames = "inspectionChecklistsByInspection", allEntries = true)
    })
    public void updateChecklist(InspectionChecklistDTO checklistDTO) throws HSException {
        InspectionChecklist existingChecklist = inspectionChecklistRepository.findById(checklistDTO.getId())
                .orElseThrow(() -> new HSException("CHECKLIST_NOT_FOUND"));
        existingChecklist.setNonConformityLevel(checklistDTO.getNonConformityLevel());
        existingChecklist.setObservation(checklistDTO.getObservation());
        existingChecklist.setDocs(persistDocIds(checklistDTO.getDocs()));
        existingChecklist.setStatus(checklistDTO.getStatus());
        existingChecklist.setUpdatedAt(LocalDateTime.now());
        inspectionChecklistRepository.save(existingChecklist);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "inspectionChecklistById", key = "#id"),
            @CacheEvict(cacheNames = "inspectionChecklistsAll", allEntries = true),
            @CacheEvict(cacheNames = "inspectionChecklistsByInspection", allEntries = true)
    })
    public void deleteChecklist(Long id, Long companyId) throws HSException {
        // Cloisonnement par mine : refuse de supprimer un point de checklist rattaché
        // à une inspection d'une autre mine (le companyId réel est porté par l'inspection).
        InspectionChecklist checklist = inspectionChecklistRepository.findById(id)
                .orElseThrow(() -> new HSException("CHECKLIST_NOT_FOUND"));
        if (companyId != null) {
            Long owner = checklist.getGeneralInspection() != null
                    ? checklist.getGeneralInspection().getCompanyId() : null;
            if (owner == null || !companyId.equals(owner)) {
                throw new HSException("CHECKLIST_NOT_FOUND");
            }
        }
        inspectionChecklistRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = "inspectionChecklistsAll")
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
    @Cacheable(cacheNames = "inspectionChecklistsByInspection", key = "#inspectionId + '-' + #companyId")
    public List<InspectionChecklistDTO> getChecklistsByInspectionId(Long inspectionId, Long companyId) {
        List<InspectionChecklistDTO> checklists = ((List<InspectionChecklist>) inspectionChecklistRepository
                .findByInspectionAndCompany(inspectionId, companyId)).stream().map(x -> {
                    InspectionChecklistDTO checklistDTO = x.toDTO();
                    checklistDTO.setDocs(mediaService.getAllMediaByArray(x.getDocs()));
                    return checklistDTO;
                }).toList();
        return checklists;
    }

    /**
     * Persiste les pièces jointes d'un point de checklist et renvoie la liste de
     * leurs ids sous forme de chaîne. Garde null/vide : une checklist enregistrée
     * sans photo (cas majoritaire) ne doit pas provoquer de NPE.
     */
    private String persistDocIds(List<com.minexpert.hns.dto.MediaDTO> docs) {
        if (docs == null || docs.isEmpty()) {
            return java.util.List.of().toString();
        }
        return docs.stream()
                .map(media -> mediaRepository.save(media.toEntity()).getId())
                .toList().toString();
    }

}
