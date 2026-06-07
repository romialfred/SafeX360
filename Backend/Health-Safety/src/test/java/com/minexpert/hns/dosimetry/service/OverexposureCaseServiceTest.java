package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.OverexposureCase;
import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.enums.CaseStatus;
import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.OverexposureCaseRepository;

/**
 * Tests unitaires du workflow OPEN -> INVESTIGATING -> CLOSED des dossiers de surexposition.
 *
 * <p>Couvre :
 * <ul>
 *   <li>openCase nominal + persistance + audit OPEN_OVEREXPOSURE</li>
 *   <li>openCase double pour la meme alerte -> IllegalStateException</li>
 *   <li>addInvestigation transition OK + invalide depuis CLOSED</li>
 *   <li>closeCase nominal + transition invalide depuis CLOSED</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class OverexposureCaseServiceTest {

    @Mock
    private OverexposureCaseRepository repository;

    @Mock
    private ExposedWorkerRepository workerRepository;

    @Mock
    private DosimetryAuditLogRepository auditLogRepository;

    @InjectMocks
    private OverexposureCaseServiceImpl service;

    private ExposedWorker worker(Long id) {
        ExposedWorker w = new ExposedWorker();
        w.setId(id);
        w.setMineId(100L);
        w.setEmployeeId(2000L + id);
        w.setCategory(DoseCategory.A);
        w.setActive(true);
        return w;
    }

    private OverexposureCase caseOf(Long id, CaseStatus status) {
        return OverexposureCase.builder()
                .id(id)
                .worker(worker(7L))
                .level(AlertLevel.ACTION)
                .status(status)
                .alertId(88L)
                .build();
    }

    // ------- openCase ---------------------------------------------------------

    @Test
    @DisplayName("openCase nominal : status=OPEN, openedAt set, audit OPEN_OVEREXPOSURE")
    void openCase_nominal() {
        when(workerRepository.findById(7L)).thenReturn(Optional.of(worker(7L)));
        when(repository.findByAlertIdAndStatusIn(eq(88L), anyList()))
                .thenReturn(Collections.emptyList());
        when(repository.save(any(OverexposureCase.class))).thenAnswer(inv -> {
            OverexposureCase c = inv.getArgument(0);
            c.setId(500L);
            return c;
        });

        Long id = service.openCase(7L, 88L, 42L, "depassement Hp10", AlertLevel.ACTION);

        assertThat(id).isEqualTo(500L);

        ArgumentCaptor<OverexposureCase> captor = ArgumentCaptor.forClass(OverexposureCase.class);
        verify(repository).save(captor.capture());
        OverexposureCase saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(CaseStatus.OPEN);
        assertThat(saved.getOpenedAt()).isNotNull();
        assertThat(saved.getAlertId()).isEqualTo(88L);
        assertThat(saved.getLevel()).isEqualTo(AlertLevel.ACTION);
        assertThat(saved.getCreatedBy()).isEqualTo(42L);

        // Audit OPEN_OVEREXPOSURE
        ArgumentCaptor<DosimetryAuditLog> logCaptor = ArgumentCaptor.forClass(DosimetryAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getAction()).isEqualTo("OPEN_OVEREXPOSURE");
        assertThat(logCaptor.getValue().getEntityType()).isEqualTo("OverexposureCase");
    }

    @Test
    @DisplayName("openCase sans alertId : autorise (ouverture manuelle)")
    void openCase_noAlertId_allowed() {
        when(workerRepository.findById(7L)).thenReturn(Optional.of(worker(7L)));
        when(repository.save(any(OverexposureCase.class))).thenAnswer(inv -> {
            OverexposureCase c = inv.getArgument(0);
            c.setId(501L);
            return c;
        });

        Long id = service.openCase(7L, null, 42L, "manual open", AlertLevel.EXCEEDED);

        assertThat(id).isEqualTo(501L);
        // Pas de findByAlertIdAndStatusIn appele puisque alertId == null.
        verify(repository, never()).findByAlertIdAndStatusIn(any(), anyList());
    }

    @Test
    @DisplayName("openCase double pour meme alertId -> IllegalStateException (anti-doublon)")
    void openCase_doubleForSameAlert_throws() {
        OverexposureCase existing = caseOf(123L, CaseStatus.OPEN);
        when(repository.findByAlertIdAndStatusIn(eq(88L), anyList()))
                .thenReturn(List.of(existing));

        assertThatThrownBy(() -> service.openCase(7L, 88L, 42L, "...", AlertLevel.ACTION))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already open")
                .hasMessageContaining("88");

        verify(repository, never()).save(any(OverexposureCase.class));
        verify(workerRepository, never()).findById(any());
    }

    @Test
    @DisplayName("openCase double si case INVESTIGATING existe -> IllegalStateException")
    void openCase_existingInvestigating_throws() {
        OverexposureCase existing = caseOf(123L, CaseStatus.INVESTIGATING);
        when(repository.findByAlertIdAndStatusIn(eq(88L), anyList()))
                .thenReturn(List.of(existing));

        assertThatThrownBy(() -> service.openCase(7L, 88L, 42L, "...", AlertLevel.ACTION))
                .isInstanceOf(IllegalStateException.class);
    }

    // ------- addInvestigation -------------------------------------------------

    @Test
    @DisplayName("addInvestigation depuis OPEN : status -> INVESTIGATING + audit INVESTIGATE")
    void addInvestigation_fromOpen_ok() {
        OverexposureCase c = caseOf(123L, CaseStatus.OPEN);
        when(repository.findById(123L)).thenReturn(Optional.of(c));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.addInvestigation(123L, "Port de plomb 0.5mm", "Aptitude provisoire", 42L);

        assertThat(c.getStatus()).isEqualTo(CaseStatus.INVESTIGATING);
        assertThat(c.getCorrectiveActions()).isEqualTo("Port de plomb 0.5mm");
        assertThat(c.getMedicalDecision()).isEqualTo("Aptitude provisoire");

        ArgumentCaptor<DosimetryAuditLog> logCaptor = ArgumentCaptor.forClass(DosimetryAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getAction()).isEqualTo("INVESTIGATE");
    }

    @Test
    @DisplayName("addInvestigation depuis CLOSED -> IllegalStateException")
    void addInvestigation_fromClosed_throws() {
        OverexposureCase c = caseOf(123L, CaseStatus.CLOSED);
        when(repository.findById(123L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.addInvestigation(123L, "x", "y", 42L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("INVESTIGATE only allowed");
        verify(repository, never()).save(any());
    }

    // ------- closeCase --------------------------------------------------------

    @Test
    @DisplayName("closeCase depuis INVESTIGATING : status=CLOSED, closedAt set, audit CLOSE_OVEREXPOSURE")
    void closeCase_fromInvestigating_ok() {
        OverexposureCase c = caseOf(123L, CaseStatus.INVESTIGATING);
        when(repository.findById(123L)).thenReturn(Optional.of(c));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.closeCase(123L, true, 42L, "Cloture suite enquete");

        assertThat(c.getStatus()).isEqualTo(CaseStatus.CLOSED);
        assertThat(c.getClosedAt()).isNotNull();
        assertThat(c.isAuthorityDeclaration()).isTrue();
        assertThat(c.getAuthorityDeclarationDate()).isNotNull();

        ArgumentCaptor<DosimetryAuditLog> logCaptor = ArgumentCaptor.forClass(DosimetryAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getAction()).isEqualTo("CLOSE_OVEREXPOSURE");
        assertThat(logCaptor.getValue().getDetails()).contains("authorityDeclaration");
    }

    @Test
    @DisplayName("closeCase depuis OPEN : transition autorisee (raccourci si pas d'investigation)")
    void closeCase_fromOpen_ok() {
        OverexposureCase c = caseOf(123L, CaseStatus.OPEN);
        when(repository.findById(123L)).thenReturn(Optional.of(c));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.closeCase(123L, false, 42L, null);
        assertThat(c.getStatus()).isEqualTo(CaseStatus.CLOSED);
        assertThat(c.isAuthorityDeclaration()).isFalse();
    }

    @Test
    @DisplayName("closeCase depuis CLOSED -> IllegalStateException (idempotence)")
    void closeCase_fromClosed_throws() {
        OverexposureCase c = caseOf(123L, CaseStatus.CLOSED);
        when(repository.findById(123L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.closeCase(123L, true, 42L, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CLOSE only allowed");
        verify(repository, never()).save(any());
    }
}
