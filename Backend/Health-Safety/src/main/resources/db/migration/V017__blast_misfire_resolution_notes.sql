-- ═══════════════════════════════════════════════════════════════════════════
-- V017 — Module Blast Management : champ misfire_resolution_notes
-- ═══════════════════════════════════════════════════════════════════════════
-- Conformite : tracabilite reglementaire de la levee d'un raté (misfire).
-- Compatible MySQL 8.0+.
--
-- Contexte (P5 — Procedure ratée + recalcul cascade) :
--   BlastService.resolveMisfire(id, resolutionNotes) doit persister la
--   description du protocole d'intervention (deminage / re-amorcage) qui
--   leve le verrou misfire et autorise la transition MISFIRE -> ALL_CLEAR.
--   Le texte est conserve a vie pour audit reglementaire (ne pas effacer
--   en cas de re-passage MISFIRE ulterieur sur le meme tir — append-only
--   via le `blast_status_event` qui garde l'historique des raisons).
--
-- IDEMPOTENCE : ADD COLUMN IF NOT EXISTS sur MySQL 8.0.29+. Pour
--               compatibilite < 8.0.29 on detecte la presence de la
--               colonne via information_schema avant ADD.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Ajout colonne misfire_resolution_notes
SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'blast'
      AND COLUMN_NAME = 'misfire_resolution_notes'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE blast ADD COLUMN misfire_resolution_notes TEXT NULL AFTER misfire_resolved_at',
    'SELECT 1');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) blast_email_log.job_id : NULLABLE + suppression de la FK stricte
--    Justification (P5) :
--      Les emails de cycle de vie (CANCELLED / RESCHEDULED) sont declenches
--      synchroniquement par BlastService — ils ne passent PAS par la table
--      blast_notification_job. On les journalise dans blast_email_log avec
--      job_id = NULL pour conserver la tracabilite (envoi reussi/echec,
--      destinataire, sujet, langue) sans alourdir le scheduler avec des
--      jobs "artificiels" deja executes.
--    Compatibilite ascendante : les lignes existantes avec un job_id non
--    null restent valides ; l'index idx_blast_email_log_job est conserve.
-- ───────────────────────────────────────────────────────────────────────────
SET @fk_exists := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'blast_email_log'
      AND CONSTRAINT_NAME = 'fk_blast_email_log_job'
);
SET @drop_fk := IF(@fk_exists > 0,
    'ALTER TABLE blast_email_log DROP FOREIGN KEY fk_blast_email_log_job',
    'SELECT 1');
PREPARE stmtFk FROM @drop_fk;
EXECUTE stmtFk;
DEALLOCATE PREPARE stmtFk;

-- Recree la colonne job_id en NULLABLE (idempotent : MODIFY est sans effet
-- si la colonne est deja NULL).
ALTER TABLE blast_email_log MODIFY COLUMN job_id BIGINT NULL;

-- Recree la FK avec ON DELETE SET NULL pour preserver les logs si un
-- blast_notification_job est purge (au lieu de cascader la suppression).
SET @recreate_fk := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'blast_email_log'
      AND CONSTRAINT_NAME = 'fk_blast_email_log_job'
);
SET @add_fk := IF(@recreate_fk = 0,
    'ALTER TABLE blast_email_log ADD CONSTRAINT fk_blast_email_log_job FOREIGN KEY (job_id) REFERENCES blast_notification_job(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmtAddFk FROM @add_fk;
EXECUTE stmtAddFk;
DEALLOCATE PREPARE stmtAddFk;
