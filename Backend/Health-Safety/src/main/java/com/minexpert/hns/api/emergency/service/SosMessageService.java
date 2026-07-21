package com.minexpert.hns.api.emergency.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.minexpert.hns.api.emergency.dto.SosMessageDTO;
import com.minexpert.hns.api.emergency.entity.SosAlert;
import com.minexpert.hns.api.emergency.entity.SosMessage;
import com.minexpert.hns.api.emergency.enums.SosMessageSender;
import com.minexpert.hns.api.emergency.repository.SosAlertRepository;
import com.minexpert.hns.api.emergency.repository.SosMessageRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Fil de communication d'un SOS (console d'intervention).
 *
 * <p>Persiste les messages échangés et les diffuse en temps réel sur
 * {@code /topic/emergency/sos/{id}/messages} pour que la console se mette à
 * jour instantanément. Cloisonné par mine (company_id dérivé du SOS).</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SosMessageService {

    private final SosMessageRepository messageRepo;
    private final SosAlertRepository alertRepo;
    private final SimpMessagingTemplate messaging;

    @Transactional(readOnly = true)
    public List<SosMessageDTO> list(Long sosAlertId) {
        return messageRepo.findBySosAlertIdOrderByCreatedAtAsc(sosAlertId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public SosMessageDTO post(Long sosAlertId, SosMessageSender senderType,
                              Long senderId, String senderName, String body) {
        if (body == null || body.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MESSAGE_BODY_REQUIRED");
        }
        SosAlert alert = alertRepo.findById(sosAlertId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SOS_NOT_FOUND"));

        SosMessage msg = SosMessage.builder()
                .sosAlertId(sosAlertId)
                .companyId(alert.getCompanyId())
                .senderType(senderType != null ? senderType : SosMessageSender.COORDINATOR)
                .senderId(senderId)
                .senderName(senderName)
                .body(body.trim())
                .createdAt(LocalDateTime.now())
                .build();
        SosMessageDTO dto = toDto(messageRepo.save(msg));

        // Diffusion temps réel — la console et l'appareil du concerné reçoivent
        // le message immédiatement. Un échec de broadcast ne perd pas le message.
        try {
            messaging.convertAndSend("/topic/emergency/sos/" + sosAlertId + "/messages", dto);
        } catch (Exception e) {
            log.error("[SosMessageService] broadcast failed for SOS#{}: {}", sosAlertId, e.getMessage());
        }
        return dto;
    }

    /** Entrée automatique (jalon d'étape) postée par le système dans le fil. */
    @Transactional
    public void postSystem(Long sosAlertId, String body) {
        try {
            post(sosAlertId, SosMessageSender.SYSTEM, null, "Système", body);
        } catch (Exception e) {
            log.warn("[SosMessageService] system message skipped for SOS#{}: {}", sosAlertId, e.getMessage());
        }
    }

    private SosMessageDTO toDto(SosMessage m) {
        return SosMessageDTO.builder()
                .id(m.getId())
                .sosAlertId(m.getSosAlertId())
                .senderType(m.getSenderType())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .body(m.getBody())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
