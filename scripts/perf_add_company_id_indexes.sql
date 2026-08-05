-- ─────────────────────────────────────────────────────────────────────────────
-- Migration performance : index sur toutes les colonnes `company_id`.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- CONTEXTE. SafeX 360 est multi-mines : PRESQUE CHAQUE requete filtre sur
-- `company_id` (cloisonnement tenant). Or 75 des 141 colonnes `company_id` de
-- la plateforme n'avaient AUCUN index de tete — chaque lecture faisait donc un
-- balayage complet de table. Invisible aujourd'hui (tables petites), c'est un
-- mur des que les volumes montent, et un cout systematiquement paye a chaque
-- requete, aggrave par la latence reseau applicatif <-> base.
--
-- Non destructif et reversible (DROP INDEX). N'affecte pas `ddl-auto: update` :
-- Hibernate en mode `update` n'a jamais supprime un index qu'il n'a pas cree.
--
-- IDEMPOTENT. MySQL 8 ne connait pas `CREATE INDEX IF NOT EXISTS`. La procedure
-- ci-dessous ne cree l'index que s'il MANQUE : rejouable sans erreur, sur la
-- base locale comme sur Aiven, quel que soit leur etat courant.
--
-- A EXECUTER avec --default-character-set=utf8mb4.
-- ─────────────────────────────────────────────────────────────────────────────

-- Schema hote de la procedure (elle opere sur les DEUX schemas via des noms
-- pleinement qualifies). `defaultdb` existe toujours, en local comme sur Aiven.
USE defaultdb;

DELIMITER //

DROP PROCEDURE IF EXISTS safex_ensure_company_indexes //

CREATE PROCEDURE safex_ensure_company_indexes()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_schema VARCHAR(64);
    DECLARE v_table  VARCHAR(64);
    DECLARE v_index  VARCHAR(128);

    -- Cible : toute colonne `company_id` d'une table de base des deux schemas
    -- metier, qui n'est PAS deja en tete d'un index.
    DECLARE cur CURSOR FOR
        SELECT c.TABLE_SCHEMA, c.TABLE_NAME
        FROM information_schema.COLUMNS c
        JOIN information_schema.TABLES t
          ON t.TABLE_SCHEMA = c.TABLE_SCHEMA
         AND t.TABLE_NAME   = c.TABLE_NAME
         AND t.TABLE_TYPE   = 'BASE TABLE'
        LEFT JOIN information_schema.STATISTICS s
          ON s.TABLE_SCHEMA = c.TABLE_SCHEMA
         AND s.TABLE_NAME   = c.TABLE_NAME
         AND s.COLUMN_NAME  = c.COLUMN_NAME
         AND s.SEQ_IN_INDEX = 1
        WHERE c.TABLE_SCHEMA IN ('healthsafety', 'defaultdb')
          AND c.COLUMN_NAME  = 'company_id'
          AND s.INDEX_NAME IS NULL;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_schema, v_table;
        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        SET v_index = CONCAT('idx_', v_table, '_company');
        SET @ddl = CONCAT('CREATE INDEX `', v_index, '` ON `', v_schema, '`.`', v_table, '` (`company_id`)');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;
    CLOSE cur;
END //

DELIMITER ;

CALL safex_ensure_company_indexes();
DROP PROCEDURE safex_ensure_company_indexes;

-- Controle : doit renvoyer 0 apres execution.
SELECT COUNT(*) AS colonnes_company_id_sans_index
FROM information_schema.COLUMNS c
JOIN information_schema.TABLES t
  ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
LEFT JOIN information_schema.STATISTICS s
  ON s.TABLE_SCHEMA = c.TABLE_SCHEMA AND s.TABLE_NAME = c.TABLE_NAME
 AND s.COLUMN_NAME = c.COLUMN_NAME AND s.SEQ_IN_INDEX = 1
WHERE c.TABLE_SCHEMA IN ('healthsafety', 'defaultdb')
  AND c.COLUMN_NAME = 'company_id'
  AND s.INDEX_NAME IS NULL;
