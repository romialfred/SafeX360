-- ============================================================================
--  SafeX 360 — Index de cloisonnement (company_id) sur les tables chaudes HNS
-- ----------------------------------------------------------------------------
--  POURQUOI CE SCRIPT PLUTÔT QUE DES ANNOTATIONS @Index
--
--  `ddl-auto=update` n'ajoute PAS de façon fiable un index à une table qui
--  existe DÉJÀ : une annotation @Index ajoutée après coup n'a d'effet que sur
--  une base neuve. C'est le cas ici — constat vérifié sur la base locale :
--  la table `incident` ne porte AUCUN index sur company_id alors qu'elle est
--  filtrée par mine à chaque requête.
--
--  (Pour mémoire : le camelCase dans un `columnList` n'est PAS un problème —
--  Hibernate lui applique la stratégie de nommage. Vérifié : l'annotation
--  "plannedDate" de GeneralInspection a bien produit un index sur la colonne
--  physique `planned_date`. Les deux écritures sont valides.)
--
--  Ce script est donc la source de vérité pour les index sur une base EXISTANTE.
--
--  PROPRIÉTÉS
--  • IDEMPOTENT : rejouable autant de fois que voulu, il ne recrée rien.
--  • AUTO-VÉRIFIANT : un index n'est créé QUE si la table ET toutes ses colonnes
--    existent. Si un nom de table est faux, la ligne est ignorée — jamais
--    d'erreur bloquante ni de table créée par erreur.
--  • TRAÇABLE : chaque décision (créé / déjà présent / table absente) est
--    affichée dans le résultat.
--
--  POURQUOI CES INDEX
--  Toutes les lectures HNS sont cloisonnées : `WHERE (:companyId IS NULL OR
--  x.company_id = :companyId)`. Sans index sur company_id, chacune de ces
--  requêtes fait un balayage complet de table. Les index composites
--  (company_id, status) et (company_id, created_at) couvrent en plus les
--  filtres et tris les plus fréquents (listes par statut, tableaux de bord
--  par période) sans lecture supplémentaire.
--
--  USAGE
--    mysql --default-character-set=utf8mb4 -h <host> -P <port> -u <user> -p <db> \
--          < migrations/indexes/01_hns_company_indexes.sql
--
--  COÛT : la création d'index verrouille brièvement la table en écriture.
--  Sur des volumes modestes c'est immédiat ; à exécuter tout de même hors
--  heure de pointe.
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS safex_create_index_if_absent $$
CREATE PROCEDURE safex_create_index_if_absent(
    IN p_table   VARCHAR(64),
    IN p_index   VARCHAR(64),
    IN p_columns VARCHAR(255)   -- ex. 'company_id' ou 'company_id, status'
)
BEGIN
    DECLARE v_table_exists  INT DEFAULT 0;
    DECLARE v_index_exists  INT DEFAULT 0;
    DECLARE v_cols_missing  INT DEFAULT 0;
    DECLARE v_sql           TEXT;

    -- 1) La table existe-t-elle dans le schéma courant ?
    SELECT COUNT(*) INTO v_table_exists
      FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table;

    IF v_table_exists = 0 THEN
        SELECT CONCAT('IGNORE  ', p_index, ' : table `', p_table, '` absente') AS resultat;
    ELSE
        -- 2) Toutes les colonnes visées existent-elles ?
        SELECT COUNT(*) INTO v_cols_missing
          FROM (
                SELECT TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(p_columns, ',', n.num), ',', -1)) AS col
                  FROM (SELECT 1 AS num UNION ALL SELECT 2 UNION ALL SELECT 3) n
                 WHERE n.num <= 1 + LENGTH(p_columns) - LENGTH(REPLACE(p_columns, ',', ''))
               ) AS wanted
         WHERE NOT EXISTS (
                SELECT 1 FROM information_schema.COLUMNS c
                 WHERE c.TABLE_SCHEMA = DATABASE()
                   AND c.TABLE_NAME   = p_table
                   AND c.COLUMN_NAME  = wanted.col
               );

        IF v_cols_missing > 0 THEN
            SELECT CONCAT('IGNORE  ', p_index, ' : colonne(s) absente(s) dans `',
                          p_table, '` (', p_columns, ')') AS resultat;
        ELSE
            -- 3) L'index existe-t-il déjà (par son nom) ?
            SELECT COUNT(*) INTO v_index_exists
              FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = p_table
               AND INDEX_NAME   = p_index;

            IF v_index_exists > 0 THEN
                SELECT CONCAT('OK      ', p_index, ' : deja present') AS resultat;
            ELSE
                SET v_sql = CONCAT('CREATE INDEX `', p_index, '` ON `', p_table,
                                   '` (', p_columns, ')');
                SET @ddl = v_sql;
                PREPARE stmt FROM @ddl;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                SELECT CONCAT('CREE    ', p_index, ' ON ', p_table, ' (', p_columns, ')') AS resultat;
            END IF;
        END IF;
    END IF;
END $$

DELIMITER ;

-- NOTE DE CONCEPTION — pas d'index simple sur company_id quand un composite
-- (company_id, X) existe : InnoDB applique la règle du PRÉFIXE LE PLUS À GAUCHE,
-- donc `WHERE company_id = ?` utilise déjà le composite. Un index simple en plus
-- serait redondant et ne ferait que ralentir les écritures. On ne pose un index
-- simple que sur les tables sans composite.

-- ── Incidents : la table la plus lue (listes, tableau de bord, mobile) ──────
CALL safex_create_index_if_absent('incident', 'idx_incident_company_status',     'company_id, status');
CALL safex_create_index_if_absent('incident', 'idx_incident_company_occurred',   'company_id, occurred_at');
CALL safex_create_index_if_absent('incident', 'idx_incident_company_created',    'company_id, created_at');
CALL safex_create_index_if_absent('incident_detail', 'idx_incident_detail_incident', 'incident_id');

-- ── Audits ─────────────────────────────────────────────────────────────────
CALL safex_create_index_if_absent('audit', 'idx_audit_company_status', 'company_id, status');

-- ── Inspections ────────────────────────────────────────────────────────────
CALL safex_create_index_if_absent('general_inspection', 'idx_inspection_company_status', 'company_id, status');

-- ── Actions correctives (dont le calcul « en retard » du tableau de bord) ──
CALL safex_create_index_if_absent('corrective_action', 'idx_capa_company_status',    'company_id, status');
CALL safex_create_index_if_absent('corrective_action', 'idx_capa_company_deadline',  'company_id, deadline');

-- ── Non-conformités / quasi-accidents ──────────────────────────────────────
CALL safex_create_index_if_absent('non_conformity', 'idx_nc_company_type',   'company_id, type');
CALL safex_create_index_if_absent('non_conformity', 'idx_nc_company_status', 'company_id, status');

-- ── Risques ────────────────────────────────────────────────────────────────
CALL safex_create_index_if_absent('risks', 'idx_risk_company_status', 'company_id, status');

-- ── EPI ────────────────────────────────────────────────────────────────────
CALL safex_create_index_if_absent('ppe',         'idx_ppe_company',         'company_id');
CALL safex_create_index_if_absent('ppe_request', 'idx_ppe_request_company', 'company_id');

-- ── Indicateurs de performance (module Target & Forecast) ──────────────────
-- Ces tables sont récentes : leurs @Index ont donc bien été créés à la
-- création des tables. Les CALL ci-dessous sont alors de simples « deja
-- present » — on les garde pour que le script soit exhaustif et rejouable
-- sur n'importe quel environnement (dont une base restaurée plus ancienne).
CALL safex_create_index_if_absent('hs_indicator',         'idx_indicator_company',      'company_id');
CALL safex_create_index_if_absent('indicator_plan',       'idx_plan_company',           'company_id');
CALL safex_create_index_if_absent('indicator_plan_entry', 'idx_plan_entry_plan',        'plan_id');

-- ── Préférences de notification ────────────────────────────────────────────
CALL safex_create_index_if_absent('notification_preference', 'idx_notifpref_user_company', 'user_id, company_id');

-- Nettoyage : la procédure n'a pas vocation à rester en base.
DROP PROCEDURE IF EXISTS safex_create_index_if_absent;

-- ============================================================================
--  VÉRIFICATION APRÈS EXÉCUTION — liste les index company_id réellement posés
--
--  SELECT TABLE_NAME, INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
--    FROM information_schema.STATISTICS
--   WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME LIKE 'idx_%'
--   GROUP BY TABLE_NAME, INDEX_NAME ORDER BY TABLE_NAME;
-- ============================================================================
