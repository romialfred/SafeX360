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

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.dto.AmbientMeasurementDTO;
import com.minexpert.hns.dosimetry.dto.AmbientMeasurementStatsDTO;
import com.minexpert.hns.dosimetry.entity.AmbientMeasurement;
import com.minexpert.hns.dosimetry.entity.MeasurementPoint;
import com.minexpert.hns.dosimetry.enums.MeasurementContext;
import com.minexpert.hns.dosimetry.enums.ZoneClass;
import com.minexpert.hns.dosimetry.repository.AmbientMeasurementRepository;
import com.minexpert.hns.dosimetry.repository.MeasurementPointRepository;

/**
 * Tests unitaires du service AmbientMeasurement (Phase 6).
 *
 * <p>Couvre :
 * <ul>
 *   <li>record nominal sur point actif -> persiste + audit + trend null si pas d'antecedent</li>
 *   <li>record sur point inactif -> IllegalStateException</li>
 *   <li>record avec mineId incoherent -> IllegalArgumentException</li>
 *   <li>aboveReferenceLevel = true quand value > refLevel</li>
 *   <li>trendVsPrevious calcule en % vs mesure immediatement precedente</li>
 *   <li>getStatsByPoint : min/max/avg/median/overReferenceCount corrects</li>
 *   <li>append-only : entite AmbientMeasurement n'expose aucun setter "value" public... (compile-check assure par updatable=false dans entite)</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class AmbientMeasurementServiceTest {

    @Mock
    private AmbientMeasurementRepository repository;

    @Mock
    private MeasurementPointRepository pointRepository;

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private AmbientMeasurementServiceImpl service;

    private MeasurementPoint activePoint;

    @BeforeEach
    void setUp() {
        activePoint = MeasurementPoint.builder()
                .id(100L)
                .mineId(1L)
                .code("MP-001")
                .label("Point")
                .zoneClassification(ZoneClass.CONTROLLED)
                .referenceLevel(new BigDecimal("1.0"))
                .active(true)
                .build();
    }

    private AmbientMeasurementDTO dto(BigDecimal value) {
        return AmbientMeasurementDTO.builder()
                .mineId(1L)
                .measurementPointId(100L)
                .measuredAt(LocalDateTime.now())
                .measuredBy(7L)
                .value(value)
                .context(MeasurementContext.ROUTINE)
                .build();
    }

    @Test
    @DisplayName("recordMeasurement persists and audits on active point")
    void recordPersistsAndAudits() {
        when(pointRepository.findById(100L)).thenReturn(Optional.of(activePoint));
        when(repository.save(any(AmbientMeasurement.class))).thenAnswer(inv -> {
            AmbientMeasurement m = inv.getArgument(0);
            m.setId(999L);
            return m;
        });
        when(repository.findLatestByPoint(eq(100L), any())).thenReturn(List.of());

        AmbientMeasurementDTO result = service.recordMeasurement(dto(new BigDecimal("0.5")));

        assertThat(result.getId()).isEqualTo(999L);
        assertThat(result.getMineId()).isEqualTo(1L);
        assertThat(result.getAboveReferenceLevel()).isFalse();
        assertThat(result.getTrendVsPrevious()).isNull();
        verify(repository).save(any(AmbientMeasurement.class));
        verify(auditService).log(eq("CREATE"), eq("AmbientMeasurement"), eq(999L), eq(7L),
                anyString(), anyString());
    }

    @Test
    @DisplayName("recordMeasurement rejects inactive point")
    void recordRejectsInactive() {
        activePoint.setActive(false);
        when(pointRepository.findById(100L)).thenReturn(Optional.of(activePoint));

        assertThatThrownBy(() -> service.recordMeasurement(dto(new BigDecimal("0.5"))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("inactive");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("recordMeasurement rejects mineId mismatch")
    void recordRejectsMineMismatch() {
        when(pointRepository.findById(100L)).thenReturn(Optional.of(activePoint));
        AmbientMeasurementDTO dto = dto(new BigDecimal("0.5"));
        dto.setMineId(2L); // mismatch (point is mine=1)

        assertThatThrownBy(() -> service.recordMeasurement(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mineId mismatch");
    }

    @Test
    @DisplayName("aboveReferenceLevel is true when value exceeds referenceLevel")
    void aboveReferenceTrue() {
        when(pointRepository.findById(100L)).thenReturn(Optional.of(activePoint));
        when(repository.save(any(AmbientMeasurement.class))).thenAnswer(inv -> {
            AmbientMeasurement m = inv.getArgument(0);
            m.setId(1L);
            return m;
        });
        when(repository.findLatestByPoint(eq(100L), any())).thenReturn(List.of());

        // refLevel = 1.0, value = 2.5
        AmbientMeasurementDTO result = service.recordMeasurement(dto(new BigDecimal("2.5")));

        assertThat(result.getAboveReferenceLevel()).isTrue();
    }

    @Test
    @DisplayName("trendVsPrevious computed in percent vs previous measurement on same point")
    void trendVsPreviousComputed() {
        when(pointRepository.findById(100L)).thenReturn(Optional.of(activePoint));

        AmbientMeasurement previous = AmbientMeasurement.builder()
                .id(500L)
                .mineId(1L)
                .measurementPointId(100L)
                .measuredAt(LocalDateTime.now().minusHours(1))
                .value(new BigDecimal("1.0"))
                .context(MeasurementContext.ROUTINE)
                .build();
        AmbientMeasurement current = AmbientMeasurement.builder()
                .id(501L)
                .mineId(1L)
                .measurementPointId(100L)
                .measuredAt(LocalDateTime.now())
                .value(new BigDecimal("1.5"))
                .context(MeasurementContext.ROUTINE)
                .build();

        when(repository.save(any(AmbientMeasurement.class))).thenReturn(current);
        // findLatestByPoint returns current first, previous second (DESC order)
        when(repository.findLatestByPoint(eq(100L), any())).thenReturn(List.of(current, previous));

        AmbientMeasurementDTO result = service.recordMeasurement(dto(new BigDecimal("1.5")));

        // (1.5 - 1.0) / 1.0 * 100 = 50.0000 %
        assertThat(result.getTrendVsPrevious()).isEqualByComparingTo(new BigDecimal("50.0000"));
    }

    @Test
    @DisplayName("getStatsByPoint computes min/max/avg/median/overReferenceCount")
    void statsByPoint() {
        when(pointRepository.findById(100L)).thenReturn(Optional.of(activePoint));
        // refLevel = 1.0
        AmbientMeasurement m1 = AmbientMeasurement.builder()
                .value(new BigDecimal("0.4")).measuredAt(LocalDateTime.now()).build();
        AmbientMeasurement m2 = AmbientMeasurement.builder()
                .value(new BigDecimal("1.5")).measuredAt(LocalDateTime.now()).build();
        AmbientMeasurement m3 = AmbientMeasurement.builder()
                .value(new BigDecimal("2.0")).measuredAt(LocalDateTime.now()).build();
        AmbientMeasurement m4 = AmbientMeasurement.builder()
                .value(new BigDecimal("0.8")).measuredAt(LocalDateTime.now()).build();
        when(repository.findByPointAndRange(eq(100L), any(), any()))
                .thenReturn(List.of(m1, m2, m3, m4));

        AmbientMeasurementStatsDTO stats = service.getStatsByPoint(100L, null, null);

        assertThat(stats.getCount()).isEqualTo(4);
        assertThat(stats.getMin()).isEqualByComparingTo(new BigDecimal("0.4"));
        assertThat(stats.getMax()).isEqualByComparingTo(new BigDecimal("2.0"));
        // avg = (0.4+1.5+2.0+0.8)/4 = 1.175
        assertThat(stats.getAvg()).isEqualByComparingTo(new BigDecimal("1.1750"));
        // sorted = 0.4, 0.8, 1.5, 2.0 -> median = (0.8+1.5)/2 = 1.15
        assertThat(stats.getMedian()).isEqualByComparingTo(new BigDecimal("1.1500"));
        // > 1.0 -> {1.5, 2.0} -> 2
        assertThat(stats.getOverReferenceCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("AmbientMeasurement entity is APPEND-ONLY (value/measuredAt updatable=false)")
    void appendOnlyEnforced() throws NoSuchFieldException {
        Field valueField = AmbientMeasurement.class.getDeclaredField("value");
        jakarta.persistence.Column col = valueField.getAnnotation(jakarta.persistence.Column.class);
        assertThat(col).as("value @Column annotation").isNotNull();
        assertThat(col.updatable()).as("value updatable").isFalse();

        Field measuredAtField = AmbientMeasurement.class.getDeclaredField("measuredAt");
        jakarta.persistence.Column col2 = measuredAtField
                .getAnnotation(jakarta.persistence.Column.class);
        assertThat(col2).as("measuredAt @Column annotation").isNotNull();
        assertThat(col2.updatable()).as("measuredAt updatable").isFalse();
    }
}
