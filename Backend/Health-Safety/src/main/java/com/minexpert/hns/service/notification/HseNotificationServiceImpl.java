package com.minexpert.hns.service.notification;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.notification.HseNotificationDTO;
import com.minexpert.hns.dto.request.EmployeeDirection;
import com.minexpert.hns.entity.notification.HseNotification;
import com.minexpert.hns.enums.HseNotificationSeverity;
import com.minexpert.hns.enums.HseNotificationType;
import com.minexpert.hns.repository.notification.HseNotificationRepository;

import com.example.mail.EmailService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HseNotificationServiceImpl implements HseNotificationService {

    private static final Logger LOG = LoggerFactory.getLogger(HseNotificationServiceImpl.class);

    private final HseNotificationRepository repository;
    private final EmailService emailService;
    private final HrmsClient hrmsClient;

    // Garde-fou global de l'e-mail (le fil in-app + le compteur restent actifs même
    // si l'e-mail est coupé). Le déploiement progressif : activer le fil, puis l'e-mail.
    @Value("${hse.sla.email-enabled:false}")
    private boolean emailEnabled;

    @Override
    public boolean raise(Long companyId, Long recipientId, HseNotificationType type, HseNotificationSeverity severity,
            String entityType, Long entityId, String title, String message, String dedupeKey) {
        if (companyId == null || dedupeKey == null) {
            return false;
        }
        // Idempotence : une même rupture de SLA n'émet qu'une fois (fire-once),
        // même si le planificateur repasse chaque jour et après un redémarrage.
        if (repository.existsByDedupeKey(dedupeKey)) {
            return false;
        }
        HseNotification n = new HseNotification();
        n.setCompanyId(companyId);
        n.setRecipientId(recipientId);
        n.setType(type);
        n.setSeverity(severity != null ? severity : HseNotificationSeverity.INFO);
        n.setEntityType(entityType);
        n.setEntityId(entityId);
        n.setTitle(title);
        n.setMessage(message);
        n.setDedupeKey(dedupeKey);
        n.setRead(false);
        n.setCreatedAt(LocalDateTime.now());
        try {
            repository.save(n);
        } catch (DataIntegrityViolationException dup) {
            // Course entre deux passes : la contrainte d'unicité a joué son rôle.
            // La notification est déjà émise — ce n'est pas une nouvelle émission.
            return false;
        }
        return true;
    }

    @Override
    public boolean emailRecipient(Long employeeId, String subject, String message) {
        if (!emailEnabled || employeeId == null) {
            return false;
        }
        String email = resolveEmail(employeeId);
        if (email == null || email.isBlank()) {
            return false;
        }
        try {
            // Asynchrone (@Async côté EmailService) — best-effort, ne bloque pas le scan.
            emailService.sendHtml(email, subject, buildHtml(subject, message));
            return true;
        } catch (Exception e) {
            LOG.warn("[HseNotification] envoi e-mail échoué ({}): {}", email, e.getMessage());
            return false;
        }
    }

    private String resolveEmail(Long employeeId) {
        try {
            List<EmployeeDirection> found = hrmsClient.getEmailsByIds(List.of(employeeId));
            if (found != null && !found.isEmpty()) {
                return found.get(0).getEmail();
            }
        } catch (Exception e) {
            LOG.warn("[HseNotification] résolution e-mail échouée (employé {}): {}", employeeId, e.getMessage());
        }
        return null;
    }

    private String buildHtml(String title, String message) {
        String safeTitle = title != null ? title : "Notification HSE";
        String safeMsg = message != null ? message : "";
        return "<div style=\"font-family:Arial,sans-serif;color:#1f2937\">"
                + "<h2 style=\"color:#b45309\">" + escape(safeTitle) + "</h2>"
                + "<p>" + escape(safeMsg) + "</p>"
                + "<p style=\"color:#6b7280;font-size:12px\">SafeX360 — surveillance des délais HSE (ISO 45001 §9.1)</p>"
                + "</div>";
    }

    private static String escape(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    @Override
    public List<HseNotificationDTO> list(Long companyId, boolean unreadOnly, int limit) {
        int capped = Math.min(Math.max(limit, 1), 200);
        PageRequest page = PageRequest.of(0, capped);
        List<HseNotification> rows = unreadOnly
                ? repository.findUnread(companyId, page)
                : repository.findRecent(companyId, page);
        return rows.stream().map(HseNotificationDTO::from).toList();
    }

    @Override
    public long unreadCount(Long companyId) {
        return repository.countUnread(companyId);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public boolean markRead(Long companyId, Long id) {
        return repository.markRead(companyId, id) > 0;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public int markAllRead(Long companyId) {
        return repository.markAllRead(companyId);
    }
}
