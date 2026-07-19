package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;

import java.util.Optional;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.dto.ThresholdDTO;
import com.minexpert.hns.dosimetry.entity.Threshold;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ThresholdRepository;

@ExtendWith(MockitoExtension.class)
class ThresholdServiceImplTest {

    @Mock private ThresholdRepository repository;
    @Mock private DosimetryAuditLogRepository auditLogRepository;

    private ThresholdServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ThresholdServiceImpl(repository, auditLogRepository);
    }

    @Test
    void apiRejectsWorkerBSixAsRegulatoryLimit() {
        ThresholdDTO dto = baseDto("WORKER_B");
        dto.setClassificationThreshold(6.0);
        dto.setRegulatoryLimit(6.0);

        assertThatThrownBy(() -> service.create(1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("classification threshold");
    }

    @Test
    void dtoExposesWorkerBSixOnlyAsClassificationThreshold() {
        Threshold migrated = Threshold.builder()
                .id(11L).grandeur(ThresholdGrandeur.HP10).personCategory("WORKER_B")
                .classificationThreshold(6.0).regulatoryLimit(null)
                .unit("mSv").referenceFramework("AIEA_GSR_PART3").active(true).build();
        when(repository.findByIdAndMineId(11L, 7L)).thenReturn(Optional.of(migrated));

        ThresholdDTO dto = service.getById(7L, 11L);

        assertThat(dto.getClassificationThreshold()).isEqualTo(6.0);
        assertThat(dto.getRegulatoryLimit()).isNull();
    }

    @Test
    void apprenticeSixRemainsAcceptedAsRegulatoryLimit() {
        ThresholdDTO dto = baseDto("APPRENTICE");
        dto.setRegulatoryLimit(6.0);
        when(repository.save(org.mockito.ArgumentMatchers.any(Threshold.class)))
                .thenAnswer(invocation -> {
                    Threshold saved = invocation.getArgument(0);
                    saved.setId(12L);
                    return saved;
                });

        assertThat(service.create(1L, dto)).isEqualTo(12L);
    }

    @Test
    void createForcesAuthenticatedCompanyInsteadOfPayloadMine() {
        ThresholdDTO dto = baseDto("WORKER_A");
        dto.setMineId(999L);
        when(repository.save(org.mockito.ArgumentMatchers.any(Threshold.class)))
                .thenAnswer(invocation -> {
                    Threshold saved = invocation.getArgument(0);
                    saved.setId(21L);
                    return saved;
                });

        service.create(7L, dto);

        ArgumentCaptor<Threshold> captor = ArgumentCaptor.forClass(Threshold.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getMineId()).isEqualTo(7L);
    }

    @Test
    void listNeverUsesUnboundedFindAll() {
        when(repository.findByMineId(7L)).thenReturn(List.of());

        assertThat(service.getAll(7L)).isEmpty();

        verify(repository).findByMineId(7L);
        verify(repository, never()).findAll();
    }

    @Test
    void getByIdIsBoundToMine() {
        when(repository.findByIdAndMineId(21L, 7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(7L, 21L))
                .isInstanceOf(jakarta.persistence.EntityNotFoundException.class);

        verify(repository).findByIdAndMineId(21L, 7L);
        verify(repository, never()).findById(21L);
    }

    private ThresholdDTO baseDto(String category) {
        ThresholdDTO dto = new ThresholdDTO();
        dto.setGrandeur(ThresholdGrandeur.HP10);
        dto.setPersonCategory(category);
        dto.setUnit("mSv");
        dto.setReferenceFramework("LOCAL_VALIDATION");
        dto.setActive(true);
        return dto;
    }
}
