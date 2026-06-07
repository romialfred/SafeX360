-- ═══════════════════════════════════════════════════════════════════════════
-- V007 — Phase 6 : Surveillance d'ambiance (4 tables + triggers append-only)
-- ═══════════════════════════════════════════════════════════════════════════
-- Tables creees :
--   1) dosimetry_measurement_point          (points fixes de mesure)
--   2) dosimetry_ambient_measurement        (mesures H*(10), APPEND-ONLY)
--   3) dosimetry_monitoring_campaign        (campagnes de surveillance)
--   4) dosimetry_monitoring_campaign_point  (table @ElementCollection)
--   5) dosimetry_exposure_profile_link      (liens Worker x Point + fraction)
--
-- Triggers d'immutabilite (defense en profondeur AIEA GSR Part 3) :
--   * dosimetry_ambient_measurement : trigger BEFORE UPDATE qui bloque toute
--     modification de value, measured_at, measurement_point_id, mine_id,
--     measured_by, instrument_id, instrument_serial, context, campaign_id.
--   * dosimetry_ambient_measurement : trigger BEFORE DELETE qui bloque toute
--     suppression (preservation legale des mesures de radioprotection).
--
-- Application :
--   mysql -u root -p healthsafety < V007__dosimetry_ambient_monitoring.sql
-- ═══════════════════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 0;

DROP TRIGGER IF EXISTS trg_dosimetry_ambient_measurement_no_update;
DROP TRIGGER IF EXISTS trg_dosimetry_ambient_measurement_no_delete;

DROP TABLE IF EXISTS dosimetry_exposure_profile_link;
DROP TABLE IF EXISTS dosimetry_monitoring_campaign_point;
DROP TABLE IF EXISTS dosimetry_ambient_measurement;
DROP TABLE IF EXISTS dosimetry_monitoring_campaign;
DROP TABLE IF EXISTS dosimetry_measurement_point;

SET FOREIGN_KEY_CHECKS = 1;

-- ───────────────────────────────────────────────────────────────────────────
-- 1) dosimetry_measurement_point — Points fixes de mesure d'ambiance
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_measurement_point (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    mine_id                     BIGINT NOT NULL,
    code                        VARCHAR(64) NOT NULL,
    label                       VARCHAR(255) NOT NULL,
    zone_id                     BIGINT,
    description                 TEXT,
    location                    TEXT,
    latitude                    DECIMAL(10,7),
    longitude                   DECIMAL(10,7),
    elevation                   DECIMAL(10,2),
    zone_classification         VARCHAR(16) NOT NULL,        -- SURVEILLED | CONTROLLED | NONE
    reference_level             DECIMAL(12,4),               -- uSv/h
    active                      BOOLEAN NOT NULL DEFAULT TRUE,
    version                     BIGINT NOT NULL DEFAULT 0,
    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uk_measurement_point_mine_code (mine_id, code),
    INDEX idx_measurement_point_mine_zone_class (mine_id, zone_classification),
    INDEX idx_measurement_point_mine_active (mine_id, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) dosimetry_monitoring_campaign — Campagnes de surveillance
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_monitoring_campaign (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    mine_id                     BIGINT NOT NULL,
    code                        VARCHAR(64) NOT NULL,
    label                       VARCHAR(255) NOT NULL,
    objective                   TEXT,
    start_date                  DATE NOT NULL,
    end_date                    DATE,
    status                      VARCHAR(16) NOT NULL,        -- DRAFT | ONGOING | COMPLETED | CANCELLED
    protocol                    TEXT,
    responsible_id              BIGINT,
    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_by                  BIGINT,
    completed_at                DATETIME(6),
    completed_by                BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uk_monitoring_campaign_mine_code (mine_id, code),
    INDEX idx_monitoring_campaign_mine_status (mine_id, status),
    INDEX idx_monitoring_campaign_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 3) dosimetry_monitoring_campaign_point — Liste des points couverts (@ElementCollection)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_monitoring_campaign_point (
    campaign_id                 BIGINT NOT NULL,
    measurement_point_id        BIGINT NOT NULL,
    CONSTRAINT fk_campaign_point_campaign
        FOREIGN KEY (campaign_id) REFERENCES dosimetry_monitoring_campaign (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_campaign_point_point
        FOREIGN KEY (measurement_point_id) REFERENCES dosimetry_measurement_point (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_campaign_point_campaign (campaign_id),
    INDEX idx_campaign_point_point (measurement_point_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 4) dosimetry_ambient_measurement — Mesures ponctuelles H*(10) (APPEND-ONLY)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_ambient_measurement (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    mine_id                     BIGINT NOT NULL,
    measurement_point_id        BIGINT NOT NULL,
    measured_at                 DATETIME(6) NOT NULL,
    measured_by                 BIGINT NOT NULL,
    value                       DECIMAL(14,4) NOT NULL,      -- uSv/h
    uncertainty                 DECIMAL(6,2),                -- %
    instrument_id               BIGINT,                      -- FK dosimetry_dosimeter
    instrument_serial           VARCHAR(64),
    context                     VARCHAR(32) NOT NULL,        -- ROUTINE | CAMPAIGN | INCIDENT_RESPONSE | COMMISSIONING
    campaign_id                 BIGINT,
    notes                       TEXT,
    created_at                  DATETIME(6),
    created_by                  BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_ambient_measurement_point
        FOREIGN KEY (measurement_point_id) REFERENCES dosimetry_measurement_point (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ambient_measurement_campaign
        FOREIGN KEY (campaign_id) REFERENCES dosimetry_monitoring_campaign (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ambient_measurement_instrument
        FOREIGN KEY (instrument_id) REFERENCES dosimetry_dosimeter (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_ambient_point_measured_at (measurement_point_id, measured_at DESC),
    INDEX idx_ambient_campaign (campaign_id),
    INDEX idx_ambient_mine_measured_at (mine_id, measured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 5) dosimetry_exposure_profile_link — Lien Worker(profile) x Point + fraction
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_exposure_profile_link (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    exposure_profile_id         BIGINT NOT NULL,
    measurement_point_id        BIGINT NOT NULL,
    fraction                    DECIMAL(6,4) NOT NULL,       -- 0..1
    estimated_dose_rate         DECIMAL(14,4),               -- uSv/h snapshot
    last_updated                DATETIME(6),
    created_at                  DATETIME(6),
    created_by                  BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uk_exposure_profile_link_profile_point (exposure_profile_id, measurement_point_id),
    CONSTRAINT fk_exposure_profile_link_profile
        FOREIGN KEY (exposure_profile_id) REFERENCES dosimetry_exposure_profile (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_exposure_profile_link_point
        FOREIGN KEY (measurement_point_id) REFERENCES dosimetry_measurement_point (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_exposure_profile_link_profile (exposure_profile_id),
    INDEX idx_exposure_profile_link_point (measurement_point_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS APPEND-ONLY sur dosimetry_ambient_measurement
-- Defense en profondeur : aucune modification ni suppression d'une mesure
-- d'ambiance n'est autorisee. AIEA GSR Part 3 §3.106 - tracabilite legale.
-- ═══════════════════════════════════════════════════════════════════════════

DELIMITER $$

CREATE TRIGGER trg_dosimetry_ambient_measurement_no_update
BEFORE UPDATE ON dosimetry_ambient_measurement
FOR EACH ROW
BEGIN
    IF NOT (
            NEW.mine_id              <=> OLD.mine_id
        AND NEW.measurement_point_id <=> OLD.measurement_point_id
        AND NEW.measured_at          <=> OLD.measured_at
        AND NEW.measured_by          <=> OLD.measured_by
        AND NEW.value                <=> OLD.value
        AND NEW.uncertainty          <=> OLD.uncertainty
        AND NEW.instrument_id        <=> OLD.instrument_id
        AND NEW.instrument_serial    <=> OLD.instrument_serial
        AND NEW.context              <=> OLD.context
        AND NEW.campaign_id          <=> OLD.campaign_id
        AND NEW.notes                <=> OLD.notes
        AND NEW.created_at           <=> OLD.created_at
        AND NEW.created_by           <=> OLD.created_by
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'dosimetry_ambient_measurement is APPEND-ONLY (no field is mutable)';
    END IF;
END$$

CREATE TRIGGER trg_dosimetry_ambient_measurement_no_delete
BEFORE DELETE ON dosimetry_ambient_measurement
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'dosimetry_ambient_measurement is APPEND-ONLY (DELETE forbidden)';
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION POST-EXECUTION :
--   SHOW TABLES LIKE 'dosimetry_%';
--   SHOW TRIGGERS WHERE `Table` = 'dosimetry_ambient_measurement';
--   UPDATE dosimetry_ambient_measurement SET value=999 WHERE id=1;
--     -- doit lever : Error 1644 (45000): ... is APPEND-ONLY ...
--   DELETE FROM dosimetry_ambient_measurement WHERE id=1;
--     -- doit lever : Error 1644 (45000): ... DELETE forbidden ...
-- ═══════════════════════════════════════════════════════════════════════════
