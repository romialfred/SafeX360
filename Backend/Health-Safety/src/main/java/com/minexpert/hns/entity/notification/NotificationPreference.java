package com.minexpert.hns.entity.notification;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.notification.NotificationPreferenceDTO;
import com.minexpert.hns.enums.NotificationEventType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Preference de notification d'un utilisateur, par canal et par type
 * d'evenement.
 *
 * <p>Mappee sur la table EXISTANTE {@code notification_preference} (migration
 * V020) : les noms de colonnes sont en snake_case et sont donc declares
 * explicitement via {@code @Column(name=...)} — sinon Hibernate
 * (ddl-auto=update) creerait des colonnes camelCase en doublon.</p>
 *
 * <p>Aujourd'hui seule la valeur {@code "WEB"} est utilisee dans
 * {@code channel} : le dispatch d'alerte n'emet QUE par WebSocket, il n'existe
 * aucun emetteur email/SMS/push. La colonne reste large pour le jour ou un
 * autre canal existera reellement.</p>
 *
 * <p>{@code companyId} est declare EN DERNIER : le constructeur positionnel
 * Lombok et {@code toDTO()} dependent de cet ordre (convention du repo).</p>
 */
@Entity
@Table(
        name = "notification_preference",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_notif_pref",
                columnNames = { "user_id", "channel", "event_type", "company_id" })
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationPreference {

    /** Seul canal reellement branche (WebSocket in-app). */
    public static final String CHANNEL_WEB = "WEB";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "channel", length = 20, nullable = false)
    private String channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", length = 40, nullable = false)
    private NotificationEventType eventType;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Mine proprietaire (cloisonnement). NOT NULL en base. */
    @Column(name = "company_id", nullable = false)
    private Long companyId;

    public NotificationPreferenceDTO toDTO() {
        return new NotificationPreferenceDTO(id, userId, channel, eventType, enabled,
                createdAt, updatedAt, companyId);
    }
}
