package com.minexpert.hns.repository.notification;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.notification.NotificationPreference;
import com.minexpert.hns.enums.NotificationEventType;

/**
 * Repository des preferences de notification. Toutes les requetes sont scopees
 * (userId + companyId) : une preference n'a de sens que pour un utilisateur
 * dans une mine donnee.
 */
public interface NotificationPreferenceRepository extends CrudRepository<NotificationPreference, Long> {

    List<NotificationPreference> findByUserIdAndCompanyId(Long userId, Long companyId);

    Optional<NotificationPreference> findByUserIdAndCompanyIdAndChannelAndEventType(
            Long userId, Long companyId, String channel, NotificationEventType eventType);
}
