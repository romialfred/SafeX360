-- ═══════════════════════════════════════════════════════════════════════════
-- LOT 48 Phase 6 — Triggers MySQL pour rendre emergency_audit_log immuable
-- ═══════════════════════════════════════════════════════════════════════════
-- ISO 45001 §9.1.2 : preuves d'audit conservées 5 ans MINIMUM en INSERT-ONLY.
-- L'entité Java est déjà @Immutable côté Hibernate, mais ces triggers ajoutent
-- une garantie BDD contre toute tentative directe (DBA, SQL direct, etc.).
--
-- Important : ce script est exécuté MANUELLEMENT (ou par flyway si activé)
-- car la migration BDD n'est pas branchée sur le démarrage Spring (ddl-auto:
-- update). Pour appliquer :
--   mysql -u root -p healthsafety < V002__emergency_audit_immutable_triggers.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Drop si déjà présents (idempotence) ──
DROP TRIGGER IF EXISTS trg_emergency_audit_log_no_update;
DROP TRIGGER IF EXISTS trg_emergency_audit_log_no_delete;

DELIMITER $$

-- Rejette toute tentative de UPDATE sur la table d'audit
CREATE TRIGGER trg_emergency_audit_log_no_update
BEFORE UPDATE ON emergency_audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'emergency_audit_log is INSERT-ONLY (ISO 45001 §9.1.2)';
END$$

-- Rejette toute tentative de DELETE sur la table d'audit (purge auto autorisée
-- uniquement via une procédure dédiée — Phase 7 archivage > 5 ans)
CREATE TRIGGER trg_emergency_audit_log_no_delete
BEFORE DELETE ON emergency_audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'emergency_audit_log is INSERT-ONLY (ISO 45001 §9.1.2)';
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════
-- Vérification (peut être exécutée séparément) :
--   SHOW TRIGGERS WHERE `Table` = 'emergency_audit_log';
-- ═══════════════════════════════════════════════════════════════════════════
