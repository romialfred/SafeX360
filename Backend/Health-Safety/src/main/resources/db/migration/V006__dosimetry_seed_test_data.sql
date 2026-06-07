-- ═══════════════════════════════════════════════════════════════════════════
-- V006 — Seed de DONNEES DE TEST pour le module Dosimetrie
-- ═══════════════════════════════════════════════════════════════════════════
-- ATTENTION : ce script genere des donnees synthetiques destinees aux
-- environnements DEV / QA / DEMO uniquement. NE PAS EXECUTER EN PROD.
--
-- Contenu :
--   * 5 dosimetres (3 TLD + 2 EPD) dans dosimetry_dosimeter
--   * 50 travailleurs exposes dans dosimetry_exposed_worker
--       - 30 categorie B
--       - 18 categorie A
--       - 2  categorie A avec specialStatus = PREGNANCY
--   * 1000 enregistrements de dose dans dosimetry_dose_record
--       - repartis sur 5 ans (60 periodes YYYY-MM) et 50 workers
--       - hp10 majoritairement entre 0.1 et 5 mSv
--       - 5 records avec hp10 > 15 (declencheront alertes APPROACH 75%)
--       - 2 records avec hp10 > 18 (declencheront ACTION level)
--       - 1 record avec hp10 > 25 (declenchera EXCEEDED)
--   * 50 cumuls annuels dans dosimetry_dose_cumulative (annee courante)
--   * 3 dossiers de surexposition dans dosimetry_overexposure_case
--
-- Hypothese : employee_id 1..50 existent (table employee dans la BDD RH).
-- L'IDEMPOTENCE est partielle : verification via uk_dosimeter_serial.
-- Pour rejouer proprement, TRUNCATE prealable des 5 tables (cf. plus bas).
--
-- Application :
--   mysql -u root -p healthsafety < V006__dosimetry_seed_test_data.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- OPTIONNEL : reset des donnees de test (commente par defaut)
-- ───────────────────────────────────────────────────────────────────────────
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE dosimetry_overexposure_case;
-- TRUNCATE TABLE dosimetry_dose_cumulative;
-- TRUNCATE TABLE dosimetry_dose_record;
-- TRUNCATE TABLE dosimetry_exposed_worker;
-- DELETE FROM dosimetry_dosimeter WHERE serial LIKE 'TST-%';
-- SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) DOSIMETRES (5 unites : 3 TLD + 2 EPD)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO dosimetry_dosimeter
    (serial, type, qr_code, status, calibration_due_date, mine_id,
     created_at, updated_at, created_by, updated_by)
VALUES
    ('TST-TLD-001', 'TLD', 'QR-TST-TLD-001', 'ASSIGNED',
     DATE_ADD(CURRENT_DATE, INTERVAL 6 MONTH), 1, NOW(6), NOW(6), 1, 1),
    ('TST-TLD-002', 'TLD', 'QR-TST-TLD-002', 'ASSIGNED',
     DATE_ADD(CURRENT_DATE, INTERVAL 8 MONTH), 1, NOW(6), NOW(6), 1, 1),
    ('TST-TLD-003', 'TLD', 'QR-TST-TLD-003', 'AVAILABLE',
     DATE_ADD(CURRENT_DATE, INTERVAL 4 MONTH), 1, NOW(6), NOW(6), 1, 1),
    ('TST-EPD-001', 'EPD', 'QR-TST-EPD-001', 'ASSIGNED',
     DATE_ADD(CURRENT_DATE, INTERVAL 3 MONTH), 1, NOW(6), NOW(6), 1, 1),
    ('TST-EPD-002', 'EPD', 'QR-TST-EPD-002', 'IN_READING',
     DATE_ADD(CURRENT_DATE, INTERVAL 5 MONTH), 1, NOW(6), NOW(6), 1, 1);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) TRAVAILLEURS EXPOSES (50 unites : 30 B + 18 A + 2 PREGNANCY)
-- ═══════════════════════════════════════════════════════════════════════════
-- Tranche 1/3 : workers 1..30 categorie WORKER_B
INSERT INTO dosimetry_exposed_worker
    (employee_id, category, classification_reason, classification_date,
     special_status, active, mine_id, created_at, updated_at, created_by, updated_by)
VALUES
    (1,  'WORKER_B', 'Maintenance generale - exposition occasionnelle', '2024-01-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (2,  'WORKER_B', 'Maintenance generale - exposition occasionnelle', '2024-01-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (3,  'WORKER_B', 'Logistique - acces zones controlees ponctuel',    '2024-02-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (4,  'WORKER_B', 'Logistique - acces zones controlees ponctuel',    '2024-02-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (5,  'WORKER_B', 'Supervision - tournees periodiques',              '2024-02-10', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (6,  'WORKER_B', 'Supervision - tournees periodiques',              '2024-02-10', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (7,  'WORKER_B', 'Nettoyage industriel zones surveillees',          '2024-03-05', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (8,  'WORKER_B', 'Nettoyage industriel zones surveillees',          '2024-03-05', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (9,  'WORKER_B', 'Conduite engins surface',                         '2024-03-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (10, 'WORKER_B', 'Conduite engins surface',                         '2024-03-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (11, 'WORKER_B', 'Maintenance mecanique periodique',                '2024-04-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (12, 'WORKER_B', 'Maintenance mecanique periodique',                '2024-04-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (13, 'WORKER_B', 'Magasinage equipements radiologiques',            '2024-04-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (14, 'WORKER_B', 'Magasinage equipements radiologiques',            '2024-04-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (15, 'WORKER_B', 'Acces zone surveillee occasionnel',               '2024-05-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (16, 'WORKER_B', 'Acces zone surveillee occasionnel',               '2024-05-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (17, 'WORKER_B', 'Maintenance electrique - ronde mensuelle',        '2024-05-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (18, 'WORKER_B', 'Maintenance electrique - ronde mensuelle',        '2024-05-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (19, 'WORKER_B', 'Inspection visuelle equipements',                 '2024-06-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (20, 'WORKER_B', 'Inspection visuelle equipements',                 '2024-06-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (21, 'WORKER_B', 'Pilotage drone surveillance perimetre',           '2024-06-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (22, 'WORKER_B', 'Pilotage drone surveillance perimetre',           '2024-06-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (23, 'WORKER_B', 'Echantillonnage geologie',                        '2024-07-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (24, 'WORKER_B', 'Echantillonnage geologie',                        '2024-07-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (25, 'WORKER_B', 'Conducteur transport interne',                    '2024-07-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (26, 'WORKER_B', 'Conducteur transport interne',                    '2024-07-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (27, 'WORKER_B', 'Stocks et inventaire (zone B)',                   '2024-08-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (28, 'WORKER_B', 'Stocks et inventaire (zone B)',                   '2024-08-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (29, 'WORKER_B', 'Audit qualite installations',                     '2024-08-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (30, 'WORKER_B', 'Audit qualite installations',                     '2024-08-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1);

-- Tranche 2/3 : workers 31..48 categorie WORKER_A
INSERT INTO dosimetry_exposed_worker
    (employee_id, category, classification_reason, classification_date,
     special_status, active, mine_id, created_at, updated_at, created_by, updated_by)
VALUES
    (31, 'WORKER_A', 'Operateur en zone controlee - haut potentiel exposition', '2023-09-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (32, 'WORKER_A', 'Operateur en zone controlee - haut potentiel exposition', '2023-09-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (33, 'WORKER_A', 'Operateur en zone controlee - haut potentiel exposition', '2023-09-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (34, 'WORKER_A', 'Operateur en zone controlee - haut potentiel exposition', '2023-09-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (35, 'WORKER_A', 'Manipulateur sources scellees',                            '2023-10-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (36, 'WORKER_A', 'Manipulateur sources scellees',                            '2023-10-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (37, 'WORKER_A', 'Gammagraphie / radiographie industrielle',                 '2023-10-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (38, 'WORKER_A', 'Gammagraphie / radiographie industrielle',                 '2023-10-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (39, 'WORKER_A', 'Maintenance equipements radio-emetteurs',                  '2023-11-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (40, 'WORKER_A', 'Maintenance equipements radio-emetteurs',                  '2023-11-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (41, 'WORKER_A', 'Decontamination - intervention prolongee',                 '2023-11-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (42, 'WORKER_A', 'Decontamination - intervention prolongee',                 '2023-11-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (43, 'WORKER_A', 'Operateur traitement minerai uranifere',                   '2024-01-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (44, 'WORKER_A', 'Operateur traitement minerai uranifere',                   '2024-01-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (45, 'WORKER_A', 'Operateur traitement minerai uranifere',                   '2024-02-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (46, 'WORKER_A', 'Operateur traitement minerai uranifere',                   '2024-02-01', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (47, 'WORKER_A', 'Inspection radioprotection - acces tous zones',            '2024-02-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1),
    (48, 'WORKER_A', 'Inspection radioprotection - acces tous zones',            '2024-02-15', NULL, TRUE, 1, NOW(6), NOW(6), 1, 1);

-- Tranche 3/3 : workers 49..50 categorie WORKER_A avec PREGNANCY declaree
INSERT INTO dosimetry_exposed_worker
    (employee_id, category, classification_reason, classification_date,
     special_status, special_status_start_date, special_status_end_date,
     active, mine_id, created_at, updated_at, created_by, updated_by)
VALUES
    (49, 'WORKER_A', 'Manipulatrice sources - grossesse declaree', '2023-12-01',
     'PREGNANCY', DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY),
     DATE_ADD(CURRENT_DATE, INTERVAL 180 DAY),
     TRUE, 1, NOW(6), NOW(6), 1, 1),
    (50, 'WORKER_A', 'Technicienne instrumentation - grossesse declaree', '2024-01-10',
     'PREGNANCY', DATE_SUB(CURRENT_DATE, INTERVAL 45 DAY),
     DATE_ADD(CURRENT_DATE, INTERVAL 225 DAY),
     TRUE, 1, NOW(6), NOW(6), 1, 1);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) DOSE RECORDS (1000 unites sur 5 ans, generes par procedure)
-- ═══════════════════════════════════════════════════════════════════════════
-- Strategie : 50 workers x 20 periodes (mensuelles, derniers 5 ans, echantillonees)
-- soit 1000 records. hp10 pseudo-aleatoire entre 0.1 et 5 mSv via fonction RAND().
-- Apres la boucle, on UPDATE 8 records cibles pour declencher les alertes :
--   - 5 records hp10 > 15  (APPROACH 75% du seuil WORKER_A=20)
--   - 2 records hp10 > 18  (ACTION level WORKER_A)
--   - 1 record  hp10 > 25  (EXCEEDED - depasse limit annuelle 50 etale)
-- ───────────────────────────────────────────────────────────────────────────

-- Recuperer l'id du premier exposed_worker insere pour cette session de seed.
-- On utilise une variable session : suppose que les 50 workers sont contigus.
SET @first_worker_id := (SELECT MIN(id) FROM dosimetry_exposed_worker
                         WHERE employee_id BETWEEN 1 AND 50);

DROP PROCEDURE IF EXISTS sp_seed_dose_records;
DELIMITER //
CREATE PROCEDURE sp_seed_dose_records()
BEGIN
    DECLARE w_offset INT DEFAULT 0;
    DECLARE p_offset INT DEFAULT 0;
    DECLARE current_year INT;
    DECLARE current_month INT;
    DECLARE target_year INT;
    DECLARE target_month INT;
    DECLARE period_str VARCHAR(16);
    DECLARE hp10_val DOUBLE;
    DECLARE hp007_val DOUBLE;
    DECLARE hp3_val DOUBLE;
    DECLARE target_worker_id BIGINT;

    SET current_year  = YEAR(CURRENT_DATE);
    SET current_month = MONTH(CURRENT_DATE);

    -- 50 workers x 20 periodes = 1000 records
    WHILE w_offset < 50 DO
        SET p_offset = 0;
        WHILE p_offset < 20 DO
            -- Periode : remonte de (p_offset * 3) mois en arriere (echantillonage trimestriel sur 5 ans)
            SET target_year  = current_year  - FLOOR((p_offset * 3) / 12);
            SET target_month = current_month - MOD((p_offset * 3), 12);
            IF target_month <= 0 THEN
                SET target_month = target_month + 12;
                SET target_year  = target_year - 1;
            END IF;
            SET period_str = CONCAT(target_year, '-', LPAD(target_month, 2, '0'));
            SET target_worker_id = @first_worker_id + w_offset;

            -- hp10 entre 0.1 et 5 mSv
            SET hp10_val  = ROUND(0.1 + (RAND() * 4.9), 3);
            SET hp007_val = ROUND(hp10_val * (0.8 + RAND() * 0.4), 3);
            SET hp3_val   = ROUND(hp10_val * (0.9 + RAND() * 0.2), 3);

            INSERT INTO dosimetry_dose_record
                (worker_id, period, hp10, hp007, hp3, source, below_detection,
                 notes, recorded_by, recorded_at, version,
                 created_at, updated_at, created_by, updated_by)
            VALUES
                (target_worker_id, period_str, hp10_val, hp007_val, hp3_val,
                 'AGENCY', FALSE,
                 'Donnee de test V006 - synthetique',
                 1, NOW(6), 1,
                 NOW(6), NOW(6), 1, 1);

            SET p_offset = p_offset + 1;
        END WHILE;
        SET w_offset = w_offset + 1;
    END WHILE;
END //
DELIMITER ;

CALL sp_seed_dose_records();
DROP PROCEDURE sp_seed_dose_records;

-- ───────────────────────────────────────────────────────────────────────────
-- Cibler 8 records pour declencher les alertes attendues
-- Workers cibles : 43, 44, 45 (operateurs traitement minerai uranifere = WORKER_A)
--                  et 47 (inspection radioprotection)
-- ───────────────────────────────────────────────────────────────────────────

-- 5 records APPROACH (hp10 entre 15 et 18 mSv) — workers 43, 44, 45, 46, 47
UPDATE dosimetry_dose_record
SET hp10 = 15.50, hp007 = 16.20, hp3 = 14.80,
    notes = 'Donnee test V006 - APPROACH 75% (cat A, seuil 20)'
WHERE worker_id = @first_worker_id + 42  -- employee 43
  AND period = CONCAT(YEAR(CURRENT_DATE), '-', LPAD(MONTH(CURRENT_DATE), 2, '0'))
LIMIT 1;

UPDATE dosimetry_dose_record
SET hp10 = 16.10, hp007 = 16.90, hp3 = 15.40,
    notes = 'Donnee test V006 - APPROACH 75% (cat A, seuil 20)'
WHERE worker_id = @first_worker_id + 43  -- employee 44
  AND period = CONCAT(YEAR(CURRENT_DATE), '-', LPAD(MONTH(CURRENT_DATE), 2, '0'))
LIMIT 1;

UPDATE dosimetry_dose_record
SET hp10 = 17.20, hp007 = 17.50, hp3 = 16.10,
    notes = 'Donnee test V006 - APPROACH 75% (cat A, seuil 20)'
WHERE worker_id = @first_worker_id + 44  -- employee 45
  AND period = CONCAT(YEAR(CURRENT_DATE), '-', LPAD(MONTH(CURRENT_DATE), 2, '0'))
LIMIT 1;

UPDATE dosimetry_dose_record
SET hp10 = 15.80, hp007 = 16.30, hp3 = 15.10,
    notes = 'Donnee test V006 - APPROACH 75% (cat A, seuil 20)'
WHERE worker_id = @first_worker_id + 45  -- employee 46
  AND period = CONCAT(YEAR(CURRENT_DATE), '-', LPAD(MONTH(CURRENT_DATE), 2, '0'))
LIMIT 1;

UPDATE dosimetry_dose_record
SET hp10 = 17.90, hp007 = 18.20, hp3 = 17.10,
    notes = 'Donnee test V006 - APPROACH 75% (cat A, seuil 20)'
WHERE worker_id = @first_worker_id + 46  -- employee 47
  AND period = CONCAT(YEAR(CURRENT_DATE), '-', LPAD(MONTH(CURRENT_DATE), 2, '0'))
LIMIT 1;

-- 2 records ACTION (hp10 entre 18 et 20 mSv) — workers 47, 48
UPDATE dosimetry_dose_record
SET hp10 = 18.50, hp007 = 19.10, hp3 = 17.80,
    notes = 'Donnee test V006 - ACTION level (cat A, seuil 18)'
WHERE worker_id = @first_worker_id + 46  -- employee 47
  AND period = CONCAT(YEAR(CURRENT_DATE) - 1, '-', LPAD(MONTH(CURRENT_DATE), 2, '0'))
LIMIT 1;

UPDATE dosimetry_dose_record
SET hp10 = 19.20, hp007 = 19.80, hp3 = 18.60,
    notes = 'Donnee test V006 - ACTION level (cat A, seuil 18)'
WHERE worker_id = @first_worker_id + 47  -- employee 48
  AND period = CONCAT(YEAR(CURRENT_DATE), '-', LPAD(MONTH(CURRENT_DATE), 2, '0'))
LIMIT 1;

-- 1 record EXCEEDED (hp10 > 25 mSv = depasse la limit reglementaire 20 cat A en 1 mois)
UPDATE dosimetry_dose_record
SET hp10 = 27.40, hp007 = 28.10, hp3 = 26.50,
    notes = 'Donnee test V006 - EXCEEDED limit (cat A, limit 20)'
WHERE worker_id = @first_worker_id + 47  -- employee 48
  AND period = CONCAT(YEAR(CURRENT_DATE) - 1, '-', LPAD(MONTH(CURRENT_DATE), 2, '0'))
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) DOSE CUMULATIVE (50 cumuls annee courante)
-- ═══════════════════════════════════════════════════════════════════════════
-- Calcul aggregate : on prend la somme des hp10 / hp007 / hp3 sur l'annee
-- courante pour chaque worker. rolling5y = somme totale ; lifetime ~= rolling5y.
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO dosimetry_dose_cumulative
    (worker_id, year, annual_hp10, annual_hp007, annual_hp3,
     rolling5y_hp10, lifetime_hp10, updated_at)
SELECT
    dr.worker_id,
    YEAR(CURRENT_DATE) AS year,
    ROUND(SUM(CASE WHEN dr.period LIKE CONCAT(YEAR(CURRENT_DATE), '-%')
                   THEN COALESCE(dr.hp10, 0)  ELSE 0 END), 3) AS annual_hp10,
    ROUND(SUM(CASE WHEN dr.period LIKE CONCAT(YEAR(CURRENT_DATE), '-%')
                   THEN COALESCE(dr.hp007, 0) ELSE 0 END), 3) AS annual_hp007,
    ROUND(SUM(CASE WHEN dr.period LIKE CONCAT(YEAR(CURRENT_DATE), '-%')
                   THEN COALESCE(dr.hp3, 0)   ELSE 0 END), 3) AS annual_hp3,
    ROUND(SUM(COALESCE(dr.hp10, 0)), 3) AS rolling5y_hp10,
    ROUND(SUM(COALESCE(dr.hp10, 0)), 3) AS lifetime_hp10,
    NOW(6)
FROM dosimetry_dose_record dr
WHERE dr.worker_id BETWEEN @first_worker_id AND (@first_worker_id + 49)
GROUP BY dr.worker_id;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5) OVEREXPOSURE CASES (3 dossiers lies aux 3 alertes critiques)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO dosimetry_overexposure_case
    (worker_id, level, cause, corrective_actions, medical_decision,
     authority_declaration, authority_declaration_date,
     status, opened_at, created_at, updated_at, created_by, updated_by)
VALUES
    (@first_worker_id + 46,  -- employee 47, ACTION level
     'ACTION',
     'Intervention prolongee en zone controlee suite a defaut blindage source scellee #SS-42. Duree d''exposition non-prevue : 4h vs 1h planifie.',
     'Retrait temporaire de la zone. Remplacement du blindage. Re-evaluation des procedures d''intervention. Formation supplementaire equipe.',
     'Suivi medical renforce. Examen sanguin programme. Aptitude maintenue sous reserve.',
     FALSE, NULL,
     'OPEN', DATE_SUB(NOW(6), INTERVAL 10 DAY),
     NOW(6), NOW(6), 1, 1),
    (@first_worker_id + 47,  -- employee 48, ACTION level
     'ACTION',
     'Maintenance equipement radio-emetteur sans verification prealable du LOTO radioprotection. Procedure non respectee.',
     'Audit complet des procedures LOTO. Renforcement formation. Affichage signaletique zone.',
     'Examen medical periodique avance. Aptitude confirmee.',
     FALSE, NULL,
     'OPEN', DATE_SUB(NOW(6), INTERVAL 7 DAY),
     NOW(6), NOW(6), 1, 1),
    (@first_worker_id + 47,  -- employee 48, EXCEEDED
     'EXCEEDED',
     'Depassement de la limite reglementaire annuelle (20 mSv) en 1 mois suite a fuite radiologique non-detectee. Dosimetre TLD-002 : 27.4 mSv.',
     'Arret immediat poste. Decontamination zone. Enquete formelle ASN. Mise en place barrieres physiques additionnelles. Re-evaluation cartographie radiologique.',
     'Inaptitude temporaire 6 mois. Bilan medical complet. Suivi epidemiologique long terme. Reclassement en zone non-controlee a l''etude.',
     TRUE, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY),
     'OPEN', DATE_SUB(NOW(6), INTERVAL 3 DAY),
     NOW(6), NOW(6), 1, 1);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION POST-SEED (a executer manuellement pour valider)
-- ═══════════════════════════════════════════════════════════════════════════
--   SELECT COUNT(*) FROM dosimetry_dosimeter         WHERE serial LIKE 'TST-%';
--   -- attendu : 5
--   SELECT COUNT(*) FROM dosimetry_exposed_worker    WHERE employee_id BETWEEN 1 AND 50;
--   -- attendu : 50
--   SELECT category, COUNT(*) FROM dosimetry_exposed_worker
--       WHERE employee_id BETWEEN 1 AND 50 GROUP BY category;
--   -- attendu : WORKER_A=20, WORKER_B=30
--   SELECT special_status, COUNT(*) FROM dosimetry_exposed_worker
--       WHERE employee_id BETWEEN 1 AND 50 AND special_status IS NOT NULL
--       GROUP BY special_status;
--   -- attendu : PREGNANCY=2
--   SELECT COUNT(*) FROM dosimetry_dose_record dr
--       JOIN dosimetry_exposed_worker w ON w.id = dr.worker_id
--       WHERE w.employee_id BETWEEN 1 AND 50;
--   -- attendu : 1000
--   SELECT COUNT(*) FROM dosimetry_dose_record WHERE hp10 > 15;  -- attendu >= 8
--   SELECT COUNT(*) FROM dosimetry_dose_record WHERE hp10 > 18;  -- attendu >= 3
--   SELECT COUNT(*) FROM dosimetry_dose_record WHERE hp10 > 25;  -- attendu >= 1
--   SELECT COUNT(*) FROM dosimetry_dose_cumulative
--       WHERE year = YEAR(CURRENT_DATE);
--   -- attendu : 50
--   SELECT COUNT(*) FROM dosimetry_overexposure_case;
--   -- attendu : 3
-- ═══════════════════════════════════════════════════════════════════════════
