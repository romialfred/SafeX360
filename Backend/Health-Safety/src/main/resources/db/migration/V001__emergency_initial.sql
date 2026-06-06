-- ============================================================================
-- LOT 48 — MODULE GESTION DES URGENCES — Migration initiale Phase 1
-- ----------------------------------------------------------------------------
-- Cible : MySQL 8 (Aiven)
-- Auteur : SafeX 360 — Full Stack
-- Date   : 2026-06-06
--
-- Phase 1 : Modèle de données + RBAC + Settings + Audit log.
-- Ce script est IDEMPOTENT (CREATE TABLE IF NOT EXISTS partout possible).
-- Le script complémentaire V001__emergency_initial_DOWN.sql permet le rollback.
--
-- Conformité :
--   • ISO 45001 §9.1.2 (traçabilité, conservation 5 ans)
--   • Pas de modification des tables existantes (Employee, Department,
--     Location, Company) — extension via FK uniquement.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. RBAC EMERGENCY — Permissions par utilisateur (table séparée, zéro impact
--    sur le système d'authentification global)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_user_permission (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT       NOT NULL COMMENT 'FK vers Employee.id',
    permission      VARCHAR(40)  NOT NULL COMMENT 'COORDINATOR | RESPONDER | ALERT_LAUNCHER',
    granted_by      BIGINT       NULL     COMMENT 'FK Employee.id de qui a accordé',
    granted_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at      DATETIME     NULL,
    revoked_by      BIGINT       NULL,
    company_id      BIGINT       NULL     COMMENT 'Permission scopée à une mine si non-null',
    CONSTRAINT uq_emergency_perm UNIQUE (user_id, permission, company_id),
    INDEX idx_emergency_perm_user (user_id),
    INDEX idx_emergency_perm_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- 2. POINTS DE RASSEMBLEMENT
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assembly_point (
    id                      BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name                    VARCHAR(120)  NOT NULL,
    description             TEXT          NULL,
    location_text           VARCHAR(255)  NULL,
    latitude                DOUBLE        NOT NULL,
    longitude               DOUBLE        NOT NULL,
    manager_id              BIGINT        NULL COMMENT 'FK Employee.id — responsable',
    deputy_manager_id       BIGINT        NULL COMMENT 'FK Employee.id — adjoint',
    camera_id               BIGINT        NULL COMMENT 'FK future — caméra associée (V2)',
    evacuation_priority     INT           NOT NULL DEFAULT 2 COMMENT '1=P1 (le plus haut) à 5',
    max_capacity            INT           NULL,
    status                  VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | INACTIVE',
    company_id              BIGINT        NOT NULL COMMENT 'Mine de rattachement',
    created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ap_company (company_id),
    INDEX idx_ap_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table de jointure n-n point ↔ département
CREATE TABLE IF NOT EXISTS assembly_point_department (
    assembly_point_id   BIGINT NOT NULL,
    department_id       BIGINT NOT NULL,
    PRIMARY KEY (assembly_point_id, department_id),
    CONSTRAINT fk_apd_ap FOREIGN KEY (assembly_point_id) REFERENCES assembly_point(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- 3. ÉQUIPES DE SECOURS + ROULEMENTS
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rescue_team (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    description TEXT         NULL,
    company_id  BIGINT       NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rescue_team_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rescue_team_member (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    team_id         BIGINT       NOT NULL,
    employee_id     BIGINT       NOT NULL,
    role            VARCHAR(60)  NULL COMMENT 'Chef d''équipe / Médecin / Secouriste …',
    is_team_leader  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rtm_team FOREIGN KEY (team_id) REFERENCES rescue_team(id) ON DELETE CASCADE,
    CONSTRAINT uq_rtm UNIQUE (team_id, employee_id),
    INDEX idx_rtm_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rescue_shift (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    team_id         BIGINT       NOT NULL,
    shift_type      VARCHAR(20)  NOT NULL COMMENT 'DAY | NIGHT | CUSTOM',
    start_time      TIME         NOT NULL,
    end_time        TIME         NOT NULL,
    days_of_week    VARCHAR(20)  NOT NULL DEFAULT 'MTWTFSS' COMMENT 'M=lundi, T=mardi…',
    valid_from      DATE         NOT NULL,
    valid_to        DATE         NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shift_team FOREIGN KEY (team_id) REFERENCES rescue_team(id) ON DELETE CASCADE,
    INDEX idx_shift_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- 4. RÈGLES D'ESCALADE
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escalation_rule (
    id                  BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id          BIGINT       NOT NULL,
    name                VARCHAR(120) NOT NULL,
    description         TEXT         NULL,
    step_order          INT          NOT NULL COMMENT '1=premier appel, 2=adjoint, 3=superviseur…',
    target_user_id      BIGINT       NULL COMMENT 'FK Employee — cible explicite si pas via rôle',
    target_permission   VARCHAR(40)  NULL COMMENT 'COORDINATOR / RESPONDER si cible par rôle',
    delay_seconds       INT          NOT NULL DEFAULT 60 COMMENT 'Délai d''attente avant ce step',
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_esc_company (company_id, step_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- 5. RÉFÉRENTIELS (types de SOS, motifs de fausse alerte, niveaux de priorité)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sos_reason_category (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(40)  NOT NULL UNIQUE COMMENT 'Ex: MEDICAL, FIRE, COLLAPSE, CHEMICAL',
    label_fr    VARCHAR(120) NOT NULL,
    label_en    VARCHAR(120) NOT NULL,
    icon_key    VARCHAR(40)  NULL,
    color_hex   VARCHAR(10)  NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS false_alarm_reason (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(40)  NOT NULL UNIQUE,
    label_fr    VARCHAR(120) NOT NULL,
    label_en    VARCHAR(120) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial — utile pour la page Settings
INSERT IGNORE INTO sos_reason_category (code, label_fr, label_en, icon_key, color_hex, sort_order) VALUES
  ('MEDICAL',     'Médical',                   'Medical',                'heart',          '#DC2626', 10),
  ('FIRE',        'Incendie',                  'Fire',                   'flame',          '#F97316', 20),
  ('COLLAPSE',    'Effondrement / éboulement', 'Collapse / cave-in',     'mountain',       '#92400E', 30),
  ('CHEMICAL',    'Fuite chimique / gaz',      'Chemical / gas leak',    'flask',          '#A855F7', 40),
  ('ELECTRICAL',  'Électrocution',             'Electrical accident',    'bolt',           '#EAB308', 50),
  ('FALL',        'Chute / blessure',          'Fall / injury',          'user-down',      '#EA580C', 60),
  ('OTHER',       'Autre',                     'Other',                  'alert-triangle', '#64748B', 99);

INSERT IGNORE INTO false_alarm_reason (code, label_fr, label_en, sort_order) VALUES
  ('TEST',        'Test / exercice involontaire',          'Unintended test / drill',         10),
  ('MISTAKE',     'Erreur de manipulation',                'Manipulation error',              20),
  ('DUPLICATE',   'Doublon (SOS déjà déclenché)',          'Duplicate (already raised)',      30),
  ('RESOLVED',    'Situation résolue avant prise en charge','Resolved before pickup',         40),
  ('MALICIOUS',   'Acte malveillant',                      'Malicious act',                   50);

-- --------------------------------------------------------------------------
-- 6. PARAMÈTRES GLOBAUX (singleton par mine) + MÉDIAS + CANAUX
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_settings (
    id                          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id                  BIGINT       NOT NULL UNIQUE,
    auto_dispatch_seconds       INT          NOT NULL DEFAULT 120 COMMENT 'Délai avant escalade auto',
    drill_mode_enabled          BOOLEAN      NOT NULL DEFAULT FALSE,
    head_count_method           VARCHAR(20)  NOT NULL DEFAULT 'GPS' COMMENT 'GPS | QR | NFC | MANUAL',
    geolocation_required        BOOLEAN      NOT NULL DEFAULT TRUE,
    audit_retention_years       INT          NOT NULL DEFAULT 5,
    sms_provider                VARCHAR(40)  NULL COMMENT 'AFRICAS_TALKING | TWILIO',
    sms_sender_id               VARCHAR(40)  NULL,
    voice_provider              VARCHAR(40)  NULL COMMENT 'AZURE_SPEECH | OTHER',
    voice_locale                VARCHAR(20)  NOT NULL DEFAULT 'fr-FR',
    voice_voice_name            VARCHAR(60)  NOT NULL DEFAULT 'fr-FR-DeniseNeural',
    created_at                  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS emergency_media (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id   BIGINT       NOT NULL,
    media_type   VARCHAR(20)  NOT NULL COMMENT 'SIREN | VOICE_MESSAGE',
    locale       VARCHAR(20)  NOT NULL DEFAULT 'fr-FR',
    label        VARCHAR(120) NOT NULL,
    file_path    VARCHAR(255) NULL  COMMENT 'URL ou path serveur',
    tts_text     TEXT         NULL  COMMENT 'Si généré via TTS Azure',
    is_default   BOOLEAN      NOT NULL DEFAULT FALSE,
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_em_company (company_id, media_type, locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- 7. JOURNAL D'AUDIT IMMUABLE (append-only)
--    Conformité ISO 45001 §9.1.2 — conservation 5 ans (ADR-008).
--    Le trigger empêche tout UPDATE/DELETE applicatif.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_audit_log (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    actor_id     BIGINT       NULL COMMENT 'Employee.id qui a déclenché l''action — NULL pour système',
    event_type   VARCHAR(60)  NOT NULL COMMENT 'PERMISSION_GRANTED | SOS_RECEIVED | ALERT_TRIGGERED | …',
    entity_type  VARCHAR(60)  NULL COMMENT 'SOS, ASSEMBLY_POINT, ALERT, SETTINGS…',
    entity_id    BIGINT       NULL,
    company_id   BIGINT       NULL,
    payload_json JSON         NULL COMMENT 'Détails contextuels horodatés',
    ip_address   VARCHAR(45)  NULL,
    user_agent   VARCHAR(255) NULL,
    created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_audit_actor (actor_id, created_at),
    INDEX idx_audit_type (event_type, created_at),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_company_date (company_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trigger : interdire UPDATE
DELIMITER //
CREATE TRIGGER trg_emergency_audit_log_no_update
BEFORE UPDATE ON emergency_audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'emergency_audit_log is append-only (UPDATE forbidden)';
END//

CREATE TRIGGER trg_emergency_audit_log_no_delete
BEFORE DELETE ON emergency_audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'emergency_audit_log is append-only (DELETE forbidden)';
END//
DELIMITER ;

-- ============================================================================
-- FIN V001__emergency_initial.sql
-- Tables créées : 12 + 2 triggers
-- Données seed  : 7 sos_reason_category + 5 false_alarm_reason
-- ============================================================================
