package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.AlertMessageSender;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertMessageDTO {
    private Long id;
    private Long generalAlertId;
    private AlertMessageSender senderType;
    private Long senderId;
    private String senderName;
    private Long rescueTeamId;
    private String rescueTeamName;
    private String body;
    private LocalDateTime createdAt;
}
