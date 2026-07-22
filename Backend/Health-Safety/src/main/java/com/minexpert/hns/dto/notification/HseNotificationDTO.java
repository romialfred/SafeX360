package com.minexpert.hns.dto.notification;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.notification.HseNotification;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Vue transportée d'une notification SLA HSE (§9.1). */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HseNotificationDTO {
    private Long id;
    private Long companyId;
    private Long recipientId;
    private String type;
    private String severity;
    private String entityType;
    private Long entityId;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;

    public static HseNotificationDTO from(HseNotification n) {
        return new HseNotificationDTO(
                n.getId(), n.getCompanyId(), n.getRecipientId(),
                n.getType() != null ? n.getType().name() : null,
                n.getSeverity() != null ? n.getSeverity().name() : null,
                n.getEntityType(), n.getEntityId(), n.getTitle(), n.getMessage(),
                n.isRead(), n.getCreatedAt());
    }
}
