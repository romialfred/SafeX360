-- V020__notification_preference.sql
-- R10 — Table de préférences de notification utilisateur.
--
-- Permet aux coordinateurs HSE de configurer par quel canal (WEB, EMAIL,
-- PUSH, SMS) ils souhaitent recevoir les alertes d'urgence, et avec
-- quelle granularité (SOS, GENERAL_ALERT, BLAST, ESCALATION, MISFIRE).
--
-- La colonne `enabled` permet de couper un canal sans supprimer la ligne.
-- Contrainte UNIQUE (user_id, channel, event_type, company_id) empêche
-- les doublons.

CREATE TABLE IF NOT EXISTS notification_preference (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    company_id  BIGINT       NOT NULL,
    channel     VARCHAR(20)  NOT NULL COMMENT 'WEB | EMAIL | PUSH | SMS | WHATSAPP',
    event_type  VARCHAR(40)  NOT NULL COMMENT 'SOS | GENERAL_ALERT | BLAST | ESCALATION | MISFIRE | ALL',
    enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_notif_pref UNIQUE (user_id, channel, event_type, company_id),
    INDEX idx_notif_pref_user (user_id),
    INDEX idx_notif_pref_company (company_id),
    INDEX idx_notif_pref_channel (channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed par défaut : tous les utilisateurs reçoivent tout en WEB.
-- Les admins pourront ensuite personnaliser via l'UI de préférences.
