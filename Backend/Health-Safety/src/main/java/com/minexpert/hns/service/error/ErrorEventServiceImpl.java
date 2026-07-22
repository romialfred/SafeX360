package com.minexpert.hns.service.error;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.error.CausalAnalysisDTO;
import com.minexpert.hns.dto.error.CauseDTO;
import com.minexpert.hns.dto.error.ErrorClassificationDTO;
import com.minexpert.hns.dto.error.ErrorEventDTO;
import com.minexpert.hns.dto.error.ErrorEventHistoryDTO;
import com.minexpert.hns.dto.error.ErrorKpiDTO;
import com.minexpert.hns.dto.error.JustCultureAssessmentDTO;
import com.minexpert.hns.dto.error.StatusUpdateRequest;
import com.minexpert.hns.entity.error.CausalAnalysis;
import com.minexpert.hns.entity.error.Cause;
import com.minexpert.hns.entity.error.ErrorClassification;
import com.minexpert.hns.entity.error.ErrorCriticalityMatrix;
import com.minexpert.hns.entity.error.ErrorEvent;
import com.minexpert.hns.entity.error.ErrorEventHistory;
import com.minexpert.hns.entity.error.ErrorEventType;
import com.minexpert.hns.entity.error.ErrorSeverity;
import com.minexpert.hns.entity.error.JustCultureAssessment;
import com.minexpert.hns.enums.CriticalityLevel;
import com.minexpert.hns.enums.ErrorEventStatus;
import com.minexpert.hns.enums.ErrorSourceModule;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.error.CausalAnalysisRepository;
import com.minexpert.hns.repository.error.CauseRepository;
import com.minexpert.hns.repository.error.ErrorClassificationRepository;
import com.minexpert.hns.repository.error.ErrorCriticalityMatrixRepository;
import com.minexpert.hns.repository.error.ErrorEventHistoryRepository;
import com.minexpert.hns.repository.error.ErrorEventRepository;
import com.minexpert.hns.repository.error.ErrorEventTypeRepository;
import com.minexpert.hns.repository.error.ErrorProbabilityRepository;
import com.minexpert.hns.repository.error.ErrorSeverityRepository;
import com.minexpert.hns.repository.error.JustCultureAssessmentRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * Implementation du service du module Gestion des Erreurs.
 *
 * Points cles :
 *  - Anonymat strict : si l'evenement est anonyme, {@code declaredBy} reste null
 *    et l'historique trace « Declarant anonyme » sans identifiant.
 *  - Reference generee : ERR-AAAA-NNNN (sequence annuelle par societe).
 *  - Criticite auto via la matrice 5x5 ; HiPo auto si criticite CRITICAL ou
 *    gravite potentielle = maximum du referentiel.
 *  - Transitions non regressives validees (sauf REOPENED qui autorise la reprise).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ErrorEventServiceImpl implements ErrorEventService {

    /** Libelle d'acteur utilise lorsque la declaration est anonyme. */
    public static final String ANONYMOUS_ACTOR_LABEL = "Declarant anonyme";

    private final ErrorEventRepository errorEventRepository;
    private final ErrorClassificationRepository classificationRepository;
    private final CausalAnalysisRepository causalAnalysisRepository;
    private final CauseRepository causeRepository;
    private final JustCultureAssessmentRepository justCultureRepository;
    private final ErrorEventHistoryRepository historyRepository;
    private final ErrorEventTypeRepository eventTypeRepository;
    private final ErrorSeverityRepository severityRepository;
    private final ErrorProbabilityRepository probabilityRepository;
    private final ErrorCriticalityMatrixRepository matrixRepository;
    private final com.minexpert.hns.repository.incident.CorrectiveActionRepository correctiveActionRepository;

    // ─── Evenement erreur ────────────────────────────────────────────────────

    @Override
    public ErrorEventDTO create(Long companyId, ErrorEventDTO dto) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        if (dto == null) {
            throw new HSException("ERROR_EVENT_DETAILS_REQUIRED");
        }
        LocalDateTime now = LocalDateTime.now();

        ErrorEvent e = new ErrorEvent();
        e.setCompanyId(companyId);
        e.setEventTypeId(dto.getEventTypeId());
        e.setTitle(dto.getTitle());
        e.setDescription(dto.getDescription());
        e.setOccurredAt(dto.getOccurredAt());
        e.setDeclaredAt(dto.getDeclaredAt() != null ? dto.getDeclaredAt() : now);
        e.setZoneId(dto.getZoneId());
        e.setActualSeverityId(dto.getActualSeverityId());
        e.setPotentialSeverityId(dto.getPotentialSeverityId());
        e.setProbabilityId(dto.getProbabilityId());
        e.setLinkedIncidentId(dto.getLinkedIncidentId());
        e.setSourceModule(dto.getSourceModule() != null ? dto.getSourceModule() : ErrorSourceModule.MANUAL);

        // Anonymat strict : si anonyme, declaredBy ne doit JAMAIS etre renseigne.
        boolean anonymous = dto.isAnonymous();
        e.setAnonymous(anonymous);
        e.setDeclaredBy(anonymous ? null : dto.getDeclaredBy());

        // Criticite automatique via la matrice (gravite reelle x probabilite).
        CriticalityLevel criticality = computeCriticality(dto.getActualSeverityId(), dto.getProbabilityId());
        e.setCriticalityLevel(criticality);

        // HiPo automatique : criticite CRITICAL OU gravite potentielle maximale.
        e.setHipo(computeHipo(criticality, dto.getPotentialSeverityId()));

        // Statut initial impose par le workflow.
        e.setStatus(ErrorEventStatus.DECLARED);
        e.setCreatedAt(now);
        e.setUpdatedAt(now);

        // Reference apres connaissance de l'annee (sequence annuelle par societe).
        e.setReference(generateReference(companyId));

        ErrorEvent saved = errorEventRepository.save(e);

        // Ligne d'historique de creation.
        appendHistory(saved, null, ErrorEventStatus.DECLARED, "CREATION",
                anonymous ? null : dto.getDeclaredBy(),
                anonymous ? ANONYMOUS_ACTOR_LABEL : null,
                "Declaration de l'evenement erreur", now);

        return ErrorEventDTO.fromEntity(saved);
    }

    @Override
    public ErrorEventDTO updateStatus(Long companyId, Long id, StatusUpdateRequest request) throws HSException {
        if (request == null || request.getToStatus() == null) {
            throw new HSException("ERROR_EVENT_STATUS_REQUIRED");
        }
        ErrorEvent e = errorEventRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("ERROR_EVENT_NOT_FOUND"));

        ErrorEventStatus from = e.getStatus();
        ErrorEventStatus to = request.getToStatus();

        if (from == to) {
            throw new HSException("ERROR_EVENT_STATUS_UNCHANGED");
        }
        // Transitions non regressives, avec deux cas de reprise legitimes :
        //  - aller VERS REOPENED (rouvrir un dossier clos) ;
        //  - repartir DEPUIS REOPENED (reprendre le traitement, p.ex. -> ANALYZING).
        // Sans cette seconde exception, REOPENED (ordinal le plus haut) serait un
        // cul-de-sac : toute reprise serait rejetee comme regression.
        boolean reprise = to == ErrorEventStatus.REOPENED || from == ErrorEventStatus.REOPENED;
        if (!reprise && to.ordinal() < from.ordinal()) {
            throw new HSException("ERROR_EVENT_STATUS_REGRESSION_FORBIDDEN");
        }

        LocalDateTime now = LocalDateTime.now();
        e.setStatus(to);
        e.setUpdatedAt(now);
        ErrorEvent saved = errorEventRepository.save(e);

        // Acteur : si l'evenement est anonyme, ne jamais tracer d'identifiant.
        Long actorId = e.isAnonymous() ? null : request.getActorId();
        String actorLabel = e.isAnonymous() && request.getActorLabel() == null
                ? ANONYMOUS_ACTOR_LABEL
                : request.getActorLabel();
        appendHistory(saved, from, to, "STATUS_CHANGE", actorId, actorLabel, request.getComment(), now);

        return ErrorEventDTO.fromEntity(saved);
    }

    @Override
    public ErrorEventDTO getById(Long companyId, Long id) throws HSException {
        ErrorEvent e = errorEventRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("ERROR_EVENT_NOT_FOUND"));
        return ErrorEventDTO.fromEntity(e);
    }

    @Override
    public List<ErrorEventDTO> list(Long companyId, ErrorEventStatus status, Long eventTypeId) throws HSException {
        List<ErrorEvent> events;
        if (status != null) {
            events = errorEventRepository.findByStatus(companyId, status);
        } else if (eventTypeId != null) {
            events = errorEventRepository.findByEventType(companyId, eventTypeId);
        } else {
            events = errorEventRepository.findAllByCompany(companyId);
        }
        List<ErrorEventDTO> result = new ArrayList<>(events.size());
        for (ErrorEvent e : events) {
            result.add(ErrorEventDTO.fromEntity(e));
        }
        return result;
    }

    @Override
    public List<ErrorEventHistoryDTO> getHistory(Long companyId, Long id) throws HSException {
        // Verifie l'appartenance a la societe avant d'exposer l'historique.
        errorEventRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("ERROR_EVENT_NOT_FOUND"));
        List<ErrorEventHistoryDTO> result = new ArrayList<>();
        for (ErrorEventHistory h : historyRepository.findByErrorEventIdOrderByTimestampAsc(id)) {
            result.add(ErrorEventHistoryDTO.fromEntity(h));
        }
        return result;
    }

    // ─── Classification ──────────────────────────────────────────────────────

    @Override
    public ErrorClassificationDTO upsertClassification(Long companyId, Long errorEventId, ErrorClassificationDTO dto)
            throws HSException {
        requireEvent(companyId, errorEventId);
        if (dto == null) {
            throw new HSException("ERROR_EVENT_DETAILS_REQUIRED");
        }
        ErrorClassification c = classificationRepository.findByErrorEventId(errorEventId)
                .orElseGet(ErrorClassification::new);
        c.setErrorEventId(errorEventId);
        c.setErrorNature(dto.getErrorNature());
        c.setViolationSubtype(dto.getViolationSubtype());
        c.setLatent(dto.isLatent());
        c.setNotes(dto.getNotes());
        return ErrorClassificationDTO.fromEntity(classificationRepository.save(c));
    }

    @Override
    public ErrorClassificationDTO getClassification(Long companyId, Long errorEventId) throws HSException {
        requireEvent(companyId, errorEventId);
        return classificationRepository.findByErrorEventId(errorEventId)
                .map(ErrorClassificationDTO::fromEntity)
                .orElse(null);
    }

    // ─── Analyse causale + causes ──────────────────────────────────────────────

    @Override
    public CausalAnalysisDTO addCausalAnalysis(Long companyId, Long errorEventId, CausalAnalysisDTO dto)
            throws HSException {
        requireEvent(companyId, errorEventId);
        if (dto == null) {
            throw new HSException("ERROR_EVENT_DETAILS_REQUIRED");
        }
        CausalAnalysis a = new CausalAnalysis();
        a.setErrorEventId(errorEventId);
        a.setMethod(dto.getMethod());
        a.setSummary(dto.getSummary());
        a.setConductedBy(dto.getConductedBy());
        a.setConductedAt(dto.getConductedAt() != null ? dto.getConductedAt() : LocalDateTime.now());
        return CausalAnalysisDTO.fromEntity(causalAnalysisRepository.save(a));
    }

    @Override
    public List<CausalAnalysisDTO> listCausalAnalyses(Long companyId, Long errorEventId) throws HSException {
        requireEvent(companyId, errorEventId);
        List<CausalAnalysisDTO> result = new ArrayList<>();
        for (CausalAnalysis a : causalAnalysisRepository.findByErrorEventId(errorEventId)) {
            result.add(CausalAnalysisDTO.fromEntity(a));
        }
        return result;
    }

    @Override
    public CauseDTO addCause(Long companyId, Long causalAnalysisId, CauseDTO dto) throws HSException {
        CausalAnalysis analysis = causalAnalysisRepository.findById(causalAnalysisId)
                .orElseThrow(() -> new HSException("CAUSAL_ANALYSIS_NOT_FOUND"));
        requireEvent(companyId, analysis.getErrorEventId());
        if (dto == null) {
            throw new HSException("ERROR_EVENT_DETAILS_REQUIRED");
        }
        Cause c = new Cause();
        c.setCausalAnalysisId(causalAnalysisId);
        c.setLabel(dto.getLabel());
        c.setLevel(dto.getLevel());
        c.setCategory(dto.getCategory());
        c.setParentCauseId(dto.getParentCauseId());
        return CauseDTO.fromEntity(causeRepository.save(c));
    }

    @Override
    public List<CauseDTO> listCauses(Long companyId, Long causalAnalysisId) throws HSException {
        CausalAnalysis analysis = causalAnalysisRepository.findById(causalAnalysisId)
                .orElseThrow(() -> new HSException("CAUSAL_ANALYSIS_NOT_FOUND"));
        requireEvent(companyId, analysis.getErrorEventId());
        List<CauseDTO> result = new ArrayList<>();
        for (Cause c : causeRepository.findByCausalAnalysisId(causalAnalysisId)) {
            result.add(CauseDTO.fromEntity(c));
        }
        return result;
    }

    @Override
    public void deleteCause(Long companyId, Long causeId) throws HSException {
        Cause c = causeRepository.findById(causeId)
                .orElseThrow(() -> new HSException("CAUSE_NOT_FOUND"));
        CausalAnalysis analysis = causalAnalysisRepository.findById(c.getCausalAnalysisId())
                .orElseThrow(() -> new HSException("CAUSAL_ANALYSIS_NOT_FOUND"));
        requireEvent(companyId, analysis.getErrorEventId());
        causeRepository.delete(c);
    }

    // ─── Culture juste (Just Culture) ───────────────────────────────────────────

    @Override
    public JustCultureAssessmentDTO upsertJustCulture(Long companyId, Long errorEventId,
            JustCultureAssessmentDTO dto) throws HSException {
        requireEvent(companyId, errorEventId);
        if (dto == null) {
            throw new HSException("ERROR_EVENT_DETAILS_REQUIRED");
        }
        JustCultureAssessment j = justCultureRepository.findByErrorEventId(errorEventId)
                .orElseGet(JustCultureAssessment::new);
        j.setErrorEventId(errorEventId);
        j.setOutcome(dto.getOutcome());
        j.setSubstitutionTest(dto.getSubstitutionTest());
        j.setDecisionNotes(dto.getDecisionNotes());
        j.setAssessedBy(dto.getAssessedBy());
        j.setAssessedAt(dto.getAssessedAt() != null ? dto.getAssessedAt() : LocalDateTime.now());
        return JustCultureAssessmentDTO.fromEntity(justCultureRepository.save(j));
    }

    @Override
    public JustCultureAssessmentDTO getJustCulture(Long companyId, Long errorEventId) throws HSException {
        requireEvent(companyId, errorEventId);
        return justCultureRepository.findByErrorEventId(errorEventId)
                .map(JustCultureAssessmentDTO::fromEntity)
                .orElse(null);
    }

    // ─── KPI ─────────────────────────────────────────────────────────────────

    @Override
    public ErrorKpiDTO computeKpis(Long companyId) throws HSException {
        List<ErrorEvent> events = errorEventRepository.findAllByCompany(companyId);

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (ErrorEventStatus s : ErrorEventStatus.values()) {
            byStatus.put(s.name(), 0L);
        }
        Map<Long, Long> byType = new HashMap<>();
        Map<String, Long> byCriticality = new LinkedHashMap<>();
        for (CriticalityLevel c : CriticalityLevel.values()) {
            byCriticality.put(c.name(), 0L);
        }

        long hipo = 0;
        long anonymous = 0;
        for (ErrorEvent e : events) {
            if (e.getStatus() != null) {
                byStatus.merge(e.getStatus().name(), 1L, Long::sum);
            }
            if (e.getEventTypeId() != null) {
                byType.merge(e.getEventTypeId(), 1L, Long::sum);
            }
            if (e.getCriticalityLevel() != null) {
                byCriticality.merge(e.getCriticalityLevel().name(), 1L, Long::sum);
            }
            if (e.isHipo()) {
                hipo++;
            }
            if (e.isAnonymous()) {
                anonymous++;
            }
        }

        long total = events.size();

        // Near-miss vs accident : derive du code du type d'evenement.
        Map<Long, String> typeCodes = loadTypeCodes(companyId);
        long nearMiss = 0;
        long accident = 0;
        for (ErrorEvent e : events) {
            String code = e.getEventTypeId() != null ? typeCodes.get(e.getEventTypeId()) : null;
            if (code == null) {
                continue;
            }
            if (code.contains("near") || code.contains("presqu")) {
                nearMiss++;
            } else if (code.contains("accident")) {
                accident++;
            }
        }
        double ratio = accident > 0 ? (double) nearMiss / accident : (double) nearMiss;

        // Statuts terminaux exclus du décompte « en retard » : COMPLETED, CANCELLED
        // et VERIFIED (efficacité prouvée §10.2 — l'état le plus fermé). REOPENED
        // reste compté comme travail ouvert.
        // À GARDER EN PHASE avec DashboardServiceImpl.CLOSED_ACTION_STATUSES.
        long overdueCapa = correctiveActionRepository.countOverdueErrorCapa(
                companyId, java.time.LocalDate.now(),
                List.of(com.minexpert.hns.enums.ActionStatus.COMPLETED,
                        com.minexpert.hns.enums.ActionStatus.CANCELLED,
                        com.minexpert.hns.enums.ActionStatus.VERIFIED));

        List<ErrorKpiDTO.RecurrentCause> recurrent = computeRecurrentCauses(events);

        // Proxy de maturite : part des declarations anonymes + presqu'accidents.
        double maturityProxy = total > 0 ? (double) (anonymous + nearMiss) / total : 0d;

        return new ErrorKpiDTO(total, byStatus, byType, byCriticality, hipo, nearMiss, accident,
                ratio, overdueCapa, recurrent, maturityProxy);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    /** Verifie que l'evenement existe et appartient a la societe. */
    private ErrorEvent requireEvent(Long companyId, Long errorEventId) throws HSException {
        if (errorEventId == null) {
            throw new HSException("ERROR_EVENT_NOT_FOUND");
        }
        return errorEventRepository.findByIdWithCompanyContext(errorEventId, companyId)
                .orElseThrow(() -> new HSException("ERROR_EVENT_NOT_FOUND"));
    }

    private void appendHistory(ErrorEvent event, ErrorEventStatus from, ErrorEventStatus to, String action,
            Long actorId, String actorLabel, String comment, LocalDateTime when) {
        ErrorEventHistory h = new ErrorEventHistory();
        h.setErrorEventId(event.getId());
        h.setFromStatus(from);
        h.setToStatus(to);
        h.setAction(action);
        h.setActorId(actorId);
        h.setActorLabel(actorLabel);
        h.setComment(comment);
        h.setTimestamp(when);
        historyRepository.save(h);
    }

    /** Genere une reference ERR-AAAA-NNNN (sequence annuelle par societe). */
    private String generateReference(Long companyId) {
        int year = Year.now().getValue();
        String prefix = "ERR-" + year + "-";
        // Le compteur est par-société mais la contrainte UNIQUE sur reference est
        // GLOBALE : deux mines généraient toutes deux ERR-AAAA-0001 -> collision
        // -> 500. On part du compteur société (indice) puis on avance jusqu'à une
        // référence réellement libre (unicité garantie).
        long n = errorEventRepository.countByReferencePrefix(companyId, prefix + "%") + 1;
        String candidate = String.format("%s%04d", prefix, n);
        while (errorEventRepository.existsByReference(candidate)) {
            n++;
            candidate = String.format("%s%04d", prefix, n);
        }
        return candidate;
    }

    /** Croise gravite et probabilite via la matrice ; defaut MEDIUM si non resolu. */
    private CriticalityLevel computeCriticality(Long actualSeverityId, Long probabilityId) {
        Integer sev = severityLevelOf(actualSeverityId);
        Integer prob = probabilityLevelOf(probabilityId);
        if (sev == null || prob == null) {
            return null;
        }
        return matrixRepository.findBySeverityLevelAndProbabilityLevel(sev, prob)
                .map(ErrorCriticalityMatrix::getCriticalityLevel)
                .orElse(CriticalityLevel.MEDIUM);
    }

    /** HiPo si criticite CRITICAL ou gravite potentielle = niveau maximum du referentiel. */
    private boolean computeHipo(CriticalityLevel criticality, Long potentialSeverityId) {
        if (criticality == CriticalityLevel.CRITICAL) {
            return true;
        }
        Integer potential = severityLevelOf(potentialSeverityId);
        if (potential == null) {
            return false;
        }
        int max = maxSeverityLevel();
        return max > 0 && potential >= max;
    }

    private Integer severityLevelOf(Long severityId) {
        if (severityId == null) {
            return null;
        }
        return severityRepository.findById(severityId).map(ErrorSeverity::getLevel).orElse(null);
    }

    private Integer probabilityLevelOf(Long probabilityId) {
        if (probabilityId == null) {
            return null;
        }
        return probabilityRepository.findById(probabilityId)
                .map(com.minexpert.hns.entity.error.ErrorProbability::getLevel)
                .orElse(null);
    }

    private int maxSeverityLevel() {
        int max = 0;
        for (ErrorSeverity s : severityRepository.findAllByOrderByLevelAsc()) {
            if (s.getLevel() != null && s.getLevel() > max) {
                max = s.getLevel();
            }
        }
        return max;
    }

    private Map<Long, String> loadTypeCodes(Long companyId) {
        Map<Long, String> codes = new HashMap<>();
        for (ErrorEventType t : eventTypeRepository.findVisibleForCompany(companyId)) {
            if (t.getCode() != null) {
                codes.put(t.getId(), t.getCode().toLowerCase());
            }
        }
        return codes;
    }

    private List<ErrorKpiDTO.RecurrentCause> computeRecurrentCauses(List<ErrorEvent> events) {
        if (events.isEmpty()) {
            return List.of();
        }
        // Recurrence par libelle de cause sur l'ensemble des analyses des evenements.
        Map<String, Long> byLabel = new HashMap<>();
        for (ErrorEvent e : events) {
            for (CausalAnalysis a : causalAnalysisRepository.findByErrorEventId(e.getId())) {
                for (Cause c : causeRepository.findByCausalAnalysisId(a.getId())) {
                    if (c.getLabel() != null && !c.getLabel().isBlank()) {
                        byLabel.merge(c.getLabel().trim(), 1L, Long::sum);
                    }
                }
            }
        }
        List<ErrorKpiDTO.RecurrentCause> result = new ArrayList<>();
        byLabel.forEach((label, count) -> result.add(new ErrorKpiDTO.RecurrentCause(label, count)));
        result.sort(Comparator.comparingLong(ErrorKpiDTO.RecurrentCause::getOccurrences).reversed());
        return result;
    }
}
