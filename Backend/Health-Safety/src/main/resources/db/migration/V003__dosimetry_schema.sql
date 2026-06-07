-- ═══════════════════════════════════════════════════════════════════════════
-- V003 — Module Dosimetrie : schema BDD (12 tables)
-- ═══════════════════════════════════════════════════════════════════════════
-- Conformite : AIEA GSR Part 3 (Radiation Protection), CIPR 103, RGPD.
-- Compatible MySQL 8.0+.
--
-- IMPORTANT : ce script est execute MANUELLEMENT (pas d'auto-run Spring).
-- Application :
--   mysql -u root -p healthsafety < V003__dosimetry_schema.sql
--
-- IDEMPOTENCE : les DROP TABLE IF EXISTS rendent le script rejouable. ATTENTION :
-- le DROP est destructif ; en production, prevoir un DUMP avant rejouage. En
-- environnement actif (donnees existantes), preferer un script incremental.
--
-- Ordre des DROP (inverse des FK) pour eviter les blocages :
--   audit_log -> overexposure_case -> exposure_alert -> medical_surveillance
--   -> qualification -> exposure_profile -> dose_cumulative -> dose_record
--   -> dosimeter_assignment -> dosimeter -> threshold -> exposed_worker
-- ═══════════════════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS dosimetry_audit_log;
DROP TABLE IF EXISTS dosimetry_overexposure_case;
DROP TABLE IF EXISTS dosimetry_exposure_alert;
DROP TABLE IF EXISTS dosimetry_medical_surveillance;
DROP TABLE IF EXISTS dosimetry_qualification;
DROP TABLE IF EXISTS dosimetry_exposure_profile;
DROP TABLE IF EXISTS dosimetry_dose_cumulative;
DROP TABLE IF EXISTS dosimetry_dose_record;
DROP TABLE IF EXISTS dosimetry_dosimeter_assignment;
DROP TABLE IF EXISTS dosimetry_dosimeter;
DROP TABLE IF EXISTS dosimetry_threshold;
DROP TABLE IF EXISTS dosimetry_exposed_worker;

SET FOREIGN_KEY_CHECKS = 1;

-- ───────────────────────────────────────────────────────────────────────────
-- 1) dosimetry_exposed_worker — Travailleur expose aux rayonnements ionisants
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_exposed_worker (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    employee_id                 BIGINT NOT NULL,
    category                    VARCHAR(16) NOT NULL,           -- WORKER_A | WORKER_B | APPRENTICE | PUBLIC
    classification_reason       VARCHAR(1024),
    classification_date         DATE,
    rpo_id                      BIGINT,
    special_status              VARCHAR(32),                    -- PREGNANCY | BREASTFEEDING | NONE
    special_status_start_date   DATE,
    special_status_end_date     DATE,
    active                      BOOLEAN NOT NULL DEFAULT TRUE,
    mine_id                     BIGINT NOT NULL,
    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    INDEX idx_exposed_worker_employee (employee_id),
    INDEX idx_exposed_worker_mine_active (mine_id, active),
    INDEX idx_exposed_worker_rpo (rpo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) dosimetry_threshold — Seuils CIPR/AIEA par grandeur et categorie
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_threshold (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    mine_id                     BIGINT,                         -- NULL = seuil global
    grandeur                    VARCHAR(16) NOT NULL,           -- HP10 | HP007 | HP3
    person_category             VARCHAR(32) NOT NULL,           -- WORKER_A | WORKER_B | APPRENTICE | PREGNANCY | PUBLIC
    dose_constraint             DOUBLE,
    investigation_level         DOUBLE,
    action_level                DOUBLE,
    regulatory_limit            DOUBLE,
    warn_percentages            VARCHAR(128),                   -- JSON array d'entiers
    unit                        VARCHAR(8) NOT NULL,
    reference_framework         VARCHAR(64) NOT NULL,           -- CIPR_103 | AIEA_GSR_PART3
    active                      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    INDEX idx_threshold_grandeur_category (grandeur, person_category, active),
    INDEX idx_threshold_mine (mine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 3) dosimetry_dosimeter — Parc de dosimetres physiques
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_dosimeter (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    serial                      VARCHAR(64) NOT NULL,
    type                        VARCHAR(16) NOT NULL,           -- TLD | OSL | EPD | NEUTRON
    qr_code                     VARCHAR(255),
    status                      VARCHAR(32) NOT NULL,           -- AVAILABLE | ASSIGNED | IN_READING | DEFECT | RETIRED
    calibration_due_date        DATE,
    mine_id                     BIGINT NOT NULL,
    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uk_dosimeter_serial (serial),
    INDEX idx_dosimeter_serial (serial),
    INDEX idx_dosimeter_qr_code (qr_code),
    INDEX idx_dosimeter_status_mine (status, mine_id),
    INDEX idx_dosimeter_calibration_due (calibration_due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 4) dosimetry_dosimeter_assignment — Affectations dosimetre <-> travailleur
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_dosimeter_assignment (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    dosimeter_id                BIGINT NOT NULL,
    worker_id                   BIGINT NOT NULL,
    period_start                DATE NOT NULL,
    period_end                  DATE,
    handover_ack                BOOLEAN NOT NULL DEFAULT FALSE,
    handover_ack_at             DATETIME(6),
    return_ack                  BOOLEAN NOT NULL DEFAULT FALSE,
    return_ack_at               DATETIME(6),
    device_condition            VARCHAR(512),
    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_assignment_dosimeter
        FOREIGN KEY (dosimeter_id) REFERENCES dosimetry_dosimeter (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_assignment_worker
        FOREIGN KEY (worker_id) REFERENCES dosimetry_exposed_worker (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,                   -- Preservation legale
    INDEX idx_assignment_worker_period (worker_id, period_start, period_end),
    INDEX idx_assignment_dosimeter_period (dosimeter_id, period_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 5) dosimetry_dose_record — Enregistrements de dose (APPEND-ONLY)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_dose_record (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    worker_id                   BIGINT NOT NULL,
    period                      VARCHAR(16) NOT NULL,           -- YYYY-MM ou YYYY-Qx
    hp10                        DOUBLE,
    hp007                       DOUBLE,
    hp3                         DOUBLE,
    source                      VARCHAR(16) NOT NULL,           -- AGENCY | EPD | MANUAL | IMPORT
    below_detection             BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_urls             TEXT,
    notes                       VARCHAR(2048),
    recorded_by                 BIGINT NOT NULL,
    recorded_at                 DATETIME(6) NOT NULL,
    version                     INT NOT NULL DEFAULT 1,
    superseded_record_id        BIGINT,                          -- Seul champ mutable (cf. triggers V004)
    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_dose_record_worker
        FOREIGN KEY (worker_id) REFERENCES dosimetry_exposed_worker (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,                   -- Preservation legale
    INDEX idx_dose_record_worker_period (worker_id, period),
    INDEX idx_dose_record_worker_version (worker_id, version),
    INDEX idx_dose_record_superseded (superseded_record_id),
    INDEX idx_dose_record_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 6) dosimetry_dose_cumulative — Cumuls (snapshot recalcule)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_dose_cumulative (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    worker_id                   BIGINT NOT NULL,
    year                        INT NOT NULL,
    annual_hp10                 DOUBLE,
    annual_hp007                DOUBLE,
    annual_hp3                  DOUBLE,
    rolling5y_hp10              DOUBLE,
    lifetime_hp10               DOUBLE,
    updated_at                  DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_dose_cumulative_worker
        FOREIGN KEY (worker_id) REFERENCES dosimetry_exposed_worker (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uk_dose_cumulative_worker_year (worker_id, year),
    INDEX idx_dose_cumulative_worker_year (worker_id, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 7) dosimetry_exposure_profile — Profil d'exposition (type/zone/poste)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_exposure_profile (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    worker_id                   BIGINT NOT NULL,
    exposure_type               VARCHAR(64) NOT NULL,
    zone_id                     BIGINT,
    post_id                     BIGINT,
    frequency                   VARCHAR(64),
    conditions                  VARCHAR(2048),
    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_exposure_profile_worker
        FOREIGN KEY (worker_id) REFERENCES dosimetry_exposed_worker (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_exposure_profile_worker (worker_id),
    INDEX idx_exposure_profile_zone (zone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 8) dosimetry_qualification — Qualifications / habilitations
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_qualification (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    worker_id                   BIGINT NOT NULL,
    training_type               VARCHAR(128) NOT NULL,
    valid_from                  DATE NOT NULL,
    valid_to                    DATE,
    certificate_url             VARCHAR(512),
    status                      VARCHAR(16) NOT NULL,           -- VALID | EXPIRING | EXPIRED | REVOKED
    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_qualification_worker
        FOREIGN KEY (worker_id) REFERENCES dosimetry_exposed_worker (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_qualification_worker_status (worker_id, status),
    INDEX idx_qualification_valid_to (valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 9) dosimetry_medical_surveillance — Suivi medical (CHIFFRE AES sur clinical)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_medical_surveillance (
    id                              BIGINT NOT NULL AUTO_INCREMENT,
    worker_id                       BIGINT NOT NULL,
    type                            VARCHAR(32) NOT NULL,       -- HIRE | PERIODIC | RETURN | DOSE_TRIGGERED
    fitness                         VARCHAR(32) NOT NULL,       -- FIT | FIT_WITH_RESTRICTIONS | UNFIT
    exam_date                       DATE NOT NULL,
    next_due_date                   DATE,
    restricted_clinical_details     TEXT,                       -- CHIFFRE AES-256-GCM (cf. AESEncryptionConverter)
    doctor_id                       BIGINT NOT NULL,
    created_at                      DATETIME(6),
    updated_at                      DATETIME(6),
    created_by                      BIGINT,
    updated_by                      BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_medical_surveillance_worker
        FOREIGN KEY (worker_id) REFERENCES dosimetry_exposed_worker (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,                   -- Preservation legale et RGPD
    INDEX idx_medical_surveillance_worker_date (worker_id, exam_date),
    INDEX idx_medical_surveillance_next_due (next_due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 10) dosimetry_exposure_alert — Alertes de franchissement de seuil
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_exposure_alert (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    worker_id                   BIGINT NOT NULL,
    zone_id                     BIGINT,
    level                       VARCHAR(32) NOT NULL,           -- APPROACH | INVESTIGATION | ACTION | EXCEEDED
    grandeur                    VARCHAR(16) NOT NULL,           -- HP10 | HP007 | HP3
    value                       DOUBLE NOT NULL,
    threshold_id                BIGINT NOT NULL,
    triggered_at                DATETIME(6) NOT NULL,
    acknowledged_at             DATETIME(6),
    acknowledged_by             BIGINT,
    status                      VARCHAR(16) NOT NULL,           -- ACTIVE | ACK | RESOLVED  (cf. enum AlertStatus)
    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_exposure_alert_worker
        FOREIGN KEY (worker_id) REFERENCES dosimetry_exposed_worker (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_exposure_alert_threshold
        FOREIGN KEY (threshold_id) REFERENCES dosimetry_threshold (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_exposure_alert_worker_status (worker_id, status),
    INDEX idx_exposure_alert_triggered_at (triggered_at),
    INDEX idx_exposure_alert_level_status (level, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 11) dosimetry_overexposure_case — Dossiers de surexposition reglementaire
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_overexposure_case (
    id                              BIGINT NOT NULL AUTO_INCREMENT,
    worker_id                       BIGINT NOT NULL,
    level                           VARCHAR(32) NOT NULL,       -- AlertLevel
    cause                           TEXT,
    corrective_actions              TEXT,
    medical_decision                TEXT,
    authority_declaration           BOOLEAN NOT NULL DEFAULT FALSE,
    authority_declaration_date      DATE,
    status                          VARCHAR(16) NOT NULL,       -- OPEN | CLOSED
    opened_at                       DATETIME(6) NOT NULL,
    closed_at                       DATETIME(6),
    created_at                      DATETIME(6),
    updated_at                      DATETIME(6),
    created_by                      BIGINT,
    updated_by                      BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_overexposure_worker
        FOREIGN KEY (worker_id) REFERENCES dosimetry_exposed_worker (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_overexposure_worker_status (worker_id, status),
    INDEX idx_overexposure_opened_at (opened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 12) dosimetry_audit_log — Journal d'audit (INSERT-ONLY, cf. V004 triggers)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_audit_log (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    action                      VARCHAR(64) NOT NULL,           -- CREATE | READ | UPDATE | VIEW_NOMINATIVE_DOSE | EXPORT | ...
    entity_type                 VARCHAR(128) NOT NULL,
    entity_id                   BIGINT,
    user_id                     BIGINT NOT NULL,
    user_permissions            VARCHAR(1024),
    timestamp                   DATETIME(6) NOT NULL,
    ip_address                  VARCHAR(64),
    details                     TEXT,
    PRIMARY KEY (id),
    INDEX idx_audit_entity_timestamp (entity_type, entity_id, timestamp),
    INDEX idx_audit_user_timestamp (user_id, timestamp),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification post-execution :
--   SHOW TABLES LIKE 'dosimetry_%';
--   SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()
--       AND TABLE_NAME LIKE 'dosimetry_%';  -- attendu : 12
-- ═══════════════════════════════════════════════════════════════════════════
