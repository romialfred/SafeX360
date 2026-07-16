-- =====================================================================
-- relax_inspection_notnull.sql  (schéma : healthsafety / HNS)
-- =====================================================================
-- Contexte : le workflow d'inspection refondu (template + cible) ne crée
-- plus d'Activity legacy et dérive le lieu (site) depuis la cible. Or les
-- colonnes general_inspection.activity_id et site_id étaient NOT NULL, ce
-- qui faisait échouer TOUTE planification (« Échec de la planification »).
--
-- Hibernate ddl-auto=update ne relâche pas une contrainte NOT NULL
-- existante : on la relâche explicitement ici. Idempotent (rejouable).
--
-- À exécuter sur les DEUX bases : MySQL local (safex-mysql) ET Aiven prod.
--   docker exec -i safex-mysql mysql -uroot -p<pwd> healthsafety < relax_inspection_notnull.sql
--   mysql --ssl-mode=REQUIRED -h datauniversmysql01-minex-360.g.aivencloud.com \
--         -P 23891 -u avnadmin -p<pwd> healthsafety < relax_inspection_notnull.sql
-- =====================================================================

-- activity_id : legacy, désormais optionnel (les inspections template n'en ont pas).
-- La contrainte UNIQUE est conservée (MySQL autorise plusieurs NULL sous UNIQUE).
ALTER TABLE `general_inspection` MODIFY COLUMN `activity_id` BIGINT NULL;

-- site_id : lieu physique optionnel (dérivé de la cible). La mine reste portée
-- par company_id (cloisonnement), pas par site_id.
ALTER TABLE `general_inspection` MODIFY COLUMN `site_id` BIGINT NULL;

-- Vérification :
--   SHOW COLUMNS FROM general_inspection LIKE 'activity_id';  -- Null = YES
--   SHOW COLUMNS FROM general_inspection LIKE 'site_id';      -- Null = YES
