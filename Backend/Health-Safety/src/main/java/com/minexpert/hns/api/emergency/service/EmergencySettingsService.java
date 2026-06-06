package com.minexpert.hns.api.emergency.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.dto.EmergencySettingsDTO;
import com.minexpert.hns.api.emergency.entity.EmergencySettings;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.repository.EmergencySettingsRepository;

import lombok.RequiredArgsConstructor;

/**
 * Gestion du singleton paramètres Urgences par mine (LOT 48 Phase 1).
 *
 * <p>Si la mine n'a pas encore de settings, ils sont initialisés à la première
 * lecture avec les valeurs par défaut sécurisées (ADR-005/008/009).</p>
 */
@Service
@RequiredArgsConstructor
public class EmergencySettingsService {

    private final EmergencySettingsRepository repository;
    private final EmergencyAuditService auditService;

    /** Récupère ou crée à la volée. Idempotent. */
    @Transactional
    public EmergencySettingsDTO getOrCreate(Long companyId) {
        EmergencySettings s = repository.findByCompanyId(companyId)
            .orElseGet(() -> repository.save(defaultsFor(companyId)));
        return toDto(s);
    }

    /** Met à jour les paramètres. Crée à la volée si absent. */
    @Transactional
    public EmergencySettingsDTO update(EmergencySettingsDTO dto, Long actorId) {
        EmergencySettings entity = repository.findByCompanyId(dto.getCompanyId())
            .orElseGet(() -> defaultsFor(dto.getCompanyId()));

        applyDto(entity, dto);
        EmergencySettings saved = repository.save(entity);

        auditService.log(
            EmergencyAuditEventType.SETTINGS_UPDATED,
            actorId,
            dto.getCompanyId(),
            "EmergencySettings",
            saved.getId(),
            null, null, null
        );
        return toDto(saved);
    }

    private EmergencySettings defaultsFor(Long companyId) {
        EmergencySettings s = new EmergencySettings();
        s.setCompanyId(companyId);
        s.setAutoDispatchSeconds(120);
        s.setDrillModeEnabled(Boolean.FALSE);
        s.setHeadCountMethod("GPS");
        s.setGeolocationRequired(Boolean.TRUE);
        s.setAuditRetentionYears(5);
        s.setVoiceLocale("fr-FR");
        s.setVoiceVoiceName("fr-FR-DeniseNeural");
        return s;
    }

    private void applyDto(EmergencySettings entity, EmergencySettingsDTO dto) {
        if (dto.getAutoDispatchSeconds() != null)   entity.setAutoDispatchSeconds(dto.getAutoDispatchSeconds());
        if (dto.getDrillModeEnabled() != null)      entity.setDrillModeEnabled(dto.getDrillModeEnabled());
        if (dto.getHeadCountMethod() != null)       entity.setHeadCountMethod(dto.getHeadCountMethod());
        if (dto.getGeolocationRequired() != null)   entity.setGeolocationRequired(dto.getGeolocationRequired());
        if (dto.getAuditRetentionYears() != null)   entity.setAuditRetentionYears(dto.getAuditRetentionYears());
        if (dto.getSmsProvider() != null)           entity.setSmsProvider(dto.getSmsProvider());
        if (dto.getSmsSenderId() != null)           entity.setSmsSenderId(dto.getSmsSenderId());
        if (dto.getVoiceProvider() != null)         entity.setVoiceProvider(dto.getVoiceProvider());
        if (dto.getVoiceLocale() != null)           entity.setVoiceLocale(dto.getVoiceLocale());
        if (dto.getVoiceVoiceName() != null)        entity.setVoiceVoiceName(dto.getVoiceVoiceName());
    }

    private EmergencySettingsDTO toDto(EmergencySettings s) {
        return EmergencySettingsDTO.builder()
            .id(s.getId())
            .companyId(s.getCompanyId())
            .autoDispatchSeconds(s.getAutoDispatchSeconds())
            .drillModeEnabled(s.getDrillModeEnabled())
            .headCountMethod(s.getHeadCountMethod())
            .geolocationRequired(s.getGeolocationRequired())
            .auditRetentionYears(s.getAuditRetentionYears())
            .smsProvider(s.getSmsProvider())
            .smsSenderId(s.getSmsSenderId())
            .voiceProvider(s.getVoiceProvider())
            .voiceLocale(s.getVoiceLocale())
            .voiceVoiceName(s.getVoiceVoiceName())
            .build();
    }
}
