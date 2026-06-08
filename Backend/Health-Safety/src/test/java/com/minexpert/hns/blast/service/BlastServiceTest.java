package com.minexpert.hns.blast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.blast.dto.BlastCreateDTO;
import com.minexpert.hns.blast.dto.BlastSearchFiltersDTO;
import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastNotificationJob;
import com.minexpert.hns.blast.entity.BlastRecipient;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.BlastType;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.enums.JobType;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;
import com.minexpert.hns.blast.repository.BlastRepository;

import jakarta.persistence.EntityNotFoundException;

/**
 * Tests unitaires du workflow {@link BlastServiceImpl}.
 *
 * <p>Couvre toutes les transitions des 9 statuts, valides et invalides, plus
 * le verrou misfire qui bloque ALL_CLEAR tant que la situation n'est pas levee.
 */
@ExtendWith(MockitoExtension.class)
class BlastServiceTest {

    @Mock
    private BlastRepository blastRepository;

    @Mock
    private BlastNotificationJobRepository jobRepository;

    @Mock
    private BlastAuditService auditService;

    @Mock
    private BlastNotificationPlanner notificationPlanner;

    @Mock
    private BlastEmailService emailService;

    @Mock
    private BlastMisfireBroadcaster misfireBroadcaster;

    @InjectMocks
    private BlastServiceImpl service;

    private Blast buildBlast(BlastStatus status) {
        return Blast.builder()
                .id(42L)
                .reference("BLT-2026-0001")
                .scheduledAt(LocalDateTime.now().plusHours(6))
                .timezone("UTC")
                .type(BlastType.PRODUCTION)
                .status(status)
                .mineId(1L)
                .guards(new ArrayList<>())
                .recipients(new ArrayList<>())
                .notificationJobs(new ArrayList<>())
                .build();
    }

    // ── CREATE ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("create persists in DRAFT and emits a status event")
    void createPersistsDraft() {
        BlastCreateDTO dto = BlastCreateDTO.builder()
                .reference("BLT-TEST-001")
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .timezone("Africa/Ouagadougou")
                .type(BlastType.PRODUCTION)
                .mineId(1L)
                .build();
        when(blastRepository.existsByReference("BLT-TEST-001")).thenReturn(false);
        when(blastRepository.save(any(Blast.class))).thenAnswer(inv -> {
            Blast b = inv.getArgument(0);
            b.setId(100L);
            return b;
        });

        Long id = service.create(dto, 7L);

        assertThat(id).isEqualTo(100L);
        verify(blastRepository).save(any(Blast.class));
        verify(auditService).logTransition(eq(100L), eq(null), eq(BlastStatus.DRAFT),
                eq(7L), anyString());
    }

    @Test
    @DisplayName("create rejects duplicate reference")
    void createRejectsDuplicateReference() {
        BlastCreateDTO dto = BlastCreateDTO.builder()
                .reference("BLT-DUP")
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .type(BlastType.PRODUCTION)
                .mineId(1L)
                .build();
        when(blastRepository.existsByReference("BLT-DUP")).thenReturn(true);

        assertThatThrownBy(() -> service.create(dto, 7L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already used");
    }

    @Test
    @DisplayName("create requires scheduledAt, type and mineId")
    void createRequiresMandatory() {
        assertThatThrownBy(() -> service.create(BlastCreateDTO.builder().build(), 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("scheduledAt");
    }

    // ── CONFIRM ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("confirm: DRAFT -> CONFIRMED is allowed and schedules notifications (planFor)")
    void confirmFromDraft() {
        Blast b = buildBlast(BlastStatus.DRAFT);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        service.confirm(42L, 9L);

        assertThat(b.getStatus()).isEqualTo(BlastStatus.CONFIRMED);
        verify(blastRepository).save(b);
        verify(auditService).logTransition(eq(42L), eq(BlastStatus.DRAFT),
                eq(BlastStatus.CONFIRMED), eq(9L), anyString());
        // P4 : confirm() appelle desormais planFor(id) (chemin canonique).
        verify(notificationPlanner).planFor(42L);
    }

    @Test
    @DisplayName("confirm: PLANNED -> CONFIRMED is allowed")
    void confirmFromPlanned() {
        Blast b = buildBlast(BlastStatus.PLANNED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        service.confirm(42L, 9L);

        assertThat(b.getStatus()).isEqualTo(BlastStatus.CONFIRMED);
        verify(notificationPlanner).planFor(42L);
    }

    @Test
    @DisplayName("confirm: CONFIRMED -> CONFIRMED is rejected (already locked)")
    void confirmFromConfirmedRejected() {
        Blast b = buildBlast(BlastStatus.CONFIRMED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        assertThatThrownBy(() -> service.confirm(42L, 9L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Invalid blast status transition");
        verify(notificationPlanner, never()).planFor(anyLong());
        verify(notificationPlanner, never()).scheduleForBlast(any());
    }

    @Test
    @DisplayName("confirm: ALL_CLEAR / CANCELLED / FIRED -> CONFIRMED are all rejected")
    void confirmFromTerminalsRejected() {
        for (BlastStatus from : List.of(BlastStatus.ALL_CLEAR, BlastStatus.CANCELLED,
                BlastStatus.FIRED, BlastStatus.MISFIRE, BlastStatus.IMMINENT,
                BlastStatus.POSTPONED)) {
            Blast b = buildBlast(from);
            when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
            assertThatThrownBy(() -> service.confirm(42L, 9L))
                    .as("confirm from %s should be rejected", from)
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── CANCEL ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("cancel: requires a non-blank reason")
    void cancelRequiresReason() {
        assertThatThrownBy(() -> service.cancel(42L, "  ", 9L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("reason");
    }

    @Test
    @DisplayName("cancel: allowed from DRAFT/PLANNED/CONFIRMED/IMMINENT/POSTPONED")
    void cancelAllowedFromOpenStates() {
        for (BlastStatus from : List.of(BlastStatus.DRAFT, BlastStatus.PLANNED,
                BlastStatus.CONFIRMED, BlastStatus.IMMINENT, BlastStatus.POSTPONED)) {
            Blast b = buildBlast(from);
            when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
            when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                    .thenReturn(List.of());

            service.cancel(42L, "Site evac issue", 9L);

            assertThat(b.getStatus()).as("cancel from %s", from).isEqualTo(BlastStatus.CANCELLED);
        }
    }

    @Test
    @DisplayName("cancel: rejected from FIRED/ALL_CLEAR/CANCELLED/MISFIRE")
    void cancelRejectedFromTerminals() {
        for (BlastStatus from : List.of(BlastStatus.FIRED, BlastStatus.ALL_CLEAR,
                BlastStatus.CANCELLED, BlastStatus.MISFIRE)) {
            Blast b = buildBlast(from);
            when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

            assertThatThrownBy(() -> service.cancel(42L, "stop", 9L))
                    .as("cancel from %s should be rejected", from)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Invalid blast status transition");
        }
    }

    @Test
    @DisplayName("cancel: schedules jobs are cancelled (idempotent)")
    void cancelCancelsScheduledJobs() {
        Blast b = buildBlast(BlastStatus.CONFIRMED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        BlastNotificationJob j1 = BlastNotificationJob.builder()
                .id(1L).blast(b).type(JobType.EMAIL_24H).status(JobStatus.SCHEDULED)
                .scheduledAt(LocalDateTime.now()).attempts(0).build();
        BlastNotificationJob j2 = BlastNotificationJob.builder()
                .id(2L).blast(b).type(JobType.GENERAL_ALARM_10M).status(JobStatus.SCHEDULED)
                .scheduledAt(LocalDateTime.now()).attempts(0).build();
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of(j1, j2));

        service.cancel(42L, "Severe weather", 9L);

        assertThat(j1.getStatus()).isEqualTo(JobStatus.CANCELLED);
        assertThat(j2.getStatus()).isEqualTo(JobStatus.CANCELLED);
        verify(jobRepository, times(2)).save(any(BlastNotificationJob.class));
    }

    // ── RESCHEDULE ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("reschedule: PLANNED -> POSTPONED -> PLANNED with new datetime")
    void rescheduleFromPlanned() {
        Blast b = buildBlast(BlastStatus.PLANNED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of());
        LocalDateTime newTime = LocalDateTime.now().plusDays(2);

        service.reschedule(42L, newTime, "Riverains preavis", 9L);

        assertThat(b.getStatus()).isEqualTo(BlastStatus.PLANNED);
        assertThat(b.getScheduledAt()).isEqualTo(newTime);
        verify(auditService).logTransition(eq(42L), eq(BlastStatus.PLANNED),
                eq(BlastStatus.POSTPONED), eq(9L), anyString());
        verify(auditService).logTransition(eq(42L), eq(BlastStatus.POSTPONED),
                eq(BlastStatus.PLANNED), eq(9L), anyString());
    }

    @Test
    @DisplayName("reschedule: rejected from FIRED")
    void rescheduleFromFiredRejected() {
        Blast b = buildBlast(BlastStatus.FIRED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        LocalDateTime newTime = LocalDateTime.now().plusDays(2);

        assertThatThrownBy(() -> service.reschedule(42L, newTime, "test", 9L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot reschedule");
    }

    @Test
    @DisplayName("reschedule: requires reason")
    void rescheduleRequiresReason() {
        LocalDateTime newTime = LocalDateTime.now().plusDays(2);
        assertThatThrownBy(() -> service.reschedule(42L, newTime, " ", 9L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── FIRED ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("declareFired: IMMINENT -> FIRED is allowed")
    void firedFromImminent() {
        Blast b = buildBlast(BlastStatus.IMMINENT);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        service.declareFired(42L, 9L);

        assertThat(b.getStatus()).isEqualTo(BlastStatus.FIRED);
    }

    @Test
    @DisplayName("declareFired: CONFIRMED -> FIRED is allowed (manual override)")
    void firedFromConfirmed() {
        Blast b = buildBlast(BlastStatus.CONFIRMED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        service.declareFired(42L, 9L);

        assertThat(b.getStatus()).isEqualTo(BlastStatus.FIRED);
    }

    @Test
    @DisplayName("declareFired: DRAFT -> FIRED is rejected")
    void firedFromDraftRejected() {
        Blast b = buildBlast(BlastStatus.DRAFT);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        assertThatThrownBy(() -> service.declareFired(42L, 9L))
                .isInstanceOf(IllegalStateException.class);
    }

    // ── MISFIRE ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("declareMisfire: IMMINENT -> MISFIRE is allowed and requires a reason")
    void misfireFromImminent() {
        Blast b = buildBlast(BlastStatus.IMMINENT);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        service.declareMisfire(42L, "Detonator failure on hole 12", 9L);

        assertThat(b.getStatus()).isEqualTo(BlastStatus.MISFIRE);
        assertThat(b.getMisfireResolvedAt()).isNull();
    }

    @Test
    @DisplayName("declareMisfire: FIRED -> MISFIRE is allowed (post-tir anomaly)")
    void misfireFromFired() {
        Blast b = buildBlast(BlastStatus.FIRED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        service.declareMisfire(42L, "Hole 7 did not detonate", 9L);

        assertThat(b.getStatus()).isEqualTo(BlastStatus.MISFIRE);
    }

    @Test
    @DisplayName("declareMisfire: requires reason")
    void misfireRequiresReason() {
        assertThatThrownBy(() -> service.declareMisfire(42L, null, 9L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("reason");
    }

    @Test
    @DisplayName("declareMisfire: from DRAFT/PLANNED/CONFIRMED/ALL_CLEAR is rejected")
    void misfireFromInvalidStatesRejected() {
        for (BlastStatus from : List.of(BlastStatus.DRAFT, BlastStatus.PLANNED,
                BlastStatus.CONFIRMED, BlastStatus.ALL_CLEAR, BlastStatus.CANCELLED,
                BlastStatus.POSTPONED)) {
            Blast b = buildBlast(from);
            when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
            assertThatThrownBy(() -> service.declareMisfire(42L, "test", 9L))
                    .as("misfire from %s should be rejected", from)
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── ALL CLEAR (misfire lock) ───────────────────────────────────────────

    @Test
    @DisplayName("allClear: FIRED -> ALL_CLEAR is allowed")
    void allClearFromFired() {
        Blast b = buildBlast(BlastStatus.FIRED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        service.allClear(42L, 9L);

        assertThat(b.getStatus()).isEqualTo(BlastStatus.ALL_CLEAR);
    }

    @Test
    @DisplayName("assertMisfireLocksAllClear: MISFIRE -> ALL_CLEAR is rejected if unresolved")
    void assertMisfireLocksAllClear() {
        Blast b = buildBlast(BlastStatus.MISFIRE);
        b.setMisfireResolvedAt(null);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        assertThatThrownBy(() -> service.allClear(42L, 9L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("misfire");
    }

    @Test
    @DisplayName("allClear: MISFIRE -> ALL_CLEAR is allowed once resolveMisfire was called")
    void allClearFromResolvedMisfire() {
        Blast b = buildBlast(BlastStatus.MISFIRE);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        // First, resolve.
        service.resolveMisfire(42L, "Hole 7 manually detonated", 1L);
        assertThat(b.getMisfireResolvedAt()).isNotNull();

        // Then, clear.
        service.allClear(42L, 9L);

        assertThat(b.getStatus()).isEqualTo(BlastStatus.ALL_CLEAR);
    }

    @Test
    @DisplayName("resolveMisfire: rejected when blast is not in MISFIRE state")
    void resolveMisfireRejectedOnOtherStates() {
        Blast b = buildBlast(BlastStatus.FIRED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        assertThatThrownBy(() -> service.resolveMisfire(42L, "test", 1L))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("allClear: DRAFT/PLANNED/CONFIRMED -> ALL_CLEAR are rejected")
    void allClearFromInvalidRejected() {
        for (BlastStatus from : List.of(BlastStatus.DRAFT, BlastStatus.PLANNED,
                BlastStatus.CONFIRMED, BlastStatus.IMMINENT, BlastStatus.CANCELLED,
                BlastStatus.ALL_CLEAR, BlastStatus.POSTPONED)) {
            Blast b = buildBlast(from);
            when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
            assertThatThrownBy(() -> service.allClear(42L, 9L))
                    .as("allClear from %s should be rejected", from)
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── UPDATE (admin override) ────────────────────────────────────────────

    @Test
    @DisplayName("update: DRAFT is freely editable")
    void updateDraftAllowed() {
        Blast b = buildBlast(BlastStatus.DRAFT);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        var dto = com.minexpert.hns.blast.dto.BlastUpdateDTO.builder()
                .id(42L)
                .pit("FOSSE_SUD")
                .build();
        service.update(dto, 7L, false);

        assertThat(b.getPit()).isEqualTo("FOSSE_SUD");
    }

    @Test
    @DisplayName("update: CONFIRMED rejected without adminOverride")
    void updateConfirmedRejectedWithoutOverride() {
        Blast b = buildBlast(BlastStatus.CONFIRMED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        var dto = com.minexpert.hns.blast.dto.BlastUpdateDTO.builder()
                .id(42L).pit("FOSSE_OUEST").build();

        assertThatThrownBy(() -> service.update(dto, 7L, false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("BLAST_ADMIN");
    }

    @Test
    @DisplayName("update: CONFIRMED + adminOverride requires reason and triggers reschedule")
    void updateConfirmedWithOverrideTriggersReplan() {
        Blast b = buildBlast(BlastStatus.CONFIRMED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of());

        var dto = com.minexpert.hns.blast.dto.BlastUpdateDTO.builder()
                .id(42L).pit("FOSSE_OUEST").reason("Operational shift").build();
        service.update(dto, 7L, true);

        assertThat(b.getPit()).isEqualTo("FOSSE_OUEST");
        verify(notificationPlanner).scheduleForBlast(b);
    }

    // ── SEARCH / DETAIL ────────────────────────────────────────────────────

    @Test
    @DisplayName("search: requires mineId")
    void searchRequiresMineId() {
        assertThatThrownBy(() -> service.search(new BlastSearchFiltersDTO()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mineId");
    }

    @Test
    @DisplayName("search: filters by status + date range")
    void searchFiltersByStatusAndRange() {
        Blast b1 = buildBlast(BlastStatus.CONFIRMED);
        b1.setScheduledAt(LocalDateTime.of(2026, 6, 18, 14, 0));
        Blast b2 = buildBlast(BlastStatus.CONFIRMED);
        b2.setId(43L);
        b2.setScheduledAt(LocalDateTime.of(2026, 6, 20, 14, 0));
        when(blastRepository.findByMineIdAndStatusIn(eq(1L), any()))
                .thenReturn(List.of(b1, b2));

        var filters = BlastSearchFiltersDTO.builder()
                .mineId(1L)
                .statuses(List.of(BlastStatus.CONFIRMED))
                .from(LocalDateTime.of(2026, 6, 19, 0, 0))
                .to(LocalDateTime.of(2026, 6, 21, 0, 0))
                .build();

        var result = service.search(filters);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(43L);
    }

    @Test
    @DisplayName("getDetail: 404 when missing")
    void detailNotFound() {
        when(blastRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getDetail(999L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ── P5 — Procedure ratée + cascade jobs + emails de cycle de vie ───────

    @Test
    @DisplayName("P5/cancel: bascule les 5 jobs SCHEDULED en CANCELLED + email 'cancelled' envoye")
    void cancelCancelsFiveJobsAndSendsEmail() {
        // Cas representatif : 5 jobs SCHEDULED (24h, 6h, 30m, popup-15m, alarm-10m)
        Blast b = buildBlast(BlastStatus.CONFIRMED);
        b.getRecipients().add(BlastRecipient.builder()
                .id(1L).externalEmail("ops@mine.test").preferredLanguage("FR").build());
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        List<BlastNotificationJob> five = List.of(
                BlastNotificationJob.builder().id(1L).blast(b).type(JobType.EMAIL_24H)
                        .status(JobStatus.SCHEDULED).scheduledAt(LocalDateTime.now()).attempts(0).build(),
                BlastNotificationJob.builder().id(2L).blast(b).type(JobType.EMAIL_6H)
                        .status(JobStatus.SCHEDULED).scheduledAt(LocalDateTime.now()).attempts(0).build(),
                BlastNotificationJob.builder().id(3L).blast(b).type(JobType.EMAIL_30M)
                        .status(JobStatus.SCHEDULED).scheduledAt(LocalDateTime.now()).attempts(0).build(),
                BlastNotificationJob.builder().id(4L).blast(b).type(JobType.POPUP_15M)
                        .status(JobStatus.SCHEDULED).scheduledAt(LocalDateTime.now()).attempts(0).build(),
                BlastNotificationJob.builder().id(5L).blast(b).type(JobType.GENERAL_ALARM_10M)
                        .status(JobStatus.SCHEDULED).scheduledAt(LocalDateTime.now()).attempts(0).build()
        );
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED)).thenReturn(five);

        service.cancel(42L, "Riverains preavis", 9L);

        // Tous les jobs basculés CANCELLED
        for (BlastNotificationJob j : five) {
            assertThat(j.getStatus())
                    .as("job %s should be CANCELLED", j.getType())
                    .isEqualTo(JobStatus.CANCELLED);
        }
        verify(jobRepository, times(five.size())).save(any(BlastNotificationJob.class));
        // Planner aussi appele pour annulation persistante (idempotent)
        verify(notificationPlanner).cancelFor(42L);
        // Email "cancelled" envoye (synchrone, pas via job).
        verify(emailService).sendLifecycleEmail(eq(b),
                eq(BlastEmailService.LifecycleEvent.CANCELLED));
    }

    @Test
    @DisplayName("P5/cancel: l'echec d'envoi d'email NE FAIT PAS rollback de l'annulation")
    void cancelEmailFailureDoesNotRollback() {
        Blast b = buildBlast(BlastStatus.CONFIRMED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of());
        org.mockito.Mockito.doThrow(new RuntimeException("SMTP boom"))
                .when(emailService).sendLifecycleEmail(any(), any());

        // Pas d'exception propagee : la cancellation reste persistee.
        service.cancel(42L, "force majeure", 9L);

        assertThat(b.getStatus()).isEqualTo(BlastStatus.CANCELLED);
    }

    @Test
    @DisplayName("P5/reschedule: depuis CONFIRMED, replan via planner + email 'rescheduled'")
    void rescheduleFromConfirmedTriggersReplanAndEmail() {
        Blast b = buildBlast(BlastStatus.CONFIRMED);
        b.getRecipients().add(BlastRecipient.builder()
                .id(1L).externalEmail("crew@mine.test").preferredLanguage("EN").build());
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of());
        LocalDateTime newTime = LocalDateTime.now().plusDays(2);

        service.reschedule(42L, newTime, "Pluies", 9L);

        // Le tir revient en PLANNED avec la nouvelle date.
        assertThat(b.getStatus()).isEqualTo(BlastStatus.PLANNED);
        assertThat(b.getScheduledAt()).isEqualTo(newTime);
        // Planner appele pour re-genererer la chaine de 5 jobs sur la
        // nouvelle echeance (rescheduleFor = cancelFor + planFor).
        verify(notificationPlanner).rescheduleFor(42L, newTime);
        // Email "rescheduled" envoye.
        verify(emailService).sendLifecycleEmail(eq(b),
                eq(BlastEmailService.LifecycleEvent.RESCHEDULED));
    }

    @Test
    @DisplayName("P5/reschedule: depuis PLANNED, pas de replan (chaine pas encore demarree) mais email envoye")
    void rescheduleFromPlannedNoReplanButEmail() {
        Blast b = buildBlast(BlastStatus.PLANNED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of());
        LocalDateTime newTime = LocalDateTime.now().plusDays(2);

        service.reschedule(42L, newTime, "Pluies", 9L);

        verify(notificationPlanner, never()).rescheduleFor(anyLong(), any());
        // Email est tout de meme envoye pour preavis riverains.
        verify(emailService).sendLifecycleEmail(eq(b),
                eq(BlastEmailService.LifecycleEvent.RESCHEDULED));
    }

    @Test
    @DisplayName("P5/declareMisfire: cancel les jobs SCHEDULED + broadcast STOMP popup")
    void declareMisfireCancelsJobsAndBroadcasts() {
        Blast b = buildBlast(BlastStatus.FIRED);
        b.setBlasterId(11L);
        b.setHseLeadId(22L);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of());

        service.declareMisfire(42L, "Trou 7 silencieux", 9L);

        assertThat(b.getStatus()).isEqualTo(BlastStatus.MISFIRE);
        assertThat(b.getMisfireResolvedAt()).isNull();
        // Planner appele pour annuler la chaine de notifications residuelles.
        verify(notificationPlanner).cancelFor(42L);
        // Broadcast STOMP pour notifier boutefeu + HSE_LEAD + control room.
        verify(misfireBroadcaster).broadcast(eq(b), eq("Trou 7 silencieux"));
    }

    @Test
    @DisplayName("P5/declareMisfire: l'echec de broadcast STOMP NE FAIT PAS rollback du raté")
    void declareMisfireBroadcastFailureDoesNotRollback() {
        Blast b = buildBlast(BlastStatus.FIRED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of());
        org.mockito.Mockito.doThrow(new RuntimeException("broker down"))
                .when(misfireBroadcaster).broadcast(any(), anyString());

        service.declareMisfire(42L, "test", 9L);

        // Status est bien MISFIRE meme si la popup n'a pas pu partir.
        assertThat(b.getStatus()).isEqualTo(BlastStatus.MISFIRE);
    }

    @Test
    @DisplayName("P5/declareMisfire: bloque ALL_CLEAR jusqu'a resolveMisfire")
    void misfireLocksAllClearUntilResolved() {
        Blast b = buildBlast(BlastStatus.FIRED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of());

        service.declareMisfire(42L, "Detonateur 12", 9L);
        assertThat(b.getStatus()).isEqualTo(BlastStatus.MISFIRE);
        assertThat(b.getMisfireResolvedAt()).isNull();

        // ALL_CLEAR est bloque tant que misfireResolvedAt est null
        assertThatThrownBy(() -> service.allClear(42L, 9L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("misfire");

        // Une fois resolve, ALL_CLEAR passe
        service.resolveMisfire(42L, "Contre-mine 14:25", 1L);
        assertThat(b.getMisfireResolvedAt()).isNotNull();
        assertThat(b.getMisfireResolutionNotes()).isEqualTo("Contre-mine 14:25");

        service.allClear(42L, 9L);
        assertThat(b.getStatus()).isEqualTo(BlastStatus.ALL_CLEAR);
    }

    @Test
    @DisplayName("P5/resolveMisfire: persiste les notes de resolution dans la colonne dediee")
    void resolveMisfirePersistsNotes() {
        Blast b = buildBlast(BlastStatus.MISFIRE);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        service.resolveMisfire(42L, "Re-amorcage trou 7 a 14h25 par boutefeu #11", 1L);

        assertThat(b.getMisfireResolvedAt()).isNotNull();
        assertThat(b.getMisfireResolutionNotes())
                .isEqualTo("Re-amorcage trou 7 a 14h25 par boutefeu #11");
        // Audit trace aussi le contenu pour preserver l'historique
        // append-only en cas de re-passage MISFIRE ulterieur.
        verify(auditService).logTransition(eq(42L),
                eq(BlastStatus.MISFIRE), eq(BlastStatus.MISFIRE),
                eq(1L),
                argThat(s -> s != null && s.contains("Re-amorcage trou 7")));
    }

    @Test
    @DisplayName("P5/resolveMisfire: notes blank/null tolerees (audit garde la trace)")
    void resolveMisfireWithoutNotesIsAllowed() {
        Blast b = buildBlast(BlastStatus.MISFIRE);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        service.resolveMisfire(42L, null, 1L);

        assertThat(b.getMisfireResolvedAt()).isNotNull();
        // Pas d'ecrasement si null
        assertThat(b.getMisfireResolutionNotes()).isNull();
    }

    @Test
    @DisplayName("P5/declareMisfire: depuis CONFIRMED rejete (sortie de workflow attendue)")
    void misfireFromConfirmedRejectedExplicitMessage() {
        Blast b = buildBlast(BlastStatus.CONFIRMED);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(b));

        assertThatThrownBy(() -> service.declareMisfire(42L, "test", 9L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("FIRED or IMMINENT");
    }
}
