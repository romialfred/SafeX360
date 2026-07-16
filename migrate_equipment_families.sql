-- =====================================================================
-- migrate_equipment_families.sql  (schéma : healthsafety / HNS)
-- =====================================================================
-- Reclasse le champ `type` des équipements depuis une granularité TECHNIQUE
-- trop large (ENGIN / INSTALLATION) vers la FAMILLE MÉTIER (Camions, Pelles,
-- Foreuses…). C'est ce champ qui sert désormais de CATÉGORIE de regroupement
-- dans la liste déroulante des cibles d'inspection : avec seulement ENGIN et
-- INSTALLATION, le regroupement n'avait aucun intérêt.
--
-- Idempotent : chaque UPDATE est ciblé par `code` et rejouable sans effet.
-- Le seeder (EquipmentSeeder.java) a été aligné pour les futures mines, mais
-- il est idempotent et ne met PAS à jour les lignes déjà présentes — d'où ce
-- script pour l'existant.
--
-- À exécuter sur les DEUX bases : Docker local `safex-mysql` ET Aiven prod.
-- =====================================================================

UPDATE equipment SET type = 'Camions'              WHERE code IN ('CAM-A40G-18', 'CAM-777F');
UPDATE equipment SET type = 'Pelles'               WHERE code IN ('EXC-336', 'EXC-6015B');
UPDATE equipment SET type = 'Foreuses'             WHERE code IN ('FOR-DML');
UPDATE equipment SET type = 'Chargeuses'           WHERE code IN ('CHA-966H');
UPDATE equipment SET type = 'Concasseurs'          WHERE code IN ('CONC-C160');
UPDATE equipment SET type = 'Groupes électrogènes' WHERE code IN ('GEN-500', 'GEN-250');

-- Filet : tout équipement resté sur l'ancienne nomenclature technique est
-- marqué « Autre » plutôt que de polluer la liste avec un groupe « ENGIN ».
UPDATE equipment SET type = 'Autre' WHERE type IN ('ENGIN', 'INSTALLATION', 'VEHICULE', 'MACHINE', 'OUTILLAGE');

-- Vérification :
--   SELECT type, COUNT(*) FROM equipment GROUP BY type ORDER BY type;
--   -- attendu : Camions 2, Chargeuses 1, Concasseurs 1, Foreuses 1,
--   --           Groupes électrogènes 2, Pelles 2 — et AUCUN ENGIN/INSTALLATION.
