-- ===========================================================================
-- Migration — cloisonnement par mine (company_id) de TOUS les modules HNS.
-- Cible : schéma HNS (healthsafety). À exécuter APRÈS déploiement du nouveau
-- code HNS (Hibernate ddl-auto=update crée les colonnes company_id au boot).
-- Idempotent : les UPDATE sont gardés par `WHERE company_id IS NULL`.
-- MySQL 8 ne supporte PAS `ADD COLUMN IF NOT EXISTS` : les ALTER ci-dessous ne
-- sont à jouer QUE si la colonne n'existe pas (sinon Hibernate l'a déjà créée →
-- n'exécuter alors QUE les UPDATE de backfill).
-- Mine par défaut de backfill = 1 (Burkina GOLD SA).
-- À appliquer aux DEUX bases : Docker local `safex-mysql` ET Aiven prod.
-- ===========================================================================

-- ---------- RISQUES ISO + CHIMIQUE ----------
UPDATE risks                  SET company_id = 1 WHERE company_id IS NULL;
UPDATE risk_analysis          SET company_id = 1 WHERE company_id IS NULL;
UPDATE risk_control           SET company_id = 1 WHERE company_id IS NULL;
UPDATE opportunity            SET company_id = 1 WHERE company_id IS NULL;
UPDATE chemical_risks         SET company_id = 1 WHERE company_id IS NULL;
UPDATE chemical_risk_analysis SET company_id = 1 WHERE company_id IS NULL;

-- ---------- NON-CONFORMITÉS + LEÇONS ----------
UPDATE non_conformity SET company_id = 1 WHERE company_id IS NULL;
UPDATE lesson_learned SET company_id = 1 WHERE company_id IS NULL;
-- EventAnalysis : pas de colonne (filtré via la NC parente).

-- ---------- AUDITS (AuditProgram déjà scopé) ----------
UPDATE audit               SET company_id = 1 WHERE company_id IS NULL;
UPDATE report              SET company_id = 1 WHERE company_id IS NULL;
UPDATE auditor             SET company_id = 1 WHERE company_id IS NULL;
UPDATE audit_history       SET company_id = 1 WHERE company_id IS NULL;
UPDATE area                SET company_id = 1 WHERE company_id IS NULL;
UPDATE audit_observations  SET company_id = 1 WHERE company_id IS NULL;
UPDATE meeting             SET company_id = 1 WHERE company_id IS NULL;
UPDATE contributor         SET company_id = 1 WHERE company_id IS NULL;
UPDATE recommendation      SET company_id = 1 WHERE company_id IS NULL;
UPDATE effectiveness_check SET company_id = 1 WHERE company_id IS NULL;

-- ---------- INSPECTIONS ----------
UPDATE general_inspection    SET company_id = 1 WHERE company_id IS NULL;
UPDATE inspection_template   SET company_id = 1 WHERE company_id IS NULL;
UPDATE inspection_finding    SET company_id = 1 WHERE company_id IS NULL;
UPDATE inspection_approval   SET company_id = 1 WHERE company_id IS NULL;
UPDATE inspection_checklist  SET company_id = 1 WHERE company_id IS NULL;
UPDATE inspection_interviews SET company_id = 1 WHERE company_id IS NULL;
UPDATE inspection_measurement SET company_id = 1 WHERE company_id IS NULL;
UPDATE inspection_report     SET company_id = 1 WHERE company_id IS NULL;
UPDATE inspection_history    SET company_id = 1 WHERE company_id IS NULL;

-- ---------- EPI ----------
UPDATE ppe         SET company_id = 1 WHERE company_id IS NULL;
UPDATE ppe_stock   SET company_id = 1 WHERE company_id IS NULL;
UPDATE ppe_request SET company_id = 1 WHERE company_id IS NULL;
UPDATE ppe_emp     SET company_id = 1 WHERE company_id IS NULL;

-- ---------- BLAST : backfill = mine_id (le mineId EST le tenant réel) ----------
UPDATE blast SET company_id = mine_id WHERE company_id IS NULL;

-- ---------- DOCUMENTS + COMMUNICATIONS ----------
UPDATE documents      SET company_id = 1 WHERE company_id IS NULL;
UPDATE communications SET company_id = 1 WHERE company_id IS NULL;

-- ---------- ACTIVITÉS (planning) : PAS de backfill ----------
-- Les activités existantes restent company_id NULL = GLOBAL (visibles de toutes
-- les mines) — rétrocompat des activités seedées globalement (ex. TDM). Les
-- nouvelles activités porteront la mine active.


-- ---------- CONFORMITÉ (ComplianceDocs) ----------
UPDATE compliance_docs SET company_id = 1 WHERE company_id IS NULL;

-- Vérification (manuel) : compter les lignes encore NULL par table.
