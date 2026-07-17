package com.minexpert.hns.service.audit;

import java.util.Optional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.config.AuditCacheNames;
import com.minexpert.hns.dto.audit.AuditDTO;
import com.minexpert.hns.dto.audit.AuditDetails;
import com.minexpert.hns.dto.audit.AuditRequest;
import com.minexpert.hns.dto.audit.ExecuteRequest;
import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.enums.AuditStatus;
import com.minexpert.hns.enums.PlanningStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AuditRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditRepository auditRepository;
    private final AuditorService auditorService;

    private final ContributorService contributorService;
    private final ReportService reportService;
    private final AreaExecutionService areaExecutionService;
    private final RecommendationService recommendationService;
    private final com.minexpert.hns.repository.audit.AreaRepository areaRepository;

    // LOT 53 — dépendances du verrouillage de clôture ISO 19011 §6.6
    private final com.minexpert.hns.repository.audit.ReportRepository reportRepository;
    private final com.minexpert.hns.repository.audit.AuditChecklistItemRepository checklistItemRepository;
    private final com.minexpert.hns.repository.audit.ObservationRepository observationRepository;
    private final com.minexpert.hns.repository.audit.MeetingRepository meetingRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public Long createAudit(AuditDTO auditDTO) throws HSException {
        assertDateOrder(auditDTO.getStartDate(), auditDTO.getEndDate());
        auditDTO.setRefNumber(generateAuditRefNumber());
        auditDTO.setStatus(AuditStatus.PLANNING);
        // ISO 19011 §5.4 — l'approbation du programme est un ACTE TRACÉ
        // (approvePlanning), jamais une propriété que l'appelant se décerne.
        // Le statut posé ici est INCONDITIONNEL : le client ne dicte pas un
        // statut d'approbation. Sans cela, un audit naissait avec
        // planningStatus = null (formulaire silencieux) ou APPROVED (POST
        // direct), et getAllAudits traite null|APPROVED comme approuvé : la
        // preuve d'approbation n'était plus opposable.
        auditDTO.setPlanningStatus(PlanningStatus.PENDING);
        auditDTO.setCreatedAt(LocalDateTime.now());
        auditDTO.setUpdatedAt(LocalDateTime.now());
        return auditRepository.save(auditDTO.toEntity()).getId();

    }

    /**
     * ISO 19011 §5.4/§5.5 — un audit ne s'EXÉCUTE pas tant que le programme
     * n'est pas approuvé.
     *
     * <p><b>Le défaut que ceci corrige :</b> l'approbation n'était qu'un FILTRE
     * D'AFFICHAGE (`getAllAudits` ne montre que `null || APPROVED`). Un audit
     * non approuvé était donc invisible… mais parfaitement exécutable par un
     * appel direct à l'API : on avait caché la porte au lieu de la fermer.
     * Cacher n'est pas interdire — la barrière doit vivre là où l'acte se
     * produit, c'est-à-dire à l'exécution.</p>
     *
     * <p><b>Rétro-compatibilité :</b> `planningStatus == null` = donnée
     * antérieure au circuit d'approbation ⇒ traitée comme approuvée, exactement
     * comme le fait le filtre de `getAllAudits`. Durcir ici sans le faire là
     * rendrait inexécutables tous les audits historiques.</p>
     */
    private void assertProgrammeApproved(Long auditId) throws HSException {
        if (auditId == null) {
            return;
        }
        Audit audit = auditRepository.findById(auditId)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        PlanningStatus ps = audit.getPlanningStatus();
        if (ps != null && ps != PlanningStatus.APPROVED) {
            throw new HSException("AUDIT_NOT_APPROVED");
        }
    }

    /**
     * Cohérence du calendrier : une fin antérieure au début n'était refusée que
     * par les minDate/maxDate de l'IHM — donc contournable par appel direct.
     * Règle métier ⇒ portée par le service (spec §2).
     */
    private void assertDateOrder(java.time.LocalDate startDate, java.time.LocalDate endDate) throws HSException {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new HSException("AUDIT_END_DATE_BEFORE_START_DATE");
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#auditDTO.id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#auditDTO.id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public void updateAudit(AuditDTO auditDTO) throws HSException {
        Audit audit = auditRepository.findById(auditDTO.getId())
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        // §2.2 — un plan APPROUVÉ (et a fortiori un audit CLOS dont le rapport est
        // signé) est une preuve figée : réécrire son périmètre, ses dates ou son
        // équipe rétroactivement est une falsification. Avancer un plan approuvé
        // suppose un nouvel acte d'approbation, pas une réécriture silencieuse.
        if (audit.getPlanningStatus() == PlanningStatus.APPROVED || audit.getStatus() == AuditStatus.CLOSED) {
            throw new HSException("AUDIT_ALREADY_APPROVED");
        }
        assertDateOrder(auditDTO.getStartDate(), auditDTO.getEndDate());
        auditRepository.save(audit.update(auditDTO));
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#id")
    public AuditDTO getAudit(Long id) throws HSException {
        return auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND")).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public Long createAudit(AuditRequest request) throws HSException {
        Long auditId = this.createAudit(request.getAudit());
        // Cloisonnement par mine : les auditeurs héritent du companyId de l'audit.
        propagateCompanyId(request);
        auditorService.addAuditors(request.getAuditors(), auditId);
        return auditId;
    }

    /** Propage le companyId de l'audit vers ses auditeurs (cloisonnement par mine). */
    private void propagateCompanyId(AuditRequest request) {
        if (request.getAudit() == null || request.getAuditors() == null) {
            return;
        }
        Long companyId = request.getAudit().getCompanyId();
        if (companyId == null) {
            return;
        }
        request.getAuditors().forEach(auditor -> auditor.setCompanyId(companyId));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#request.audit.id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#request.audit.id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public void updateAudit(AuditRequest request) throws HSException {
        this.updateAudit(request.getAudit());
        // Cloisonnement par mine : les auditeurs héritent du companyId de l'audit persisté
        // (évite d'écraser le companyId existant si le payload de mise à jour ne le porte pas).
        if (request.getAudit() != null && request.getAudit().getCompanyId() == null
                && request.getAudit().getId() != null) {
            auditRepository.findById(request.getAudit().getId())
                    .ifPresent(a -> request.getAudit().setCompanyId(a.getCompanyId()));
        }
        propagateCompanyId(request);
        auditorService.addOrUpdateAuditors(request.getAuditors(), request.getAudit().getId());

    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AUDIT_LIST, key = "#companyId != null ? #companyId : -1")
    public List<AuditDTO> getAllAudits(Long companyId) throws HSException {
        // Cloisonnement par mine : companyId null (appel système / allMines) => aucun filtre.
        return auditRepository.findAllByCompany(companyId).stream()
                .filter((x) -> x.getPlanningStatus() == null || x.getPlanningStatus() == PlanningStatus.APPROVED)
                .map(Audit::toDTO)
                .toList();
    }

    @Override
    // HSException est une exception CONTRÔLÉE : sans rollbackFor, Spring committe
    // la transaction. Un refus sur les entretiens / recommandations laisserait le
    // rapport enregistré (donc l'écran d'exécution définitivement verrouillé par
    // reportExists) avec la saisie perdue. La soumission doit être atomique.
    @Transactional(rollbackFor = HSException.class)
    public void executeAudit(ExecuteRequest request) throws HSException {
        // Persiste RÉELLEMENT le rapport d'audit (rédacteur, validateur, statut,
        // description, pièces jointes) + les contributeurs. Auparavant seul
        // createContributors était appelé (createReport était commenté, de plus
        // avec une mauvaise signature) → le rapport d'exécution était perdu
        // silencieusement. createReport gère médias + contributeurs et pose le
        // statut DRAFT ; l'écran d'exécution n'est ouvert que si aucun rapport
        // n'existe (reportExists), donc pas de doublon.
        if (request.getReport() != null) {
            assertProgrammeApproved(request.getReport().getAuditId());
            assertNotExecutedBeforePlannedDate(request.getReport());
            reportService.createReport(request);
        } else if (request.getContributors() != null) {
            contributorService.createContributors(request.getContributors());
        }
        // Puis les entretiens par domaine et les recommandations : jusqu'ici absents
        // d'ExecuteRequest, ils étaient écartés par Jackson et donc perdus.
        Long auditId = request.getReport() != null ? request.getReport().getAuditId() : null;
        persistExecutions(request.getExecutions(), auditId);
        persistRecommendations(request.getRecommendations(), auditId);
    }

    /**
     * §2.1 / ISO 19011 §9.2 — un rapport daté d'un jour où l'audit n'avait pas
     * commencé est une falsification (« pencil-whipping »), et le rapport est
     * ensuite définitivement figé (reportExists verrouille l'écran d'exécution).
     * La règle vit donc AU SERVEUR, l'IHM ne faisant que l'annoncer (minDate).
     *
     * Contrat volontaire :
     *   • comparaison sur la DATE seule (démarrer le jour prévu est permis) ;
     *   • le RETARD n'est JAMAIS bloqué — le bloquer pousserait à créer un faux
     *     rapport à la bonne date, et l'écart est déjà visible comme tel ;
     *   • date de rapport ou date planifiée absente ⇒ aucun blocage.
     */
    private void assertNotExecutedBeforePlannedDate(com.minexpert.hns.dto.audit.ReportDTO report) throws HSException {
        if (report.getPreDate() == null || report.getAuditId() == null) {
            return;
        }
        java.time.LocalDate plannedStart = auditRepository.findById(report.getAuditId())
                .map(Audit::getStartDate).orElse(null);
        if (plannedStart != null && report.getPreDate().isBefore(plannedStart)) {
            throw new HSException("AUDIT_EXECUTION_BEFORE_PLANNED_DATE");
        }
    }

    /**
     * Entretiens d'exécution : FK {@code area_id} NOT NULL, et le domaine doit
     * appartenir à l'audit rapporté (intégrité + cloisonnement par mine, le
     * companyId de l'audit ayant déjà été vérifié par la garde du controller).
     * AreaExecution ne porte pas de companyId : il est hérité via area -> audit.
     */
    private void persistExecutions(List<com.minexpert.hns.dto.audit.AreaExecutionDTO> executions, Long auditId)
            throws HSException {
        if (executions == null || executions.isEmpty()) {
            return;
        }
        Set<Long> auditAreaIds = auditId == null ? Set.of()
                : areaRepository.findByAudit_Id(auditId).stream()
                        .map(com.minexpert.hns.entity.audit.Area::getId)
                        .collect(java.util.stream.Collectors.toSet());
        for (var execution : executions) {
            if (execution.getAreaId() == null) {
                throw new HSException("AREA_REQUIRED_FOR_EXECUTION");
            }
            if (auditId != null && !auditAreaIds.contains(execution.getAreaId())) {
                throw new HSException("AREA_NOT_IN_AUDIT");
            }
        }
        areaExecutionService.createAreaExecutionList(executions);
    }

    /**
     * Recommandations : FK {@code audit_id} NOT NULL — l'auditId est résolu depuis
     * le rapport quand le payload ne le porte pas. Le companyId a déjà été posé
     * par le controller (mine active) ; à défaut on le fait hériter de l'audit.
     */
    private void persistRecommendations(List<com.minexpert.hns.dto.audit.RecommendationDTO> recommendations,
            Long auditId) throws HSException {
        if (recommendations == null || recommendations.isEmpty()) {
            return;
        }
        Long ownerCompanyId = auditId == null ? null
                : auditRepository.findById(auditId).map(Audit::getCompanyId).orElse(null);
        for (var recommendation : recommendations) {
            if (recommendation.getAuditId() == null) {
                recommendation.setAuditId(auditId);
            }
            if (recommendation.getAuditId() == null) {
                throw new HSException("AUDIT_REQUIRED_FOR_RECOMMENDATION");
            }
            if (recommendation.getCompanyId() == null) {
                recommendation.setCompanyId(ownerCompanyId);
            }
        }
        recommendationService.createRecommendations(recommendations);
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#id")
    public AuditDetails getAuditDetails(Long id) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        return audit.toDTO().toDetails();
    }

    private String generateAuditRefNumber() {
        int currentYear = Year.now().getValue();
        String prefix = "AUD-" + currentYear + "-";

        // Reprend depuis le dernier numéro du format standard de l'année (parse
        // robuste : dernier segment numérique, tolère un préfixe à 4 segments) +
        // boucle anti-collision -> numéros uniques garantis (voir bug incident).
        int nextNumber = 1;
        Optional<Audit> last = auditRepository.findFirstByRefNumberStartingWithOrderByRefNumberDesc(prefix);
        if (last.isPresent() && last.get().getRefNumber() != null) {
            String[] parts = last.get().getRefNumber().split("-");
            try {
                nextNumber = Integer.parseInt(parts[parts.length - 1].trim()) + 1;
            } catch (NumberFormatException e) {
                nextNumber = 1;
            }
        }
        String candidate = String.format("%s%03d", prefix, nextNumber);
        while (auditRepository.existsByRefNumber(candidate)) {
            nextNumber++;
            candidate = String.format("%s%03d", prefix, nextNumber);
        }
        return candidate;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public void updateAuditStatus(Long id, AuditStatus status) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        assertAuditTransition(audit.getStatus(), status);
        if (status == AuditStatus.CLOSED) {
            assertReadyForClosure(id);
        }
        audit.setStatus(status);
        audit.setUpdatedAt(LocalDateTime.now());
        auditRepository.save(audit);
    }

    private static final Map<AuditStatus, Set<AuditStatus>> AUDIT_TRANSITIONS = Map.of(
            AuditStatus.PLANNING, Set.of(AuditStatus.PREPARATION, AuditStatus.CANCELLED),
            AuditStatus.PREPARATION, Set.of(AuditStatus.EXECUTION, AuditStatus.PLANNING, AuditStatus.CANCELLED),
            AuditStatus.EXECUTION, Set.of(AuditStatus.CLOSED, AuditStatus.CANCELLED),
            AuditStatus.CLOSED, Set.of(),
            AuditStatus.CANCELLED, Set.of()
    );

    private void assertAuditTransition(AuditStatus current, AuditStatus target) throws HSException {
        if (!AUDIT_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
            throw new HSException("INVALID_STATUS_TRANSITION");
        }
    }

    /**
     * LOT 53 — verrouillage de clôture ISO 19011 §6.6 : un audit n'est terminé
     * que lorsque les activités du plan sont achevées et le rapport approuvé.
     * Chaque condition violée est signalée par un code d'erreur dédié :
     *   1. rapport d'audit existant et APPROUVÉ (§6.5) ;
     *   2. checklist entièrement évaluée — aucun item A_EVALUER (§6.4.7) ;
     *   3. tous les constats classés selon ISO (§6.4.8 — plus de constat « non classé ») ;
     *   4. toute non-conformité (majeure/mineure) escaladée vers les Constats
     *      centraux pour garantir le suivi des actions (§6.7) ;
     *   5. réunions d'ouverture ET de clôture enregistrées (§6.4.2 / §6.4.9).
     */
    private void assertReadyForClosure(Long auditId) throws HSException {
        var report = reportRepository.findByAudit_Id(auditId).orElse(null);
        if (report == null || report.getStatus() != com.minexpert.hns.enums.AuditReportStatus.APPROVED) {
            throw new HSException("CLOSURE_REQUIRES_APPROVED_REPORT");
        }

        boolean checklistIncomplete = checklistItemRepository
                .findByAuditIdOrderByReferentialAscIdAsc(auditId).stream()
                .anyMatch(item -> "A_EVALUER".equals(item.getResult()));
        if (checklistIncomplete) {
            throw new HSException("CLOSURE_REQUIRES_COMPLETED_CHECKLIST");
        }

        var observations = observationRepository.findByAudit_Id(auditId);
        if (observations.stream().anyMatch(o -> o.getClassification() == null || o.getClassification().isBlank())) {
            throw new HSException("CLOSURE_REQUIRES_CLASSIFIED_FINDINGS");
        }
        if (observations.stream().anyMatch(o -> o.getClassification() != null
                && o.getClassification().startsWith("NC_") && o.getNonConformityId() == null)) {
            throw new HSException("CLOSURE_REQUIRES_ESCALATED_NC");
        }

        var meetings = meetingRepository.findByAudit_Id(auditId);
        boolean hasOpening = meetings.stream().anyMatch(m -> "OPENING".equals(m.getType()));
        boolean hasClosing = meetings.stream().anyMatch(m -> "CLOSING".equals(m.getType()));
        if (!hasOpening || !hasClosing) {
            throw new HSException("CLOSURE_REQUIRES_OPENING_AND_CLOSING_MEETINGS");
        }
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, key = "#companyId != null ? #companyId : -1")
    public List<AuditDTO> getAllPlanningAudits(Long companyId) throws HSException {
        // Cloisonnement par mine : companyId null (appel système / allMines) => aucun filtre.
        return auditRepository.findAllWithNonNullPlanningStatusByCompany(companyId).stream()
                .map(Audit::toDTO).toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public void approvePlanning(Long id) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        audit.setPlanningStatus(PlanningStatus.APPROVED);
        audit.setUpdatedAt(LocalDateTime.now());
        auditRepository.save(audit);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public void rejectPlanning(Long id) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        audit.setPlanningStatus(PlanningStatus.REJECTED);
        audit.setUpdatedAt(LocalDateTime.now());
        auditRepository.save(audit);
    }

}
