package com.minexpert.hns.dto.notification;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.notification.NotificationPreference;
import com.minexpert.hns.enums.NotificationEventType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de preference de notification. Miroir plat de
 * {@link NotificationPreference} ; l'ordre des champs est IDENTIQUE a l'entite
 * (constructeur positionnel), companyId en dernier.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationPreferenceDTO {
    private Long id;
    private Long userId;
    private String channel;
    private NotificationEventType eventType;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long companyId;

    public NotificationPreference toEntity() {
        return new NotificationPreference(id, userId, channel, eventType, enabled,
                createdAt, updatedAt, companyId);
    }
}
