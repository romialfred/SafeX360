package com.minexpert.hns.entity.notification;

import java.time.LocalDateTime;

import com.minexpert.hns.enums.HseNotificationSeverity;
import com.minexpert.hns.enums.HseNotificationType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Notification durable du moteur SLA HSE (ISO 45001 §9.1). Contrairement aux
 * diffusions WebSocket d'urgence (éphémères — perdues si le client est hors
 * ligne), une notification SLA est PERSISTÉE : elle alimente un fil consultable
 * par l'équipe HSE de la mine et survit aux redémarrages.
 *
 * <p><b>Idempotence / anti-ré-émission :</b> {@code dedupeKey} porte une
 * contrainte d'UNICITÉ. Le moteur insère « si absent » ; une même rupture de SLA
 * (même type, même entité, même échéance) ne génère donc qu'UNE notification,
 * même si le planificateur repasse chaque jour et même après un redémarrage —
 * la version durable du marqueur {@code [ESC:N]} des alertes SOS. Un changement
 * d'échéance (deadline incluse dans la clé) autorise une nouvelle notification.
 */
@Entity
@Table(name = "hse_notification", indexes = {
        @Index(name = "idx_hse_notif_company_created", columnList = "company_id, created_at"),
        @Index(name = "idx_hse_notif_dedupe", columnList = "dedupe_key", unique = true)
})
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HseNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /**
     * Destinataire « principal » (id employé : propriétaire de l'action /
     * responsable de la recommandation). Métadonnée d'affichage ; le fil reste
     * cloisonné et consulté au niveau MINE (l'équipe HSE), pas par égalité
     * stricte au demandeur — l'espace d'id X-User-Id (compte) et empId n'étant
     * pas encore aligné (même dette que la garde SELF employé).
     */
    @Column(name = "recipient_id")
    private Long recipientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 40, nullable = false)
    private HseNotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 16, nullable = false)
    private HseNotificationSeverity severity;

    /** Entité source (« CORRECTIVE_ACTION », « RECOMMENDATION »…) + son id. */
    @Column(name = "entity_type", length = 40)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "title", length = 200)
    private String title;

    @Lob
    @Column(name = "message")
    private String message;

    /** Clé d'idempotence — unicité portée par l'index nommé (voir @Table). */
    @Column(name = "dedupe_key", length = 200)
    private String dedupeKey;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
