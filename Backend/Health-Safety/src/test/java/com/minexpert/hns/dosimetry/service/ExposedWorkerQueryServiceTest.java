package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Tests unitaires de {@link ExposedWorkerQueryServiceImpl#calculateExposureLevel(Double, Double)}.
 *
 * <p>Verifie le mapping ratio annualHp10 / regulatoryLimit -> GREEN/YELLOW/ORANGE/RED :
 * <ul>
 *   <li>GREEN : ratio &lt; 0.50</li>
 *   <li>YELLOW : 0.50 &lt;= ratio &lt; 0.75</li>
 *   <li>ORANGE : 0.75 &lt;= ratio &lt; 1.00</li>
 *   <li>RED : ratio &gt;= 1.00</li>
 *   <li>null : entree invalide (null ou limite &lt;= 0)</li>
 * </ul>
 */
class ExposedWorkerQueryServiceTest {

    private ExposedWorkerQueryServiceImpl service;

    @BeforeEach
    void setUp() {
        // Tous les repos sont null : la methode calculateExposureLevel n'en utilise aucun, elle
        // est testee en isolation totale.
        service = new ExposedWorkerQueryServiceImpl(null, null, null, null, null,
                null, null, null, null, null, null);
    }

    @Test
    @DisplayName("GREEN : annualHp10 < 50% de la limite")
    void calculateExposureLevel_green() {
        assertThat(service.calculateExposureLevel(5.0, 20.0)).isEqualTo("GREEN");
        assertThat(service.calculateExposureLevel(0.0, 20.0)).isEqualTo("GREEN");
        assertThat(service.calculateExposureLevel(9.99, 20.0)).isEqualTo("GREEN");
    }

    @Test
    @DisplayName("YELLOW : 50% <= ratio < 75%")
    void calculateExposureLevel_yellow() {
        assertThat(service.calculateExposureLevel(10.0, 20.0)).isEqualTo("YELLOW");
        assertThat(service.calculateExposureLevel(12.5, 20.0)).isEqualTo("YELLOW");
        assertThat(service.calculateExposureLevel(14.99, 20.0)).isEqualTo("YELLOW");
    }

    @Test
    @DisplayName("ORANGE : 75% <= ratio < 100%")
    void calculateExposureLevel_orange() {
        assertThat(service.calculateExposureLevel(15.0, 20.0)).isEqualTo("ORANGE");
        assertThat(service.calculateExposureLevel(17.5, 20.0)).isEqualTo("ORANGE");
        assertThat(service.calculateExposureLevel(19.99, 20.0)).isEqualTo("ORANGE");
    }

    @Test
    @DisplayName("RED : ratio >= 100%")
    void calculateExposureLevel_red() {
        assertThat(service.calculateExposureLevel(20.0, 20.0)).isEqualTo("RED");
        assertThat(service.calculateExposureLevel(30.0, 20.0)).isEqualTo("RED");
        assertThat(service.calculateExposureLevel(100.0, 20.0)).isEqualTo("RED");
    }

    @Test
    @DisplayName("null si annualHp10 ou regulatoryLimit invalide")
    void calculateExposureLevel_nullSafe() {
        assertThat(service.calculateExposureLevel(null, 20.0)).isNull();
        assertThat(service.calculateExposureLevel(5.0, null)).isNull();
        assertThat(service.calculateExposureLevel(null, null)).isNull();
        assertThat(service.calculateExposureLevel(5.0, 0.0)).isNull();
        assertThat(service.calculateExposureLevel(5.0, -1.0)).isNull();
    }
}
