package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.dto.MonitoringCampaignDTO;
import com.minexpert.hns.dosimetry.entity.MeasurementPoint;
import com.minexpert.hns.dosimetry.entity.MonitoringCampaign;
import com.minexpert.hns.dosimetry.enums.CampaignStatus;
import com.minexpert.hns.dosimetry.enums.ZoneClass;
import com.minexpert.hns.dosimetry.repository.AmbientMeasurementRepository;
import com.minexpert.hns.dosimetry.repository.MeasurementPointRepository;
import com.minexpert.hns.dosimetry.repository.MonitoringCampaignRepository;

/**
 * Tests unitaires du service MonitoringCampaign (Phase 6).
 *
 * <p>Couvre les transitions de statut autorisees / interdites :
 * <pre>
 *   DRAFT     -&gt; ONGOING   (OK)
 *   DRAFT     -&gt; CANCELLED (OK)
 *   ONGOING   -&gt; COMPLETED (OK)
 *   ONGOING   -&gt; CANCELLED (OK)
 *   DRAFT     -&gt; COMPLETED (KO)
 *   COMPLETED -&gt; *         (KO)
 *   CANCELLED -&gt; *         (KO)
 * </pre>
 */
@ExtendWith(MockitoExtension.class)
class MonitoringCampaignServiceTest {

    @Mock
    private MonitoringCampaignRepository repository;

    @Mock
    private MeasurementPointRepository pointRepository;

    @Mock
    private AmbientMeasurementRepository measurementRepository;

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private MonitoringCampaignServiceImpl service;

    private MonitoringCampaign buildCampaign(CampaignStatus status) {
        return MonitoringCampaign.builder()
                .id(10L)
                .mineId(1L)
                .code("CAMP-TEST")
                .label("Campagne test")
                .startDate(LocalDate.now().minusDays(10))
                .status(status)
                .measurementPointIds(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("createCampaign persists DRAFT by default and audits")
    void createCampaignNominal() {
        MonitoringCampaignDTO dto = MonitoringCampaignDTO.builder()
                .mineId(1L)
                .code("C1")
                .label("L")
                .startDate(LocalDate.now())
                .build();
        when(repository.existsByMineIdAndCode(1L, "C1")).thenReturn(false);
        when(repository.save(any(MonitoringCampaign.class))).thenAnswer(inv -> {
            MonitoringCampaign c = inv.getArgument(0);
            c.setId(77L);
            return c;
        });

        Long id = service.createCampaign(dto, 3L);

        assertThat(id).isEqualTo(77L);
        verify(repository).save(any(MonitoringCampaign.class));
        verify(auditService).log(eq("CREATE"), eq("MonitoringCampaign"), eq(77L), eq(3L),
                anyString(), anyString());
    }

    @Test
    @DisplayName("createCampaign rejects duplicate code per mine")
    void createCampaignDuplicate() {
        MonitoringCampaignDTO dto = MonitoringCampaignDTO.builder()
                .mineId(1L).code("C1").label("L").startDate(LocalDate.now()).build();
        when(repository.existsByMineIdAndCode(1L, "C1")).thenReturn(true);

        assertThatThrownBy(() -> service.createCampaign(dto, 3L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already used");
    }

    @Test
    @DisplayName("startCampaign : DRAFT -> ONGOING is allowed")
    void startFromDraftAllowed() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.DRAFT);
        when(repository.findById(10L)).thenReturn(Optional.of(c));

        service.startCampaign(10L, 4L);

        assertThat(c.getStatus()).isEqualTo(CampaignStatus.ONGOING);
        verify(repository).save(c);
    }

    @Test
    @DisplayName("startCampaign : ONGOING -> ONGOING is rejected")
    void startFromOngoingRejected() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.ONGOING);
        when(repository.findById(10L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.startCampaign(10L, 4L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Invalid campaign status transition");
    }

    @Test
    @DisplayName("startCampaign : COMPLETED -> ONGOING is rejected (terminal state)")
    void startFromCompletedRejected() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.COMPLETED);
        when(repository.findById(10L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.startCampaign(10L, 4L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Invalid campaign status transition");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("startCampaign : CANCELLED -> ONGOING is rejected (terminal state)")
    void startFromCancelledRejected() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.CANCELLED);
        when(repository.findById(10L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.startCampaign(10L, 4L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Invalid campaign status transition");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("completeCampaign : ONGOING -> COMPLETED is allowed and sets completedAt/by")
    void completeFromOngoingAllowed() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.ONGOING);
        when(repository.findById(10L)).thenReturn(Optional.of(c));

        service.completeCampaign(10L, 4L);

        assertThat(c.getStatus()).isEqualTo(CampaignStatus.COMPLETED);
        assertThat(c.getCompletedAt()).isNotNull();
        assertThat(c.getCompletedBy()).isEqualTo(4L);
        verify(repository).save(c);
    }

    @Test
    @DisplayName("completeCampaign : DRAFT -> COMPLETED is rejected")
    void completeFromDraftRejected() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.DRAFT);
        when(repository.findById(10L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.completeCampaign(10L, 4L))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("cancelCampaign allowed from DRAFT or ONGOING, rejected from COMPLETED")
    void cancelTransitions() {
        MonitoringCampaign draft = buildCampaign(CampaignStatus.DRAFT);
        when(repository.findById(10L)).thenReturn(Optional.of(draft));
        service.cancelCampaign(10L, 4L);
        assertThat(draft.getStatus()).isEqualTo(CampaignStatus.CANCELLED);

        MonitoringCampaign ongoing = buildCampaign(CampaignStatus.ONGOING);
        ongoing.setId(11L);
        when(repository.findById(11L)).thenReturn(Optional.of(ongoing));
        service.cancelCampaign(11L, 4L);
        assertThat(ongoing.getStatus()).isEqualTo(CampaignStatus.CANCELLED);

        MonitoringCampaign completed = buildCampaign(CampaignStatus.COMPLETED);
        completed.setId(12L);
        when(repository.findById(12L)).thenReturn(Optional.of(completed));
        assertThatThrownBy(() -> service.cancelCampaign(12L, 4L))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("addMeasurementPoint adds point id when both mine match (DRAFT phase only)")
    void addPointSameMine() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.DRAFT);
        when(repository.findById(10L)).thenReturn(Optional.of(c));
        MeasurementPoint p = MeasurementPoint.builder()
                .id(50L).mineId(1L).code("MP").label("L")
                .zoneClassification(ZoneClass.SURVEILLED)
                .active(true).build();
        when(pointRepository.findById(50L)).thenReturn(Optional.of(p));

        service.addMeasurementPoint(10L, 50L, 4L);

        assertThat(c.getMeasurementPointIds()).containsExactly(50L);
        verify(repository).save(c);
    }

    @Test
    @DisplayName("addMeasurementPoint rejects cross-mine point")
    void addPointCrossMineRejected() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.DRAFT);
        when(repository.findById(10L)).thenReturn(Optional.of(c));
        MeasurementPoint p = MeasurementPoint.builder()
                .id(50L).mineId(2L).code("MP").label("L")
                .zoneClassification(ZoneClass.SURVEILLED)
                .active(true).build();
        when(pointRepository.findById(50L)).thenReturn(Optional.of(p));

        assertThatThrownBy(() -> service.addMeasurementPoint(10L, 50L, 4L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mine mismatch");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("addMeasurementPoint forbidden on ONGOING campaign (perimeter locked after DRAFT)")
    void addPointOngoingRejected() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.ONGOING);
        when(repository.findById(10L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.addMeasurementPoint(10L, 50L, 4L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot modify campaign perimeter");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("addMeasurementPoint forbidden on COMPLETED campaign")
    void addPointCompletedRejected() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.COMPLETED);
        when(repository.findById(10L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.addMeasurementPoint(10L, 50L, 4L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot modify campaign perimeter");
    }

    @Test
    @DisplayName("addMeasurementPoint forbidden on CANCELLED campaign")
    void addPointCancelledRejected() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.CANCELLED);
        when(repository.findById(10L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.addMeasurementPoint(10L, 50L, 4L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot modify campaign perimeter");
    }

    @Test
    @DisplayName("generateReport returns textual summary with key fields")
    void generateReportSummary() {
        MonitoringCampaign c = buildCampaign(CampaignStatus.ONGOING);
        c.getMeasurementPointIds().addAll(List.of(1L, 2L));
        c.setObjective("Surveillance trim");
        c.setProtocol("Protocole P");
        when(repository.findById(10L)).thenReturn(Optional.of(c));
        when(measurementRepository.findByCampaignIdOrderByMeasuredAtDesc(10L))
                .thenReturn(List.of());

        String report = service.generateReport(10L);

        assertThat(report).contains("Campaign Report");
        assertThat(report).contains("CAMP-TEST");
        assertThat(report).contains("ONGOING");
        assertThat(report).contains("Points covered: 2");
        assertThat(report).contains("Measurements collected: 0");
    }
}
