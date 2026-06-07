package com.minexpert.hns.dosimetry.api;

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

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.MedicalVisitFullDTO;
import com.minexpert.hns.dosimetry.dto.MedicalVisitSummaryDTO;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.service.DosimetryAuditService;
import com.minexpert.hns.dosimetry.service.MedicalVisitService;
import com.minexpert.hns.dosimetry.util.DosimetrySelfAccessGuard;
import com.minexpert.hns.dosimetry.util.XReasonValidator;

/**
 * Tests securite du {@link MedicalVisitController} (Phase 10-A).
 *
 * <p>Combine les vrais beans {@link DosimetrySelfAccessGuard} et {@link XReasonValidator}
 * avec un service mocke, pour verifier que :
 * <ul>
 *   <li>{@code GET /by-worker/{workerId}} sans permission elevee + workerId d'autrui
 *       leve {@link AccessDeniedException} -&gt; mappe en 403 par Spring Security en runtime,
 *       sans appeler le service.</li>
 *   <li>{@code GET /by-worker/{workerId}/full} sans X-Reason valide leve une 400 +
 *       audit INVALID_REASON.</li>
 *   <li>{@code GET /by-worker/{workerId}/full} avec X-Reason valide + permission MEDICAL :
 *       reason transmis a service.getWorkerVisitsFull(..., reasonValidated, ...).</li>
 *   <li>{@code GET /by-worker/{workerId}} : SELF match (employeeId == userId) : autorise et
 *       service appele.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class MedicalVisitControllerSecurityTest {

    @Mock
    private MedicalVisitService service;

    @Mock
    private ExposedWorkerRepository workerRepository;

    @Mock
    private DosimetryAuditService auditService;

    private DosimetrySelfAccessGuard selfAccessGuard;
    private XReasonValidator reasonValidator;
    private MedicalVisitController controller;

    @BeforeEach
    void setUp() {
        selfAccessGuard = new DosimetrySelfAccessGuard(workerRepository, auditService);
        reasonValidator = new XReasonValidator(auditService);
        controller = new MedicalVisitController(service, selfAccessGuard, reasonValidator);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private void mockAuthorities(String... authorities) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                "test-user", "",
                List.of(authorities).stream().map(SimpleGrantedAuthority::new).toList());
        SecurityContextHolder.getContext().setAuthentication(token);
    }

    private ExposedWorker worker(Long id, Long employeeId) {
        return ExposedWorker.builder()
                .id(id)
                .employeeId(employeeId)
                .mineId(1L)
                .active(true)
                .build();
    }

    private HttpServletRequest request() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRemoteAddr("10.0.0.1");
        return req;
    }

    // ────────────────────────────────────────────────────────────────────────
    // /by-worker/{workerId} : SELF enforcement
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("by-worker : cross worker sans permission elevee -> AccessDeniedException 403")
    void byWorker_crossWorker_throwsAccessDenied() {
        when(workerRepository.findById(10L)).thenReturn(Optional.of(worker(10L, 100L)));

        assertThatThrownBy(() -> controller.byWorker(10L, 999L, request()))
                .isInstanceOf(AccessDeniedException.class);

        // Service NON appele.
        verify(service, never()).getWorkerVisitsSummary(anyLong(), any(), any());
        // Audit ACCESS_DENIED ecrit.
        verify(auditService).log(eq("ACCESS_DENIED_SELF_MISMATCH"),
                eq("ExposedWorker"), eq(10L), eq(999L), isNull(),
                contains("EMPLOYEE_ID_MISMATCH"));
    }

    @Test
    @DisplayName("by-worker : SELF match -> OK, service appele")
    void byWorker_selfMatch_ok() {
        when(workerRepository.findById(10L)).thenReturn(Optional.of(worker(10L, 999L)));
        when(service.getWorkerVisitsSummary(eq(10L), eq(999L), anyString()))
                .thenReturn(Collections.<MedicalVisitSummaryDTO>emptyList());

        ResponseEntity<List<MedicalVisitSummaryDTO>> resp = controller.byWorker(10L, 999L, request());

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(service, times(1)).getWorkerVisitsSummary(eq(10L), eq(999L), anyString());
    }

    @Test
    @DisplayName("by-worker : permission MEDICAL elevee + cross worker -> OK (bypass SELF)")
    void byWorker_elevatedMedical_bypass() {
        mockAuthorities(DosimetryRBACConfig.DOSIMETRY_MEDICAL);
        when(service.getWorkerVisitsSummary(eq(10L), eq(999L), anyString()))
                .thenReturn(Collections.<MedicalVisitSummaryDTO>emptyList());

        ResponseEntity<List<MedicalVisitSummaryDTO>> resp = controller.byWorker(10L, 999L, request());

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        // Pas de lookup repo (shortcut elevated).
        verify(workerRepository, never()).findById(anyLong());
        verify(service).getWorkerVisitsSummary(eq(10L), eq(999L), anyString());
    }

    // ────────────────────────────────────────────────────────────────────────
    // /by-worker/{workerId}/full : X-Reason validation
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("byWorkerFull : X-Reason 'unspecified' -> 400 + audit INVALID_REASON")
    void byWorkerFull_invalidReason_400() {
        assertThatThrownBy(() -> controller.byWorkerFull(10L, 99L, "unspecified", request()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));

        verify(auditService).log(eq("INVALID_REASON"), anyString(), isNull(), eq(99L), isNull(),
                contains("FORBIDDEN_LITERAL"));
        verify(service, never()).getWorkerVisitsFull(anyLong(), anyLong(), anyString(), anyString());
    }

    @Test
    @DisplayName("byWorkerFull : X-Reason trop courte (< 10 chars) -> 400")
    void byWorkerFull_tooShortReason_400() {
        assertThatThrownBy(() -> controller.byWorkerFull(10L, 99L, "ok", request()))
                .isInstanceOf(ResponseStatusException.class);

        verify(auditService).log(eq("INVALID_REASON"), anyString(), isNull(), eq(99L), isNull(),
                contains("TOO_SHORT"));
    }

    @Test
    @DisplayName("byWorkerFull : X-Reason valide -> service appele avec reason validee")
    void byWorkerFull_validReason_ok() {
        when(service.getWorkerVisitsFull(eq(10L), eq(99L),
                eq("Consultation medicale annuelle"), anyString()))
                .thenReturn(Collections.<MedicalVisitFullDTO>emptyList());

        ResponseEntity<List<MedicalVisitFullDTO>> resp = controller.byWorkerFull(
                10L, 99L, "  Consultation medicale annuelle  ", request());

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        // Service appele avec la valeur trimmed.
        verify(service).getWorkerVisitsFull(eq(10L), eq(99L),
                eq("Consultation medicale annuelle"), anyString());
    }

    @Test
    @DisplayName("getFull : X-Reason 'n/a' -> 400 + audit")
    void getFull_forbiddenLiteral_400() {
        assertThatThrownBy(() -> controller.getFull(42L, 99L, "n/a", request()))
                .isInstanceOf(ResponseStatusException.class);
        verify(service, never()).getVisitFull(anyLong(), anyLong(), anyString(), anyString());
    }
}
