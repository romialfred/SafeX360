package com.minexpert.hns.service.incident;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.utility.AuthUtils;
import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.dto.request.DepartmentNames;
import com.minexpert.hns.dto.response.DepartmentIncidentStats;
import com.minexpert.hns.dto.response.IncidentResponse;
import com.minexpert.hns.dto.response.YearlyClosureData;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.incident.IncidentAnalysis;
import com.minexpert.hns.entity.incident.IncidentDetail;
import com.minexpert.hns.entity.incident.RiskAssessment;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.enums.IncidentStatus;
import com.minexpert.hns.enums.InvestigationStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.MediaRepository;
import com.minexpert.hns.repository.incident.CorrectiveActionRepository;
import com.minexpert.hns.repository.incident.IncidentAnalysisRepository;
import com.minexpert.hns.repository.incident.IncidentDetailRepository;
import com.minexpert.hns.repository.incident.IncidentRepository;
import com.minexpert.hns.repository.incident.InvestigationRepository;
import com.minexpert.hns.repository.incident.RiskAssessmentRepository;
import com.minexpert.hns.repository.incident.projection.MonthlyClosureSummary;
import com.minexpert.hns.repository.parameters.IncidentTypeRepository;
import com.minexpert.hns.service.audit.ChangeLogService;
import com.minexpert.hns.dto.IncidentDetailDTO;
import com.minexpert.hns.dto.response.IncidentTypeDetails;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.service.MediaService;

@Service
@Transactional
public class IncidentServiceImpl implements IncidentService {

    public static final String CACHE_INCIDENTS_ALL = "incidentsAll";
    public static final String CACHE_INCIDENT_BY_ID = "incidentById";
    public static final String CACHE_INCIDENT_RESPONSE_BY_ID = "incidentResponseById";
    public static final String CACHE_INCIDENT_YEARLY_CLOSURE = "incidentYearlyClosure";
    public static final String CACHE_DEPARTMENT_INCIDENT_STATS = "departmentIncidentStats";
    private static final String[] MONTH_LABELS = { "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept",
            "Oct", "Nov", "Dec" };

    @Autowired
    private IncidentRepository incidentRepository;
    @Autowired
    private MediaRepository mediaRepository;

    @Autowired
    private IncidentAnalysisRepository incidentAnalysisRepository;
    @Autowired
    private IncidentDetailRepository incidentDetailRepository;

    @Autowired
    private MediaService mediaService;

    @Autowired
    private RiskAssessmentRepository riskAssessmentRepository;

    @Autowired
    private HrmsClient hrmsClient;

    @Autowired
    private CorrectiveActionRepository correctiveActionRepository;

    @Autowired
    private InvestigationRepository investigationRepository;

    @Autowired
    private IncidentTypeRepository incidentTypeRepository;

    @Autowired
    private ChangeLogService changeLogService;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_INCIDENTS_ALL, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INCIDENT_YEARLY_CLOSURE, allEntries = true),
            // @CacheEvict(cacheNames = CACHE_INCIDENT_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INCIDENT_RESPONSE_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = CACHE_DEPARTMENT_INCIDENT_STATS, allEntries = true),
            // Les caches d'agrégation incidentDetail* ont été supprimés avec les
            // requêtes non cloisonnées qu'ils servaient (voir IncidentDetailRepository).
            @CacheEvict(cacheNames = IncidentDetailServiceIImpl.CACHE_INCIDENT_DETAILS_BY_INCIDENT, allEntries = true)
    })
    public void reportIncident(Long companyId, IncidentDTO incidentDTO) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        // Statut initial IMPOSE (ISO 45001 §10.2 — spec formulaires §2.3) : un
        // incident NAIT dans son etat initial, il ne se choisit pas. Auparavant le
        // statut n'etait force que s'il etait null : le client pouvait donc faire
        // naitre un incident directement CLOSED ou REJECTED — etats TERMINAUX dans
        // INCIDENT_TRANSITIONS — soit une preuve definitivement figee, sans
        // investigation ni tracabilite de la cloture. assertIncidentTransition ne
        // protege que updateIncidentStatus : la creation la contournait.
        // PENDING est bien l'etat initial de la machine a etats (seul etat sans
        // transition entrante) ; c'est le HSE qui le fait ensuite transiter vers
        // REPORTED ou REJECTED.
        incidentDTO.setStatus(IncidentStatus.PENDING);

        incidentDTO.setCompanyId(companyId);
        Incident incident = incidentDTO.toIncident();
        // Intégrité du déclarant (E1.3 · §7.5.3) : un incident ne doit JAMAIS naître
        // sans déclarant. La voie web/IA fournit reporterId ; une voie qui l'omettrait
        // (mobile, appel direct) créerait un incident anonyme faussant la traçabilité
        // et les relances. On retombe sur l'EMPLOYÉ authentifié (empId non répudiable).
        if (incident.getReporterId() == null) {
            incident.setReporterId(com.minexpert.hns.utility.AuthUtils.currentEmpId());
        }
        incident.setNumber(generateIncidentNumber(companyId));
        incident.setCreatedAt(LocalDateTime.now());
        incident.setUpdatedAt(LocalDateTime.now());
        incident.setEvidence(mediaService.saveAllMedia(incidentDTO.getEvidence()));
        Incident savedIncident = incidentRepository.save(incident);

        // Incident Analysis

        IncidentAnalysis incidentAnalysis = incidentDTO.toIncidentAnalysis();
        incidentAnalysis.setIncident(savedIncident);

        incidentAnalysis.setCreatedAt(LocalDateTime.now());
        incidentAnalysis.setUpdatedAt(LocalDateTime.now());
        incidentAnalysisRepository.save(incidentAnalysis);

        // incident Detail — CLASSIFICATION (ISO 45001 §9.1)
        // Integrite inter-voies (E1.3) : le formulaire web classique fournit une
        // classification (categorie/type/gravite) choisie par l'utilisateur ; les
        // voies IA et mobile, non. Sans au moins une ligne de classification,
        // l'incident sort a GRAVITE NULLE des listes (findAllIncidentsWithMaxSeverity)
        // et fausse tous les KPI. Plutot que de faire reconstruire ce triplet par
        // chaque ecran (fragile, duplique), le SERVEUR derive ici une classification
        // minimale valide a partir des referentiels de la mine + la gravite declaree.
        List<IncidentDetailDTO> details = incidentDTO.getIncidentDetails();
        if (details == null || details.isEmpty()) {
            IncidentDetailDTO derived = deriveDefaultClassification(companyId, incidentDTO.getSeverity());
            details = derived != null ? java.util.List.of(derived) : java.util.Collections.emptyList();
        }
        details.forEach(incidentDetailDTO -> {
            incidentDetailDTO.setIncidentId(savedIncident.getId());
            incidentDetailDTO.setCreatedAt(LocalDateTime.now());
            incidentDetailDTO.setUpdatedAt(LocalDateTime.now());
            incidentDetailRepository.save(incidentDetailDTO.toEntity());
        });
        // RiskAssement
        RiskAssessment riskAssessment = incidentDTO.toRiskAssessment();
        riskAssessment.setIncident(savedIncident);
        riskAssessment.setCreatedAt(LocalDateTime.now());
        riskAssessment.setUpdatedAt(LocalDateTime.now());
        riskAssessmentRepository.save(riskAssessment);
    }

    /**
     * Derive une classification minimale VALIDE pour une declaration qui n'en
     * porte pas (voies IA / mobile). Un {@code IncidentType} de la mine encapsule
     * deja un triplet coherent : categorie (FK non-null) + niveau de gravite
     * (JOIN interne). On choisit le type actif dont le niveau de gravite est le
     * plus proche de la gravite declaree ({@code severity} 1..5), afin que la
     * classification reflete au mieux l'evenement plutot qu'un simple defaut.
     *
     * Best-effort : si la mine n'a aucun type actif configure, on renvoie null et
     * l'incident est persiste sans detail — une declaration ne se bloque JAMAIS
     * (ISO 45001 §10.2), la classification restant rattrapable a l'edition.
     */
    private IncidentDetailDTO deriveDefaultClassification(Long companyId, Integer declaredSeverity) {
        List<IncidentTypeDetails> types;
        try {
            types = incidentTypeRepository.findAllByStatus(companyId, Status.ACTIVE);
        } catch (Exception e) {
            return null;
        }
        if (types == null || types.isEmpty()) {
            return null;
        }
        IncidentTypeDetails chosen = types.get(0);
        if (declaredSeverity != null) {
            int best = Integer.MAX_VALUE;
            for (IncidentTypeDetails t : types) {
                Integer level = t.getSeverityLevel();
                int dist = level != null ? Math.abs(level - declaredSeverity) : Integer.MAX_VALUE;
                if (dist < best) {
                    best = dist;
                    chosen = t;
                }
            }
        }
        // Le type actif garantit des FK non-null (categorie + gravite via JOIN
        // interne) — l'invariant de IncidentDetail (3 colonnes NOT NULL) est tenu.
        if (chosen.getIncidentCategoryId() == null || chosen.getSeverityLevelId() == null) {
            return null;
        }
        IncidentDetailDTO detail = new IncidentDetailDTO();
        detail.setIncidentCategoryId(chosen.getIncidentCategoryId());
        detail.setIncidentTypeId(chosen.getId());
        detail.setSeverityLevelId(chosen.getSeverityLevelId());
        return detail;
    }

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENTS_ALL, key = "#companyId != null ? #companyId : 'ALL'")
    public List<IncidentResponse> getAllIncidents(Long companyId) {
        return incidentRepository.findAllIncidentsWithMaxSeverity(companyId);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_INCIDENT_BY_ID, key = "#companyId != null ? (#companyId + '-' + #incidentDTO.id) : 'ALL-' + #incidentDTO.id"),
            @CacheEvict(cacheNames = CACHE_INCIDENT_RESPONSE_BY_ID, key = "#companyId != null ? (#companyId + '-' + #incidentDTO.id) : 'ALL-' + #incidentDTO.id"),
            @CacheEvict(cacheNames = CACHE_INCIDENTS_ALL, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INCIDENT_YEARLY_CLOSURE, allEntries = true),
            @CacheEvict(cacheNames = CACHE_DEPARTMENT_INCIDENT_STATS, allEntries = true),
            @CacheEvict(cacheNames = IncidentDetailServiceIImpl.CACHE_INCIDENT_DETAILS_BY_INCIDENT, key = "#incidentDTO.id")
    })
    public void updateIncident(Long companyId, IncidentDTO incidentDTO) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }

        // incident
        Incident incident = incidentRepository.findByIdAndCompanyId(incidentDTO.getId(), companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        incidentDTO.setCompanyId(companyId);
        Incident updatedIncident = incidentDTO.toIncident();
        updatedIncident.setStatus(incident.getStatus());
        updatedIncident.setCreatedAt(incident.getCreatedAt());
        // number est unique et attribue par le SERVEUR (generateIncidentNumber) : on
        // le preserve depuis l'entite chargee comme status/createdAt, jamais depuis le
        // corps client — sinon un DTO qui l'omet/l'altere casserait la contrainte unique.
        updatedIncident.setNumber(incident.getNumber());
        // Champs réglementaires (E3.1) : gérés par les endpoints dédiés, PRÉSERVÉS
        // depuis l'entité chargée — une édition de contenu ne doit pas les effacer.
        updatedIncident.setNotifiable(incident.getNotifiable());
        updatedIncident.setRegulatoryDeadline(incident.getRegulatoryDeadline());
        updatedIncident.setNotifiedToAuthorityAt(incident.getNotifiedToAuthorityAt());
        // Contexte terrain + confidentialité (E3.2) : posés à la déclaration, PRÉSERVÉS
        // (le formulaire d'édition ne les porte pas — évite un effacement silencieux).
        updatedIncident.setEquipment(incident.getEquipment());
        updatedIncident.setShift(incident.getShift());
        updatedIncident.setConfidential(incident.getConfidential());
        updatedIncident.setUpdatedAt(LocalDateTime.now());
        updatedIncident.setEvidence(mediaService.saveAllMedia(incidentDTO.getEvidence()));
        incidentRepository.save(updatedIncident);

        // incident Analysis

        Optional<IncidentAnalysis> optional = incidentAnalysisRepository.findByIncidentId(incidentDTO.getId());

        IncidentAnalysis incidentAnalysis = incidentDTO.toIncidentAnalysis();
        incidentAnalysis.setIncident(new Incident(incidentDTO.getId()));

        incidentAnalysis.setUpdatedAt(LocalDateTime.now());
        incidentAnalysis.setCreatedAt(LocalDateTime.now());

        if (optional.isPresent()) {
            incidentAnalysis.setId(optional.get().getId());
            incidentAnalysis.setCreatedAt(optional.get().getCreatedAt());
        }
        incidentAnalysisRepository.save(incidentAnalysis);

        // incident Detail
        if (incidentDTO.getIncidentDetails() != null) {
            incidentDTO.getIncidentDetails().forEach(incidentDetailDTO -> {
                incidentDetailDTO.setIncidentId(incidentDTO.getId());
                incidentDetailDTO.setUpdatedAt(LocalDateTime.now());
                if (incidentDetailDTO.getId() == null) {
                    incidentDetailDTO.setCreatedAt(LocalDateTime.now());
                } else {
                    Optional<IncidentDetail> existingDetail = incidentDetailRepository
                            .findById(incidentDetailDTO.getId());
                    if (existingDetail.isPresent()) {
                        incidentDetailDTO.setCreatedAt(existingDetail.get().getCreatedAt());
                    }
                }
                incidentDetailRepository.save(incidentDetailDTO.toEntity());
            });
        }
        // RiskAssement
        RiskAssessment riskAssessment = incidentDTO.toRiskAssessment();
        riskAssessment.setIncident(new Incident(incidentDTO.getId()));
        riskAssessment.setUpdatedAt(LocalDateTime.now());
        // Lookup PAR incident_id (et non findById(incidentId) : le PK auto-genere
        // de RiskAssessment ne coincide avec l'incident_id que par hasard — le
        // findById historique lisait/ecrasait souvent l'evaluation d'un AUTRE incident).
        Optional<RiskAssessment> riskAssessmentOptional = riskAssessmentRepository
                .findFirstByIncident_IdOrderByIdDesc(incidentDTO.getId());
        if (riskAssessmentOptional.isPresent()) {
            riskAssessment.setId(riskAssessmentOptional.get().getId());
            riskAssessment.setCreatedAt(riskAssessmentOptional.get().getCreatedAt());
        }
        riskAssessmentRepository.save(riskAssessment);

    }

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENT_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public IncidentDTO getIncidentById(Long companyId, Long id) throws HSException {
        Incident incident = incidentRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        IncidentDTO incidentDTO = incident.toDTO();
        incidentDTO.setEvidence(mediaService.getAllMediaByArray(incident.getEvidence()));
        Optional<IncidentAnalysis> optional = incidentAnalysisRepository.findByIncidentId(id);
        if (optional.isPresent()) {
            IncidentAnalysis incidentAnalysis = optional.get();
            incidentDTO = incidentAnalysis.toIncidentDTO(incidentDTO);
        }
        if (incident.getDepartmentId() != null) {
            List<DepartmentNames> departmentNames = hrmsClient.getDepartmentNames(List.of(incident.getDepartmentId()));
            if (!departmentNames.isEmpty()) {
                incidentDTO.setDepartmentName(departmentNames.get(0).getName());
            }
        }
        List<IncidentDetail> incidentDetails = incidentDetailRepository.findByIncidentId(id);
        incidentDTO.setIncidentDetails(incidentDetails.stream()
                .map(IncidentDetail::toDTO)
                .toList());
        RiskAssessment riskAssessment = riskAssessmentRepository.findFirstByIncident_IdOrderByIdDesc(id)
                .orElse(null);
        if (riskAssessment != null) {
            incidentDTO = riskAssessment.toIncidentDTO(incidentDTO);
        }
        return incidentDTO;
    }

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENT_RESPONSE_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public IncidentResponse getIncidentResponseById(Long companyId, Long id) throws HSException {
        return incidentRepository.findByIncidentId(id, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_INCIDENT_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = CACHE_INCIDENT_RESPONSE_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = CACHE_INCIDENTS_ALL, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INCIDENT_YEARLY_CLOSURE, allEntries = true),
            @CacheEvict(cacheNames = CACHE_DEPARTMENT_INCIDENT_STATS, allEntries = true)
    })
    public void updateIncidentStatus(Long companyId, Long id, IncidentStatus status) throws HSException {
        Incident incident = incidentRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        IncidentStatus previous = incident.getStatus();
        assertIncidentTransition(previous, status);
        if (status == IncidentStatus.CLOSED) {
            assertCloseAuthority();
            assertRiskReducedForClosure(previous, id);
            assertInvestigationValidatedForClosure(id);
            assertHpiInvestigatedForClosure(incident);
        }
        incident.setStatus(status);
        incident.setUpdatedAt(LocalDateTime.now());
        incidentRepository.save(incident);
        // Journal d'audit (ISO 45001 §7.5.3) : l'acteur est l'utilisateur authentifié
        // (dérivé dans ChangeLogService), pas le « responsable » déclaratif du formulaire.
        changeLogService.record(ChangeLogService.INCIDENT, id, incident.getCompanyId(),
                "status", previous != null ? previous.name() : null, status != null ? status.name() : null);
    }

    @Override
    public void setRegulatoryStatus(Long companyId, Long id, Boolean notifiable, java.time.LocalDate deadline)
            throws HSException {
        Incident incident = incidentRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        Boolean previous = incident.getNotifiable();
        incident.setNotifiable(notifiable);
        // L'échéance n'a de sens que si l'incident est notifiable ; sinon on la vide.
        incident.setRegulatoryDeadline(Boolean.TRUE.equals(notifiable) ? deadline : null);
        incident.setUpdatedAt(LocalDateTime.now());
        incidentRepository.save(incident);
        changeLogService.record(ChangeLogService.INCIDENT, id, incident.getCompanyId(),
                "notifiable", String.valueOf(previous), String.valueOf(notifiable));
    }

    @Override
    public List<com.minexpert.hns.dto.response.SimilarIncidentDTO> getSimilarIncidents(Long companyId, Long id)
            throws HSException {
        Incident incident = incidentRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        Long locationId = incident.getLocation() != null ? incident.getLocation().getId() : null;
        Long processId = incident.getWorkProcess() != null ? incident.getWorkProcess().getId() : null;
        if (locationId == null && processId == null) {
            return java.util.Collections.emptyList();
        }
        // Cloisonné : on requête sur la mine RÉELLE de l'incident (companyId peut être
        // null en vue consolidée — l'incident, lui, porte toujours sa mine).
        return incidentRepository
                .findSimilar(incident.getCompanyId(), id, locationId, processId, PageRequest.of(0, 5))
                .stream()
                .map(i -> new com.minexpert.hns.dto.response.SimilarIncidentDTO(
                        i.getId(), i.getNumber(), i.getTitle(), i.getOccurredAt(),
                        i.getStatus() != null ? i.getStatus().name() : null,
                        locationId != null && i.getLocation() != null && locationId.equals(i.getLocation().getId()),
                        processId != null && i.getWorkProcess() != null && processId.equals(i.getWorkProcess().getId())))
                .toList();
    }

    @Override
    public void markNotifiedToAuthority(Long companyId, Long id) throws HSException {
        Incident incident = incidentRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        // On ne « déclare à l'autorité » qu'un incident effectivement notifiable :
        // sinon la date de déclaration serait un fait réglementaire sans obligation.
        if (!Boolean.TRUE.equals(incident.getNotifiable())) {
            throw new HSException("INCIDENT_NOT_NOTIFIABLE");
        }
        if (incident.getNotifiedToAuthorityAt() != null) {
            throw new HSException("INCIDENT_ALREADY_NOTIFIED");
        }
        java.time.LocalDate today = java.time.LocalDate.now();
        incident.setNotifiedToAuthorityAt(today);
        incident.setUpdatedAt(LocalDateTime.now());
        incidentRepository.save(incident);
        changeLogService.record(ChangeLogService.INCIDENT, id, incident.getCompanyId(),
                "notifiedToAuthorityAt", null, today.toString());
    }

    /**
     * Verrou de clôture (ISO 45001 §8.1.2) : un incident ayant fait l'objet d'un
     * traitement (investigation + actions correctives) ne se clôt qu'après une
     * ré-évaluation du risque montrant qu'il n'a PAS augmenté.
     *
     * On ne l'impose QUE lorsque la clôture suit un vrai traitement
     * (INVESTIGATION_COMPLETED ou CORRECTIVE_ACTIONS) : les incidents mineurs
     * clos directement depuis REPORTED ne sont pas freinés (ISO n'exige pas
     * d'enquête pour tout). L'égalité est tolérée (un risque initial déjà minimal
     * ne peut plus décroître) ; seule une augmentation bloque.
     */
    private void assertRiskReducedForClosure(IncidentStatus current, Long incidentId) throws HSException {
        boolean followsTreatment = current == IncidentStatus.INVESTIGATION_COMPLETED
                || current == IncidentStatus.CORRECTIVE_ACTIONS;
        if (!followsTreatment) {
            return;
        }
        RiskAssessment ra = riskAssessmentRepository.findFirstByIncident_IdOrderByIdDesc(incidentId).orElse(null);
        if (ra == null || ra.getProbability() == null || ra.getSeverity() == null) {
            // Pas de risque initial chiffré : rien à comparer, on n'invente pas de blocage.
            return;
        }
        if (ra.getPostProbability() == null || ra.getPostSeverity() == null) {
            throw new HSException("RESIDUAL_RISK_REQUIRED_FOR_CLOSURE");
        }
        int initialScore = ra.getProbability() * ra.getSeverity();
        int postScore = ra.getPostProbability() * ra.getPostSeverity();
        if (postScore > initialScore) {
            throw new HSException("RISK_NOT_REDUCED");
        }
    }

    /**
     * Garde RACI (ISO 45001 §5.3) : prononcer la clôture d'un incident est une
     * responsabilité « Accountable » (coordinateur/manager HSE ou admin). On
     * exige l'autorité {@code INCIDENT_CLOSE} (frappée par la passerelle pour ces
     * seuls rôles). Un appel SANS identité utilisateur (système/interne) n'est
     * pas bridé — cette voie n'existe pas aujourd'hui (seul le parcours
     * utilisateur via l'historique clôt un incident) mais on reste tolérant pour
     * ne pas casser un futur appel machine légitime. La garde précède toute
     * mutation : un refus n'altère pas l'incident.
     */
    private void assertCloseAuthority() {
        // « Requête utilisateur passée par la passerelle » = présence d'une identité
        // (X-User-Id) OU d'autorités RBAC (X-Permissions). On ne se fie PAS au seul
        // X-User-Id : un futur émetteur de jeton qui omettrait le claim `id`
        // laisserait alors la garde s'ouvrir (fail-open) alors que la requête porte
        // pourtant des autorités. Un appel réellement interne (aucune identité, aucune
        // autorité) reste toléré — cette voie n'existe pas aujourd'hui.
        boolean gatewayUserRequest = AuthUtils.currentActorId() != null || AuthUtils.hasAnyAuthority();
        if (gatewayUserRequest && !AuthUtils.hasAuthority(com.minexpert.hns.config.IncidentRbacConfig.INCIDENT_CLOSE)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Closing an incident requires the INCIDENT_CLOSE authority (Accountable role).");
        }
    }

    /**
     * Verrou de gouvernance (ISO 45001 §10.2) : « pas de clôture sans enquête
     * validée ». Le verrou porte sur l'ARTEFACT, pas sur le statut précédent :
     * dès qu'une enquête EXISTE pour l'incident, elle doit être validée par un
     * pair avant toute clôture — y compris sur un chemin REPORTED → CLOSED (où
     * le statut précédent ne « suit » pas l'enquête mais où une enquête peut
     * néanmoins avoir été créée). Les incidents mineurs clos sans enquête ne
     * sont pas concernés (l'Optional est vide → pas de blocage).
     */
    private void assertInvestigationValidatedForClosure(Long incidentId) throws HSException {
        boolean unvalidatedInvestigationExists = investigationRepository
                .findByIncidentIdWithCompanyContext(incidentId, null)
                .map(inv -> !Boolean.TRUE.equals(inv.getValidated()))
                .orElse(false);
        if (unvalidatedInvestigationExists) {
            throw new HSException("INVESTIGATION_NOT_VALIDATED");
        }
    }

    /**
     * Triage Haut Potentiel (ICMM · ISO 45001 §6.1.2 / §10.2) : un incident à
     * potentiel élevé (pire scénario crédible grave/mortel) NE PEUT PAS être clos
     * sans qu'une enquête ait été menée ET validée par un pair — même s'il s'agit
     * d'un simple presque-accident. C'est ce qui fait « vivre » la sévérité
     * potentielle : le badge HPI ne se contente plus d'informer, il IMPOSE la
     * profondeur d'enquête. Complète {@link #assertInvestigationValidatedForClosure}
     * qui, lui, n'exige rien si AUCUNE enquête n'existe.
     */
    private void assertHpiInvestigatedForClosure(Incident incident) throws HSException {
        if (incident == null || !Boolean.TRUE.equals(incident.getHighPotential())) {
            return; // Incident non-HPI : pas d'exigence d'enquête renforcée.
        }
        boolean validatedInvestigationExists = investigationRepository
                .findByIncidentIdWithCompanyContext(incident.getId(), null)
                .map(inv -> Boolean.TRUE.equals(inv.getValidated()))
                .orElse(false);
        if (!validatedInvestigationExists) {
            throw new HSException("HPI_REQUIRES_VALIDATED_INVESTIGATION");
        }
    }

    private static final Map<IncidentStatus, Set<IncidentStatus>> INCIDENT_TRANSITIONS = Map.of(
            IncidentStatus.PENDING, Set.of(IncidentStatus.REPORTED, IncidentStatus.REJECTED),
            IncidentStatus.REPORTED, Set.of(IncidentStatus.INVESTIGATION, IncidentStatus.CLOSED, IncidentStatus.REJECTED),
            IncidentStatus.INVESTIGATION, Set.of(IncidentStatus.INVESTIGATION_COMPLETED),
            IncidentStatus.INVESTIGATION_COMPLETED, Set.of(IncidentStatus.CORRECTIVE_ACTIONS, IncidentStatus.CLOSED),
            IncidentStatus.CORRECTIVE_ACTIONS, Set.of(IncidentStatus.CLOSED),
            IncidentStatus.CLOSED, Set.of(),
            IncidentStatus.REJECTED, Set.of()
    );

    private void assertIncidentTransition(IncidentStatus current, IncidentStatus target) throws HSException {
        if (!INCIDENT_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
            throw new HSException("INVALID_STATUS_TRANSITION");
        }
    }

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENT_YEARLY_CLOSURE, key = "#companyId != null ? (#companyId + '-' + #year) : 'ALL-' + #year")
    public List<YearlyClosureData> getYearlyClosureData(Long companyId, int year) {
        List<MonthlyClosureSummary> summaries = incidentRepository.findMonthlyClosureSummaryByYear(year, companyId);

        Map<Integer, MonthlyClosureSummary> summaryByMonth = summaries.stream()
                .filter(summary -> summary.getMonth() != null)
                .collect(Collectors.toMap(MonthlyClosureSummary::getMonth, summary -> summary,
                        (current, ignore) -> current));

        return IntStream.rangeClosed(1, 12)
                .mapToObj(month -> {
                    MonthlyClosureSummary summary = summaryByMonth.get(month);
                    long totalIncidents = summary != null && summary.getTotalIncidents() != null
                            ? summary.getTotalIncidents()
                            : 0L;
                    long closedIncidents = summary != null && summary.getClosedIncidents() != null
                            ? summary.getClosedIncidents()
                            : 0L;
                    return new YearlyClosureData(MONTH_LABELS[month - 1], totalIncidents, closedIncidents);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(cacheNames = CACHE_DEPARTMENT_INCIDENT_STATS, key = "#companyId != null ? (#companyId + '-' + #departmentId) : 'ALL-' + #departmentId")
    public DepartmentIncidentStats getDepartmentIncidentStats(Long companyId, Long departmentId) {
        LocalDateTime windowEnd = LocalDateTime.now();
        LocalDateTime windowStart = windowEnd.minusDays(30);

        if (departmentId == null) {
            return new DepartmentIncidentStats(null, windowStart, windowEnd, 0L, 0L, 0L);
        }

        long incidentCount = companyId != null
                ? incidentRepository.countByCompanyIdAndDepartmentIdAndCreatedAtGreaterThanEqual(companyId,
                        departmentId, windowStart)
                : incidentRepository.countByDepartmentIdAndCreatedAtGreaterThanEqual(departmentId, windowStart);

        long completedInvestigations = companyId != null
                ? investigationRepository
                        .countByStatusAndIncident_CompanyIdAndIncident_DepartmentIdAndUpdatedAtGreaterThanEqual(
                                InvestigationStatus.COMPLETED,
                                companyId,
                                departmentId,
                                windowStart)
                : investigationRepository.countByStatusAndIncident_DepartmentIdAndUpdatedAtGreaterThanEqual(
                        InvestigationStatus.COMPLETED,
                        departmentId,
                        windowStart);

        LocalDate today = windowEnd.toLocalDate();
        LocalDate deadlineStart = today.minusDays(30);

        long correctiveActionCount = companyId != null
                ? correctiveActionRepository.countByIncident_CompanyIdAndDepartmentIdAndStatusInAndDeadlineBetween(
                        companyId,
                        departmentId,
                        List.of(ActionStatus.PENDING, ActionStatus.IN_PROGRESS, ActionStatus.REOPENED),
                        deadlineStart,
                        today)
                : correctiveActionRepository.countByDepartmentIdAndStatusInAndDeadlineBetween(
                        departmentId,
                        List.of(ActionStatus.PENDING, ActionStatus.IN_PROGRESS, ActionStatus.REOPENED),
                        deadlineStart,
                        today);

        return new DepartmentIncidentStats(departmentId, windowStart, windowEnd, incidentCount, completedInvestigations,
                correctiveActionCount);
    }

    private String generateIncidentNumber(Long companyId) {
        int currentYear = Year.now().getValue();
        String prefix = "INC-" + currentYear + "-";

        // Repart de la séquence du format standard de l'année (INC-YYYY-NNNNNN).
        // On NE se base PLUS sur « le dernier incident de l'année par id » : ce
        // dernier peut porter un autre format (ex. INC-SYR-2026-0014, 4 segments),
        // ce qui cassait le parsing et réinitialisait le compteur à 1 -> doublon
        // sur INC-YYYY-000001 -> 500 (aucune mine « neuve » ne pouvait déclarer).
        int nextNumber = 1;
        Optional<Incident> last = incidentRepository.findFirstByNumberStartingWithOrderByNumberDesc(prefix);
        if (last.isPresent()) {
            String[] parts = last.get().getNumber().split("-");
            try {
                nextNumber = Integer.parseInt(parts[parts.length - 1].trim()) + 1;
            } catch (NumberFormatException ex) {
                nextNumber = 1;
            }
        }

        // Garantie d'unicité (contrainte UNIQUE globale) : on avance jusqu'à un
        // numéro réellement libre — plus jamais de DataIntegrityViolation.
        String candidate = String.format("%s%06d", prefix, nextNumber);
        while (incidentRepository.existsByNumber(candidate)) {
            nextNumber++;
            candidate = String.format("%s%06d", prefix, nextNumber);
        }
        return candidate;
    }

}
