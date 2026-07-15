package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.config.AuditCacheNames;
import com.minexpert.hns.dto.audit.ObservationDTO;
import com.minexpert.hns.dto.nonConformity.NonConformityDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.ObsTitle;
import com.minexpert.hns.entity.audit.EmpInterview;
import com.minexpert.hns.entity.audit.Observation;
import com.minexpert.hns.enums.EventType;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.ObservationRepository;
import com.minexpert.hns.service.MediaService;
import com.minexpert.hns.service.nonConformity.NonConformityService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ObservationServiceImpl implements ObservationService {

    /** LOT 52 — classifications ISO 19011 admises pour un constat d'audit. */
    private static final java.util.Set<String> ISO_CLASSIFICATIONS =
            java.util.Set.of("NC_MAJEURE", "NC_MINEURE", "OBSERVATION", "OPPORTUNITE");

    private final ObservationRepository observationRepository;
    private final MediaService mediaService;
    private final HrmsClient hrmsClient;
    private final NonConformityService nonConformityService;

    /**
     * LOT 52 — rigueur ISO : une non-conformité (majeure ou mineure) exige la
     * clause du référentiel ET au moins une preuve. Classification inconnue refusée.
     */
    private void validateIsoClassification(ObservationDTO dto) throws HSException {
        String classification = dto.getClassification();
        if (classification == null || classification.isBlank()) return;
        if (!ISO_CLASSIFICATIONS.contains(classification)) {
            throw new HSException("CLASSIFICATION_INVALID");
        }
        boolean isNc = classification.startsWith("NC_");
        if (isNc && (dto.getClause() == null || dto.getClause().isBlank())) {
            throw new HSException("CLAUSE_REQUIRED_FOR_NC");
        }
        if (isNc && (dto.getEvidence() == null || dto.getEvidence().isEmpty())) {
            throw new HSException("EVIDENCE_REQUIRED_FOR_NC");
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.OBSERVATIONS_BY_AUDIT, key = "#observationDTO.auditId", condition = "#observationDTO.auditId != null"),
            @CacheEvict(cacheNames = AuditCacheNames.OBSERVATION_TITLES_BY_AUDIT, key = "#observationDTO.auditId", condition = "#observationDTO.auditId != null")
    })
    public Long createObservation(ObservationDTO observationDTO) throws HSException {
        validateIsoClassification(observationDTO);
        observationDTO.setCreatedAt(LocalDateTime.now());
        observationDTO.setUpdatedAt(LocalDateTime.now());
        Observation observation = observationDTO.toEntity();
        observation.setEvidence(mediaService.saveAllMedia(observationDTO.getEvidence()));
        return observationRepository.save(observation).getId();
    }

    /**
     * LOT 52 — escalade d'un constat d'audit classé NC vers un Constat central
     * (NonConformity) : un seul flux de traitement des écarts dans SafeX.
     * Idempotent : si déjà escaladé, retourne l'identifiant existant.
     */
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.OBSERVATIONS_BY_AUDIT, allEntries = true)
    })
    public Long escalateToNonConformity(Long observationId) throws HSException {
        Observation observation = observationRepository.findById(observationId)
                .orElseThrow(() -> new HSException("OBSERVATION_NOT_FOUND"));
        if (observation.getNonConformityId() != null) {
            return observation.getNonConformityId();
        }
        String classification = observation.getClassification();
        if (classification == null || !classification.startsWith("NC_")) {
            throw new HSException("ONLY_NC_CAN_BE_ESCALATED");
        }

        NonConformityDTO nc = new NonConformityDTO();
        // Cloisonnement par mine : la NC créée par escalade hérite du companyId
        // du constat d'origine, sinon elle devient orpheline (company_id NULL)
        // et invisible dans le registre filtré par mine.
        nc.setCompanyId(observation.getCompanyId());
        nc.setType(EventType.NON_CONFORMITY);
        nc.setTitle(observation.getTitle());
        nc.setDescription(observation.getObservedFact());
        nc.setDate(observation.getDate());
        nc.setDetectionDate(observation.getDate());
        nc.setRequirement(observation.getClause());
        nc.setDetectionSource("Audit interne"
                + (observation.getAudit() != null && observation.getAudit().getRefNumber() != null
                    ? " — " + observation.getAudit().getRefNumber() : ""));
        Long ncId = nonConformityService.createNonConformity(nc);

        observation.setNonConformityId(ncId);
        observation.setUpdatedAt(LocalDateTime.now());
        observationRepository.save(observation);
        return ncId;
    }

    /**
     * LOT 52 (remédiation GATE CODE-04) : mise à jour réelle d'un constat —
     * mêmes règles de rigueur ISO qu'à la création (NC ⇒ clause + preuve).
     * L'audit de rattachement et l'éventuel lien NonConformity sont préservés.
     */
    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.OBSERVATIONS_BY_AUDIT, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.OBSERVATION_TITLES_BY_AUDIT, allEntries = true)
    })
    public void updateObservation(ObservationDTO observationDTO) throws HSException {
        Observation observation = observationRepository.findById(observationDTO.getId())
                .orElseThrow(() -> new HSException("OBSERVATION_NOT_FOUND"));
        validateIsoClassification(observationDTO);

        if (observationDTO.getTitle() != null) observation.setTitle(observationDTO.getTitle());
        if (observationDTO.getDate() != null) observation.setDate(observationDTO.getDate());
        if (observationDTO.getObservedFact() != null) observation.setObservedFact(observationDTO.getObservedFact());
        if (observationDTO.getReference() != null) observation.setReference(observationDTO.getReference());
        if (observationDTO.getType() != null) observation.setType(observationDTO.getType());
        if (observationDTO.getSeverity() != null) observation.setSeverity(observationDTO.getSeverity());
        if (observationDTO.getDescription() != null) observation.setDescription(observationDTO.getDescription());
        if (observationDTO.getClassification() != null) observation.setClassification(observationDTO.getClassification());
        if (observationDTO.getClause() != null) observation.setClause(observationDTO.getClause());
        if (observationDTO.getEvidence() != null && !observationDTO.getEvidence().isEmpty()) {
            observation.setEvidence(mediaService.saveAllMedia(observationDTO.getEvidence()));
        }
        observation.setUpdatedAt(LocalDateTime.now());
        observationRepository.save(observation);
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.OBSERVATIONS_BY_AUDIT, key = "#auditId")
    public List<ObservationDTO> getAllObservationsByAuditId(Long auditId) throws HSException {
        List<Observation> observations = observationRepository.findByAudit_Id(auditId);

        List<Long> employeeIds = observations.stream()
                .flatMap(o -> {
                    List<EmpInterview> interviews = o.getInterviews();
                    return interviews != null ? interviews.stream() : Stream.empty();
                })
                .map((x) -> x.getId())
                .distinct()
                .toList();
        List<EmployeeNameDTO> employeeNames = hrmsClient.getEmployeeNameByIds(employeeIds);
        Map<Long, String> employeeNameMap = employeeNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));

        return observations.stream()
                .map((x) -> {
                    ObservationDTO dto = x.toDTO();
                    dto.setEvidence(mediaService.getAllMediaByArray(x.getEvidence()));
                    if (x.getInterviews() != null) {
                        dto.setInterviews(x.getInterviews().stream()
                                .map((interview) -> {
                                    return new EmpInterview(interview.getId(), employeeNameMap.get(interview.getId()),
                                            interview.getDate());
                                }).toList());
                    }
                    return dto;
                })
                .toList();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.OBSERVATION_TITLES_BY_AUDIT, key = "#auditId")
    public List<ObsTitle> getObservationTitlesByAuditId(Long auditId) throws HSException {
        return observationRepository.findTitlesByAuditId(auditId);
    }

}
