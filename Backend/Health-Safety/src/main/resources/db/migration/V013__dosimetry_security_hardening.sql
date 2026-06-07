-- ═══════════════════════════════════════════════════════════════════════════
-- V013 — Module Dosimetrie : durcissement securite Phase 10-A (indexes)
-- ═══════════════════════════════════════════════════════════════════════════
-- Conformite : AIEA GSR Part 3, RGPD.
--
-- Objectif : ajouter les indexes manquants identifies lors des audits qualite
-- des Phases 5-7 pour soutenir les scans periodiques du NotificationScheduler
-- (scanStaleActiveAlerts et scanStaleOpenCases).
--
-- Idempotence : MySQL 8.0+ ne supporte pas "CREATE INDEX IF NOT EXISTS" en
-- syntaxe standard, donc on utilise un appel a la table INFORMATION_SCHEMA
-- pour ne creer l'index que s'il n'existe pas deja (script rejouable).
--
-- Application :
--   mysql -u root -p healthsafety < V013__dosimetry_security_hardening.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1) idx_alert_status_triggered (status, triggered_at DESC)
-- ───────────────────────────────────────────────────────────────────────────
-- Supporte la requete repo `findByStatusAndTriggeredAtBefore(status, cutoff)`
-- utilisee chaque heure par NotificationScheduler.scanStaleActiveAlerts pour
-- detecter les alertes ACTIVE non acknowledged depuis > 24h.
--
-- L'index existant idx_exposure_alert_worker_status (worker_id, status) ne
-- couvre PAS ce scan car la requete ne porte pas worker_id. L'index
-- idx_exposure_alert_triggered_at (triggered_at) seul n'utilise pas le filtre
-- status comme prefix -> table scan partiel. Le nouvel index colonnes
-- (status, triggered_at) permet un index range scan pur.
-- ───────────────────────────────────────────────────────────────────────────
SET @stmt = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'dosimetry_exposure_alert'
           AND INDEX_NAME = 'idx_alert_status_triggered') = 0,
        'CREATE INDEX idx_alert_status_triggered ON dosimetry_exposure_alert (status, triggered_at DESC)',
        'SELECT ''idx_alert_status_triggered already exists'' AS info'
    )
);
PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) idx_overexposure_worker_status (worker_id, status)
-- ───────────────────────────────────────────────────────────────────────────
-- Cet index existe deja (cf. V003 ligne 317), mais on l'inclut en idempotent
-- au cas ou une migration de schema l'aurait perdu (defense en profondeur).
-- ───────────────────────────────────────────────────────────────────────────
SET @stmt = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'dosimetry_overexposure_case'
           AND INDEX_NAME = 'idx_overexposure_worker_status') = 0,
        'CREATE INDEX idx_overexposure_worker_status ON dosimetry_overexposure_case (worker_id, status)',
        'SELECT ''idx_overexposure_worker_status already exists'' AS info'
    )
);
PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;

-- ───────────────────────────────────────────────────────────────────────────
-- 3) idx_overexposure_alert_status (alert_id, status)
-- ───────────────────────────────────────────────────────────────────────────
-- Supporte la requete `findByAlertIdAndStatusIn(alertId, statuses)` qui evite
-- la double ouverture d'un dossier pour une meme alerte (verifie a la creation
-- d'un OverexposureCase depuis une ExposureAlert).
-- ───────────────────────────────────────────────────────────────────────────
SET @stmt = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'dosimetry_overexposure_case'
           AND INDEX_NAME = 'idx_overexposure_alert_status') = 0,
        'CREATE INDEX idx_overexposure_alert_status ON dosimetry_overexposure_case (alert_id, status)',
        'SELECT ''idx_overexposure_alert_status already exists'' AS info'
    )
);
PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN V013
-- ═══════════════════════════════════════════════════════════════════════════
