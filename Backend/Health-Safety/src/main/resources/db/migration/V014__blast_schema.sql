-- ═══════════════════════════════════════════════════════════════════════════
-- V014 — Module Blast Management : schema BDD (9 tables)
-- ═══════════════════════════════════════════════════════════════════════════
-- Conformite : tracabilite legale des tirs de mine.
-- Compatible MySQL 8.0+.
--
-- Application :
--   mysql -u root -p healthsafety < V014__blast_schema.sql
--
-- IDEMPOTENCE : les DROP TABLE IF EXISTS rendent le script rejouable. ATTENTION :
-- le DROP est destructif ; en production, prevoir un DUMP avant rejouage.
--
-- Ordre des DROP (inverse des FK) :
--   blast_email_log -> blast_notification_job -> blast_status_event
--   -> blast_evacuation_report -> blast_recipient -> blast_guard
--   -> blast_plan -> blast -> blast_setting
-- ═══════════════════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS blast_email_log;
DROP TABLE IF EXISTS blast_notification_job;
DROP TABLE IF EXISTS blast_status_event;
DROP TABLE IF EXISTS blast_evacuation_report;
DROP TABLE IF EXISTS blast_recipient;
DROP TABLE IF EXISTS blast_guard;
DROP TABLE IF EXISTS blast_plan;
DROP TABLE IF EXISTS blast;
DROP TABLE IF EXISTS blast_setting;

SET FOREIGN_KEY_CHECKS = 1;

-- ───────────────────────────────────────────────────────────────────────────
-- 1) blast — Tir de mine principal
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE blast (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    reference                   VARCHAR(64) NOT NULL,
    scheduled_at                DATETIME(6) NOT NULL,
    timezone                    VARCHAR(64) NOT NULL DEFAULT 'UTC',
    type                        VARCHAR(32) NOT NULL,             -- PRODUCTION | DEVELOPMENT | SECONDARY | PRESPLIT | FINAL
    pit                         VARCHAR(64),
    bench                       VARCHAR(64),
    block                       VARCHAR(64),
    lat                         DOUBLE,
    lng                         DOUBLE,
    status                      VARCHAR(32) NOT NULL,             -- DRAFT | PLANNED | CONFIRMED | IMMINENT | FIRED | ALL_CLEAR | MISFIRE | CANCELLED | POSTPONED
    exclusion_radius_m          DOUBLE,
    blaster_id                  BIGINT,
    hse_lead_id                 BIGINT,
    alarm_zone_scope            VARCHAR(128),
    mine_id                     BIGINT NOT NULL,
    misfire_resolved_at         DATETIME(6),
    version                     INT NOT NULL DEFAULT 0,
    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uk_blast_reference (reference),
    INDEX idx_blast_mine_status_scheduled (mine_id, status, scheduled_at),
    INDEX idx_blast_scheduled_at (scheduled_at),
    INDEX idx_blast_blaster (blaster_id),
    INDEX idx_blast_hse_lead (hse_lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) blast_plan — Plan de tir (relation 1-1)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE blast_plan (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    blast_id                    BIGINT NOT NULL,
    hole_count                  INT,
    hole_diameter_mm            DOUBLE,
    depth_m                     DOUBLE,
    burden_m                    DOUBLE,
    spacing_m                   DOUBLE,
    stemming_m                  DOUBLE,
    explosive_type              VARCHAR(64),
    explosive_qty_kg            DOUBLE,
    powder_factor               DOUBLE,
    initiation_system           VARCHAR(64),
    delay_sequence              TEXT,
    created_at                  DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_blast_plan_blast (blast_id),
    CONSTRAINT fk_blast_plan_blast FOREIGN KEY (blast_id) REFERENCES blast(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 3) blast_guard — Gardes de tir (sentinelles)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE blast_guard (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    blast_id                    BIGINT NOT NULL,
    employee_id                 BIGINT NOT NULL,
    position                    VARCHAR(128),
    PRIMARY KEY (id),
    INDEX idx_blast_guard_blast (blast_id),
    INDEX idx_blast_guard_employee (employee_id),
    CONSTRAINT fk_blast_guard_blast FOREIGN KEY (blast_id) REFERENCES blast(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 4) blast_recipient — Destinataires des e-mails de rappel
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE blast_recipient (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    blast_id                    BIGINT NOT NULL,
    employee_id                 BIGINT,
    external_email              VARCHAR(255),
    preferred_language          VARCHAR(8),                       -- FR | EN
    PRIMARY KEY (id),
    INDEX idx_blast_recipient_blast (blast_id),
    INDEX idx_blast_recipient_employee (employee_id),
    CONSTRAINT fk_blast_recipient_blast FOREIGN KEY (blast_id) REFERENCES blast(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 5) blast_notification_job — Taches planifiees (rappels + alerte)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE blast_notification_job (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    blast_id                    BIGINT NOT NULL,
    type                        VARCHAR(32) NOT NULL,             -- EMAIL_24H | EMAIL_6H | EMAIL_30M | POPUP_15M | GENERAL_ALARM_10M
    scheduled_at                DATETIME(6) NOT NULL,
    status                      VARCHAR(16) NOT NULL,             -- SCHEDULED | SENT | FAILED | CANCELLED
    attempts                    INT NOT NULL DEFAULT 0,
    last_error                  TEXT,
    sent_at                     DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_blast_job_status_scheduled (status, scheduled_at),
    INDEX idx_blast_job_blast (blast_id),
    CONSTRAINT fk_blast_job_blast FOREIGN KEY (blast_id) REFERENCES blast(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 6) blast_email_log — Journal des envois e-mail (audit operationnel)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE blast_email_log (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    job_id                      BIGINT NOT NULL,
    recipient                   VARCHAR(255) NOT NULL,
    subject                     VARCHAR(512),
    language                    VARCHAR(8),
    status                      VARCHAR(16) NOT NULL,             -- SENT | FAILED
    error                       TEXT,
    sent_at                     DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_blast_email_log_job (job_id),
    INDEX idx_blast_email_log_status (status),
    CONSTRAINT fk_blast_email_log_job FOREIGN KEY (job_id) REFERENCES blast_notification_job(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 7) blast_status_event — Historique des transitions (APPEND-ONLY)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE blast_status_event (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    blast_id                    BIGINT NOT NULL,
    from_status                 VARCHAR(32),
    to_status                   VARCHAR(32) NOT NULL,
    actor_id                    BIGINT,
    reason                      TEXT,
    at                          DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_blast_status_event_blast_at (blast_id, at DESC),
    CONSTRAINT fk_blast_status_event_blast FOREIGN KEY (blast_id) REFERENCES blast(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 8) blast_evacuation_report — Rapport d'evacuation cloturant un tir
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE blast_evacuation_report (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    blast_id                    BIGINT NOT NULL,
    alarm_triggered_at          DATETIME(6),
    mustered_count              INT,
    missing_count               INT,
    evac_duration_seconds       INT,
    fired_at                    DATETIME(6),
    all_clear_at                DATETIME(6),
    incidents                   TEXT,
    signed_off_by               BIGINT,
    signed_at                   DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_blast_evac_report_blast (blast_id),
    CONSTRAINT fk_blast_evac_report_blast FOREIGN KEY (blast_id) REFERENCES blast(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 9) blast_setting — Parametres par mine (offsets rappels, SMTP, etc.)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE blast_setting (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    mine_id                     BIGINT NOT NULL,
    reminder_24h_offset_minutes INT NOT NULL DEFAULT 1440,
    reminder_6h_offset_minutes  INT NOT NULL DEFAULT 360,
    reminder_30m_offset_minutes INT NOT NULL DEFAULT 30,
    popup_cadence_minutes       INT NOT NULL DEFAULT 15,
    popup_window_minutes        INT NOT NULL DEFAULT 120,
    general_alarm_offset_minutes INT NOT NULL DEFAULT 10,
    default_timezone            VARCHAR(64) NOT NULL DEFAULT 'UTC',
    smtp_from_address           VARCHAR(255),
    control_room_label          VARCHAR(128),
    updated_at                  DATETIME(6),
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uk_blast_setting_mine (mine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- Defaut blast_setting pour mine_id=1
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO blast_setting (
    mine_id, reminder_24h_offset_minutes, reminder_6h_offset_minutes,
    reminder_30m_offset_minutes, popup_cadence_minutes, popup_window_minutes,
    general_alarm_offset_minutes, default_timezone, smtp_from_address,
    control_room_label, updated_at, updated_by
) VALUES (
    1, 1440, 360, 30, 15, 120, 10, 'Africa/Ouagadougou',
    'no-reply@minexpert.local', 'Salle de controle', NOW(6), 0
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Triggers append-only sur blast_status_event
-- ═══════════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_blast_status_event_no_update;
DROP TRIGGER IF EXISTS trg_blast_status_event_no_delete;

DELIMITER $$

CREATE TRIGGER trg_blast_status_event_no_update
BEFORE UPDATE ON blast_status_event
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'blast_status_event is APPEND-ONLY (blast workflow traceability)';
END$$

CREATE TRIGGER trg_blast_status_event_no_delete
BEFORE DELETE ON blast_status_event
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'blast_status_event is APPEND-ONLY (blast workflow traceability)';
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification :
--   SHOW TABLES LIKE 'blast%';
--   SHOW TRIGGERS WHERE `Table` LIKE 'blast%';
-- ═══════════════════════════════════════════════════════════════════════════
