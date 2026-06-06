package com.minexpert.hns.api.emergency.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.api.emergency.entity.EmergencyAuditLog;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.repository.EmergencyAuditLogRepository;

/**
 * Tests smoke du {@link EmergencyAuditService} (LOT 48 Phase 1.b).
 *
 * <p>Recommandation P1 de l'Application Quality Officer Phase 1.a : démontrer
 * que le journal d'audit ne casse jamais une transaction métier, même en cas
 * d'échec côté repository.</p>
 */
@ExtendWith(MockitoExtension.class)
class EmergencyAuditServiceTest {

    @Mock
    private EmergencyAuditLogRepository repository;

    @InjectMocks
    private EmergencyAuditService service;

    @BeforeEach
    void setUp() {
        // Configuration commune éventuelle
    }

    @Test
    @DisplayName("log() écrit une entrée valide via le repository")
    void log_writesEntry_whenAllFieldsProvided() {
        // Arrange
        when(repository.save(any(EmergencyAuditLog.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        service.log(
            EmergencyAuditEventType.SETTINGS_UPDATED,
            42L,                  // actorId
            1L,                   // companyId
            "EmergencySettings",  // entityType
            7L,                   // entityId
            "{\"k\":\"v\"}",      // payload
            "10.0.0.1",
            "JUnit"
        );

        // Assert : une seule écriture déclenchée
        verify(repository, times(1)).save(any(EmergencyAuditLog.class));
    }

    @Test
    @DisplayName("log() ne propage AUCUNE exception même si le repo crash (criticité)")
    void log_swallowsExceptions_whenRepoFails() {
        // Arrange — simule une panne DB
        doThrow(new RuntimeException("DB down"))
            .when(repository).save(any(EmergencyAuditLog.class));

        // Act + Assert — le service ne doit jamais propager : la criticité
        // demande qu'un échec d'audit ne casse pas la transaction métier.
        assertThatCode(() ->
            service.log(EmergencyAuditEventType.SOS_RECEIVED, 1L, 1L)
        ).doesNotThrowAnyException();

        verify(repository, times(1)).save(any(EmergencyAuditLog.class));
    }

    @Test
    @DisplayName("log() court ne crash pas même si tous les paramètres optionnels sont null")
    void log_handlesNullsGracefully() {
        // Arrange
        when(repository.save(any(EmergencyAuditLog.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        assertThatCode(() ->
            service.log(EmergencyAuditEventType.PERMISSION_GRANTED, null, null)
        ).doesNotThrowAnyException();

        verify(repository, times(1)).save(any(EmergencyAuditLog.class));
    }
}
