package com.minexpert.hns.service.notification;

import java.util.List;

import com.minexpert.hns.dto.notification.NotificationPreferenceDTO;
import com.minexpert.hns.enums.NotificationEventType;
import com.minexpert.hns.exception.HSException;

public interface NotificationPreferenceService {

    /**
     * Preferences in-app de l'utilisateur pour la mine active : TOUJOURS les 5
     * types d'evenement, avec {@code enabled=true} par defaut quand aucune ligne
     * n'existe encore (opt-out, pas opt-in).
     */
    List<NotificationPreferenceDTO> getMyPreferences(Long companyId, Long userId) throws HSException;

    /** Upsert sur la contrainte unique (userId, channel, eventType, companyId). */
    void updatePreference(Long companyId, Long userId, NotificationEventType eventType, boolean enabled)
            throws HSException;
}
