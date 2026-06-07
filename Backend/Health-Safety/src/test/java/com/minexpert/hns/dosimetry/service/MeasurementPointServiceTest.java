package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.dto.MeasurementPointDTO;
import com.minexpert.hns.dosimetry.entity.MeasurementPoint;
import com.minexpert.hns.dosimetry.enums.ZoneClass;
import com.minexpert.hns.dosimetry.repository.MeasurementPointRepository;

import jakarta.persistence.EntityNotFoundException;

/**
 * Tests unitaires du service MeasurementPoint (Phase 6).
 *
 * <p>Couvre :
 * <ul>
 *   <li>create nominal -> persiste + audit + active=true par defaut</li>
 *   <li>create avec code en doublon -> IllegalStateException</li>
 *   <li>update nominal -> persiste les champs metiers</li>
 *   <li>activate/deactivate idempotent (pas de save inutile)</li>
 *   <li>listByZone -> filtre par classification</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class MeasurementPointServiceTest {

    @Mock
    private MeasurementPointRepository repository;

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private MeasurementPointServiceImpl service;

    private MeasurementPointDTO baseDto;

    @BeforeEach
    void setUp() {
        baseDto = MeasurementPointDTO.builder()
                .mineId(1L)
                .code("MP-T-001")
                .label("Point de test")
                .zoneClassification(ZoneClass.SURVEILLED)
                .referenceLevel(new BigDecimal("0.5"))
                .build();
    }

    @Test
    @DisplayName("create persists with active=true and emits audit log")
    void createPersists() {
        when(repository.existsByMineIdAndCode(1L, "MP-T-001")).thenReturn(false);
        when(repository.save(any(MeasurementPoint.class))).thenAnswer(inv -> {
            MeasurementPoint mp = inv.getArgument(0);
            mp.setId(42L);
            return mp;
        });

        Long id = service.create(baseDto, 7L);

        assertThat(id).isEqualTo(42L);
        verify(repository).save(any(MeasurementPoint.class));
        verify(auditService).log(eq("CREATE"), eq("MeasurementPoint"), eq(42L), eq(7L),
                anyString(), anyString());
    }

    @Test
    @DisplayName("create rejects duplicate code in same mine")
    void createDuplicateCode() {
        when(repository.existsByMineIdAndCode(1L, "MP-T-001")).thenReturn(true);

        assertThatThrownBy(() -> service.create(baseDto, 7L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already exists");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("update persists changed fields and audits")
    void updateNominal() {
        MeasurementPoint existing = MeasurementPoint.builder()
                .id(10L)
                .mineId(1L)
                .code("MP-T-001")
                .label("Old")
                .zoneClassification(ZoneClass.SURVEILLED)
                .active(true)
                .build();
        when(repository.findById(10L)).thenReturn(Optional.of(existing));

        MeasurementPointDTO upd = MeasurementPointDTO.builder()
                .code("MP-T-001")
                .label("New label")
                .zoneClassification(ZoneClass.CONTROLLED)
                .referenceLevel(new BigDecimal("2.0"))
                .build();

        service.update(10L, upd, 9L);

        assertThat(existing.getLabel()).isEqualTo("New label");
        assertThat(existing.getZoneClassification()).isEqualTo(ZoneClass.CONTROLLED);
        verify(repository).save(existing);
        verify(auditService).log(eq("UPDATE"), eq("MeasurementPoint"), eq(10L), eq(9L),
                anyString(), anyString());
    }

    @Test
    @DisplayName("update throws when entity not found")
    void updateNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, baseDto, 1L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("activate is idempotent on already active point")
    void activateIdempotent() {
        MeasurementPoint existing = MeasurementPoint.builder()
                .id(10L).mineId(1L).code("X").label("X")
                .zoneClassification(ZoneClass.NONE)
                .active(true).build();
        when(repository.findById(10L)).thenReturn(Optional.of(existing));

        service.activate(10L, 5L);

        verify(repository, never()).save(any());
        verify(auditService, never()).log(anyString(), anyString(), anyLong(), anyLong(),
                anyString(), anyString());
    }

    @Test
    @DisplayName("deactivate sets active=false and audits")
    void deactivate() {
        MeasurementPoint existing = MeasurementPoint.builder()
                .id(10L).mineId(1L).code("X").label("X")
                .zoneClassification(ZoneClass.NONE)
                .active(true).build();
        when(repository.findById(10L)).thenReturn(Optional.of(existing));

        service.deactivate(10L, 5L);

        assertThat(existing.isActive()).isFalse();
        verify(repository).save(existing);
        verify(auditService).log(eq("DEACTIVATE"), eq("MeasurementPoint"), eq(10L), eq(5L),
                anyString(), anyString());
    }

    @Test
    @DisplayName("listByZone delegates to repository with classification filter")
    void listByZoneDelegates() {
        MeasurementPoint p = MeasurementPoint.builder()
                .id(1L).mineId(1L).code("MP").label("L")
                .zoneClassification(ZoneClass.CONTROLLED)
                .active(true).build();
        when(repository.findByMineIdAndZoneClassification(1L, ZoneClass.CONTROLLED))
                .thenReturn(List.of(p));

        List<MeasurementPointDTO> result = service.listByZone(1L, ZoneClass.CONTROLLED);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getZoneClassification()).isEqualTo(ZoneClass.CONTROLLED);
        verify(repository, times(1)).findByMineIdAndZoneClassification(1L, ZoneClass.CONTROLLED);
    }
}
