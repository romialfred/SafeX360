package com.minexpert.hns.dto.communications;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.communications.Communication;
import com.minexpert.hns.entity.parameters.WorkArea;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CommunicationDTO {
    private Long id;
    private String type;
    private String category;
    private String title;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private String content;
    private List<Long> recipients;
    private Long departmentId;
    private Long zoneId;
    private LocalDateTime scheduledAt;
    private LocalDateTime expiresAt;
    private Communication.Urgency urgency;
    private List<MediaDTO> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private CommTimeDTO schedule;
    private Long companyId;

    public Communication toEntity() {
        String recipientsString = recipients != null ? recipients.toString() : null;

        Communication comm = new Communication(
                id,
                type,
                category,
                title,
                senderId,
                senderName,
                senderEmail,
                content,
                recipientsString,
                departmentId,
                zoneId != null ? new WorkArea(zoneId) : null,
                scheduledAt,
                expiresAt,
                urgency,
                null,
                createdAt,
                updatedAt,
                companyId);
        return comm;
    }

}
