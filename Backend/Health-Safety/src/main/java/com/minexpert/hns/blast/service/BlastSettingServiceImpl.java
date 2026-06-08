package com.minexpert.hns.blast.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.blast.dto.BlastSettingDTO;
import com.minexpert.hns.blast.entity.BlastSetting;
import com.minexpert.hns.blast.repository.BlastSettingRepository;

import lombok.RequiredArgsConstructor;

/**
 * Implementation des parametres Blast par mine.
 *
 * <p>Les defauts (24h / 6h / 30 min / popups 15 min sur fenetre 2h / alerte 10
 * min) sont positionnes a la creation initiale d'une ligne. Le timezone par
 * defaut est UTC, surclasse par {@code Africa/Ouagadougou} si la migration
 * V014 a deja seede pour {@code mineId=1}.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class BlastSettingServiceImpl implements BlastSettingService {

    private final BlastSettingRepository repository;

    @Override
    public BlastSettingDTO getByMineId(Long mineId) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        BlastSetting setting = repository.findByMineId(mineId)
                .orElseGet(() -> repository.save(defaults(mineId)));
        return toDTO(setting);
    }

    @Override
    public void update(BlastSettingDTO dto, Long userId) {
        if (dto.getMineId() == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        BlastSetting setting = repository.findByMineId(dto.getMineId())
                .orElseGet(() -> defaults(dto.getMineId()));
        setting.setReminder24hOffsetMinutes(dto.getReminder24hOffsetMinutes());
        setting.setReminder6hOffsetMinutes(dto.getReminder6hOffsetMinutes());
        setting.setReminder30mOffsetMinutes(dto.getReminder30mOffsetMinutes());
        setting.setPopupCadenceMinutes(dto.getPopupCadenceMinutes());
        setting.setPopupWindowMinutes(dto.getPopupWindowMinutes());
        setting.setGeneralAlarmOffsetMinutes(dto.getGeneralAlarmOffsetMinutes());
        if (dto.getDefaultTimezone() != null) {
            setting.setDefaultTimezone(dto.getDefaultTimezone());
        }
        if (dto.getSmtpFromAddress() != null) {
            setting.setSmtpFromAddress(dto.getSmtpFromAddress());
        }
        if (dto.getControlRoomLabel() != null) {
            setting.setControlRoomLabel(dto.getControlRoomLabel());
        }
        if (dto.getSiteLabel() != null) {
            setting.setSiteLabel(dto.getSiteLabel());
        }
        setting.setUpdatedAt(LocalDateTime.now());
        setting.setUpdatedBy(userId);
        repository.save(setting);
    }

    private BlastSetting defaults(Long mineId) {
        return BlastSetting.builder()
                .mineId(mineId)
                .reminder24hOffsetMinutes(1440)
                .reminder6hOffsetMinutes(360)
                .reminder30mOffsetMinutes(30)
                .popupCadenceMinutes(15)
                .popupWindowMinutes(120)
                .generalAlarmOffsetMinutes(10)
                .defaultTimezone("UTC")
                .controlRoomLabel("Control room")
                .updatedAt(LocalDateTime.now())
                .updatedBy(0L)
                .build();
    }

    private BlastSettingDTO toDTO(BlastSetting e) {
        return BlastSettingDTO.builder()
                .id(e.getId())
                .mineId(e.getMineId())
                .reminder24hOffsetMinutes(e.getReminder24hOffsetMinutes())
                .reminder6hOffsetMinutes(e.getReminder6hOffsetMinutes())
                .reminder30mOffsetMinutes(e.getReminder30mOffsetMinutes())
                .popupCadenceMinutes(e.getPopupCadenceMinutes())
                .popupWindowMinutes(e.getPopupWindowMinutes())
                .generalAlarmOffsetMinutes(e.getGeneralAlarmOffsetMinutes())
                .defaultTimezone(e.getDefaultTimezone())
                .smtpFromAddress(e.getSmtpFromAddress())
                .controlRoomLabel(e.getControlRoomLabel())
                .siteLabel(e.getSiteLabel())
                .updatedAt(e.getUpdatedAt())
                .updatedBy(e.getUpdatedBy())
                .build();
    }
}
