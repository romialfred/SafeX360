-- ═══════════════════════════════════════════════════════════════════════════
-- V008 — Seed DEMO surveillance d'ambiance (Phase 6)
-- ═══════════════════════════════════════════════════════════════════════════
-- ATTENTION : donnees synthetiques pour DEV / QA / DEMO uniquement.
--
-- Contenu :
--   * 8 measurement_points  (4 par mine, mine_id 1 et 2)
--       - Entree galerie          : ZoneClass SURVEILLED, refLevel ~0.5 uSv/h
--       - Front taille            : ZoneClass CONTROLLED, refLevel ~2.0 uSv/h
--       - Salle stockage          : ZoneClass CONTROLLED, refLevel ~1.5 uSv/h
--       - Point ventilation       : ZoneClass SURVEILLED, refLevel ~0.8 uSv/h
--   * 1 monitoring_campaign ONGOING par mine (soit 2 campagnes)
--   * 50 ambient_measurements aleatoires sur 6 mois, valeurs entre 0.1 et 2.5 uSv/h
--
-- Application :
--   mysql -u root -p healthsafety < V008__dosimetry_seed_ambient.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- OPTIONNEL : reset DEMO (commente par defaut, le DELETE des mesures est
-- bloque par le trigger append-only ; en pratique, recreer le schema)
-- ───────────────────────────────────────────────────────────────────────────
-- SET FOREIGN_KEY_CHECKS = 0;
-- DELETE FROM dosimetry_exposure_profile_link
--     WHERE measurement_point_id IN (SELECT id FROM dosimetry_measurement_point
--                                    WHERE code LIKE 'MP-DEMO-%');
-- DELETE FROM dosimetry_monitoring_campaign_point
--     WHERE campaign_id IN (SELECT id FROM dosimetry_monitoring_campaign
--                           WHERE code LIKE 'CAMP-DEMO-%');
-- DELETE FROM dosimetry_monitoring_campaign WHERE code LIKE 'CAMP-DEMO-%';
-- DELETE FROM dosimetry_measurement_point   WHERE code LIKE 'MP-DEMO-%';
-- SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) MEASUREMENT POINTS (8 unites : 4 par mine x 2 mines)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO dosimetry_measurement_point
    (mine_id, code, label, zone_id, description, location,
     latitude, longitude, elevation,
     zone_classification, reference_level, active, version,
     created_at, updated_at, created_by, updated_by)
VALUES
    -- Mine 1 ----------------------------------------------------------------
    (1, 'MP-DEMO-M1-001', 'Entree galerie principale (M1)', NULL,
     'Point de mesure d''ambiance au croisement entree principale / passerelle',
     'Galerie principale, niveau -120, PK 0+050',
     14.6928000, -17.4467000, -120.00,
     'SURVEILLED', 0.5000, TRUE, 0,
     NOW(6), NOW(6), 1, 1),
    (1, 'MP-DEMO-M1-002', 'Front de taille A (M1)', NULL,
     'Point de mesure au front de taille zone A - haute activite uranium',
     'Galerie A, niveau -240, PK 1+250',
     14.6929000, -17.4469000, -240.00,
     'CONTROLLED', 2.0000, TRUE, 0,
     NOW(6), NOW(6), 1, 1),
    (1, 'MP-DEMO-M1-003', 'Salle stockage minerai (M1)', NULL,
     'Point de mesure salle de stockage minerai brut',
     'Hall de stockage, surface, batiment B',
     14.6930000, -17.4470000, 5.00,
     'CONTROLLED', 1.5000, TRUE, 0,
     NOW(6), NOW(6), 1, 1),
    (1, 'MP-DEMO-M1-004', 'Point ventilation extraction (M1)', NULL,
     'Point de mesure cheminee d''extraction air mine',
     'Cheminee ventilation, surface, secteur Sud',
     14.6925000, -17.4465000, 10.00,
     'SURVEILLED', 0.8000, TRUE, 0,
     NOW(6), NOW(6), 1, 1),
    -- Mine 2 ----------------------------------------------------------------
    (2, 'MP-DEMO-M2-001', 'Entree galerie principale (M2)', NULL,
     'Point de mesure d''ambiance entree principale Mine 2',
     'Galerie principale, niveau -80, PK 0+020',
     14.7100000, -17.4600000, -80.00,
     'SURVEILLED', 0.5000, TRUE, 0,
     NOW(6), NOW(6), 1, 1),
    (2, 'MP-DEMO-M2-002', 'Front de taille B (M2)', NULL,
     'Point de mesure au front de taille zone B',
     'Galerie B, niveau -180, PK 0+850',
     14.7101000, -17.4602000, -180.00,
     'CONTROLLED', 2.0000, TRUE, 0,
     NOW(6), NOW(6), 1, 1),
    (2, 'MP-DEMO-M2-003', 'Salle stockage minerai (M2)', NULL,
     'Point de mesure salle de stockage minerai',
     'Hall stockage, surface, batiment C',
     14.7102000, -17.4603000, 8.00,
     'CONTROLLED', 1.5000, TRUE, 0,
     NOW(6), NOW(6), 1, 1),
    (2, 'MP-DEMO-M2-004', 'Point ventilation extraction (M2)', NULL,
     'Point de mesure cheminee d''extraction air mine 2',
     'Cheminee ventilation, surface, secteur Est',
     14.7099000, -17.4598000, 12.00,
     'SURVEILLED', 0.8000, TRUE, 0,
     NOW(6), NOW(6), 1, 1);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) MONITORING CAMPAIGNS (2 unites : 1 ONGOING par mine)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO dosimetry_monitoring_campaign
    (mine_id, code, label, objective, start_date, end_date,
     status, protocol, responsible_id,
     created_at, updated_at, created_by, updated_by)
VALUES
    (1, 'CAMP-DEMO-M1-2026-01',
     'Surveillance trimestrielle Q1-Q2 2026 (M1)',
     'Cartographie radiologique trimestrielle ambiance toutes zones M1, '
     'comparaison aux niveaux de reference, detection derives.',
     DATE_SUB(CURRENT_DATE, INTERVAL 180 DAY),
     DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY),
     'ONGOING',
     '4 mesures par point par semaine. Survey meter calibre Thermo RadEye G-10. '
     'Hauteur 1m, duree 60s, conditions T<25 C HR<70%.',
     1,
     NOW(6), NOW(6), 1, 1),
    (2, 'CAMP-DEMO-M2-2026-01',
     'Surveillance trimestrielle Q1-Q2 2026 (M2)',
     'Cartographie radiologique trimestrielle ambiance toutes zones M2, '
     'comparaison aux niveaux de reference, detection derives.',
     DATE_SUB(CURRENT_DATE, INTERVAL 180 DAY),
     DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY),
     'ONGOING',
     '4 mesures par point par semaine. Survey meter calibre Thermo RadEye G-10. '
     'Hauteur 1m, duree 60s, conditions T<25 C HR<70%.',
     1,
     NOW(6), NOW(6), 1, 1);

-- Variables d'aide
SET @first_point_id := (SELECT MIN(id) FROM dosimetry_measurement_point WHERE code LIKE 'MP-DEMO-%');
SET @camp_m1_id := (SELECT id FROM dosimetry_monitoring_campaign WHERE code = 'CAMP-DEMO-M1-2026-01');
SET @camp_m2_id := (SELECT id FROM dosimetry_monitoring_campaign WHERE code = 'CAMP-DEMO-M2-2026-01');

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) MONITORING CAMPAIGN POINTS (couverture : 4 points par campagne)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO dosimetry_monitoring_campaign_point (campaign_id, measurement_point_id)
SELECT @camp_m1_id, id FROM dosimetry_measurement_point
    WHERE code LIKE 'MP-DEMO-M1-%';
INSERT INTO dosimetry_monitoring_campaign_point (campaign_id, measurement_point_id)
SELECT @camp_m2_id, id FROM dosimetry_measurement_point
    WHERE code LIKE 'MP-DEMO-M2-%';

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) AMBIENT MEASUREMENTS (50 unites repartis sur 6 mois, valeurs 0.1-2.5)
-- ═══════════════════════════════════════════════════════════════════════════
-- Strategie : 50 mesures pseudo-aleatoires distribuees sur les 8 points,
-- timestamps remontant jusqu'a 180 jours en arriere. Chaque mesure est
-- rattachee a la campagne ONGOING de sa mine.
-- ───────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_seed_ambient_measurements;
DELIMITER //
CREATE PROCEDURE sp_seed_ambient_measurements()
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE p_offset INT;
    DECLARE target_point_id BIGINT;
    DECLARE target_mine_id BIGINT;
    DECLARE target_camp_id BIGINT;
    DECLARE measured_value DECIMAL(14,4);
    DECLARE measured_uncertainty DECIMAL(6,2);
    DECLARE measured_when DATETIME(6);
    DECLARE days_back INT;
    DECLARE ctx_idx INT;
    DECLARE ctx_value VARCHAR(32);

    WHILE i < 50 DO
        -- Reparti round-robin sur 8 points
        SET p_offset = MOD(i, 8);
        SET target_point_id = @first_point_id + p_offset;
        SET target_mine_id  = IF(p_offset < 4, 1, 2);
        SET target_camp_id  = IF(p_offset < 4, @camp_m1_id, @camp_m2_id);

        -- Valeur uSv/h pseudo-aleatoire entre 0.1 et 2.5
        SET measured_value = ROUND(0.1 + (RAND() * 2.4), 4);
        SET measured_uncertainty = ROUND(2.0 + (RAND() * 6.0), 2);

        -- Timestamp : remontee jusqu'a 180 jours
        SET days_back = FLOOR(RAND() * 180);
        SET measured_when = DATE_SUB(NOW(6), INTERVAL days_back DAY);

        -- Contexte tournant ROUTINE / CAMPAIGN majoritairement
        SET ctx_idx = FLOOR(RAND() * 10);
        SET ctx_value = CASE
            WHEN ctx_idx < 6 THEN 'CAMPAIGN'
            WHEN ctx_idx < 9 THEN 'ROUTINE'
            ELSE 'COMMISSIONING'
        END;

        INSERT INTO dosimetry_ambient_measurement
            (mine_id, measurement_point_id, measured_at, measured_by,
             value, uncertainty, instrument_id, instrument_serial,
             context, campaign_id, notes,
             created_at, created_by)
        VALUES
            (target_mine_id, target_point_id, measured_when, 1,
             measured_value, measured_uncertainty, NULL, 'SURVEY-DEMO-001',
             ctx_value, IF(ctx_value = 'CAMPAIGN', target_camp_id, NULL),
             CONCAT('Mesure DEMO V008 #', i + 1, ' - synthetique'),
             NOW(6), 1);

        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

CALL sp_seed_ambient_measurements();
DROP PROCEDURE sp_seed_ambient_measurements;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION POST-SEED :
--   SELECT COUNT(*) FROM dosimetry_measurement_point    WHERE code LIKE 'MP-DEMO-%';
--   -- attendu : 8
--   SELECT mine_id, COUNT(*) FROM dosimetry_measurement_point
--       WHERE code LIKE 'MP-DEMO-%' GROUP BY mine_id;
--   -- attendu : mine_id=1 -> 4, mine_id=2 -> 4
--   SELECT COUNT(*) FROM dosimetry_monitoring_campaign  WHERE code LIKE 'CAMP-DEMO-%';
--   -- attendu : 2
--   SELECT status, COUNT(*) FROM dosimetry_monitoring_campaign
--       WHERE code LIKE 'CAMP-DEMO-%' GROUP BY status;
--   -- attendu : ONGOING -> 2
--   SELECT COUNT(*) FROM dosimetry_ambient_measurement
--       WHERE notes LIKE 'Mesure DEMO V008%';
--   -- attendu : 50
--   SELECT MIN(value), MAX(value) FROM dosimetry_ambient_measurement
--       WHERE notes LIKE 'Mesure DEMO V008%';
--   -- attendu : >= 0.1 et <= 2.5
-- ═══════════════════════════════════════════════════════════════════════════
