package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.MonitoringCampaignDTO;

public interface MonitoringCampaignService {

    Long createCampaign(MonitoringCampaignDTO dto, Long userId);

    MonitoringCampaignDTO getById(Long id);

    List<MonitoringCampaignDTO> listByMine(Long mineId);

    void addMeasurementPoint(Long campaignId, Long measurementPointId, Long userId);

    /** Transitions DRAFT -&gt; ONGOING. */
    void startCampaign(Long campaignId, Long userId);

    /** Transitions ONGOING -&gt; COMPLETED. */
    void completeCampaign(Long campaignId, Long userId);

    /** Transitions DRAFT|ONGOING -&gt; CANCELLED. */
    void cancelCampaign(Long campaignId, Long userId);

    /** Genere un rapport textuel (placeholder simple : libelle, periode, points couverts, nb mesures). */
    String generateReport(Long campaignId);
}
