-- =====================================================================
-- migrate_equipment_family_keys.sql  (schéma : healthsafety / HNS)
-- =====================================================================
-- D1 — LA FAMILLE D'ÉQUIPEMENT DEVIENT UNE CLÉ CANONIQUE.
--
-- Contexte : `equipment.type` portait un LIBELLÉ FR (« Chargeuses ») alors que
-- `inspection_template.scope_ref` porte une CLÉ EN (« EXCAVATOR »). Aucun
-- appariement machine n'était possible → le formulaire de planification listait
-- TOUS les modèles EQUIPMENT sans filtre, donc on pouvait inspecter une
-- chargeuse avec la checklist d'un camion benne (défaut de SÉCURITÉ).
--
-- Ce script convertit l'existant en base vers les clés canoniques :
--   HEAVY_TRUCK, EXCAVATOR, WHEEL_LOADER, DRILL_RIG, DOZER, GRADER, PICKUP,
--   LIGHT_VEHICLE, CRUSHER, CONVEYOR, GENSET, COMPRESSOR, CRANE, PUMP,
--   TOOLING, OTHER
-- Le LIBELLÉ FR/EN n'est plus stocké : il est porté par l'i18n
-- (`equipment.family.<KEY>`).
--
-- Remplace `migrate_equipment_families.sql` (qui écrivait les libellés FR).
-- `EquipmentSeeder.java` est aligné sur ces clés pour les FUTURES insertions ;
-- il est idempotent et ne met PAS à jour les lignes déjà présentes — d'où ce
-- script pour l'existant.
--
-- Idempotent : conversions ciblées par valeur (les clés déjà en place ne
-- matchent aucun UPDATE) + filet final borné à la liste blanche des clés.
-- Rejouable sans effet de bord.
--
-- À exécuter sur les DEUX bases : Docker local `safex-mysql` ET Aiven prod.
--
-- ⚠ OBLIGATOIRE : passer `--default-character-set=utf8mb4` au client mysql.
-- Ce fichier contient des accents (« Groupes électrogènes », « Véhicules
-- légers »…). Sans cette option, le client lit les octets UTF-8 comme du
-- latin1 et les ré-encode : DOUBLE ENCODAGE en base (« Groupes Ã©lectrogÃ¨nes »)
-- → les WHERE ci-dessous ne matchent plus rien et la migration passe en
-- silence sans rien convertir. Déjà vécu sur ce projet.
--
--   docker exec -i safex-mysql mysql -uroot -p<pwd> --default-character-set=utf8mb4 \
--       healthsafety < migrate_equipment_family_keys.sql
--
--   mysql --ssl-mode=REQUIRED -h datauniversmysql01-minex-360.g.aivencloud.com \
--       -P 23891 -u avnadmin -p<pwd> --default-character-set=utf8mb4 \
--       healthsafety < migrate_equipment_family_keys.sql
--
-- CONTRÔLE D'ENCODAGE (avant conversion, sur la valeur accentuée) :
--   SELECT type, HEX(type) FROM equipment WHERE type LIKE 'Groupes%';
--   -- « é » doit apparaître comme C3A9. Si C383C2A9 → double encodage :
--   -- NE PAS jouer ce script, corriger d'abord l'encodage de la colonne.
-- =====================================================================

-- ── 1. Libellés FR actuellement en base → clés canoniques ────────────
UPDATE equipment SET type = 'HEAVY_TRUCK'   WHERE type = 'Camions';
UPDATE equipment SET type = 'EXCAVATOR'     WHERE type = 'Pelles';
UPDATE equipment SET type = 'WHEEL_LOADER'  WHERE type = 'Chargeuses';
UPDATE equipment SET type = 'DRILL_RIG'     WHERE type = 'Foreuses';
UPDATE equipment SET type = 'CRUSHER'       WHERE type = 'Concasseurs';
UPDATE equipment SET type = 'GENSET'        WHERE type = 'Groupes électrogènes';

-- ── 2. Autres libellés FR possibles (saisie libre historique) ────────
-- La saisie libre du champ famille est SUPPRIMÉE (D1), mais des valeurs ont
-- pu être saisies avant : on les rattrape ici plutôt que de les basculer en
-- OTHER par le filet.
UPDATE equipment SET type = 'DOZER'         WHERE type IN ('Bulldozers', 'Bulldozer');
UPDATE equipment SET type = 'GRADER'        WHERE type IN ('Niveleuses', 'Niveleuse');
UPDATE equipment SET type = 'PICKUP'        WHERE type IN ('Pickups', 'Pickup');
UPDATE equipment SET type = 'LIGHT_VEHICLE' WHERE type IN ('Véhicules légers', 'Véhicule léger');
UPDATE equipment SET type = 'CONVEYOR'      WHERE type IN ('Convoyeurs', 'Convoyeur');
UPDATE equipment SET type = 'COMPRESSOR'    WHERE type IN ('Compresseurs', 'Compresseur');
UPDATE equipment SET type = 'CRANE'         WHERE type IN ('Grues', 'Grue');
UPDATE equipment SET type = 'PUMP'          WHERE type IN ('Pompes', 'Pompe');
UPDATE equipment SET type = 'TOOLING'       WHERE type IN ('Outillage', 'Outils');
UPDATE equipment SET type = 'OTHER'         WHERE type IN ('Autre', 'Autres');

-- ── 3. Filet : toute valeur non reconnue → OTHER ─────────────────────
-- Couvre l'ancienne nomenclature technique (ENGIN, INSTALLATION…), les
-- libellés inconnus, les chaînes vides et les NULL. Aucun équipement ne doit
-- rester sur une valeur non appariable à `inspection_template.scope_ref`.
UPDATE equipment
   SET type = 'OTHER'
 WHERE type IS NULL
    OR type NOT IN (
        'HEAVY_TRUCK', 'EXCAVATOR', 'WHEEL_LOADER', 'DRILL_RIG', 'DOZER',
        'GRADER', 'PICKUP', 'LIGHT_VEHICLE', 'CRUSHER', 'CONVEYOR', 'GENSET',
        'COMPRESSOR', 'CRANE', 'PUMP', 'TOOLING', 'OTHER'
    );

-- =====================================================================
-- Vérifications :
--
--   SELECT type, COUNT(*) FROM equipment GROUP BY type ORDER BY type;
--   -- attendu (données de démo) : CRUSHER 1, DRILL_RIG 1, EXCAVATOR 2,
--   --   GENSET 2, HEAVY_TRUCK 2, WHEEL_LOADER 1 — et AUCUN libellé FR,
--   --   AUCUN ENGIN/INSTALLATION.
--
--   -- Aucune valeur hors liste blanche ne doit subsister (attendu : 0) :
--   SELECT COUNT(*) FROM equipment WHERE type IS NULL OR type NOT IN (
--       'HEAVY_TRUCK','EXCAVATOR','WHEEL_LOADER','DRILL_RIG','DOZER','GRADER',
--       'PICKUP','LIGHT_VEHICLE','CRUSHER','CONVEYOR','GENSET','COMPRESSOR',
--       'CRANE','PUMP','TOOLING','OTHER');
--
--   -- Familles sans modèle d'inspection applicable (attendu : 0 après le
--   -- seed des 3 modèles manquants EQ-CHARGEUSE / EQ-CONCASSEUR /
--   -- EQ-GROUPE-ELECTROGENE) :
--   SELECT DISTINCT e.type
--     FROM equipment e
--    WHERE NOT EXISTS (SELECT 1 FROM inspection_template t
--                       WHERE t.type = 'EQUIPMENT' AND t.active = 1
--                         AND t.scope_ref = e.type);
-- =====================================================================
