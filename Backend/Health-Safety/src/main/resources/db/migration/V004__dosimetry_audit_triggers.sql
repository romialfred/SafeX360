-- ═══════════════════════════════════════════════════════════════════════════
-- V004 — Triggers d'immutabilite (AIEA GSR Part 3 — tracabilite legale)
-- ═══════════════════════════════════════════════════════════════════════════
-- Garanties cote BDD (defense en profondeur contre toute mutation directe
-- via DBA, SQL ad-hoc, outils de migration, etc.) :
--
--   1) dosimetry_audit_log : INSERT-ONLY (pas d'UPDATE, pas de DELETE)
--      Reference : AIEA GSR Part 3 §3.106 (records to be kept for the entire
--      working life of a worker and for at least 30 years after cessation of
--      occupational exposure).
--
--   2) dosimetry_dose_record : APPEND-ONLY avec exception controlee sur
--      superseded_record_id. Si superseded_record_id est deja NOT NULL,
--      aucune mutation supplementaire n'est autorisee (chainage scelle).
--      Sinon, on autorise UNIQUEMENT la mise a jour de superseded_record_id
--      (toute autre colonne reste figee).
--
-- Application :
--   mysql -u root -p healthsafety < V004__dosimetry_audit_triggers.sql
--
-- Verification :
--   SHOW TRIGGERS WHERE `Table` LIKE 'dosimetry_%';
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Drop si deja presents (idempotence) ──
DROP TRIGGER IF EXISTS trg_dosimetry_audit_log_no_update;
DROP TRIGGER IF EXISTS trg_dosimetry_audit_log_no_delete;
DROP TRIGGER IF EXISTS trg_dosimetry_dose_record_append_only;

DELIMITER $$

-- ───────────────────────────────────────────────────────────────────────────
-- 1) dosimetry_audit_log : rejet de toute UPDATE
-- ───────────────────────────────────────────────────────────────────────────
CREATE TRIGGER trg_dosimetry_audit_log_no_update
BEFORE UPDATE ON dosimetry_audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'dosimetry_audit_log is INSERT-ONLY (AIEA GSR Part 3 traceability)';
END$$

-- ───────────────────────────────────────────────────────────────────────────
-- 2) dosimetry_audit_log : rejet de toute DELETE
-- ───────────────────────────────────────────────────────────────────────────
CREATE TRIGGER trg_dosimetry_audit_log_no_delete
BEFORE DELETE ON dosimetry_audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'dosimetry_audit_log is INSERT-ONLY (AIEA GSR Part 3 traceability)';
END$$

-- ───────────────────────────────────────────────────────────────────────────
-- 3) dosimetry_dose_record : append-only avec exception sur superseded_record_id
--
--    Regles :
--      a) Si OLD.superseded_record_id IS NOT NULL : la ligne est scellee,
--         AUCUNE modification autorisee.
--      b) Sinon : seule la transition OLD.superseded_record_id NULL -> NEW.X
--         est autorisee. Toute autre difference colonne / colonne est rejetee.
--
--    NB : on compare colonne par colonne avec NULL-safe (<=>) pour gerer les
--    valeurs NULL des champs optionnels (hp10, hp007, hp3, notes...).
-- ───────────────────────────────────────────────────────────────────────────
CREATE TRIGGER trg_dosimetry_dose_record_append_only
BEFORE UPDATE ON dosimetry_dose_record
FOR EACH ROW
BEGIN
    -- (a) Chainage deja scelle : interdit toute modification.
    IF OLD.superseded_record_id IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Dose records are append-only (chain already sealed)';
    END IF;

    -- (b) Verifie qu'aucune autre colonne n'est modifiee.
    IF NOT (
            NEW.worker_id            <=> OLD.worker_id
        AND NEW.period               <=> OLD.period
        AND NEW.hp10                 <=> OLD.hp10
        AND NEW.hp007                <=> OLD.hp007
        AND NEW.hp3                  <=> OLD.hp3
        AND NEW.source               <=> OLD.source
        AND NEW.below_detection      <=> OLD.below_detection
        AND NEW.attachment_urls      <=> OLD.attachment_urls
        AND NEW.notes                <=> OLD.notes
        AND NEW.recorded_by          <=> OLD.recorded_by
        AND NEW.recorded_at          <=> OLD.recorded_at
        AND NEW.version              <=> OLD.version
        AND NEW.created_at           <=> OLD.created_at
        AND NEW.updated_at           <=> OLD.updated_at
        AND NEW.created_by           <=> OLD.created_by
        AND NEW.updated_by           <=> OLD.updated_by
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Dose records are append-only (only superseded_record_id is mutable)';
    END IF;
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════
-- Test rapide (a executer manuellement) :
--   UPDATE dosimetry_audit_log SET action='X' WHERE id=1;
--     -- doit lever : Error 1644 (45000): dosimetry_audit_log is INSERT-ONLY ...
--   DELETE FROM dosimetry_audit_log WHERE id=1;
--     -- doit lever : Error 1644 (45000): dosimetry_audit_log is INSERT-ONLY ...
--   UPDATE dosimetry_dose_record SET hp10=99 WHERE id=1;
--     -- doit lever : Dose records are append-only (only superseded_record_id is mutable)
--   UPDATE dosimetry_dose_record SET superseded_record_id=2 WHERE id=1;
--     -- doit passer (premiere fois), echouer ensuite (chain already sealed)
-- ═══════════════════════════════════════════════════════════════════════════
