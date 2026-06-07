package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.dto.ExposureProfileLinkDTO;
import com.minexpert.hns.dosimetry.entity.ExposureProfileLink;
import com.minexpert.hns.dosimetry.entity.MeasurementPoint;
import com.minexpert.hns.dosimetry.enums.ZoneClass;
import com.minexpert.hns.dosimetry.repository.AmbientMeasurementRepository;
import com.minexpert.hns.dosimetry.repository.ExposureProfileLinkRepository;
import com.minexpert.hns.dosimetry.repository.MeasurementPointRepository;

/**
 * Tests unitaires de la regle metier centrale de {@link ExposureProfileLinkServiceImpl#setLinks} :
 * la somme des fractions des liens d'un profil d'exposition doit etre &lt;= 1.0.
 *
 * <p>Cas couverts :
 * <ul>
 *   <li>somme = 0   -> accepte (liste vide ou liens a 0)</li>
 *   <li>somme = 0.5 -> accepte</li>
 *   <li>somme = 1.0 -> accepte (limite inclusive)</li>
 *   <li>somme = 1.0001 -> rejete (IllegalArgumentException)</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class ExposureProfileLinkServiceImplTest {

    @Mock
    private ExposureProfileLinkRepository repository;

    @Mock
    private MeasurementPointRepository pointRepository;

    @Mock
    private AmbientMeasurementRepository measurementRepository;

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private ExposureProfileLinkServiceImpl service;

    private MeasurementPoint buildPoint(Long id) {
        return MeasurementPoint.builder()
                .id(id)
                .mineId(1L)
                .code("MP-" + id)
                .label("Point " + id)
                .zoneClassification(ZoneClass.SURVEILLED)
                .active(true)
                .build();
    }

    private ExposureProfileLinkDTO buildLink(Long pointId, String fraction) {
        return ExposureProfileLinkDTO.builder()
                .exposureProfileId(7L)
                .measurementPointId(pointId)
                .fraction(new BigDecimal(fraction))
                .build();
    }

    @Test
    @DisplayName("setLinks : somme=0 (liste vide) est acceptee, supprime les liens existants")
    void sumZeroEmptyAccepted() {
        assertThatCode(() -> service.setLinks(7L, Collections.emptyList(), 3L))
                .doesNotThrowAnyException();
        verify(repository).deleteByExposureProfileId(7L);
        verify(repository, never()).save(any(ExposureProfileLink.class));
        verify(auditService).log(eq("SET_LINKS"), eq("ExposureProfileLink"), eq(7L), eq(3L),
                anyString(), anyString());
    }

    @Test
    @DisplayName("setLinks : somme=0.5 est acceptee")
    void sumHalfAccepted() {
        List<ExposureProfileLinkDTO> links = new ArrayList<>(List.of(
                buildLink(100L, "0.3"),
                buildLink(101L, "0.2")
        ));
        when(pointRepository.findById(100L)).thenReturn(Optional.of(buildPoint(100L)));
        when(pointRepository.findById(101L)).thenReturn(Optional.of(buildPoint(101L)));
        when(measurementRepository.findByMeasurementPointIdOrderByMeasuredAtDesc(anyLong()))
                .thenReturn(List.of());

        assertThatCode(() -> service.setLinks(7L, links, 3L))
                .doesNotThrowAnyException();

        verify(repository, atLeastOnce()).save(any(ExposureProfileLink.class));
    }

    @Test
    @DisplayName("setLinks : somme=1.0 est acceptee (limite inclusive)")
    void sumOneInclusiveAccepted() {
        List<ExposureProfileLinkDTO> links = new ArrayList<>(List.of(
                buildLink(100L, "0.4"),
                buildLink(101L, "0.6")
        ));
        when(pointRepository.findById(100L)).thenReturn(Optional.of(buildPoint(100L)));
        when(pointRepository.findById(101L)).thenReturn(Optional.of(buildPoint(101L)));
        when(measurementRepository.findByMeasurementPointIdOrderByMeasuredAtDesc(anyLong()))
                .thenReturn(List.of());

        assertThatCode(() -> service.setLinks(7L, links, 3L))
                .doesNotThrowAnyException();

        verify(repository, atLeastOnce()).save(any(ExposureProfileLink.class));
    }

    @Test
    @DisplayName("setLinks : somme=1.0001 est rejetee -> IllegalArgumentException")
    void sumExceedsOneRejected() {
        List<ExposureProfileLinkDTO> links = new ArrayList<>(List.of(
                buildLink(100L, "0.5001"),
                buildLink(101L, "0.5000")
        ));

        assertThatThrownBy(() -> service.setLinks(7L, links, 3L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Sum of fractions must be <= 1.0");

        // Aucune ecriture en base ne doit avoir lieu
        verify(repository, never()).deleteByExposureProfileId(anyLong());
        verify(repository, never()).save(any(ExposureProfileLink.class));
    }

    @Test
    @DisplayName("setLinks : fraction null sur un lien -> IllegalArgumentException")
    void fractionNullRejected() {
        List<ExposureProfileLinkDTO> links = new ArrayList<>(List.of(
                ExposureProfileLinkDTO.builder()
                        .exposureProfileId(7L)
                        .measurementPointId(100L)
                        .fraction(null)
                        .build()
        ));

        assertThatThrownBy(() -> service.setLinks(7L, links, 3L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fraction is required");
    }

    @Test
    @DisplayName("setLinks : fraction hors [0,1] -> IllegalArgumentException")
    void fractionOutOfRangeRejected() {
        List<ExposureProfileLinkDTO> links = new ArrayList<>(List.of(
                buildLink(100L, "1.5")
        ));

        assertThatThrownBy(() -> service.setLinks(7L, links, 3L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fraction must be in [0,1]");
    }
}
