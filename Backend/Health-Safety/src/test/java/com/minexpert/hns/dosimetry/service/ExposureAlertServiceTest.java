package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.enums.AlertStatus;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.ExposureAlertRepository;

import jakarta.persistence.EntityNotFoundException;

/**
 * Tests unitaires du workflow ACK/RESOLVE des alertes d'exposition (Phase 5).
 *
 * <p>Couvre :
 * <ul>
 *   <li>acknowledge nominal (ACTIVE -> ACK) + audit ACK_ALERT</li>
 *   <li>transition invalide (ACK depuis ACK -> IllegalStateException)</li>
 *   <li>idempotence : double-ACK leve une erreur (pas d'ecrasement silencieux)</li>
 *   <li>resolve depuis ACTIVE et depuis ACK + transition invalide depuis RESOLVED</li>
 *   <li>EntityNotFoundException si id inconnu</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class ExposureAlertServiceTest {

    @Mock
    private ExposureAlertRepository repository;

    @Mock
    private DosimetryAuditLogRepository auditLogRepository;

    @Mock
    private ExposedWorkerRepository workerRepository;

    @InjectMocks
    private ExposureAlertServiceImpl service;

    private ExposureAlert activeAlert(Long id) {
        return ExposureAlert.builder()
                .id(id)
                .workerId(7L)
                .grandeur(ThresholdGrandeur.HP10)
                .level(AlertLevel.ACTION)
                .value(15.0)
                .thresholdId(1L)
                .status(AlertStatus.ACTIVE)
                .build();
    }

    // ------- acknowledge ------------------------------------------------------

    @Test
    @DisplayName("acknowledge nominal : ACTIVE -> ACK + champs renseignes + audit ACK_ALERT")
    void acknowledge_nominal_ackTransition() {
        ExposureAlert alert = activeAlert(42L);
        when(repository.findById(42L)).thenReturn(Optional.of(alert));
        when(repository.save(any(ExposureAlert.class))).thenAnswer(inv -> inv.getArgument(0));

        service.acknowledge(42L, 99L, "Pris en compte par PCR");

        ArgumentCaptor<ExposureAlert> captor = ArgumentCaptor.forClass(ExposureAlert.class);
        verify(repository).save(captor.capture());
        ExposureAlert saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(AlertStatus.ACK);
        assertThat(saved.getAcknowledgedBy()).isEqualTo(99L);
        assertThat(saved.getAcknowledgedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();

        // Audit log = ACK_ALERT, entityType = ExposureAlert.
        ArgumentCaptor<DosimetryAuditLog> logCaptor = ArgumentCaptor.forClass(DosimetryAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getAction()).isEqualTo("ACK_ALERT");
        assertThat(logCaptor.getValue().getEntityType()).isEqualTo("ExposureAlert");
        assertThat(logCaptor.getValue().getEntityId()).isEqualTo(42L);
        assertThat(logCaptor.getValue().getUserId()).isEqualTo(99L);
    }

    @Test
    @DisplayName("acknowledge transition INVALID : depuis ACK -> IllegalStateException")
    void acknowledge_fromAck_throws() {
        ExposureAlert alert = activeAlert(42L);
        alert.setStatus(AlertStatus.ACK);
        when(repository.findById(42L)).thenReturn(Optional.of(alert));

        assertThatThrownBy(() -> service.acknowledge(42L, 99L, "double ack"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ACK only allowed from ACTIVE");
        verify(repository, never()).save(any());
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("acknowledge transition INVALID : depuis RESOLVED -> IllegalStateException")
    void acknowledge_fromResolved_throws() {
        ExposureAlert alert = activeAlert(42L);
        alert.setStatus(AlertStatus.RESOLVED);
        when(repository.findById(42L)).thenReturn(Optional.of(alert));

        assertThatThrownBy(() -> service.acknowledge(42L, 99L, null))
                .isInstanceOf(IllegalStateException.class);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("acknowledge idempotence : double-ACK simule par 2 transitions echoue la 2eme fois")
    void acknowledge_doubleCall_secondFails() {
        ExposureAlert alert = activeAlert(42L);
        when(repository.findById(42L)).thenReturn(Optional.of(alert));
        when(repository.save(any(ExposureAlert.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1er appel : OK -> alert passe en ACK
        service.acknowledge(42L, 99L, null);
        assertThat(alert.getStatus()).isEqualTo(AlertStatus.ACK);

        // 2e appel : meme entite trouvee, deja ACK -> IllegalStateException.
        assertThatThrownBy(() -> service.acknowledge(42L, 99L, null))
                .isInstanceOf(IllegalStateException.class);

        // 1 seul save effectif (le 1er) : pas d'ecrasement silencieux.
        verify(repository, times(1)).save(any(ExposureAlert.class));
    }

    @Test
    @DisplayName("acknowledge id inconnu -> EntityNotFoundException")
    void acknowledge_unknownId_throws() {
        when(repository.findById(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.acknowledge(404L, 99L, null))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ------- resolve ----------------------------------------------------------

    @Test
    @DisplayName("resolve depuis ACTIVE : transition autorisee -> RESOLVED + audit RESOLVE_ALERT")
    void resolve_fromActive_ok() {
        ExposureAlert alert = activeAlert(7L);
        when(repository.findById(7L)).thenReturn(Optional.of(alert));
        when(repository.save(any(ExposureAlert.class))).thenAnswer(inv -> inv.getArgument(0));

        service.resolve(7L, 99L, "Faux positif (capteur HS)");

        assertThat(alert.getStatus()).isEqualTo(AlertStatus.RESOLVED);
        ArgumentCaptor<DosimetryAuditLog> logCaptor = ArgumentCaptor.forClass(DosimetryAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getAction()).isEqualTo("RESOLVE_ALERT");
        assertThat(logCaptor.getValue().getDetails()).contains("Faux positif");
    }

    @Test
    @DisplayName("resolve depuis ACK : transition autorisee")
    void resolve_fromAck_ok() {
        ExposureAlert alert = activeAlert(7L);
        alert.setStatus(AlertStatus.ACK);
        when(repository.findById(7L)).thenReturn(Optional.of(alert));
        when(repository.save(any(ExposureAlert.class))).thenAnswer(inv -> inv.getArgument(0));

        service.resolve(7L, 99L, null);
        assertThat(alert.getStatus()).isEqualTo(AlertStatus.RESOLVED);
    }

    @Test
    @DisplayName("resolve transition INVALID : depuis RESOLVED -> IllegalStateException")
    void resolve_fromResolved_throws() {
        ExposureAlert alert = activeAlert(7L);
        alert.setStatus(AlertStatus.RESOLVED);
        when(repository.findById(7L)).thenReturn(Optional.of(alert));

        assertThatThrownBy(() -> service.resolve(7L, 99L, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("RESOLVE only allowed from ACTIVE or ACK");
        verify(repository, never()).save(any());
    }

    // ------- delete (verifie qu'il reste interdit) ----------------------------

    @Test
    @DisplayName("delete : interdit (UnsupportedOperationException) -> doit utiliser ACK/RESOLVE")
    void delete_forbidden() {
        assertThatThrownBy(() -> service.delete(42L))
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessageContaining("acknowledge")
                .hasMessageContaining("resolve");
        verify(repository, never()).deleteById(eq(42L));
    }
}
