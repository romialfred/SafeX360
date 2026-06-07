package com.minexpert.hns.dosimetry.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.contains;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.service.DosimetryAuditService;

/**
 * Tests unitaires de {@link DosimetrySelfAccessGuard} (Phase 10-A).
 *
 * <p>Couverture :
 * <ul>
 *   <li>SELF match (workerId.employeeId == userId) -&gt; autorise sans audit.</li>
 *   <li>Cross worker (employeeId != userId) -&gt; AccessDeniedException + audit
 *       ACCESS_DENIED_SELF_MISMATCH.</li>
 *   <li>Worker introuvable -&gt; AccessDeniedException + audit.</li>
 *   <li>Permission elevee (MEDICAL/PCR_RPO/READ_AGGREGATE/...) -&gt; bypass SELF, OK.</li>
 *   <li>isSelfOrElevated : variante non-throwing returns true/false sans levee.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class DosimetrySelfAccessGuardTest {

    @Mock
    private ExposedWorkerRepository workerRepository;

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private DosimetrySelfAccessGuard guard;

    @AfterEach
    void clearContext() {
        // S'assurer qu'aucun authentication leak d'un test a l'autre.
        SecurityContextHolder.clearContext();
    }

    private ExposedWorker worker(Long id, Long employeeId) {
        return ExposedWorker.builder()
                .id(id)
                .employeeId(employeeId)
                .mineId(1L)
                .active(true)
                .build();
    }

    private void mockAuthorities(String... authorities) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                "test-user", "",
                List.of(authorities).stream().map(SimpleGrantedAuthority::new).toList());
        SecurityContextHolder.getContext().setAuthentication(token);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SELF match
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("SELF match : worker.employeeId == userId -> autorise, pas d'audit DENIED")
    void selfMatch_ok() {
        when(workerRepository.findById(10L)).thenReturn(Optional.of(worker(10L, 999L)));

        boolean ok = guard.verifySelfAccess(10L, 999L);

        assertThat(ok).isTrue();
        // Aucun audit ACCESS_DENIED ne doit etre ecrit.
        verify(auditService, never()).log(eq("ACCESS_DENIED_SELF_MISMATCH"),
                anyString(), anyLong(), anyLong(), any(), anyString());
    }

    // ────────────────────────────────────────────────────────────────────────
    // Cross worker
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Cross worker : employeeId != userId -> AccessDeniedException + audit")
    void crossWorker_deniedAndAudited() {
        when(workerRepository.findById(10L)).thenReturn(Optional.of(worker(10L, 100L)));

        assertThatThrownBy(() -> guard.verifySelfAccess(10L, 999L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("SELF access denied");

        verify(auditService, times(1)).log(eq("ACCESS_DENIED_SELF_MISMATCH"),
                eq("ExposedWorker"), eq(10L), eq(999L), isNull(),
                contains("EMPLOYEE_ID_MISMATCH"));
    }

    @Test
    @DisplayName("Worker introuvable : AccessDeniedException + audit WORKER_NOT_FOUND")
    void workerNotFound_denied() {
        when(workerRepository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> guard.verifySelfAccess(42L, 999L))
                .isInstanceOf(AccessDeniedException.class);

        verify(auditService).log(eq("ACCESS_DENIED_SELF_MISMATCH"),
                eq("ExposedWorker"), eq(42L), eq(999L), isNull(),
                contains("WORKER_NOT_FOUND"));
    }

    @Test
    @DisplayName("X-User-Id absent (null) sans permission elevee : AccessDeniedException + audit")
    void missingUserId_denied() {
        assertThatThrownBy(() -> guard.verifySelfAccess(10L, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("X-User-Id");

        verify(auditService).log(eq("ACCESS_DENIED_SELF_MISMATCH"),
                eq("ExposedWorker"), eq(10L), eq(0L), isNull(),
                contains("MISSING_USER_ID"));
        // L'appel ne doit pas avoir leve la requete BDD : on fail-fast avant.
        verify(workerRepository, never()).findById(anyLong());
    }

    // ────────────────────────────────────────────────────────────────────────
    // Bypass via permission elevee
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("DOSIMETRY_MEDICAL : bypass SELF, autorise meme cross worker")
    void elevatedMedical_bypass() {
        mockAuthorities(DosimetryRBACConfig.DOSIMETRY_MEDICAL);

        boolean ok = guard.verifySelfAccess(10L, 999L);

        assertThat(ok).isTrue();
        // Pas de lookup repo : on shortcut avant.
        verify(workerRepository, never()).findById(anyLong());
        // Pas d'audit DENIED.
        verify(auditService, never()).log(eq("ACCESS_DENIED_SELF_MISMATCH"),
                anyString(), anyLong(), anyLong(), any(), anyString());
    }

    @Test
    @DisplayName("DOSIMETRY_PCR_RPO : bypass SELF (gestion alertes/cases)")
    void elevatedPcrRpo_bypass() {
        mockAuthorities(DosimetryRBACConfig.DOSIMETRY_PCR_RPO);

        assertThat(guard.verifySelfAccess(10L, 999L)).isTrue();
        verify(workerRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("DOSIMETRY_READ_AGGREGATE : bypass SELF (KPI globaux)")
    void elevatedReadAggregate_bypass() {
        mockAuthorities(DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE);

        assertThat(guard.verifySelfAccess(10L, 999L)).isTrue();
    }

    @Test
    @DisplayName("DOSIMETRY_READ_NOMINATIVE seul : PAS de bypass (SELF strict)")
    void readNominativeOnly_noBypass() {
        mockAuthorities(DosimetryRBACConfig.DOSIMETRY_READ_NOMINATIVE);
        when(workerRepository.findById(10L)).thenReturn(Optional.of(worker(10L, 100L)));

        assertThatThrownBy(() -> guard.verifySelfAccess(10L, 999L))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // isSelfOrElevated : variante non throwing
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("isSelfOrElevated : self match -> true")
    void isSelfOrElevated_self() {
        when(workerRepository.findById(10L)).thenReturn(Optional.of(worker(10L, 999L)));
        assertThat(guard.isSelfOrElevated(10L, 999L)).isTrue();
    }

    @Test
    @DisplayName("isSelfOrElevated : cross worker -> false (sans lever)")
    void isSelfOrElevated_cross() {
        when(workerRepository.findById(10L)).thenReturn(Optional.of(worker(10L, 100L)));
        assertThat(guard.isSelfOrElevated(10L, 999L)).isFalse();
    }

    @Test
    @DisplayName("hasAnyElevatedAuthority : aucune authority -> false")
    void hasAnyElevatedAuthority_noAuth() {
        SecurityContextHolder.clearContext();
        assertThat(guard.hasAnyElevatedAuthority()).isFalse();
    }
}
