package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.SosMessageSender;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Message du fil de communication d'un SOS (console d'intervention).
 *
 * <p>Table {@code sos_message}. Persiste la conversation entre le centre de
 * contrôle et la personne en détresse, ainsi que les jalons d'étape
 * automatiques (SYSTEM). Cloisonnée par mine via {@code company_id}.</p>
 */
@Entity
@Table(name = "sos_message", indexes = {
        @Index(name = "idx_sos_message_alert", columnList = "sos_alert_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SosMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sos_alert_id", nullable = false)
    private Long sosAlertId;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 20)
    private SosMessageSender senderType;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "sender_name", length = 150)
    private String senderName;

    @Column(name = "body", columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
