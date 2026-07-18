package com.minexpert.hns.service.notification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.notification.NotificationPreferenceDTO;
import com.minexpert.hns.entity.notification.NotificationPreference;
import com.minexpert.hns.enums.NotificationEventType;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.notification.NotificationPreferenceRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service des preferences de notification.
 *
 * <p>DEUX choix de conception structurants :</p>
 *
 * <ol>
 *   <li><b>Canal unique WEB.</b> Le dispatch d'alerte de la plateforme
 *       (GeneralAlertService, SosEscalationScheduler, BlastPopupBroadcaster…)
 *       n'emet QUE par WebSocket STOMP. Il n'existe aucun emetteur email, SMS
 *       ou push. On ne stocke donc que la constante {@code "WEB"} : proposer
 *       un reglage « recevoir par email » serait promettre un canal
 *       inexistant.</li>
 *   <li><b>Opt-out, pas opt-in.</b> Absence de ligne en base = notification
 *       ACTIVE. Il s'agit d'alertes de securite (SOS, rate de tir) : le defaut
 *       doit etre « je recois », jamais « je ne recois pas ». Un utilisateur
 *       qui n'a jamais ouvert cet ecran doit etre notifie.</li>
 * </ol>
 *
 * <p>Cloisonnement standard du repo : companyId requis en ecriture
 * ({@code COMPANY_ID_REQUIRED}), et toute lecture/ecriture est filtree sur le
 * couple (userId, companyId) — un utilisateur ne peut ni lire ni modifier les
 * preferences d'une autre mine que celle transmise (elle-meme clampee par
 * CompanyScopeFilter).</p>
 */
@Service
@Transactional
@RequiredArgsConstructor
public class NotificationPreferenceServiceImpl implements NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    private void ensureUserIdProvided(Long userId) throws HSException {
        if (userId == null) {
            throw new HSException("USER_ID_REQUIRED");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationPreferenceDTO> getMyPreferences(Long companyId, Long userId) throws HSException {
        ensureUserIdProvided(userId);
        // En lecture, companyId null (vue consolidee « Toutes les mines ») ne doit
        // pas casser l'ecran : on renvoie simplement les defauts (tout actif).
        Map<NotificationEventType, NotificationPreference> stored = new EnumMap<>(NotificationEventType.class);
        if (companyId != null) {
            for (NotificationPreference pref : preferenceRepository.findByUserIdAndCompanyId(userId, companyId)) {
                if (NotificationPreference.CHANNEL_WEB.equalsIgnoreCase(pref.getChannel())
                        && pref.getEventType() != null) {
                    stored.put(pref.getEventType(), pref);
                }
            }
        }

        List<NotificationPreferenceDTO> result = new ArrayList<>();
        for (NotificationEventType type : NotificationEventType.values()) {
            NotificationPreference pref = stored.get(type);
            if (pref != null) {
                result.add(pref.toDTO());
            } else {
                // Aucune ligne : defaut ACTIF (voir « opt-out » dans le javadoc de classe).
                result.add(new NotificationPreferenceDTO(null, userId, NotificationPreference.CHANNEL_WEB,
                        type, Boolean.TRUE, null, null, companyId));
            }
        }
        return result;
    }

    @Override
    public void updatePreference(Long companyId, Long userId, NotificationEventType eventType, boolean enabled)
            throws HSException {
        ensureCompanyIdProvided(companyId);
        ensureUserIdProvided(userId);
        if (eventType == null) {
            throw new HSException("NOTIFICATION_EVENT_TYPE_REQUIRED");
        }

        // Upsert sur la contrainte unique (user_id, channel, event_type, company_id).
        Optional<NotificationPreference> existing = preferenceRepository
                .findByUserIdAndCompanyIdAndChannelAndEventType(userId, companyId,
                        NotificationPreference.CHANNEL_WEB, eventType);

        LocalDateTime now = LocalDateTime.now();
        NotificationPreference pref = existing.orElseGet(() -> {
            NotificationPreference fresh = new NotificationPreference();
            fresh.setUserId(userId);
            fresh.setCompanyId(companyId);
            fresh.setChannel(NotificationPreference.CHANNEL_WEB);
            fresh.setEventType(eventType);
            fresh.setCreatedAt(now);
            return fresh;
        });
        pref.setEnabled(enabled);
        pref.setUpdatedAt(now);
        preferenceRepository.save(pref);
    }
}
