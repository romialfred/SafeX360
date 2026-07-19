-- ============================================================================
-- V022 - Idempotence SOS : rejouer un POST (reseau/offline) ne cree pas de
-- doublon. Colonne nullable (NULL multiples permis en MySQL) + index UNIQUE.
-- ============================================================================
-- SCRIPT IDEMPOTENT (convention projet : applique a la MAIN, pas de Flyway).
-- Deux chemins peuvent avoir deja cree la COLONNE : une execution precedente
-- du script, ou Hibernate ddl-auto=update au premier boot du nouveau code -
-- qui, lui, ne creera JAMAIS l'index unique. Ce script doit donc pouvoir
-- passer APRES un boot et poser uniquement ce qui manque : sans l'index
-- unique, l'idempotence SOS n'est pas garantie.

DROP PROCEDURE IF EXISTS safex_v022;
DELIMITER $$
CREATE PROCEDURE safex_v022()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sos_alert'
                     AND COLUMN_NAME = 'client_request_id') THEN
        ALTER TABLE sos_alert ADD COLUMN client_request_id VARCHAR(64) NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sos_alert'
                     AND INDEX_NAME = 'ux_sos_client_request') THEN
        CREATE UNIQUE INDEX ux_sos_client_request ON sos_alert (client_request_id);
    END IF;
END$$
DELIMITER ;
CALL safex_v022();
DROP PROCEDURE IF EXISTS safex_v022;
