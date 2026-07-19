package com.minexpert.hns.service.inspections;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import org.springframework.data.domain.PageRequest;

import com.minexpert.hns.dto.GeneralInspectionDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.GeneralInspectionDetails;
import com.minexpert.hns.dto.response.GeneralInspectionResponse;
import com.minexpert.hns.dto.response.InspectionInfo;
import com.minexpert.hns.dto.response.LastInspectionDTO;
import com.minexpert.hns.dto.response.ParticipantResponse;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.inspections.workflow.InspectionWorkflowRules;
import com.minexpert.hns.enums.InspectionTemplateType;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.inspections.GeneralInspectionRepository;
import com.minexpert.hns.service.planning.ActivityService;
import com.minexpert.hns.utility.StringListConverter;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class GeneralInspectionServiceImpl implements GeneralInspectionService {

        private final GeneralInspectionRepository generalInspectionRepository;
        private final HrmsClient hrmsClient;
        private final ActivityService activityService;

        @Override
        @Caching(evict = {
                        // @CacheEvict(cacheNames = "generalInspectionById", allEntries = true),
                        @CacheEvict(cacheNames = "generalInspectionsAll", allEntries = true),
                        @CacheEvict(cacheNames = "generalInspectionDetails", allEntries = true),
                        @CacheEvict(cacheNames = "inspectionInfoById", allEntries = true)
        })
        public void createGeneralInspection(GeneralInspectionDTO generalInspectionDTO) throws HSException {
                // Une inspection SANS mine (companyId absent) devient une entite
                // orpheline, invisible des qu'une mine est selectionnee. On refuse la
                // creation silencieuse (doctrine COMPANY_ID_REQUIRED). Le companyId est
                // injecte dans le DTO par le controller depuis la mine active du header.
                if (generalInspectionDTO.getCompanyId() == null || generalInspectionDTO.getCompanyId() <= 0) {
                        throw new HSException("COMPANY_ID_REQUIRED");
                }
                generalInspectionDTO.setCreatedAt(LocalDateTime.now());
                generalInspectionDTO.setUpdatedAt(LocalDateTime.now());
                generalInspectionDTO.setStatus(InspectionStatus.PENDING);
                activityService.changeActivityStatusProgress(generalInspectionDTO.getActivityId());
                generalInspectionRepository.save(generalInspectionDTO.toEntity());

        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "generalInspectionById", key = "#generalInspectionDTO.id", condition = "#generalInspectionDTO.id != null"),
                        @CacheEvict(cacheNames = "generalInspectionsAll", allEntries = true),
                        // Clés de cache désormais suffixées par companyId : purge globale sur mutation.
                        @CacheEvict(cacheNames = "generalInspectionDetails", allEntries = true),
                        @CacheEvict(cacheNames = "inspectionInfoById", allEntries = true)
        })
        public void updateGeneralInspection(GeneralInspectionDTO generalInspectionDTO, Long companyId) throws HSException {
                GeneralInspection existing = generalInspectionRepository.findById(generalInspectionDTO.getId())
                                .orElseThrow(() -> new HSException("GENERAL_INSPECTION_NOT_FOUND"));
                // Cloisonnement : ne pas modifier une inspection d'une autre mine.
                if (companyId != null && !companyId.equals(existing.getCompanyId())) {
                        throw new HSException("GENERAL_INSPECTION_NOT_FOUND");
                }
                // Conserver la mine d'origine si la requête n'en fournit pas une.
                if (generalInspectionDTO.getCompanyId() == null) {
                        generalInspectionDTO.setCompanyId(existing.getCompanyId());
                }
                generalInspectionDTO.setUpdatedAt(LocalDateTime.now());
                generalInspectionRepository.save(generalInspectionDTO.toEntity());
        }

        @Override
        @Cacheable(cacheNames = "generalInspectionsAll", key = "#companyId != null ? #companyId : 'ALL'")
        public List<GeneralInspectionResponse> getAllInspections(Long companyId) throws HSException {
                return generalInspectionRepository.findAllInspections(companyId);
        }

        @Override
        @Cacheable(cacheNames = "generalInspectionDetails", key = "#id + '-' + #companyId")
        public GeneralInspectionDetails getInspectionDetailsById(Long id, Long companyId) throws HSException {
                GeneralInspection inspection = generalInspectionRepository.findById(id)
                                .orElseThrow(() -> new HSException("GENERAL_INSPECTION_NOT_FOUND"));
                // Cloisonnement : ne pas divulguer une inspection d'une autre mine.
                if (companyId != null && !companyId.equals(inspection.getCompanyId())) {
                        throw new HSException("GENERAL_INSPECTION_NOT_FOUND");
                }
                GeneralInspectionDetails details = inspection.toDetails();
                List<ParticipantResponse> participants = inspection.getParticipants() != null
                                ? StringListConverter.convertStringToParticipants(inspection.getParticipants())
                                : Arrays.asList();
                List<Long> empIds = participants.stream().map(x -> x.getId())
                                .filter(Objects::nonNull)
                                .distinct()
                                .toList();
                List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
                Map<Long, String> empIdToDtoMap = empNames.stream()
                                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
                participants.forEach(participant -> {
                        if (participant.getId() != null) {
                                participant.setName(empIdToDtoMap.get(participant.getId()));

                        }
                });
                details.setParticipants(participants);
                return details;
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "generalInspectionById", key = "#id"),
                        @CacheEvict(cacheNames = "generalInspectionsAll", allEntries = true),
                        @CacheEvict(cacheNames = "generalInspectionDetails", allEntries = true),
                        @CacheEvict(cacheNames = "inspectionInfoById", allEntries = true)
        })
        public void updateInspectionStatus(Long id, InspectionStatus status) throws HSException {
                GeneralInspection inspection = generalInspectionRepository.findById(id)
                                .orElseThrow(() -> new HSException("GENERAL_INSPECTION_NOT_FOUND"));

                // Cette methode est la VOIE BRUTE d'ecriture du statut (sauvegarde de
                // processus, historique) : elle recevait jusqu'ici le statut tel quel
                // depuis le client, sans machine a etats ni verrou de date — le verrou
                // ne vivait donc que dans l'IHM, contournable par appel direct.
                // On applique desormais EXACTEMENT les memes regles que le service
                // metier garde (source unique : InspectionWorkflowRules).
                //
                // Statut absent : on ne touche pas au statut courant (sauvegarde de
                // brouillon qui ne porte pas d'intention de transition).
                if (status == null) {
                        inspection.setUpdatedAt(LocalDateTime.now());
                        generalInspectionRepository.save(inspection);
                        return;
                }
                InspectionWorkflowRules.assertTransitionAllowed(inspection.getStatus(), status);
                InspectionWorkflowRules.assertNotBeforePlannedDate(inspection.getPlannedDate(), status);

                inspection.setStatus(status);
                inspection.setUpdatedAt(LocalDateTime.now());
                generalInspectionRepository.save(inspection);
        }

        @Override
        @Cacheable(cacheNames = "inspectionInfoById", key = "#id + '-' + #companyId")
        public InspectionInfo getInspectionInfoById(Long id, Long companyId) throws HSException {
                // Le filtre companyId dans la requête renvoie vide si l'inspection
                // appartient à une autre mine → NOT_FOUND (pas de divulgation).
                return generalInspectionRepository.findInspectionInfo(id, companyId)
                                .orElseThrow(() -> new HSException("GENERAL_INSPECTION_NOT_FOUND"));
        }

        @Override
        public LastInspectionDTO getLastInspection(String targetType, Long targetRefId, Long companyId)
                        throws HSException {
                if (targetType == null || targetRefId == null) {
                        return null;
                }
                InspectionTemplateType type;
                try {
                        type = InspectionTemplateType.valueOf(targetType.trim().toUpperCase());
                } catch (IllegalArgumentException ex) {
                        // Type inconnu → aucune correspondance possible.
                        return null;
                }
                List<GeneralInspection> found = generalInspectionRepository
                                .findLastInspection(type, targetRefId, companyId, PageRequest.of(0, 1));
                if (found.isEmpty()) {
                        return null;
                }
                GeneralInspection last = found.get(0);
                String inspectorName = resolveInspectorName(last.getPrimaryInspectorId());
                String templateName = last.getTemplate() != null ? last.getTemplate().getName() : null;
                return new LastInspectionDTO(last.getId(), last.getPlannedDate(), last.getStatus(),
                                inspectorName, templateName);
        }

        /** Nom de l'inspecteur principal via HRMS (best-effort, jamais bloquant). */
        private String resolveInspectorName(Long inspectorId) {
                if (inspectorId == null) {
                        return null;
                }
                try {
                        List<EmployeeNameDTO> names = hrmsClient.getEmployeeNameByIds(List.of(inspectorId));
                        return names.isEmpty() ? null : names.get(0).getName();
                } catch (RuntimeException ex) {
                        // HRMS indisponible : on renvoie la dernière inspection sans le nom.
                        return null;
                }
        }

}
