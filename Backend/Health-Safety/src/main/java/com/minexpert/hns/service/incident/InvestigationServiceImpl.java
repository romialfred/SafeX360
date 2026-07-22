package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.InvestActionDTO;
import com.minexpert.hns.dto.InvestigationDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.InvestResponse;
import com.minexpert.hns.dto.response.InvestigationSummary;
import com.minexpert.hns.dto.response.ParticipantResponse;
import com.minexpert.hns.entity.incident.Investigation;
import com.minexpert.hns.enums.InvestigationStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.repository.incident.IncidentRepository;
import com.minexpert.hns.repository.incident.InvestigationRepository;
import com.minexpert.hns.service.MediaService;
import com.minexpert.hns.service.audit.ChangeLogService;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class InvestigationServiceImpl implements InvestigationService {

    private static final org.slf4j.Logger LOGGER =
            org.slf4j.LoggerFactory.getLogger(InvestigationServiceImpl.class);

    public static final String CACHE_INVESTIGATION_BY_INCIDENT = "investigationByIncident";
    public static final String CACHE_INVESTIGATION_BY_ID = "investigationById";
    public static final String CACHE_INVESTIGATIONS_ALL = "investigationsAll";

    private final InvestigationRepository investigationRepository;
    private final IncidentRepository incidentRepository;

    private final CorrectiveActionService correctiveActionService;
    private final MediaService mediaService;
    private final HrmsClient hrmsClient;
    private final com.minexpert.hns.service.audit.ChangeLogService changeLogService;

    /**
     * Resout le companyId d'une investigation. Une investigation appartient
     * TOUJOURS a un incident, donc a une mine precise : quand le companyId n'est
     * pas fourni par la requete (ex. UI en vue consolidee « Toutes les Mines »
     * ou selectedCompanyId null), on le derive de l'incident lui-meme. Cela rend
     * l'operation independante du selecteur de vue et evite le 400
     * « parametre companyId manquant » qui remontait en erreur generique.
     */
    private Long resolveCompanyId(Long companyId, Long incidentId) throws HSException {
        if (companyId != null) {
            return companyId;
        }
        if (incidentId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        Incident incident = incidentRepository
                .findByIdWithCompanyContext(incidentId, null)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        if (incident.getCompanyId() == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        return incident.getCompanyId();
    }

    @Override
    @Caching(evict = {
            // Eviction large : le companyId du parametre peut etre null (derive
            // ensuite de l'incident), une cle SpEL par companyId serait donc fausse.
            @CacheEvict(cacheNames = CACHE_INVESTIGATION_BY_INCIDENT, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INVESTIGATIONS_ALL, allEntries = true),
            @CacheEvict(cacheNames = IncidentServiceImpl.CACHE_DEPARTMENT_INCIDENT_STATS, allEntries = true)
    })
    public Long addInvestigation(Long companyId, InvestActionDTO request) throws HSException {
        InvestigationDTO investigationDTO = request.getInvestigation();
        if (investigationDTO == null) {
            throw new HSException("INVESTIGATION_DETAILS_REQUIRED");
        }
        // Derive du companyId depuis l'incident si absent (vue consolidee).
        // Variable finale distincte : requise pour la capture dans le lambda.
        final Long resolvedCompanyId = resolveCompanyId(companyId, investigationDTO.getIncidentId());
        investigationDTO.setCompanyId(resolvedCompanyId);
        Optional<Investigation> optional = investigationRepository
                .findByIncidentIdWithCompanyContext(investigationDTO.getIncidentId(), resolvedCompanyId);

        if (optional.isPresent()) {
            throw new HSException("INVESTIGATION_ALREADY_EXISTS");
        }

        if (request.getCorrectiveActions() != null) {
            request.getCorrectiveActions().forEach(action -> {
                try {
                    action.setIncidentId(investigationDTO.getIncidentId());
                    action.setCompanyId(resolvedCompanyId);
                    correctiveActionService.addCorrectiveAction(resolvedCompanyId, action);
                } catch (HSException e) {
                    // Une action corrective en echec ne doit pas casser toute
                    // l'investigation, mais on trace pour ne pas la perdre en silence.
                    LOGGER.warn("[Investigation] Action corrective ignoree (incident {}): {}",
                            investigationDTO.getIncidentId(), e.getMessage());
                }
            });
        }
        investigationDTO.setCreatedAt(LocalDateTime.now());
        investigationDTO.setUpdatedAt(LocalDateTime.now());
        investigationDTO.setStatus(InvestigationStatus.PENDING);
        investigationDTO.setProgress(0);
        Investigation investigation = investigationDTO.toEntity();
        investigation.setEvidence(mediaService.saveAllMedia(investigationDTO.getEvidence()));
        return investigationRepository.save(investigation).getId();
    }

    @Override
    @Cacheable(cacheNames = CACHE_INVESTIGATION_BY_INCIDENT, key = "#companyId != null ? (#companyId + '-' + #incidentId) : 'ALL-' + #incidentId")
    public InvestResponse getInvestigationByIncidentId(Long companyId, Long incidentId) throws HSException {
        Investigation investigation = investigationRepository
                .findByIncidentIdWithCompanyContext(incidentId, companyId)
                .orElseThrow(() -> new HSException("INVESTIGATION_NOT_FOUND"));
        InvestResponse investResponse = investigation.toResponse();
        investResponse.setEvidence(mediaService.getAllMediaByArray(investigation.getEvidence()));
        List<Long> empIds = StringListConverter.convertStringToParticipants(investigation.getTeam()).stream()
                .map(ParticipantResponse::getId).toList();
        List<EmployeeNameDTO> participants = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, EmployeeNameDTO> empNumberMap = participants.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, e -> e));
        investResponse.setTeam(investResponse.getTeam().stream()
                .map(participant -> {
                    EmployeeNameDTO emp = empNumberMap.get(participant.getId());
                    if (emp != null) {
                        participant.setName(emp.getName());
                        participant.setEmpNumber(emp.getEmpNumber());
                    }
                    return participant;
                })
                .toList());
        return investResponse;
    }

    @Override
    @Cacheable(cacheNames = CACHE_INVESTIGATION_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public InvestResponse getInvestigationById(Long companyId, Long id) throws HSException {
        Investigation investigation = investigationRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INVESTIGATION_NOT_FOUND"));
        InvestResponse investResponse = investigation.toResponse();
        investResponse.setEvidence(mediaService.getAllMediaByArray(investigation.getEvidence()));
        List<Long> empIds = StringListConverter.convertStringToParticipants(investigation.getTeam()).stream()
                .map(ParticipantResponse::getId).toList();
        List<EmployeeNameDTO> participants = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, EmployeeNameDTO> empNumberMap = participants.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, e -> e));
        investResponse.setTeam(investResponse.getTeam().stream()
                .map(participant -> {
                    EmployeeNameDTO emp = empNumberMap.get(participant.getId());
                    if (emp != null) {
                        participant.setName(emp.getName());
                        participant.setEmpNumber(emp.getEmpNumber());
                    }
                    return participant;
                })
                .toList());
        return investResponse;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_INVESTIGATION_BY_INCIDENT, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INVESTIGATION_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INVESTIGATIONS_ALL, allEntries = true)
    })
    public void validateInvestigation(Long companyId, Long investigationId, String comment) throws HSException {
        Investigation investigation = investigationRepository.findByIdWithCompanyContext(investigationId, companyId)
                .orElseThrow(() -> new HSException("INVESTIGATION_NOT_FOUND"));
        if (Boolean.TRUE.equals(investigation.getValidated())) {
            throw new HSException("INVESTIGATION_ALREADY_VALIDATED");
        }
        // Verificateur = pair AUTHENTIFIE (non repudiable). On refuse fail-closed si
        // aucune identite authentifiee n'est presente : une validation « sans auteur »
        // ne serait pas opposable (le sens meme du controle §10.2).
        Long actor = com.minexpert.hns.utility.AuthUtils.currentActorId();
        if (actor == null) {
            throw new HSException("VALIDATION_ACTOR_REQUIRED");
        }
        // Independance (ISO 45001 §10.2) : pas d'auto-validation. Le validateur ne
        // doit pas figurer dans l'equipe d'enquete — sinon la « revue par un pair »
        // se reduit a une auto-attestation, exactement ce que le controle interdit.
        boolean actorOnTeam = StringListConverter.convertStringToParticipants(investigation.getTeam())
                .stream()
                .anyMatch(p -> actor.equals(p.getId()));
        if (actorOnTeam) {
            throw new HSException("VALIDATOR_MUST_BE_INDEPENDENT");
        }
        investigation.setValidated(true);
        investigation.setReviewedBy(actor);
        investigation.setReviewedAt(LocalDateTime.now());
        investigation.setValidationComment(comment);
        investigation.setUpdatedAt(LocalDateTime.now());
        investigationRepository.save(investigation);
        changeLogService.record(ChangeLogService.INVESTIGATION, investigationId, investigation.getCompanyId(),
                "validated", "false", "true");
    }

    @Override
    @Caching(evict = {
            // Eviction large : companyId du parametre peut etre null (derive ensuite)
            @CacheEvict(cacheNames = CACHE_INVESTIGATION_BY_INCIDENT, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INVESTIGATION_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INVESTIGATIONS_ALL, allEntries = true),
            @CacheEvict(cacheNames = IncidentServiceImpl.CACHE_DEPARTMENT_INCIDENT_STATS, allEntries = true)
    })
    public void updateInvestigation(Long companyId, InvestActionDTO request) throws HSException {
        InvestigationDTO dto = request.getInvestigation();
        if (dto == null) {
            throw new HSException("INVESTIGATION_DETAILS_REQUIRED");
        }
        // Derive du companyId depuis l'incident si absent (vue consolidee)
        final Long resolvedCompanyId = resolveCompanyId(companyId, dto.getIncidentId());
        dto.setCompanyId(resolvedCompanyId);
        Investigation investigation = investigationRepository
                .findByIdWithCompanyContext(dto.getId(), resolvedCompanyId)
                .orElseThrow(() -> new HSException("INVESTIGATION_NOT_FOUND"));
        if (request.getCorrectiveActions() != null) {
            request.getCorrectiveActions().forEach(action -> {
                try {
                    action.setIncidentId(dto.getIncidentId());
                    action.setCompanyId(resolvedCompanyId);
                    if (action.getId() != null) {
                        correctiveActionService.updateCorrectiveAction(resolvedCompanyId, action);
                    } else {
                        correctiveActionService.addCorrectiveAction(resolvedCompanyId, action);
                    }
                } catch (HSException e) {
                    LOGGER.warn("[Investigation] Action corrective ignoree (incident {}): {}",
                            dto.getIncidentId(), e.getMessage());
                }
            });
        }

        // `toEntity()` porte les conversions de format (équipe et causes sont des
        // listes côté DTO, sérialisées en texte côté entité) : on le réutilise
        // pour le CONTENU éditable...
        Investigation entity = dto.toEntity();
        entity.setEvidence(mediaService.saveAllMedia(dto.getEvidence()));

        // ...puis on RESTAURE les champs qui appartiennent au SERVEUR depuis
        // l'entité persistée. Auparavant l'objet était intégralement reconstruit
        // depuis la requête : le statut, la progression, la mine, l'incident de
        // rattachement et la date de création étaient dictés par le client. Un
        // appel direct pouvait donc déclarer une investigation terminée sans
        // passer par le workflow, ou la rattacher à une autre mine. Ces champs
        // transitent par les actions dédiées, jamais par une édition de contenu.
        entity.setId(investigation.getId());
        entity.setStatus(investigation.getStatus());
        entity.setProgress(investigation.getProgress());
        entity.setCompanyId(investigation.getCompanyId());
        entity.setIncident(investigation.getIncident());
        entity.setCreatedAt(investigation.getCreatedAt());
        // Gouvernance (validation par pair) : appartient au SERVEUR, posee par
        // validateInvestigation. On la PRESERVE — sinon une edition de contenu
        // apres validation effacerait la validation (et rouvrirait la clôture).
        entity.setValidated(investigation.getValidated());
        entity.setReviewedBy(investigation.getReviewedBy());
        entity.setReviewedAt(investigation.getReviewedAt());
        entity.setValidationComment(investigation.getValidationComment());
        entity.setUpdatedAt(LocalDateTime.now());
        investigationRepository.save(entity);
    }

    @Override
    @Cacheable(cacheNames = CACHE_INVESTIGATIONS_ALL, key = "#companyId != null ? #companyId : 'ALL'")
    public List<InvestigationSummary> getAllInvestigations(Long companyId) throws HSException {
        return investigationRepository.findAllInvestigationSummaries(companyId);
    }

}
