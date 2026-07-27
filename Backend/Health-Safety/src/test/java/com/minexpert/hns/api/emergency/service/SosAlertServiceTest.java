package com.minexpert.hns.api.emergency.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import org.springframework.security.access.AccessDeniedException;

import com.minexpert.hns.api.emergency.dto.SosAlertDTO;
import com.minexpert.hns.api.emergency.dto.SosTransitionRequest;
import com.minexpert.hns.api.emergency.entity.SosAlert;
import com.minexpert.hns.api.emergency.enums.SosStatus;
import com.minexpert.hns.api.emergency.repository.RescueTeamRepository;
import com.minexpert.hns.api.emergency.repository.SosAlertRepository;
import com.minexpert.hns.api.emergency.repository.SosLifecycleEventRepository;

@ExtendWith(MockitoExtension.class)
class SosAlertServiceTest {

    @Mock private SosAlertRepository alertRepo;
    @Mock private SosLifecycleEventRepository eventRepo;
    @Mock private RescueTeamRepository teamRepo;
    @Mock private EmergencyAuditService auditService;
    @Mock private SimpMessagingTemplate messaging;
    @Mock private EmergencyEmailService emergencyEmailService;
    @Mock private EmergencyPermissionService permissionService;
    @Mock private com.minexpert.hns.clients.HrmsClient hrmsClient;
    // [AUTHZ-02] Nouvelle dependance : garde de cloisonnement mine (mock no-op ici).
    @Mock private com.minexpert.hns.config.CompanyScopeGuard companyScopeGuard;

    private SosAlertService service;

    @BeforeEach
    void setUp() {
        service = new SosAlertService(
            alertRepo,
            eventRepo,
            teamRepo,
            auditService,
            messaging,
            emergencyEmailService,
            permissionService,
            hrmsClient,
            companyScopeGuard
        );
    }

    @Test
    void createReturnsExistingAlertForSameClientRequest() {
        SosAlert existing = alert(41L, "request-123", 7L, 9L);
        when(alertRepo.findByClientRequestId("request-123")).thenReturn(Optional.of(existing));

        SosAlertDTO result = service.create(dto("request-123", 7L, 9L), 9L);

        assertThat(result.getId()).isEqualTo(41L);
        assertThat(result.getClientRequestId()).isEqualTo("request-123");
        verify(alertRepo, never()).save(any());
        verify(eventRepo, never()).save(any());
    }

    @Test
    void createPersistsClientRequestIdOnFirstSubmission() {
        when(alertRepo.findByClientRequestId("request-456")).thenReturn(Optional.empty());
        when(alertRepo.save(any(SosAlert.class))).thenAnswer(invocation -> {
            SosAlert saved = invocation.getArgument(0);
            saved.setId(42L);
            saved.setTriggeredAt(LocalDateTime.now());
            return saved;
        });

        SosAlertDTO result = service.create(dto(" request-456 ", 7L, 9L), 9L);

        ArgumentCaptor<SosAlert> captor = ArgumentCaptor.forClass(SosAlert.class);
        verify(alertRepo).save(captor.capture());
        assertThat(captor.getValue().getClientRequestId()).isEqualTo("request-456");
        assertThat(result.getClientRequestId()).isEqualTo("request-456");
    }

    @Test
    void createRejectedWhenCompanyOutOfScope() {
        // [AUTHZ-02] La garde de cloisonnement refuse la mine hors perimetre :
        // aucune alerte ne doit etre persistee.
        doThrow(new AccessDeniedException("COMPANY_SCOPE_FORBIDDEN"))
            .when(companyScopeGuard).assertInScope(7L);

        assertThatThrownBy(() -> service.create(dto("request-789", 7L, 9L), 9L))
            .isInstanceOf(AccessDeniedException.class);

        verify(alertRepo, never()).save(any());
        verify(eventRepo, never()).save(any());
    }

    @Test
    void transitionRejectedWhenCompanyOutOfScope() {
        // [AUTHZ-02] Ferme le BOLA sur /{id}/{action} : une transition sur une alerte
        // hors perimetre est refusee avant toute mutation d'etat.
        SosAlert alert = alert(50L, "request-xyz", 7L, 9L);
        when(alertRepo.findById(50L)).thenReturn(Optional.of(alert));
        doThrow(new AccessDeniedException("COMPANY_SCOPE_FORBIDDEN"))
            .when(companyScopeGuard).assertInScope(7L);

        assertThatThrownBy(() -> service.acknowledge(50L, 9L, new SosTransitionRequest()))
            .isInstanceOf(AccessDeniedException.class);

        verify(alertRepo, never()).save(any());
        verify(eventRepo, never()).save(any());
    }

    private SosAlertDTO dto(String requestId, Long companyId, Long employeeId) {
        return SosAlertDTO.builder()
            .clientRequestId(requestId)
            .companyId(companyId)
            .employeeId(employeeId)
            .reasonCode("MEDICAL")
            .latitude(1.0)
            .longitude(2.0)
            .drillMode(false)
            .build();
    }

    private SosAlert alert(Long id, String requestId, Long companyId, Long employeeId) {
        SosAlert alert = new SosAlert();
        alert.setId(id);
        alert.setClientRequestId(requestId);
        alert.setCompanyId(companyId);
        alert.setEmployeeId(employeeId);
        alert.setReasonCode("MEDICAL");
        alert.setLatitude(1.0);
        alert.setLongitude(2.0);
        alert.setStatus(SosStatus.RECEIVED);
        alert.setDrillMode(false);
        alert.setTriggeredAt(LocalDateTime.now());
        return alert;
    }
}

