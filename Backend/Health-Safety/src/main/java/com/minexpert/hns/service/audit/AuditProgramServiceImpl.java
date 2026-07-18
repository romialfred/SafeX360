package com.minexpert.hns.service.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.audit.AuditProgramDTO;
import com.minexpert.hns.dto.audit.AuditProgramKpisDTO;
import com.minexpert.hns.dto.audit.RiskSuggestionDTO;
import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.audit.AuditProgram;
import com.minexpert.hns.entity.audit.Observation;
import com.minexpert.hns.entity.audit.Recommendation;
import com.minexpert.hns.entity.parameters.AuditAreas;
import com.minexpert.hns.enums.AuditProgramStatus;
import com.minexpert.hns.enums.AuditStatus;
import com.minexpert.hns.enums.EventStatus;
import com.minexpert.hns.enums.RecommendationStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AreaRepository;
import com.minexpert.hns.repository.audit.AuditProgramRepository;
import com.minexpert.hns.repository.audit.AuditRepository;
import com.minexpert.hns.repository.audit.EffectivenessCheckRepository;
import com.minexpert.hns.repository.audit.ObservationRepository;
import com.minexpert.hns.repository.audit.RecommendationRepository;
import com.minexpert.hns.repository.nonConformity.NonConformityRepository;
import com.minexpert.hns.repository.parameters.AuditAreasRepository;

import lombok.RequiredArgsConstructor;

/**
 * LOT 52 — Implémentation du programme d'audit annuel (ISO 19011:2018 §5).
 *
 * <p>Couvre le cycle de vie du programme (PROPOSED → APPROVED → CLOSED), la
 * priorisation basée risques des domaines d'audit et les indicateurs de
 * pilotage (§5.6).
 */
@Service
@Transactional
@RequiredArgsConstructor
public class AuditProgramServiceImpl implements AuditProgramService {

    /** Plafond en mois pour l'ancienneté du dernier audit dans le score de risque. */
    private static final int MAX_MONTHS_SINCE_LAST_AUDIT = 24;

    /** Statuts considérés comme « clos » pour une non-conformité. */
    private static final List<EventStatus> NC_CLOSED_STATUSES = List.of(EventStatus.CLOSED, EventStatus.CANCELLED);

    private final AuditProgramRepository auditProgramRepository;
    private final AuditRepository auditRepository;
    private final AreaRepository areaRepository;
    private final AuditAreasRepository auditAreasRepository;
    private final ObservationRepository observationRepository;
    private final NonConformityRepository nonConformityRepository;
    private final RecommendationRepository recommendationRepository;
    private final EffectivenessCheckRepository effectivenessCheckRepository;

    // ─── CRUD ────────────────────────────────────────────────────────────────

    @Override
    public Long createProgram(AuditProgramDTO programDTO) throws HSException {
        programDTO.setId(null);
        programDTO.setStatus(AuditProgramStatus.PROPOSED);
        programDTO.setApprovedBy(null);
        programDTO.setApprovedAt(null);
        programDTO.setCreatedAt(LocalDateTime.now());
        programDTO.setUpdatedAt(LocalDateTime.now());
        return auditProgramRepository.save(programDTO.toEntity()).getId();
    }

    @Override
    public void updateProgram(AuditProgramDTO programDTO, Long companyId) throws HSException {
        AuditProgram program = loadProgram(programDTO.getId());
        assertSameCompany(companyId, program.getCompanyId());
        program.setYear(programDTO.getYear());
        program.setTitle(programDTO.getTitle());
        program.setObjectives(programDTO.getObjectives());
        program.setScope(programDTO.getScope());
        program.setResources(programDTO.getResources());
        // ISO 19011 §5.4 — l'approbation d'un programme est un ACTE TRACÉ : elle
        // passe exclusivement par approveProgram(), qui enregistre approvedBy et
        // approvedAt. Accepter le statut du corps de requête permettait de poser
        // APPROVED sans aucun approbateur ni date : le programme paraissait
        // approuvé alors que rien ne prouvait qui l'avait approuvé.
        // Le statut n'est donc PLUS modifiable par update (l'IHM renvoyait de
        // toute façon la valeur d'origine, jamais un choix de l'utilisateur).
        //
        // De même, la mine de rattachement n'est pas réassignable par le corps :
        // l'accepter permettait de DÉPLACER un programme vers une autre mine.
        program.setUpdatedAt(LocalDateTime.now());
        auditProgramRepository.save(program);
    }

    @Override
    public AuditProgramDTO getProgram(Long id) throws HSException {
        return loadProgram(id).toDTO();
    }

    @Override
    public List<AuditProgramDTO> getAllPrograms(Long companyId) throws HSException {
        return auditProgramRepository.findAllWithCompany(companyId).stream()
                .map(AuditProgram::toDTO)
                .toList();
    }

    @Override
    public void approveProgram(Long id, Long approvedBy, Long companyId) throws HSException {
        AuditProgram program = loadProgram(id);
        assertSameCompany(companyId, program.getCompanyId());
        program.setStatus(AuditProgramStatus.APPROVED);
        program.setApprovedBy(approvedBy);
        program.setApprovedAt(LocalDateTime.now());
        program.setUpdatedAt(LocalDateTime.now());
        auditProgramRepository.save(program);
    }

    @Override
    public void deleteProgram(Long id, Long companyId) throws HSException {
        AuditProgram program = loadProgram(id);
        assertSameCompany(companyId, program.getCompanyId());
        auditProgramRepository.delete(program);
    }

    // ─── Priorisation basée risques (ISO 19011 §5.4.2) ──────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<RiskSuggestionDTO> getRiskSuggestions(Long programId) throws HSException {
        AuditProgram program = loadProgram(programId);
        List<AuditAreas> areas = auditAreasRepository.findAllByCompanyId(program.getCompanyId());

        // NC ouvertes traçables par domaine (constats escaladés). Si aucune NC
        // n'est traçable, on retombe sur le total des NC ouvertes pour tous les
        // domaines (signal global de pression qualité).
        Map<Long, Long> openNcByZone = new HashMap<>();
        for (Object[] row : observationRepository.countOpenNonConformitiesByZone(NC_CLOSED_STATUSES)) {
            if (row[0] != null) {
                openNcByZone.put((Long) row[0], (Long) row[1]);
            }
        }
        long totalOpenNc = nonConformityRepository.countByStatusNotIn(NC_CLOSED_STATUSES);
        boolean traceable = !openNcByZone.isEmpty();

        // Dernier audit CLOSED couvrant chaque domaine : périmètre direct + zones.
        Map<Long, LocalDate> lastClosedByArea = new HashMap<>();
        mergeLastDates(lastClosedByArea, auditRepository.findLastEndDateByScopeAndStatus(AuditStatus.CLOSED));
        mergeLastDates(lastClosedByArea, areaRepository.findLastEndDateByAreaAndStatus(AuditStatus.CLOSED));

        LocalDate today = LocalDate.now();
        List<RiskSuggestionDTO> suggestions = new ArrayList<>();
        for (AuditAreas area : areas) {
            long openNc = traceable ? openNcByZone.getOrDefault(area.getId(), 0L) : totalOpenNc;
            LocalDate lastClosed = lastClosedByArea.get(area.getId());
            int months = lastClosed == null
                    ? MAX_MONTHS_SINCE_LAST_AUDIT
                    : (int) Math.min(MAX_MONTHS_SINCE_LAST_AUDIT,
                            Math.max(0, ChronoUnit.MONTHS.between(lastClosed, today)));
            int score = (int) (openNc * 2) + months;
            suggestions.add(new RiskSuggestionDTO(area.getId(), area.getName(), openNc, months, score,
                    suggestFrequency(score)));
        }
        suggestions.sort(Comparator.comparingInt(RiskSuggestionDTO::getScore).reversed());
        return suggestions;
    }

    private void mergeLastDates(Map<Long, LocalDate> target, List<Object[]> rows) {
        for (Object[] row : rows) {
            if (row[0] == null || row[1] == null) {
                continue;
            }
            Long areaId = (Long) row[0];
            LocalDate date = (LocalDate) row[1];
            target.merge(areaId, date, (a, b) -> a.isAfter(b) ? a : b);
        }
    }

    private String suggestFrequency(int score) {
        if (score > 30) {
            return "TRIMESTRIEL";
        }
        if (score > 15) {
            return "SEMESTRIEL";
        }
        return "ANNUEL";
    }

    // ─── KPI programme (ISO 19011 §5.6) ─────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AuditProgramKpisDTO getProgramKpis(Long programId) throws HSException {
        loadProgram(programId);
        List<Audit> audits = auditRepository.findByProgramId(programId);
        if (audits.isEmpty()) {
            return new AuditProgramKpisDTO(0, 0, 0.0, Map.of(), Map.of(), 0, 0, 0);
        }
        List<Long> auditIds = audits.stream().map(Audit::getId).toList();

        long total = audits.size();
        long realises = audits.stream().filter(a -> a.getStatus() == AuditStatus.CLOSED).count();
        double taux = Math.round(realises * 1000.0 / total) / 10.0;

        List<Observation> observations = observationRepository.findByAudit_IdIn(auditIds);
        Map<String, Long> parClassification = observations.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getClassification() != null ? o.getClassification() : "NON_CLASSE",
                        Collectors.counting()));
        Map<String, Long> parClause = observations.stream()
                .filter(o -> o.getClause() != null && !o.getClause().isBlank())
                .collect(Collectors.groupingBy(Observation::getClause, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                        (a, b) -> a, LinkedHashMap::new));

        List<Recommendation> recommendations = recommendationRepository.findByAudit_IdIn(auditIds);
        LocalDate today = LocalDate.now();
        long ouvertes = recommendations.stream()
                .filter(r -> r.getStatus() != RecommendationStatus.COMPLETED)
                .count();
        long enRetard = recommendations.stream()
                .filter(r -> r.getStatus() != RecommendationStatus.COMPLETED)
                .filter(r -> r.getDeadline() != null && r.getDeadline().isBefore(today))
                .count();

        long verificationsPendantes = effectivenessCheckRepository
                .countByRecommendation_Audit_IdInAndVerdictIsNull(auditIds);

        return new AuditProgramKpisDTO(total, realises, taux, parClassification, parClause,
                ouvertes, enRetard, verificationsPendantes);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Cloisonnement par mine : si un companyId est fourni (appel utilisateur),
     * le programme doit lui appartenir. companyId null = appel système / toutes mines.
     */
    private void assertSameCompany(Long companyId, Long entityCompanyId) throws HSException {
        if (companyId != null && !companyId.equals(entityCompanyId)) {
            throw new HSException("AUDIT_PROGRAM_NOT_FOUND");
        }
    }

    private AuditProgram loadProgram(Long id) throws HSException {
        if (id == null) {
            throw new HSException("AUDIT_PROGRAM_NOT_FOUND");
        }
        return auditProgramRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_PROGRAM_NOT_FOUND"));
    }
}
