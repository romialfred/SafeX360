-- ═══════════════════════════════════════════════════════════════════════════
-- V011 — Phase 8 : Snapshots agreges KPI Dosimetrie
-- ═══════════════════════════════════════════════════════════════════════════
-- Table creee :
--   1) dosimetry_kpi_snapshot              (snapshots agreges par jour + categorie)
--
-- Triggers d'immutabilite (defense en profondeur) :
--   * dosimetry_kpi_snapshot : trigger BEFORE UPDATE qui bloque toute mutation
--     des colonnes calculees - les snapshots sont append-only.
--     Le scheduler journalier DELETE + INSERT plutot que UPDATE.
--   * dosimetry_kpi_snapshot : trigger BEFORE DELETE permis (necessaire au
--     re-run intra-day), mais loggue dans le slow log applicatif.
--
-- Application :
--   mysql -u root -p healthsafety < V011__dosimetry_kpi_snapshot.sql
-- ═══════════════════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 0;

DROP TRIGGER IF EXISTS trg_dosimetry_kpi_snapshot_append_only;

DROP TABLE IF EXISTS dosimetry_kpi_snapshot;

SET FOREIGN_KEY_CHECKS = 1;

-- ───────────────────────────────────────────────────────────────────────────
-- 1) dosimetry_kpi_snapshot — Snapshot agrege (mine, date, categorie)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE dosimetry_kpi_snapshot (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    mine_id                     BIGINT NOT NULL,
    snapshot_date               DATE NOT NULL,
    category                    VARCHAR(16) NOT NULL,        -- WORKER_A | WORKER_B | APPRENTICE | PREGNANCY | PUBLIC

    workers_count               BIGINT NOT NULL DEFAULT 0,
    dose_records_count          BIGINT NOT NULL DEFAULT 0,

    avg_annual_dose             DECIMAL(12,4),               -- mSv
    median_annual_dose          DECIMAL(12,4),               -- mSv
    max_annual_dose             DECIMAL(12,4),               -- mSv

    workers_over_50_pct         BIGINT NOT NULL DEFAULT 0,
    workers_over_75_pct         BIGINT NOT NULL DEFAULT 0,
    workers_over_90_pct         BIGINT NOT NULL DEFAULT 0,
    workers_over_100_pct        BIGINT NOT NULL DEFAULT 0,

    active_alerts_count         BIGINT NOT NULL DEFAULT 0,
    overexposure_cases_open     BIGINT NOT NULL DEFAULT 0,
    fitness_expiring_soon       BIGINT NOT NULL DEFAULT 0,

    measurement_points_count    BIGINT NOT NULL DEFAULT 0,
    ambient_avg_usvh            DECIMAL(14,4),

    created_at                  DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_kpi_snapshot_mine_date_category (mine_id, snapshot_date, category),
    INDEX idx_kpi_snapshot_mine_date_category (mine_id, snapshot_date DESC, category),
    INDEX idx_kpi_snapshot_date (snapshot_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER APPEND-ONLY sur les colonnes calculees
-- ═══════════════════════════════════════════════════════════════════════════
-- Toute tentative d'UPDATE sur les KPI bloque (le scheduler doit faire DELETE +
-- INSERT lorsqu'il re-traite la meme journee). Seul id reste mutable pour
-- compat. avec un eventuel rename de cle physique, mais en pratique le
-- generated ID JPA n'est jamais reaffecte.

DELIMITER //

CREATE TRIGGER trg_dosimetry_kpi_snapshot_append_only
BEFORE UPDATE ON dosimetry_kpi_snapshot
FOR EACH ROW
BEGIN
    IF NEW.mine_id <> OLD.mine_id
        OR NEW.snapshot_date <> OLD.snapshot_date
        OR NEW.category <> OLD.category
        OR NEW.workers_count <> OLD.workers_count
        OR NEW.dose_records_count <> OLD.dose_records_count
        OR NOT (NEW.avg_annual_dose <=> OLD.avg_annual_dose)
        OR NOT (NEW.median_annual_dose <=> OLD.median_annual_dose)
        OR NOT (NEW.max_annual_dose <=> OLD.max_annual_dose)
        OR NEW.workers_over_50_pct <> OLD.workers_over_50_pct
        OR NEW.workers_over_75_pct <> OLD.workers_over_75_pct
        OR NEW.workers_over_90_pct <> OLD.workers_over_90_pct
        OR NEW.workers_over_100_pct <> OLD.workers_over_100_pct
        OR NEW.active_alerts_count <> OLD.active_alerts_count
        OR NEW.overexposure_cases_open <> OLD.overexposure_cases_open
        OR NEW.fitness_expiring_soon <> OLD.fitness_expiring_soon
        OR NEW.measurement_points_count <> OLD.measurement_points_count
        OR NOT (NEW.ambient_avg_usvh <=> OLD.ambient_avg_usvh)
        OR NEW.created_at <> OLD.created_at
    THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'dosimetry_kpi_snapshot is APPEND-ONLY. Use DELETE + INSERT to re-run a day.';
    END IF;
END//

DELIMITER ;
