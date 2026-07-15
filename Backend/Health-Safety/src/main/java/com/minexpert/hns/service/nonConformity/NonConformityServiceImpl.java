package com.minexpert.hns.service.nonConformity;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.nonConformity.EventAnalysisDTO;
import com.minexpert.hns.dto.nonConformity.EventRequestDTO;
import com.minexpert.hns.dto.nonConformity.NcInfo;
import com.minexpert.hns.dto.nonConformity.NonConformityDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.entity.nonConformity.NonConformity;
import com.minexpert.hns.enums.EventStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.nonConformity.NonConformityRepository;
import com.minexpert.hns.service.MediaService;
import com.minexpert.hns.service.incident.CorrectiveActionService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class NonConformityServiceImpl implements NonConformityService {

    private static final Logger log = LoggerFactory.getLogger(NonConformityServiceImpl.class);

    private final NonConformityRepository nonConformityRepository;
    private final EventAnalysisService eventAnalysisService;
    private final CorrectiveActionService correctiveActionService;
    private final MediaService mediaService;
    private final HrmsClient hrmsClient;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "nonConformityById", allEntries = true),
            @CacheEvict(cacheNames = "nonConformitiesAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoById", allEntries = true)
    })
    public Long addNonConformity(Long companyId, EventRequestDTO request) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        // Cloisonnement par mine : la NC porte le companyId de la requête.
        if (request.getNonConformity() != null) {
            request.getNonConformity().setCompanyId(companyId);
        }
        Long id = this.createNonConformity(request.getNonConformity());
        if (request.getCorrectiveActions() != null) {
            request.getCorrectiveActions().forEach(action -> {
                try {
                    action.setNonConformityId(id);
                    action.setCompanyId(companyId);
                    correctiveActionService.addCorrectiveAction(companyId, action);
                } catch (HSException e) {
                    log.error("Failed to add corrective action for NC#{}: {}", id, e.getMessage());
                }
            });
        }
        EventAnalysisDTO eventAnalysisDTO = request.getAnalysis();
        if (eventAnalysisDTO != null) {
            eventAnalysisDTO.setNonConformityId(id);
            eventAnalysisService.createEventAnalysis(eventAnalysisDTO);
        }
        return id;

    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "nonConformityById", allEntries = true),
            @CacheEvict(cacheNames = "nonConformitiesAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoById", allEntries = true)
    })
    public Long createNonConformity(NonConformityDTO nonConformityDTO) throws HSException {
        NonConformity nonConformity = nonConformityDTO.toEntity();
        com.minexpert.hns.enums.EventType eventType = nonConformityDTO.getType();
        nonConformity.setNumber(generateNonConformityNumber(eventType));
        nonConformity.setCreatedAt(LocalDateTime.now());
        nonConformity.setUpdatedAt(LocalDateTime.now());
        nonConformity.setStatus(EventStatus.REPORTED);
        nonConformity.setEvidence(mediaService.saveAllMedia(nonConformityDTO.getEvidence()));
        nonConformity.setDocs(mediaService.saveAllMedia(nonConformityDTO.getDocs()));
        return nonConformityRepository.save(nonConformity).getId();
    }

    private String generateNonConformityNumber(com.minexpert.hns.enums.EventType eventType) {
        int currentYear = Year.now().getValue();
        String prefix = "NC";
        if (eventType != null && eventType == com.minexpert.hns.enums.EventType.NEAR_MISS) {
            prefix = "NM";
        }

        Pageable limitOne = PageRequest.of(0, 1);
        List<NonConformity> latestConformities = nonConformityRepository.findTopByYearOrderByIdDesc(currentYear,
                limitOne);

        int nextNumber = 1;
        if (!latestConformities.isEmpty()) {
            String lastNumber = latestConformities.get(0).getNumber();
            if (lastNumber != null) {
                String[] parts = lastNumber.split("-");
                // Parse robuste : dernier segment numérique (tolère un format à 4
                // segments type PREF-XXX-2026-0007 qui cassait le compteur -> 1).
                try {
                    nextNumber = Integer.parseInt(parts[parts.length - 1].trim()) + 1;
                } catch (NumberFormatException e) {
                    nextNumber = 1;
                }
            }
        }

        // Contrainte UNIQUE globale sur number : boucle anti-collision -> plus de
        // DataIntegrityViolation -> 500 à la déclaration.
        String candidate = String.format("%s-%d-%03d", prefix, currentYear, nextNumber);
        while (nonConformityRepository.existsByNumber(candidate)) {
            nextNumber++;
            candidate = String.format("%s-%d-%03d", prefix, currentYear, nextNumber);
        }
        return candidate;
    }

    @Override
    @Cacheable(cacheNames = "nonConformityById", key = "#id + '_' + #companyId")
    public NonConformityDTO getNonConformityById(Long id, Long companyId) throws HSException {
        NonConformity nonConformity = nonConformityRepository.findById(id)
                .orElseThrow(() -> new HSException("NON_CONFORMITY_NOT_FOUND"));
        // Vérification d'appartenance à la mine (ne pas divulguer une NC d'une autre mine).
        if (companyId != null && !companyId.equals(nonConformity.getCompanyId())) {
            throw new HSException("NON_CONFORMITY_NOT_FOUND");
        }
        NonConformityDTO dto = nonConformity.toDTO();
        dto.setEvidence(mediaService.getAllMediaByArray(nonConformity.getEvidence()));
        dto.setDocs(mediaService.getAllMediaByArray(nonConformity.getDocs()));
        return dto;
    }

    @Override
    @Caching(evict = {
            // Clés de cache désormais composites (id_companyId) -> éviction globale de ces caches.
            @CacheEvict(cacheNames = "nonConformityById", allEntries = true),
            @CacheEvict(cacheNames = "nonConformitiesAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoById", allEntries = true)
    })
    public void updateNonConformityStatus(Long nonConformityId, EventStatus status) throws HSException {
        NonConformity nonConformity = nonConformityRepository.findById(nonConformityId)
                .orElseThrow(() -> new HSException("NON_CONFORMITY_NOT_FOUND"));
        assertNcTransition(nonConformity.getStatus(), status);
        nonConformity.setStatus(status);
        nonConformity.setUpdatedAt(LocalDateTime.now());
        nonConformityRepository.save(nonConformity);
    }

    private static final Map<EventStatus, Set<EventStatus>> NC_TRANSITIONS = Map.of(
            EventStatus.REPORTED, Set.of(EventStatus.ANALYSIS, EventStatus.CANCELLED),
            EventStatus.ANALYSIS, Set.of(EventStatus.AC_IMPLEMENTATION, EventStatus.CANCELLED),
            EventStatus.AC_IMPLEMENTATION, Set.of(EventStatus.CLOSED, EventStatus.CANCELLED),
            EventStatus.CLOSED, Set.of(),
            EventStatus.CANCELLED, Set.of()
    );

    private void assertNcTransition(EventStatus current, EventStatus target) throws HSException {
        if (!NC_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
            throw new HSException("INVALID_STATUS_TRANSITION");
        }
    }

    @Override
    @Cacheable(cacheNames = "nonConformityInfoAll", key = "#companyId")
    public List<NcInfo> getAllNcInfo(Long companyId) throws HSException {
        List<NcInfo> infos = nonConformityRepository.findAllNcInfo(companyId);
        List<Long> empIds = infos.stream()
                .map(NcInfo::getReporterId)
                .distinct()
                .toList();
        List<EmployeeNameDTO> employees = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> employeeMap = employees.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        infos.forEach(info -> {
            info.setReporterName(employeeMap.get(info.getReporterId()));
        });
        return infos;

    }

    @Override
    @Cacheable(cacheNames = "nonConformityInfoById", key = "#id + '_' + #companyId")
    public NcInfo getNcInfoById(Long id, Long companyId) throws HSException {
        return nonConformityRepository.findNcInfoById(id, companyId)
                .orElseThrow(() -> new HSException("NON_CONFORMITY_NOT_FOUND"));
    }

    @Override
    @Caching(evict = {
            // Clés de cache désormais composites (id_companyId) -> éviction globale de ces caches.
            @CacheEvict(cacheNames = "nonConformityById", allEntries = true),
            @CacheEvict(cacheNames = "nonConformitiesAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoById", allEntries = true)
    })
    public void updateNonConformity(NonConformityDTO nonConformityDTO) throws HSException {
        NonConformity nonConformity = nonConformityRepository.findById(nonConformityDTO.getId())
                .orElseThrow(() -> new HSException("NON_CONFORMITY_NOT_FOUND"));
        // Vérification d'appartenance : companyId de la requête (alimenté par le controller) vs entité.
        if (nonConformityDTO.getCompanyId() != null
                && !nonConformityDTO.getCompanyId().equals(nonConformity.getCompanyId())) {
            throw new HSException("NON_CONFORMITY_NOT_FOUND");
        }
        nonConformity.updateFromDTO(nonConformityDTO);
        // Le companyId ne doit jamais changer après création (updateFromDTO ne le touche pas).
        nonConformity.setEvidence(mediaService.saveAllMedia(nonConformityDTO.getEvidence()));
        nonConformity.setDocs(mediaService.saveAllMedia(nonConformityDTO.getDocs()));
        nonConformity.setUpdatedAt(LocalDateTime.now());
        nonConformityRepository.save(nonConformity);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "nonConformityById", allEntries = true),
            @CacheEvict(cacheNames = "nonConformitiesAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoById", key = "#request.nonConformity.id", condition = "#request.nonConformity != null")
    })
    public void updateEvent(Long companyId, EventRequestDTO request) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        // Propage le companyId de la requête pour la vérif d'appartenance dans updateNonConformity.
        if (request.getNonConformity() != null) {
            request.getNonConformity().setCompanyId(companyId);
        }
        this.updateNonConformity(request.getNonConformity());
        if (request.getCorrectiveActions() != null && !request.getCorrectiveActions().isEmpty()) {
            correctiveActionService.saveOrUpdateCorrectiveActions(companyId,
                    request.getCorrectiveActions().stream().map(action -> {
                        action.setNonConformityId(request.getNonConformity().getId());
                        action.setCompanyId(companyId);
                        return action;
                    }).toList());
        }
        if (request.getAnalysis() != null && request.getAnalysis().getId() != null) {
            eventAnalysisService.updateEventAnalysis(request.getAnalysis(), companyId);
        }
    }

}
