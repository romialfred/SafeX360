package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.SosMessageSender;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SosMessageDTO {
    private Long id;
    private Long sosAlertId;
    private SosMessageSender senderType;
    private Long senderId;
    private String senderName;
    private String body;
    private LocalDateTime createdAt;
}
