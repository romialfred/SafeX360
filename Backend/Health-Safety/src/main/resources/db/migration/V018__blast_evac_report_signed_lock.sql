-- ═══════════════════════════════════════════════════════════════════════════
-- V018 — Module Blast Management : verrou append-only post-signature
-- ═══════════════════════════════════════════════════════════════════════════
-- Conformite : reglement HSE mining + RGPD art.30 (integrite des registres
-- post-signature). Compatible MySQL 8.0+.
--
-- Contexte (P6 — Rapport d'evacuation + signature + export PDF) :
--   Apres signature d'un rapport d'evacuation (signedAt != NULL), les
--   colonnes `incidents`, `mustered_count`, `missing_count` deviennent
--   strictement read-only au niveau BDD. Le service applique la meme
--   regle cote applicatif via BlastEvacuationReportServiceImpl.assertNotSigned,
--   mais le trigger SQL ci-dessous defend en profondeur contre toute
--   ecriture qui contournerait le service (job batch, console DBA, etc.).
--
--   Les colonnes signed_off_by et signed_at sont elles aussi figees apres
--   la premiere signature (a la difference d'un workflow "deconnecte" :
--   on ne dessigne pas, on emet un nouveau rapport si besoin).
--
-- IDEMPOTENCE : DROP TRIGGER IF EXISTS avant CREATE TRIGGER.
-- ═══════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_blast_evac_report_no_update_after_sign;

DELIMITER //
CREATE TRIGGER trg_blast_evac_report_no_update_after_sign
BEFORE UPDATE ON blast_evacuation_report
FOR EACH ROW
BEGIN
    -- Si l'ancienne ligne etait deja signee (OLD.signed_at IS NOT NULL),
    -- toute modification des champs verrouilles est rejetee.
    IF OLD.signed_at IS NOT NULL THEN
        IF NOT (OLD.incidents <=> NEW.incidents) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'blast_evacuation_report.incidents is read-only after signature';
        END IF;
        IF NOT (OLD.mustered_count <=> NEW.mustered_count) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'blast_evacuation_report.mustered_count is read-only after signature';
        END IF;
        IF NOT (OLD.missing_count <=> NEW.missing_count) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'blast_evacuation_report.missing_count is read-only after signature';
        END IF;
        IF NOT (OLD.signed_off_by <=> NEW.signed_off_by) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'blast_evacuation_report.signed_off_by is immutable after signature';
        END IF;
        IF NOT (OLD.signed_at <=> NEW.signed_at) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'blast_evacuation_report.signed_at is immutable after signature';
        END IF;
    END IF;
END//
DELIMITER ;
