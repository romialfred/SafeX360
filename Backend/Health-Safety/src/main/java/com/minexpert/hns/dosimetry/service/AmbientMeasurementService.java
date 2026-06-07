package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.dosimetry.dto.AmbientMeasurementDTO;
import com.minexpert.hns.dosimetry.dto.AmbientMeasurementStatsDTO;

public interface AmbientMeasurementService {

    /**
     * Cree une nouvelle mesure d'ambiance. Verifie que le point est actif et calcule les
     * indicateurs derivees (above reference, trend vs N-1).
     *
     * @param dto    payload de la mesure
     * @param userId identifiant de l'utilisateur authentifie (header X-User-Id) ; sert de
     *               fallback createdBy / measuredBy si non fournis dans le DTO. Peut etre
     *               null lorsque le contexte d'auth n'est pas disponible (jobs internes).
     */
    AmbientMeasurementDTO recordMeasurement(AmbientMeasurementDTO dto, Long userId);

    /**
     * Surcharge de compatibilite : delegue avec userId null.
     */
    default AmbientMeasurementDTO recordMeasurement(AmbientMeasurementDTO dto) {
        return recordMeasurement(dto, null);
    }

    List<AmbientMeasurementDTO> findByPoint(Long pointId, LocalDateTime from, LocalDateTime to);

    List<AmbientMeasurementDTO> findByCampaign(Long campaignId);

    AmbientMeasurementStatsDTO getStatsByPoint(Long pointId, LocalDateTime from, LocalDateTime to);
}
