package com.minexpert.hns.api.emergency.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
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

import com.minexpert.hns.api.emergency.dto.SosAlertDTO;
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
            hrmsClient
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

