package com.minexpert.hns.service.notification;

import java.util.List;

import com.minexpert.hns.dto.notification.HseNotificationDTO;
import com.minexpert.hns.enums.HseNotificationSeverity;
import com.minexpert.hns.enums.HseNotificationType;

/** Émission (idempotente) et consultation des notifications SLA HSE (§9.1). */
public interface HseNotificationService {

    /**
     * Émet une notification SLA si elle n'existe pas déjà (idempotence par
     * {@code dedupeKey}) et la persiste dans le fil de la mine. Un {@code companyId}
     * nul est ignoré. Le canal e-mail est délibérément SÉPARÉ ({@link #emailRecipient})
     * pour n'être déclenché que sur une émission RÉELLE et sous budget — évite tout
     * envoi massif et toute résolution HRMS sur des lignes déjà notifiées.
     *
     * @return {@code true} si une NOUVELLE notification a été créée, {@code false}
     *         si elle existait déjà (ou entrée invalide).
     */
    boolean raise(Long companyId, Long recipientId, HseNotificationType type, HseNotificationSeverity severity,
            String entityType, Long entityId, String title, String message, String dedupeKey);

    /**
     * Envoie un e-mail best-effort au destinataire (résolution HRMS interne), UNIQUEMENT
     * si l'e-mail est globalement activé ({@code hse.sla.email-enabled}). Ne résout HRMS
     * que lorsqu'un envoi est réellement possible.
     *
     * @return {@code true} si un envoi a été tenté (e-mail activé + adresse trouvée).
     */
    boolean emailRecipient(Long employeeId, String subject, String message);

    List<HseNotificationDTO> list(Long companyId, boolean unreadOnly, int limit);

    long unreadCount(Long companyId);

    boolean markRead(Long companyId, Long id);

    int markAllRead(Long companyId);
}
