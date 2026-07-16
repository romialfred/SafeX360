-- =====================================================================
-- migrate_equipment_families.sql  (schéma : healthsafety / HNS)
-- =====================================================================
-- ⛔ OBSOLÈTE — NE PLUS EXÉCUTER. Remplacé par migrate_equipment_family_keys.sql.
-- Ce script écrit des LIBELLÉS FR dans `equipment.type` ; depuis la décision D1
-- (réforme Inspections), ce champ porte une CLÉ canonique (HEAVY_TRUCK,
-- WHEEL_LOADER…) appariée à `inspection_template.scope_ref`. Le rejouer
-- ANNULERAIT la migration vers les clés et re-casserait le filtrage des
-- modèles d'inspection. Conservé uniquement pour l'historique.
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
--
-- ⚠ OBLIGATOIRE : passer `--default-character-set=utf8mb4` au client mysql.
-- Ce fichier contient des accents (« Groupes électrogènes »). Sans cette
-- option, le client lit les octets UTF-8 comme du latin1 et les ré-encode :
-- on obtient un DOUBLE ENCODAGE en base (« Groupes Ã©lectrogÃ¨nes »), visible
-- tel quel dans l'IHM. Contrôle : `SELECT HEX(type) ...` doit donner C3A9 pour
-- « é » (et non C383C2A9).
--   docker exec -i safex-mysql mysql -uroot -p<pwd> --default-character-set=utf8mb4 healthsafety < migrate_equipment_families.sql
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
