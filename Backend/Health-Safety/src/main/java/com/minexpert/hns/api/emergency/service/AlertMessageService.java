package com.minexpert.hns.api.emergency.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.minexpert.hns.api.emergency.dto.AlertMessageDTO;
import com.minexpert.hns.api.emergency.entity.AlertMessage;
import com.minexpert.hns.api.emergency.entity.GeneralAlert;
import com.minexpert.hns.api.emergency.enums.AlertMessageSender;
import com.minexpert.hns.api.emergency.repository.AlertMessageRepository;
import com.minexpert.hns.api.emergency.repository.GeneralAlertRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Fil de liaison d'une alerte générale (salle de crise ↔ équipes de secours).
 *
 * <p>Persiste les messages échangés et les diffuse en temps réel sur
 * {@code /topic/emergency/alert/{id}/messages} pour que la salle de crise et
 * les postes reliés se mettent à jour instantanément. Cloisonné par mine
 * (company_id dérivé de l'alerte).</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlertMessageService {

    private final AlertMessageRepository messageRepo;
    private final GeneralAlertRepository alertRepo;
    private final SimpMessagingTemplate messaging;

    @Transactional(readOnly = true)
    public List<AlertMessageDTO> list(Long generalAlertId) {
        return messageRepo.findByGeneralAlertIdOrderByCreatedAtAsc(generalAlertId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public AlertMessageDTO post(Long generalAlertId, AlertMessageSender senderType,
                                Long senderId, String senderName,
                                Long rescueTeamId, String rescueTeamName, String body) {
        if (body == null || body.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MESSAGE_BODY_REQUIRED");
        }
        GeneralAlert alert = alertRepo.findById(generalAlertId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ALERT_NOT_FOUND"));

        AlertMessage msg = AlertMessage.builder()
                .generalAlertId(generalAlertId)
                .companyId(alert.getCompanyId())
                .senderType(senderType != null ? senderType : AlertMessageSender.CONTROL_ROOM)
                .senderId(senderId)
                .senderName(senderName)
                .rescueTeamId(rescueTeamId)
                .rescueTeamName(rescueTeamName)
                .body(body.trim())
                .createdAt(LocalDateTime.now())
                .build();
        AlertMessageDTO dto = toDto(messageRepo.save(msg));

        // Diffusion temps réel — un échec de broadcast ne perd pas le message.
        try {
            messaging.convertAndSend("/topic/emergency/alert/" + generalAlertId + "/messages", dto);
        } catch (Exception e) {
            log.error("[AlertMessageService] broadcast failed for alert#{}: {}", generalAlertId, e.getMessage());
        }
        return dto;
    }

    private AlertMessageDTO toDto(AlertMessage m) {
        return AlertMessageDTO.builder()
                .id(m.getId())
                .generalAlertId(m.getGeneralAlertId())
                .senderType(m.getSenderType())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .rescueTeamId(m.getRescueTeamId())
                .rescueTeamName(m.getRescueTeamName())
                .body(m.getBody())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
