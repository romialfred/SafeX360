-- ===========================================================================
-- Migration — cloisonnement par mine (company_id) des THÈMES mensuels
-- (module Planification annuelle → Thèmes mensuels).
-- Cible : schéma HNS (healthsafety). À exécuter APRÈS déploiement du nouveau
-- code HNS (Hibernate ddl-auto=update crée la colonne company_id au boot).
-- Idempotent : l'UPDATE est gardé par `WHERE company_id IS NULL`.
-- MySQL 8 ne supporte PAS `ADD COLUMN IF NOT EXISTS` : l'ALTER ci-dessous
-- n'est à jouer QUE si la colonne n'existe pas (sinon Hibernate l'a déjà créée
-- → n'exécuter alors QUE l'UPDATE de backfill).
-- Mine par défaut de backfill = 1 (Burkina GOLD SA).
-- À appliquer aux DEUX bases : Docker local `safex-mysql` ET Aiven prod.
-- ===========================================================================

-- ---------- Filet de sécurité si Hibernate n'a pas (encore) créé la colonne --
-- Décommenter UNIQUEMENT si `SHOW COLUMNS FROM theme LIKE 'company_id'` est vide :
-- ALTER TABLE theme ADD COLUMN company_id BIGINT NULL;

-- ---------- THÈMES (planning) : backfill sur la mine 1 ----------
-- Les thèmes existants ont été saisis avant le cloisonnement, tous depuis
-- Burkina GOLD SA (mine 1) : on les rattache explicitement à cette mine plutôt
-- que de les laisser globaux, pour qu'ils ne fuient pas vers les autres mines.
UPDATE theme SET company_id = 1 WHERE company_id IS NULL;

-- ---------- ACTIVITÉS (planning) : colonne `theme` ----------
-- Ajout du champ thème persisté sur l'activité (Hibernate ddl-auto=update le
-- crée au boot). Décommenter UNIQUEMENT si `SHOW COLUMNS FROM activity LIKE
-- 'theme'` est vide :
-- ALTER TABLE activity ADD COLUMN theme VARCHAR(255) NULL;
-- Pas de backfill : les activités antérieures n'ont jamais porté de thème
-- (il était jeté silencieusement par l'API).

-- Vérification (manuel) :
--   SELECT COUNT(*) FROM theme WHERE company_id IS NULL;   -- attendu : 0
--   SELECT company_id, COUNT(*) FROM theme GROUP BY company_id;
