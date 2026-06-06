package com.minexpert.hns.api.emergency.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO transport pour la page « Paramètres Urgences ». */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmergencySettingsDTO {
    private Long id;
    private Long companyId;
    private Integer autoDispatchSeconds;
    private Boolean drillModeEnabled;
    private String headCountMethod;
    private Boolean geolocationRequired;
    private Integer auditRetentionYears;
    private String smsProvider;
    private String smsSenderId;
    private String voiceProvider;
    private String voiceLocale;
    private String voiceVoiceName;
}
