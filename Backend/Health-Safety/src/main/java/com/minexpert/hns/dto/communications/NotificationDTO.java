package com.minexpert.hns.dto.communications;

import com.minexpert.hns.entity.communications.CommTime;
import com.minexpert.hns.entity.communications.Communication;
import com.minexpert.hns.entity.communications.NotiRunStatus;
import com.minexpert.hns.entity.communications.Notification;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDTO {
    private Long id;
    private Long communicationId;
    private Long commTimeId;
    private String dedupedKey;
    private NotiRunStatus status;
    private String responseMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Notification toEntity(Communication communication, CommTime commTime) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setCommunication(communication);
        notification.setCommTime(commTime);
        notification.setDedupedKey(dedupedKey);
        notification.setStatus(status);
        notification.setResponseMessage(responseMessage);
        notification.setCreatedAt(createdAt);
        notification.setUpdatedAt(updatedAt);
        return notification;
    }

    public static NotificationDTO fromEntity(Notification n) {
        return new NotificationDTO(
                n.getId(),
                n.getCommunication() != null ? n.getCommunication().getId() : null,
                n.getCommTime() != null ? n.getCommTime().getId() : null,
                n.getDedupedKey(),
                n.getStatus(),
                n.getResponseMessage(),
                n.getCreatedAt(),
                n.getUpdatedAt());
    }
}
