package com.minexpert.hns.blast.service;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.blast.dto.BlastCreateDTO;
import com.minexpert.hns.blast.dto.BlastDetailDTO;
import com.minexpert.hns.blast.dto.BlastGuardDTO;
import com.minexpert.hns.blast.dto.BlastListItemDTO;
import com.minexpert.hns.blast.dto.BlastPlanDTO;
import com.minexpert.hns.blast.dto.BlastRecipientDTO;
import com.minexpert.hns.blast.dto.BlastSearchFiltersDTO;
import com.minexpert.hns.blast.dto.BlastUpdateDTO;
import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastGuard;
import com.minexpert.hns.blast.entity.BlastNotificationJob;
import com.minexpert.hns.blast.entity.BlastPlan;
import com.minexpert.hns.blast.entity.BlastRecipient;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;
import com.minexpert.hns.blast.repository.BlastRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation du service Blast.
 *
 * <p>Workflow strict des 9 statuts (voir {@link BlastStatus}). Transitions
 * autorisees :
 * <pre>
 *   DRAFT     -&gt; PLANNED | CANCELLED
 *   PLANNED   -&gt; CONFIRMED | CANCELLED | POSTPONED | DRAFT
 *   CONFIRMED -&gt; IMMINENT | CANCELLED | POSTPONED
 *   IMMINENT  -&gt; FIRED | MISFIRE | CANCELLED
 *   FIRED     -&gt; ALL_CLEAR | MISFIRE
 *   MISFIRE   -&gt; ALL_CLEAR (uniquement si misfireResolvedAt != null)
 *   ALL_CLEAR -&gt; (terminal)
 *   CANCELLED -&gt; (terminal)
 *   POSTPONED -&gt; PLANNED
 * </pre>
 *
 * <p>Le hook de planification des notifications (T-24h, T-6h, T-30m, popups
 * T-2h-&gt;tir, alerte T-10) est exposé via {@link BlastNotificationPlanner}
 * et appele a la confirmation. L'implementation effective sera branchee en
 * Phase 3 ; pour P1, le planner est un no-op qui logge.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class BlastServiceImpl implements BlastService {

    private static final Logger LOGGER = LoggerFactory.getLogger(BlastServiceImpl.class);

    /** Statuts depuis lesquels on peut encore annuler. */
    private static final Set<BlastStatus> CANCELLABLE_FROM = EnumSet.of(
            BlastStatus.DRAFT, BlastStatus.PLANNED, BlastStatus.CONFIRMED,
            BlastStatus.IMMINENT, BlastStatus.POSTPONED);

    /** Statuts depuis lesquels on peut reprogrammer. */
    private static final Set<BlastStatus> RESCHEDULABLE_FROM = EnumSet.of(
            BlastStatus.DRAFT, BlastStatus.PLANNED, BlastStatus.CONFIRMED,
            BlastStatus.POSTPONED);

    private final BlastRepository blastRepository;
    private final BlastNotificationJobRepository jobRepository;
    private final BlastAuditService auditService;
    private final BlastNotificationPlanner notificationPlanner;

    @Override
    public Long create(BlastCreateDTO dto, Long userId) {
        if (dto.getScheduledAt() == null) {
            throw new IllegalArgumentException("scheduledAt is required");
        }
        if (dto.getType() == null) {
            throw new IllegalArgumentException("type is required");
        }
        if (dto.getMineId() == null) {
            throw new IllegalArgumentException("mineId is required");
        }

        String reference = (dto.getReference() != null && !dto.getReference().isBlank())
                ? dto.getReference()
                : generateReference();

        if (blastRepository.existsByReference(reference)) {
            throw new IllegalStateException("Blast reference already used: " + reference);
        }

        LocalDateTime now = LocalDateTime.now();
        Blast entity = Blast.builder()
                .reference(reference)
                .scheduledAt(dto.getScheduledAt())
                .timezone(dto.getTimezone() != null ? dto.getTimezone() : "UTC")
                .type(dto.getType())
                .pit(dto.getPit())
                .bench(dto.getBench())
                .block(dto.getBlock())
                .lat(dto.getLat())
                .lng(dto.getLng())
                .status(BlastStatus.DRAFT)
                .exclusionRadiusM(dto.getExclusionRadiusM())
                .blasterId(dto.getBlasterId())
                .hseLeadId(dto.getHseLeadId())
                .alarmZoneScope(dto.getAlarmZoneScope())
                .mineId(dto.getMineId())
                .createdAt(now)
                .createdBy(userId)
                .updatedAt(now)
                .updatedBy(userId)
                .guards(new ArrayList<>())
                .recipients(new ArrayList<>())
                .notificationJobs(new ArrayList<>())
                .build();

        if (dto.getPlan() != null) {
            BlastPlan plan = toPlanEntity(dto.getPlan(), entity);
            entity.setPlan(plan);
        }
        if (dto.getGuards() != null) {
            for (BlastGuardDTO g : dto.getGuards()) {
                entity.getGuards().add(toGuardEntity(g, entity));
            }
        }
        if (dto.getRecipients() != null) {
            for (BlastRecipientDTO r : dto.getRecipients()) {
                entity.getRecipients().add(toRecipientEntity(r, entity));
            }
        }

        Blast saved = blastRepository.save(entity);
        auditService.logTransition(saved.getId(), null, BlastStatus.DRAFT, userId,
                "Initial creation");
        return saved.getId();
    }

    @Override
    public void update(BlastUpdateDTO dto, Long userId, boolean adminOverride) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("id is required");
        }
        Blast blast = loadOrThrow(dto.getId());
        BlastStatus current = blast.getStatus();

        boolean isOpenForEdit = current == BlastStatus.DRAFT || current == BlastStatus.PLANNED;
        if (!isOpenForEdit) {
            if (!adminOverride) {
                throw new IllegalStateException(
                        "Blast " + blast.getReference() + " is " + current
                                + " ; only BLAST_ADMIN can update with a reason");
            }
            if (dto.getReason() == null || dto.getReason().isBlank()) {
                throw new IllegalArgumentException(
                        "reason is required to update a blast in status " + current);
            }
        }

        applyUpdatableFields(blast, dto);
        if (dto.getPlan() != null) {
            applyPlanUpdate(blast, dto.getPlan());
        }
        if (dto.getGuards() != null) {
            replaceGuards(blast, dto.getGuards());
        }
        if (dto.getRecipients() != null) {
            replaceRecipients(blast, dto.getRecipients());
        }

        blast.setUpdatedAt(LocalDateTime.now());
        blast.setUpdatedBy(userId);
        blastRepository.save(blast);

        // Si edition apres confirmation : trace un evenement d'override.
        if (adminOverride && !isOpenForEdit) {
            auditService.logTransition(blast.getId(), current, current, userId,
                    "Admin override edit: " + dto.getReason());
            // Recalcul des notifications (hook P3) : on annule les jobs SCHEDULED
            // et on redemandera au planner de regenerer.
            cancelScheduledJobs(blast.getId());
            notificationPlanner.scheduleForBlast(blast);
        }
    }

    @Override
    public void confirm(Long id, Long userId) {
        Blast blast = loadOrThrow(id);
        assertTransition(blast, BlastStatus.CONFIRMED);
        BlastStatus from = blast.getStatus();
        blast.setStatus(BlastStatus.CONFIRMED);
        blast.setUpdatedAt(LocalDateTime.now());
        blast.setUpdatedBy(userId);
        blastRepository.save(blast);
        auditService.logTransition(id, from, BlastStatus.CONFIRMED, userId,
                "Blast locked and notifications scheduled");
        // Hook P3 : planification persistante des rappels et alertes.
        notificationPlanner.scheduleForBlast(blast);
    }

    @Override
    public void cancel(Long id, String reason, Long userId) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("reason is required to cancel a blast");
        }
        Blast blast = loadOrThrow(id);
        if (!CANCELLABLE_FROM.contains(blast.getStatus())) {
            throw new IllegalStateException(
                    "Invalid blast status transition: " + blast.getStatus()
                            + " -> CANCELLED");
        }
        BlastStatus from = blast.getStatus();
        blast.setStatus(BlastStatus.CANCELLED);
        blast.setUpdatedAt(LocalDateTime.now());
        blast.setUpdatedBy(userId);
        blastRepository.save(blast);
        auditService.logTransition(id, from, BlastStatus.CANCELLED, userId, reason);
        cancelScheduledJobs(id);
    }

    @Override
    public void reschedule(Long id, LocalDateTime newScheduledAt, String reason, Long userId) {
        if (newScheduledAt == null) {
            throw new IllegalArgumentException("newScheduledAt is required");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("reason is required to reschedule a blast");
        }
        Blast blast = loadOrThrow(id);
        if (!RESCHEDULABLE_FROM.contains(blast.getStatus())) {
            throw new IllegalStateException(
                    "Cannot reschedule a blast in status " + blast.getStatus());
        }
        BlastStatus from = blast.getStatus();

        // Bascule POSTPONED puis PLANNED avec la nouvelle heure.
        blast.setStatus(BlastStatus.POSTPONED);
        blast.setUpdatedAt(LocalDateTime.now());
        blast.setUpdatedBy(userId);
        blastRepository.save(blast);
        auditService.logTransition(id, from, BlastStatus.POSTPONED, userId, reason);

        // Annule les jobs precedents.
        cancelScheduledJobs(id);

        // Repositionne en PLANNED avec la nouvelle heure.
        blast.setScheduledAt(newScheduledAt);
        blast.setStatus(BlastStatus.PLANNED);
        blast.setUpdatedAt(LocalDateTime.now());
        blast.setUpdatedBy(userId);
        blastRepository.save(blast);
        auditService.logTransition(id, BlastStatus.POSTPONED, BlastStatus.PLANNED, userId,
                "Rescheduled to " + newScheduledAt);
    }

    @Override
    public void declareFired(Long id, Long userId) {
        Blast blast = loadOrThrow(id);
        assertTransition(blast, BlastStatus.FIRED);
        BlastStatus from = blast.getStatus();
        blast.setStatus(BlastStatus.FIRED);
        blast.setUpdatedAt(LocalDateTime.now());
        blast.setUpdatedBy(userId);
        blastRepository.save(blast);
        auditService.logTransition(id, from, BlastStatus.FIRED, userId, "Blast fired");
    }

    @Override
    public void declareMisfire(Long id, String reason, Long userId) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("reason is required to declare a misfire");
        }
        Blast blast = loadOrThrow(id);
        assertTransition(blast, BlastStatus.MISFIRE);
        BlastStatus from = blast.getStatus();
        blast.setStatus(BlastStatus.MISFIRE);
        blast.setMisfireResolvedAt(null);
        blast.setUpdatedAt(LocalDateTime.now());
        blast.setUpdatedBy(userId);
        blastRepository.save(blast);
        auditService.logTransition(id, from, BlastStatus.MISFIRE, userId, reason);
    }

    @Override
    public void resolveMisfire(Long id, String reason, Long userId) {
        Blast blast = loadOrThrow(id);
        if (blast.getStatus() != BlastStatus.MISFIRE) {
            throw new IllegalStateException(
                    "Cannot resolve misfire when blast is in status " + blast.getStatus());
        }
        blast.setMisfireResolvedAt(LocalDateTime.now());
        blast.setUpdatedAt(LocalDateTime.now());
        blast.setUpdatedBy(userId);
        blastRepository.save(blast);
        // Trace via un evenement "self-transition" pour conserver l'horodatage.
        auditService.logTransition(id, BlastStatus.MISFIRE, BlastStatus.MISFIRE, userId,
                "Misfire resolved" + (reason != null ? ": " + reason : ""));
    }

    @Override
    public void allClear(Long id, Long userId) {
        Blast blast = loadOrThrow(id);
        if (blast.getStatus() == BlastStatus.MISFIRE
                && blast.getMisfireResolvedAt() == null) {
            throw new IllegalStateException(
                    "Cannot declare ALL_CLEAR while misfire is unresolved");
        }
        assertTransition(blast, BlastStatus.ALL_CLEAR);
        BlastStatus from = blast.getStatus();
        blast.setStatus(BlastStatus.ALL_CLEAR);
        blast.setUpdatedAt(LocalDateTime.now());
        blast.setUpdatedBy(userId);
        blastRepository.save(blast);
        auditService.logTransition(id, from, BlastStatus.ALL_CLEAR, userId,
                "All clear pronounced");
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlastListItemDTO> search(BlastSearchFiltersDTO filters) {
        if (filters == null || filters.getMineId() == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        List<Blast> blasts;
        if (filters.getStatuses() != null && !filters.getStatuses().isEmpty()) {
            blasts = blastRepository.findByMineIdAndStatusIn(filters.getMineId(),
                    filters.getStatuses());
        } else {
            blasts = blastRepository.findByMineIdOrderByScheduledAtDesc(filters.getMineId());
        }
        return blasts.stream()
                .filter(b -> filters.getFrom() == null
                        || !b.getScheduledAt().isBefore(filters.getFrom()))
                .filter(b -> filters.getTo() == null
                        || !b.getScheduledAt().isAfter(filters.getTo()))
                .filter(b -> filters.getPit() == null
                        || filters.getPit().equalsIgnoreCase(b.getPit()))
                .filter(b -> filters.getBlasterId() == null
                        || filters.getBlasterId().equals(b.getBlasterId()))
                .map(this::toListItem)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BlastDetailDTO getDetail(Long id) {
        Blast b = loadOrThrow(id);
        return toDetailDTO(b);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private Blast loadOrThrow(Long id) {
        return blastRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Blast not found: " + id));
    }

    /**
     * Verifie qu'une transition est autorisee. Strictement enumeree pour eviter
     * toute regression silencieuse.
     */
    void assertTransition(Blast blast, BlastStatus next) {
        BlastStatus current = blast.getStatus();
        boolean ok;
        switch (next) {
            case PLANNED:
                ok = current == BlastStatus.DRAFT
                        || current == BlastStatus.POSTPONED;
                break;
            case CONFIRMED:
                ok = current == BlastStatus.DRAFT
                        || current == BlastStatus.PLANNED;
                break;
            case IMMINENT:
                ok = current == BlastStatus.CONFIRMED;
                break;
            case FIRED:
                ok = current == BlastStatus.IMMINENT
                        || current == BlastStatus.CONFIRMED;
                break;
            case MISFIRE:
                ok = current == BlastStatus.IMMINENT
                        || current == BlastStatus.FIRED;
                break;
            case ALL_CLEAR:
                if (current == BlastStatus.MISFIRE) {
                    ok = blast.getMisfireResolvedAt() != null;
                } else {
                    ok = current == BlastStatus.FIRED;
                }
                break;
            case POSTPONED:
                ok = current == BlastStatus.PLANNED
                        || current == BlastStatus.CONFIRMED;
                break;
            case CANCELLED:
                ok = CANCELLABLE_FROM.contains(current);
                break;
            case DRAFT:
                ok = current == BlastStatus.PLANNED;
                break;
            default:
                ok = false;
        }
        if (!ok) {
            throw new IllegalStateException(
                    "Invalid blast status transition: " + current + " -> " + next);
        }
    }

    private void cancelScheduledJobs(Long blastId) {
        List<BlastNotificationJob> scheduled = jobRepository
                .findByBlastIdAndStatus(blastId, JobStatus.SCHEDULED);
        for (BlastNotificationJob j : scheduled) {
            j.setStatus(JobStatus.CANCELLED);
            jobRepository.save(j);
        }
        LOGGER.info("[BlastService] Cancelled {} scheduled job(s) for blast {}",
                scheduled.size(), blastId);
    }

    private String generateReference() {
        // Reference simple {@code BLT-YYYY-NNNN} sur la base du nombre total
        // de tirs deja crees + 1. Ce comportement est suffisant pour P1 ;
        // un sequencer dedie par mine sera introduit si necessaire.
        long count = blastRepository.count() + 1L;
        return String.format("BLT-%d-%04d", Year.now().getValue(), count);
    }

    private void applyUpdatableFields(Blast blast, BlastUpdateDTO dto) {
        if (dto.getScheduledAt() != null) {
            blast.setScheduledAt(dto.getScheduledAt());
        }
        if (dto.getTimezone() != null) {
            blast.setTimezone(dto.getTimezone());
        }
        if (dto.getType() != null) {
            blast.setType(dto.getType());
        }
        if (dto.getPit() != null) {
            blast.setPit(dto.getPit());
        }
        if (dto.getBench() != null) {
            blast.setBench(dto.getBench());
        }
        if (dto.getBlock() != null) {
            blast.setBlock(dto.getBlock());
        }
        if (dto.getLat() != null) {
            blast.setLat(dto.getLat());
        }
        if (dto.getLng() != null) {
            blast.setLng(dto.getLng());
        }
        if (dto.getExclusionRadiusM() != null) {
            blast.setExclusionRadiusM(dto.getExclusionRadiusM());
        }
        if (dto.getBlasterId() != null) {
            blast.setBlasterId(dto.getBlasterId());
        }
        if (dto.getHseLeadId() != null) {
            blast.setHseLeadId(dto.getHseLeadId());
        }
        if (dto.getAlarmZoneScope() != null) {
            blast.setAlarmZoneScope(dto.getAlarmZoneScope());
        }
    }

    private void applyPlanUpdate(Blast blast, BlastPlanDTO planDTO) {
        BlastPlan plan = blast.getPlan();
        if (plan == null) {
            plan = new BlastPlan();
            plan.setBlast(blast);
            plan.setCreatedAt(LocalDateTime.now());
            blast.setPlan(plan);
        }
        plan.setHoleCount(planDTO.getHoleCount());
        plan.setHoleDiameterMm(planDTO.getHoleDiameterMm());
        plan.setDepthM(planDTO.getDepthM());
        plan.setBurdenM(planDTO.getBurdenM());
        plan.setSpacingM(planDTO.getSpacingM());
        plan.setStemmingM(planDTO.getStemmingM());
        plan.setExplosiveType(planDTO.getExplosiveType());
        plan.setExplosiveQtyKg(planDTO.getExplosiveQtyKg());
        plan.setPowderFactor(planDTO.getPowderFactor());
        plan.setInitiationSystem(planDTO.getInitiationSystem());
        plan.setDelaySequence(planDTO.getDelaySequence());
    }

    private void replaceGuards(Blast blast, List<BlastGuardDTO> guards) {
        blast.getGuards().clear();
        for (BlastGuardDTO g : guards) {
            blast.getGuards().add(toGuardEntity(g, blast));
        }
    }

    private void replaceRecipients(Blast blast, List<BlastRecipientDTO> recipients) {
        blast.getRecipients().clear();
        for (BlastRecipientDTO r : recipients) {
            blast.getRecipients().add(toRecipientEntity(r, blast));
        }
    }

    private BlastPlan toPlanEntity(BlastPlanDTO dto, Blast blast) {
        return BlastPlan.builder()
                .blast(blast)
                .holeCount(dto.getHoleCount())
                .holeDiameterMm(dto.getHoleDiameterMm())
                .depthM(dto.getDepthM())
                .burdenM(dto.getBurdenM())
                .spacingM(dto.getSpacingM())
                .stemmingM(dto.getStemmingM())
                .explosiveType(dto.getExplosiveType())
                .explosiveQtyKg(dto.getExplosiveQtyKg())
                .powderFactor(dto.getPowderFactor())
                .initiationSystem(dto.getInitiationSystem())
                .delaySequence(dto.getDelaySequence())
                .createdAt(LocalDateTime.now())
                .build();
    }

    private BlastGuard toGuardEntity(BlastGuardDTO dto, Blast blast) {
        return BlastGuard.builder()
                .blast(blast)
                .employeeId(dto.getEmployeeId())
                .position(dto.getPosition())
                .build();
    }

    private BlastRecipient toRecipientEntity(BlastRecipientDTO dto, Blast blast) {
        return BlastRecipient.builder()
                .blast(blast)
                .employeeId(dto.getEmployeeId())
                .externalEmail(dto.getExternalEmail())
                .preferredLanguage(dto.getPreferredLanguage())
                .build();
    }

    private BlastListItemDTO toListItem(Blast b) {
        return BlastListItemDTO.builder()
                .id(b.getId())
                .reference(b.getReference())
                .scheduledAt(b.getScheduledAt())
                .timezone(b.getTimezone())
                .type(b.getType())
                .status(b.getStatus())
                .pit(b.getPit())
                .bench(b.getBench())
                .blasterId(b.getBlasterId())
                .hseLeadId(b.getHseLeadId())
                .mineId(b.getMineId())
                .build();
    }

    private BlastDetailDTO toDetailDTO(Blast b) {
        BlastDetailDTO.BlastDetailDTOBuilder builder = BlastDetailDTO.builder()
                .id(b.getId())
                .reference(b.getReference())
                .scheduledAt(b.getScheduledAt())
                .timezone(b.getTimezone())
                .type(b.getType())
                .pit(b.getPit())
                .bench(b.getBench())
                .block(b.getBlock())
                .lat(b.getLat())
                .lng(b.getLng())
                .status(b.getStatus())
                .exclusionRadiusM(b.getExclusionRadiusM())
                .blasterId(b.getBlasterId())
                .hseLeadId(b.getHseLeadId())
                .alarmZoneScope(b.getAlarmZoneScope())
                .mineId(b.getMineId())
                .misfireResolvedAt(b.getMisfireResolvedAt())
                .version(b.getVersion())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .createdBy(b.getCreatedBy())
                .updatedBy(b.getUpdatedBy());

        BlastPlan plan = b.getPlan();
        if (plan != null) {
            builder.plan(BlastPlanDTO.builder()
                    .id(plan.getId())
                    .holeCount(plan.getHoleCount())
                    .holeDiameterMm(plan.getHoleDiameterMm())
                    .depthM(plan.getDepthM())
                    .burdenM(plan.getBurdenM())
                    .spacingM(plan.getSpacingM())
                    .stemmingM(plan.getStemmingM())
                    .explosiveType(plan.getExplosiveType())
                    .explosiveQtyKg(plan.getExplosiveQtyKg())
                    .powderFactor(plan.getPowderFactor())
                    .initiationSystem(plan.getInitiationSystem())
                    .delaySequence(plan.getDelaySequence())
                    .build());
        }

        List<BlastGuardDTO> guards = b.getGuards() == null ? List.of()
                : b.getGuards().stream()
                .map(g -> BlastGuardDTO.builder()
                        .id(g.getId())
                        .employeeId(g.getEmployeeId())
                        .position(g.getPosition())
                        .build())
                .collect(Collectors.toList());

        List<BlastRecipientDTO> recipients = b.getRecipients() == null ? List.of()
                : b.getRecipients().stream()
                .map(r -> BlastRecipientDTO.builder()
                        .id(r.getId())
                        .employeeId(r.getEmployeeId())
                        .externalEmail(r.getExternalEmail())
                        .preferredLanguage(r.getPreferredLanguage())
                        .build())
                .collect(Collectors.toList());

        builder.guards(new ArrayList<>(guards));
        builder.recipients(new ArrayList<>(recipients));
        return builder.build();
    }

    /** Pour les tests : statuts depuis lesquels un tir peut etre annule. */
    static Set<BlastStatus> cancellableFrom() {
        return EnumSet.copyOf(CANCELLABLE_FROM);
    }

    /** Pour les tests : statuts depuis lesquels un tir peut etre reprogramme. */
    static Set<BlastStatus> reschedulableFrom() {
        return EnumSet.copyOf(RESCHEDULABLE_FROM);
    }

    /** Pour les tests : enumere tous les statuts. */
    static List<BlastStatus> allStatuses() {
        return Arrays.asList(BlastStatus.values());
    }
}
