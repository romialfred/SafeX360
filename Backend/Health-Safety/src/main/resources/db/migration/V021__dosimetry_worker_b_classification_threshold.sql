-- ============================================================================
-- V021 - AUD-REG-002 : distinguer classification radiologique et limite legale
-- ============================================================================
-- Le niveau de 6 mSv associe a WORKER_B est un seuil de CLASSIFICATION. Il ne
-- doit jamais etre utilise comme limite reglementaire annuelle du travailleur.
--
-- SCRIPT IDEMPOTENT (convention projet : applique a la MAIN, pas de Flyway).
-- Hibernate ddl-auto=update cree la colonne au premier boot du nouveau code
-- mais JAMAIS la contrainte CHECK : le script doit pouvoir passer avant OU
-- apres un boot, et ne poser que ce qui manque.

DROP PROCEDURE IF EXISTS safex_v021;
DELIMITER $$
CREATE PROCEDURE safex_v021()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dosimetry_threshold'
                     AND COLUMN_NAME = 'classification_threshold') THEN
        ALTER TABLE dosimetry_threshold
            ADD COLUMN classification_threshold DOUBLE NULL AFTER action_level;
    END IF;

    -- Migration semantique des donnees historiques, sans substituer 20 mSv.
    -- Naturellement idempotente : le WHERE ne matche plus apres le 1er passage.
    UPDATE dosimetry_threshold
    SET classification_threshold = COALESCE(classification_threshold, 6.0),
        regulatory_limit = NULL,
        updated_at = NOW(6)
    WHERE person_category = 'WORKER_B'
      AND regulatory_limit IS NOT NULL
      AND ABS(regulatory_limit - 6.0) < 0.000001;

    -- Defense en profondeur contre la reintroduction de l'ambiguite.
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dosimetry_threshold'
                     AND CONSTRAINT_NAME = 'chk_threshold_worker_b_6_not_regulatory') THEN
        ALTER TABLE dosimetry_threshold
            ADD CONSTRAINT chk_threshold_worker_b_6_not_regulatory
            CHECK (
                person_category <> 'WORKER_B'
                OR regulatory_limit IS NULL
                OR ABS(regulatory_limit - 6.0) >= 0.000001
            );
    END IF;
END$$
DELIMITER ;
CALL safex_v021();
DROP PROCEDURE IF EXISTS safex_v021;
