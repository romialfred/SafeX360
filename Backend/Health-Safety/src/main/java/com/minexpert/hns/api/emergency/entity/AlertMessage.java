package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.AlertMessageSender;

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
 * Message de liaison d'une alerte générale (salle de crise ↔ équipes de secours).
 *
 * <p>Table {@code alert_message}. Persiste les échanges entre le centre de
 * contrôle et les équipes de secours pendant une évacuation, ainsi que les
 * jalons automatiques (SYSTEM). Cloisonné par mine via {@code company_id}.</p>
 */
@Entity
@Table(name = "alert_message", indexes = {
        @Index(name = "idx_alert_message_alert", columnList = "general_alert_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "general_alert_id", nullable = false)
    private Long generalAlertId;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 20)
    private AlertMessageSender senderType;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "sender_name", length = 150)
    private String senderName;

    /** Équipe de secours concernée (destinataire si CONTROL_ROOM, émetteur si RESCUE_TEAM). */
    @Column(name = "rescue_team_id")
    private Long rescueTeamId;

    @Column(name = "rescue_team_name", length = 150)
    private String rescueTeamName;

    @Column(name = "body", columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
