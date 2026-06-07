-- ═══════════════════════════════════════════════════════════════════════════
-- V009 — Phase 7 : Surveillance medicale renforcee
-- ═══════════════════════════════════════════════════════════════════════════
-- Tables creees :
--   1) dosimetry_medical_visit       (visites medicales reglementaires)
--   2) dosimetry_fitness_assessment  (fiches d'aptitude)
--
-- Triggers d'immutabilite (defense en profondeur - AIEA GSR Part 3 §3.106) :
--   * dosimetry_medical_visit : trigger BEFORE UPDATE qui bloque toute mutation
--     de detailed_report, performed_date, worker_id, mine_id, visit_type,
--     physician_id et physician_name une fois status=PERFORMED.
--   * dosimetry_fitness_assessment : trigger BEFORE UPDATE qui bloque toute
--     mutation de fitness et restrictions une fois signed=TRUE.
--
-- Cloisonnement medical :
--   * Les colonnes detailed_report et restrictions sont chiffrees AES-256-GCM
--     par AESEncryptionConverter (cf. safex.encryption.key). En BDD elles
--     contiennent du base64.
--
-- Application :
--   mysql -u root -p healthsafety < V009__dosimetry_medical.sql
-- ═══════════════════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 0;

DROP TRIGGER IF EXISTS trg_dosimetry_medical_visit_append_only;
DROP TRIGGER IF EXISTS trg_dosimetry_medical_visit_no_delete;
DROP TRIGGER IF EXISTS trg_dosimetry_fitness_assessment_signed_lock;
DROP TRIGGER IF EXISTS trg_dosimetry_fitness_assessment_no_delete;

DROP TABLE IF EXISTS dosimetry_fitness_assessment;
DROP TABLE IF EXISTS dosimetry_medical_visit;

SET FOREIGN_KEY_CHECKS = 1;

-- ───────────────────────────────────────────────────────────────────────────
-- 1) dosimetry_medical_visit — Visite medicale (CHIFFRE AES sur detailed_report)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_medical_visit (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    worker_id                   BIGINT NOT NULL,
    mine_id                     BIGINT NOT NULL,
    visit_type                  VARCHAR(32) NOT NULL,        -- INITIAL | PERIODIC_ANNUAL | POST_EXPOSURE | FOLLOWUP | FINAL_AT_DEPARTURE
    scheduled_date              DATE NOT NULL,
    performed_date              DATE,                        -- APPEND-ONLY apres PERFORMED
    physician_id                BIGINT NOT NULL,
    physician_name              VARCHAR(255),                -- snapshot
    status                      VARCHAR(16) NOT NULL,        -- SCHEDULED | PERFORMED | CANCELLED | MISSED
    general_conclusion          TEXT,                        -- non chiffre (libelle generique)
    detailed_report             TEXT,                        -- CHIFFRE AES-256-GCM (AESEncryptionConverter)
    cancellation_reason         VARCHAR(512),
    created_at                  DATETIME(6),
    created_by                  BIGINT,
    updated_at                  DATETIME(6),
    updated_by                  BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_medical_visit_worker
        FOREIGN KEY (worker_id) REFERENCES dosimetry_exposed_worker (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,                -- Preservation legale 30 ans
    INDEX idx_medical_visit_worker_scheduled (worker_id, scheduled_date DESC),
    INDEX idx_medical_visit_mine_type_status (mine_id, visit_type, status),
    INDEX idx_medical_visit_status_scheduled (status, scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) dosimetry_fitness_assessment — Fiche d'aptitude (CHIFFRE AES sur restrictions)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_fitness_assessment (
    id                              BIGINT NOT NULL AUTO_INCREMENT,
    worker_id                       BIGINT NOT NULL,
    mine_id                         BIGINT NOT NULL,
    medical_visit_id                BIGINT,                   -- FK soft vers dosimetry_medical_visit
    assessment_date                 DATE NOT NULL,
    valid_until                     DATE,
    fitness                         VARCHAR(32) NOT NULL,     -- FIT | FIT_WITH_RESTRICTIONS | TEMPORARILY_UNFIT | UNFIT
    restrictions                    TEXT,                     -- CHIFFRE AES-256-GCM (details cliniques)
    public_restrictions_summary     TEXT,                     -- non chiffre (PCR/RPO/SELF)
    review_required_date            DATE,
    physician_id                    BIGINT NOT NULL,
    physician_name                  VARCHAR(255),
    signed                          BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at                       DATETIME(6),
    created_at                      DATETIME(6),
    created_by                      BIGINT,
    updated_at                      DATETIME(6),
    updated_by                      BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_fitness_assessment_worker
        FOREIGN KEY (worker_id) REFERENCES dosimetry_exposed_worker (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_fitness_assessment_visit
        FOREIGN KEY (medical_visit_id) REFERENCES dosimetry_medical_visit (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_fitness_worker_assessment_date (worker_id, assessment_date DESC),
    INDEX idx_fitness_mine_level (mine_id, fitness),
    INDEX idx_fitness_valid_until (valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS APPEND-ONLY
-- ═══════════════════════════════════════════════════════════════════════════

DELIMITER $$

-- ───────────────────────────────────────────────────────────────────────────
-- dosimetry_medical_visit :
--   * Une fois OLD.status='PERFORMED', les champs detailed_report,
--     performed_date, general_conclusion ne peuvent plus etre modifies.
--   * Les champs d'identite (worker_id, mine_id, visit_type, physician_id,
--     physician_name) sont figes des l'insertion (deja updatable=false cote
--     JPA, on double cote BDD).
--   * Une visite PERFORMED ne peut pas etre supprimee (preservation legale).
--   * Une visite CANCELLED/MISSED reste mutable pour la cancellation_reason
--     uniquement (corrections administratives).
-- ───────────────────────────────────────────────────────────────────────────
CREATE TRIGGER trg_dosimetry_medical_visit_append_only
BEFORE UPDATE ON dosimetry_medical_visit
FOR EACH ROW
BEGIN
    -- Champs d'identite toujours immuables.
    IF NOT (
            NEW.worker_id        <=> OLD.worker_id
        AND NEW.mine_id          <=> OLD.mine_id
        AND NEW.visit_type       <=> OLD.visit_type
        AND NEW.physician_id     <=> OLD.physician_id
        AND NEW.physician_name   <=> OLD.physician_name
        AND NEW.created_at       <=> OLD.created_at
        AND NEW.created_by       <=> OLD.created_by
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'dosimetry_medical_visit identity fields are immutable';
    END IF;

    -- Si la visite est deja PERFORMED, le compte-rendu est verrouille.
    IF OLD.status = 'PERFORMED' THEN
        IF NOT (
                NEW.performed_date     <=> OLD.performed_date
            AND NEW.detailed_report    <=> OLD.detailed_report
            AND NEW.general_conclusion <=> OLD.general_conclusion
            AND NEW.status             <=> OLD.status
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'dosimetry_medical_visit is APPEND-ONLY once PERFORMED (medical report locked)';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_dosimetry_medical_visit_no_delete
BEFORE DELETE ON dosimetry_medical_visit
FOR EACH ROW
BEGIN
    IF OLD.status = 'PERFORMED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'dosimetry_medical_visit PERFORMED rows cannot be deleted (legal retention 30y)';
    END IF;
END$$

-- ───────────────────────────────────────────────────────────────────────────
-- dosimetry_fitness_assessment :
--   * Une fois OLD.signed=TRUE, les champs fitness et restrictions ne peuvent
--     plus etre modifies. publicRestrictionsSummary reste mutable pour
--     permettre des corrections de formulation operationnelle.
--   * Une fiche signee ne peut pas etre supprimee.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TRIGGER trg_dosimetry_fitness_assessment_signed_lock
BEFORE UPDATE ON dosimetry_fitness_assessment
FOR EACH ROW
BEGIN
    -- Champs d'identite figes des l'insertion.
    IF NOT (
            NEW.worker_id          <=> OLD.worker_id
        AND NEW.mine_id            <=> OLD.mine_id
        AND NEW.medical_visit_id   <=> OLD.medical_visit_id
        AND NEW.created_at         <=> OLD.created_at
        AND NEW.created_by         <=> OLD.created_by
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'dosimetry_fitness_assessment identity fields are immutable';
    END IF;

    -- Verrouillage post-signature.
    IF OLD.signed = TRUE THEN
        IF NOT (
                NEW.fitness            <=> OLD.fitness
            AND NEW.restrictions       <=> OLD.restrictions
            AND NEW.assessment_date    <=> OLD.assessment_date
            AND NEW.signed             <=> OLD.signed
            AND NEW.signed_at          <=> OLD.signed_at
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'dosimetry_fitness_assessment fitness/restrictions are APPEND-ONLY after signature';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_dosimetry_fitness_assessment_no_delete
BEFORE DELETE ON dosimetry_fitness_assessment
FOR EACH ROW
BEGIN
    IF OLD.signed = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'dosimetry_fitness_assessment signed rows cannot be deleted (legal retention)';
    END IF;
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION POST-EXECUTION :
--   SHOW TABLES LIKE 'dosimetry_%';
--   SHOW TRIGGERS WHERE `Table` LIKE 'dosimetry_medical_visit'
--                   OR  `Table` LIKE 'dosimetry_fitness_assessment';
--
--   -- Test trigger PERFORMED lock :
--   UPDATE dosimetry_medical_visit SET detailed_report='hack' WHERE status='PERFORMED' LIMIT 1;
--     -- doit lever : Error 1644 (45000): ... APPEND-ONLY once PERFORMED ...
--
--   -- Test trigger signature lock :
--   UPDATE dosimetry_fitness_assessment SET fitness='FIT' WHERE signed=1 LIMIT 1;
--     -- doit lever : Error 1644 (45000): ... APPEND-ONLY after signature ...
-- ═══════════════════════════════════════════════════════════════════════════
