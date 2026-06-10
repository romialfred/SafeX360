package com.hrms.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — journal immuable des actions d'administration des comptes.
 * Append-only : aucune mise à jour ni suppression exposée par l'API.
 *
 * Actions tracées : USER_CREATED, USER_CREATED_FROM_AD, PASSWORD_RESET,
 * INVITATION_RESENT, STATUS_ACTIVATED, STATUS_DEACTIVATED, PERMISSIONS_UPDATED,
 * DIRECTORY_SETTINGS_UPDATED.
 */
@Entity
@Table(name = "admin_action_log", indexes = {
        @Index(name = "idx_admin_log_target", columnList = "targetAccountId"),
        @Index(name = "idx_admin_log_date", columnList = "createdAt")
})
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Type d'action (enum libre côté code, voir javadoc). */
    private String action;

    /** Compte cible de l'action (null pour les actions de configuration). */
    private Long targetAccountId;
    private String targetLogin;

    /** Auteur de l'action (login extrait du JWT de la requête admin). */
    private String performedBy;

    /** Détail lisible (sans aucune donnée sensible : jamais de mot de passe). */
    @Column(length = 512)
    private String details;

    private LocalDateTime createdAt;

    public static AdminActionLog of(String action, Long targetAccountId, String targetLogin,
                                    String performedBy, String details) {
        AdminActionLog log = new AdminActionLog();
        log.setAction(action);
        log.setTargetAccountId(targetAccountId);
        log.setTargetLogin(targetLogin);
        log.setPerformedBy(performedBy);
        log.setDetails(details);
        log.setCreatedAt(LocalDateTime.now());
        return log;
    }
}
