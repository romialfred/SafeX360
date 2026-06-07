package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.dto.MedicalVisitFullDTO;
import com.minexpert.hns.dosimetry.dto.MedicalVisitSummaryDTO;
import com.minexpert.hns.dosimetry.entity.MedicalVisit;
import com.minexpert.hns.dosimetry.enums.MedicalVisitType;
import com.minexpert.hns.dosimetry.enums.VisitStatus;
import com.minexpert.hns.dosimetry.repository.MedicalVisitRepository;

/**
 * Tests unitaires de {@link MedicalVisitServiceImpl} (Phase 7).
 *
 * <p>Couverture cible :
 * <ul>
 *   <li>Planification d'une visite + audit SCHEDULE_MEDICAL_VISIT.</li>
 *   <li>Realisation d'une visite : transition SCHEDULED -&gt; PERFORMED + audit
 *       PERFORM_MEDICAL_VISIT.</li>
 *   <li>Transition invalide (perform depuis PERFORMED ou CANCELLED).</li>
 *   <li>Annulation + transition invalide depuis PERFORMED.</li>
 *   <li>Lecture Full vs Summary : seul le DTO Full porte detailedReport.</li>
 *   <li>Audit VIEW_MEDICAL_DETAIL sur lecture Full + reason + ipAddress.</li>
 *   <li>Auto-schedule POST_EXPOSURE idempotent.</li>
 * </ul>
 *
 * <p><b>RBAC enforcement :</b> Au niveau service, on verifie que le DTO Summary NE PORTE
 * PAS le detailedReport (verification structurelle - aucun champ correspondant). Le
 * controle d'autorite ({@code @PreAuthorize}) est applique au niveau controller et teste
 * en integration ailleurs.
 */
@ExtendWith(MockitoExtension.class)
class MedicalVisitServiceTest {

    @Mock
    private MedicalVisitRepository repository;

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private MedicalVisitServiceImpl service;

    private MedicalVisit visit(Long id, VisitStatus status) {
        return MedicalVisit.builder()
                .id(id)
                .workerId(7L)
                .mineId(1L)
                .visitType(MedicalVisitType.PERIODIC_ANNUAL)
                .scheduledDate(LocalDate.now().plusDays(10))
                .physicianId(99L)
                .physicianName("Dr Test")
                .status(status)
                .detailedReport("CONFIDENTIEL - donnees cliniques sensibles - tres detaillees")
                .generalConclusion("Visite realisee - voir fiche d'aptitude")
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────
    // scheduleVisit
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("scheduleVisit nominal : entite persistee en SCHEDULED + audit")
    void scheduleVisit_nominal() {
        when(repository.save(any(MedicalVisit.class))).thenAnswer(inv -> {
            MedicalVisit v = inv.getArgument(0);
            v.setId(42L);
            return v;
        });

        Long id = service.scheduleVisit(7L, 1L, MedicalVisitType.PERIODIC_ANNUAL,
                LocalDate.now().plusDays(30), 99L, "Dr Test", 100L);

        assertThat(id).isEqualTo(42L);
        ArgumentCaptor<MedicalVisit> captor = ArgumentCaptor.forClass(MedicalVisit.class);
        verify(repository).save(captor.capture());
        MedicalVisit saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(VisitStatus.SCHEDULED);
        assertThat(saved.getCreatedBy()).isEqualTo(100L);
        // Audit SCHEDULE_MEDICAL_VISIT
        verify(auditService).log(eq("SCHEDULE_MEDICAL_VISIT"), eq("MedicalVisit"),
                eq(42L), eq(100L), eq("DOSIMETRY_MEDICAL"), anyString());
    }

    @Test
    @DisplayName("scheduleVisit : workerId null -> IllegalArgumentException")
    void scheduleVisit_workerIdNull_throws() {
        assertThatThrownBy(() -> service.scheduleVisit(null, 1L,
                MedicalVisitType.PERIODIC_ANNUAL, LocalDate.now(), 99L, "Dr", 100L))
                .isInstanceOf(IllegalArgumentException.class);
        verify(repository, never()).save(any());
    }

    // ────────────────────────────────────────────────────────────────────────
    // performVisit
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("performVisit depuis SCHEDULED : status PERFORMED + audit MEDICAL_DETAIL")
    void performVisit_fromScheduled_ok() {
        MedicalVisit v = visit(50L, VisitStatus.SCHEDULED);
        v.setDetailedReport(null);
        v.setGeneralConclusion(null);
        when(repository.findById(50L)).thenReturn(Optional.of(v));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.performVisit(50L, "Conclusion generique",
                "Compte-rendu medical detaille - confidentiel",
                LocalDate.now(), 99L, "192.168.1.10");

        assertThat(v.getStatus()).isEqualTo(VisitStatus.PERFORMED);
        assertThat(v.getDetailedReport()).contains("confidentiel");
        assertThat(v.getGeneralConclusion()).isEqualTo("Conclusion generique");

        // Audit PERFORM_MEDICAL_VISIT avec ipAddress
        verify(auditService).log(eq("PERFORM_MEDICAL_VISIT"), eq("MedicalVisit"),
                eq(50L), eq(99L), eq("DOSIMETRY_MEDICAL"), eq("192.168.1.10"),
                contains("hasDetailedReport"));
    }

    @Test
    @DisplayName("performVisit depuis PERFORMED -> IllegalStateException (append-only)")
    void performVisit_fromPerformed_throws() {
        MedicalVisit v = visit(50L, VisitStatus.PERFORMED);
        when(repository.findById(50L)).thenReturn(Optional.of(v));

        assertThatThrownBy(() -> service.performVisit(50L, "x", "y", LocalDate.now(),
                99L, "ip"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PERFORM only allowed");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("performVisit depuis CANCELLED -> IllegalStateException")
    void performVisit_fromCancelled_throws() {
        MedicalVisit v = visit(50L, VisitStatus.CANCELLED);
        when(repository.findById(50L)).thenReturn(Optional.of(v));

        assertThatThrownBy(() -> service.performVisit(50L, "x", "y", LocalDate.now(),
                99L, "ip"))
                .isInstanceOf(IllegalStateException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // cancelVisit
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("cancelVisit depuis SCHEDULED : status CANCELLED + reason persistee")
    void cancelVisit_fromScheduled_ok() {
        MedicalVisit v = visit(50L, VisitStatus.SCHEDULED);
        when(repository.findById(50L)).thenReturn(Optional.of(v));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.cancelVisit(50L, "Indisponibilite medecin", 100L);

        assertThat(v.getStatus()).isEqualTo(VisitStatus.CANCELLED);
        assertThat(v.getCancellationReason()).isEqualTo("Indisponibilite medecin");
        verify(auditService).log(eq("CANCEL_MEDICAL_VISIT"), eq("MedicalVisit"),
                eq(50L), eq(100L), eq("DOSIMETRY_MEDICAL"), anyString());
    }

    @Test
    @DisplayName("cancelVisit depuis PERFORMED -> IllegalStateException")
    void cancelVisit_fromPerformed_throws() {
        MedicalVisit v = visit(50L, VisitStatus.PERFORMED);
        when(repository.findById(50L)).thenReturn(Optional.of(v));

        assertThatThrownBy(() -> service.cancelVisit(50L, "reason", 100L))
                .isInstanceOf(IllegalStateException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // RBAC enforcement : Summary DTO ne porte PAS le detailedReport
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getWorkerVisitsSummary : DTO Summary ne contient PAS detailedReport (RGPD)")
    void getWorkerVisitsSummary_noDetailedReport() {
        when(repository.findByWorkerIdOrderByScheduledDateDesc(7L))
                .thenReturn(List.of(visit(1L, VisitStatus.PERFORMED)));

        List<MedicalVisitSummaryDTO> result = service.getWorkerVisitsSummary(7L, 200L,
                "10.0.0.1");

        assertThat(result).hasSize(1);
        MedicalVisitSummaryDTO dto = result.get(0);
        assertThat(dto.getGeneralConclusion()).isNotNull();
        // Verification structurelle : pas de getter detailedReport sur le DTO Summary.
        assertThat(dto.getClass().getDeclaredFields())
                .extracting("name")
                .doesNotContain("detailedReport", "restrictions");
        // Audit non-medical avec ipAddress.
        verify(auditService).log(eq("READ_MEDICAL_VISIT_SUMMARY"), eq("MedicalVisit"),
                isNull(), eq(200L), isNull(), eq("10.0.0.1"), anyString());
    }

    @Test
    @DisplayName("getWorkerVisitsFull : DTO Full contient detailedReport + audit VIEW_MEDICAL_DETAIL")
    void getWorkerVisitsFull_contientDetailedReport_etAudit() {
        when(repository.findByWorkerIdOrderByScheduledDateDesc(7L))
                .thenReturn(List.of(visit(1L, VisitStatus.PERFORMED)));

        List<MedicalVisitFullDTO> result = service.getWorkerVisitsFull(7L, 300L,
                "Demande judiciaire", "192.168.1.42");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDetailedReport()).contains("CONFIDENTIEL");
        // Audit VIEW_MEDICAL_DETAIL avec reason + ip.
        verify(auditService).log(eq("VIEW_MEDICAL_DETAIL"), eq("MedicalVisit"),
                isNull(), eq(300L), eq("DOSIMETRY_MEDICAL"), eq("192.168.1.42"),
                contains("Demande judiciaire"));
    }

    @Test
    @DisplayName("getVisitFull(id) : audit VIEW_MEDICAL_DETAIL avec visitId precise")
    void getVisitFull_audit() {
        MedicalVisit v = visit(50L, VisitStatus.PERFORMED);
        when(repository.findById(50L)).thenReturn(Optional.of(v));

        MedicalVisitFullDTO dto = service.getVisitFull(50L, 300L, "suivi clinique",
                "192.168.1.42");

        assertThat(dto.getDetailedReport()).isNotNull();
        verify(auditService).log(eq("VIEW_MEDICAL_DETAIL"), eq("MedicalVisit"),
                eq(50L), eq(300L), eq("DOSIMETRY_MEDICAL"), eq("192.168.1.42"),
                contains("suivi clinique"));
    }

    // ────────────────────────────────────────────────────────────────────────
    // autoSchedulePostExposureVisit
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("autoSchedulePostExposureVisit nominal : cree visite POST_EXPOSURE J+7")
    void autoSchedule_nominal() {
        when(repository.findByWorkerAndTypeAndStatus(eq(7L),
                eq(MedicalVisitType.POST_EXPOSURE), eq(VisitStatus.SCHEDULED)))
                .thenReturn(Collections.emptyList());
        when(repository.save(any(MedicalVisit.class))).thenAnswer(inv -> {
            MedicalVisit v = inv.getArgument(0);
            v.setId(60L);
            return v;
        });

        Long id = service.autoSchedulePostExposureVisit(7L, 1L, 200L);
        assertThat(id).isEqualTo(60L);

        ArgumentCaptor<MedicalVisit> captor = ArgumentCaptor.forClass(MedicalVisit.class);
        verify(repository).save(captor.capture());
        MedicalVisit saved = captor.getValue();
        assertThat(saved.getVisitType()).isEqualTo(MedicalVisitType.POST_EXPOSURE);
        assertThat(saved.getScheduledDate())
                .isEqualTo(LocalDate.now().plusDays(
                        MedicalVisitServiceImpl.POST_EXPOSURE_DELAY_DAYS));
    }

    @Test
    @DisplayName("autoSchedulePostExposureVisit idempotent : skip si visite deja planifiee")
    void autoSchedule_idempotent() {
        MedicalVisit existing = visit(60L, VisitStatus.SCHEDULED);
        existing.setVisitType(MedicalVisitType.POST_EXPOSURE);
        when(repository.findByWorkerAndTypeAndStatus(eq(7L),
                eq(MedicalVisitType.POST_EXPOSURE), eq(VisitStatus.SCHEDULED)))
                .thenReturn(List.of(existing));

        Long id = service.autoSchedulePostExposureVisit(7L, 1L, 200L);

        assertThat(id).isNull();
        verify(repository, never()).save(any(MedicalVisit.class));
        verify(auditService, never()).log(eq("SCHEDULE_MEDICAL_VISIT"), anyString(),
                anyLong(), anyLong(), anyString(), anyString());
    }

    // ────────────────────────────────────────────────────────────────────────
    // getUpcomingVisits : pas de detailedReport dans Summary
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getUpcomingVisits retourne Summary uniquement (RGPD)")
    void getUpcomingVisits_summaryOnly() {
        when(repository.findUpcomingByMine(eq(1L), eq(VisitStatus.SCHEDULED),
                any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(visit(1L, VisitStatus.SCHEDULED)));

        List<MedicalVisitSummaryDTO> upcoming = service.getUpcomingVisits(1L, 30);

        assertThat(upcoming).hasSize(1);
        // Structurel : pas de detailedReport.
        assertThat(upcoming.get(0).getClass().getDeclaredFields())
                .extracting("name")
                .doesNotContain("detailedReport");
        verify(auditService, times(0)).log(eq("VIEW_MEDICAL_DETAIL"), anyString(),
                any(), anyLong(), anyString(), anyString());
    }

    // ────────────────────────────────────────────────────────────────────────
    // garde : audit declenche systematiquement sur lecture Full
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getWorkerVisitsFull : audit VIEW_MEDICAL_DETAIL toujours appele (zero leak)")
    void getWorkerVisitsFull_alwaysAudits() {
        when(repository.findByWorkerIdOrderByScheduledDateDesc(7L))
                .thenReturn(Collections.emptyList());

        service.getWorkerVisitsFull(7L, 300L, "any reason", "ip");

        // Meme si la liste est vide, l'audit doit etre genere (intentionnalite tracee).
        verify(auditService, atLeastOnce()).log(eq("VIEW_MEDICAL_DETAIL"), eq("MedicalVisit"),
                isNull(), eq(300L), eq("DOSIMETRY_MEDICAL"), eq("ip"), anyString());
    }
}
