-- ═══════════════════════════════════════════════════════════════════════════
-- V010 — Seed DEMO surveillance medicale (Phase 7)
-- ═══════════════════════════════════════════════════════════════════════════
-- ATTENTION : donnees synthetiques pour DEV / QA / DEMO uniquement.
--
-- Contenu :
--   * 1 visite INITIAL PERFORMED (J-365) par worker existant (worker_id 1..50)
--   * 1 visite PERIODIC_ANNUAL SCHEDULED (J+30 a J+90 selon worker) par worker
--   * Fiches d'aptitude distribuees comme suit (50 workers) :
--       - 25 workers (50%) : FIT
--       - 15 workers (30%) : FIT_WITH_RESTRICTIONS
--       -  7 workers (15%) : TEMPORARILY_UNFIT
--       -  3 workers (5%)  : UNFIT
--     Toutes signees.
--   * Toutes les fiches restrictives portent une restrictions clinique en
--     CLAIR ici (pour la demo, sans cle AES chargee : pass-through). En
--     production la cle est presente et le converter chiffre a l'INSERT.
--
-- Application :
--   mysql -u root -p healthsafety < V010__dosimetry_seed_medical.sql
--
-- Hypothese : V003 + V006 + V009 deja appliques (workers 1..50 + tables medical).
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1) Visites INITIAL — toutes PERFORMED il y a 1 an (J-365)
--    physician_id=999 = medecin du travail fictif "Dr Demo"
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO dosimetry_medical_visit
    (worker_id, mine_id, visit_type, scheduled_date, performed_date,
     physician_id, physician_name, status, general_conclusion, detailed_report,
     created_at, created_by, updated_at, updated_by)
SELECT
    w.id, w.mine_id,
    'INITIAL',
    DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY),
    DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY),
    999, 'Dr Demo Medical',
    'PERFORMED',
    'Visite initiale d''aptitude realisee - voir fiche d''aptitude associee.',
    CONCAT('Anamnese standard, examen clinique sans particularite. ',
           'Travailleur worker_id=', w.id,
           '. Pas de contre-indication detectee a la date d''embauche.'),
    NOW(6), 1, NOW(6), 1
FROM dosimetry_exposed_worker w
WHERE w.active = TRUE;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) Visites PERIODIC_ANNUAL — SCHEDULED entre J+30 et J+90
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO dosimetry_medical_visit
    (worker_id, mine_id, visit_type, scheduled_date, performed_date,
     physician_id, physician_name, status, general_conclusion, detailed_report,
     created_at, created_by, updated_at, updated_by)
SELECT
    w.id, w.mine_id,
    'PERIODIC_ANNUAL',
    DATE_ADD(CURRENT_DATE, INTERVAL (30 + (w.id % 60)) DAY),
    NULL,
    999, 'Dr Demo Medical',
    'SCHEDULED',
    NULL, NULL,
    NOW(6), 1, NOW(6), 1
FROM dosimetry_exposed_worker w
WHERE w.active = TRUE;

-- ───────────────────────────────────────────────────────────────────────────
-- 3) Fiches d'aptitude — distribution 50% FIT / 30% RESTRICTED / 15% TEMP / 5% UNFIT
--    Repartition deterministe par tranche de worker.id pour idempotence.
-- ───────────────────────────────────────────────────────────────────────────

-- ----- 25 workers FIT (id 1..25) ------------------------------------------
INSERT INTO dosimetry_fitness_assessment
    (worker_id, mine_id, medical_visit_id, assessment_date, valid_until,
     fitness, restrictions, public_restrictions_summary, review_required_date,
     physician_id, physician_name, signed, signed_at,
     created_at, created_by, updated_at, updated_by)
SELECT
    w.id, w.mine_id, NULL,
    DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY),
    DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY),
    'FIT',
    NULL, NULL, NULL,
    999, 'Dr Demo Medical', TRUE, DATE_SUB(NOW(6), INTERVAL 365 DAY),
    NOW(6), 1, NOW(6), 1
FROM dosimetry_exposed_worker w
WHERE w.active = TRUE AND w.id BETWEEN 1 AND 25;

-- ----- 15 workers FIT_WITH_RESTRICTIONS (id 26..40) -----------------------
INSERT INTO dosimetry_fitness_assessment
    (worker_id, mine_id, medical_visit_id, assessment_date, valid_until,
     fitness, restrictions, public_restrictions_summary, review_required_date,
     physician_id, physician_name, signed, signed_at,
     created_at, created_by, updated_at, updated_by)
SELECT
    w.id, w.mine_id, NULL,
    DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY),
    DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY),
    'FIT_WITH_RESTRICTIONS',
    CONCAT('Restriction medicale : eviter exposition Hp(10) > 10 mSv. ',
           'Suivi biologique hemogramme tous les 6 mois. ',
           'Worker_id=', w.id, '. Antecedents declares sous secret medical.'),
    'Eviter zone controlee pendant 6 mois. Suivi medical renforce.',
    DATE_ADD(CURRENT_DATE, INTERVAL 180 DAY),
    999, 'Dr Demo Medical', TRUE, DATE_SUB(NOW(6), INTERVAL 365 DAY),
    NOW(6), 1, NOW(6), 1
FROM dosimetry_exposed_worker w
WHERE w.active = TRUE AND w.id BETWEEN 26 AND 40;

-- ----- 7 workers TEMPORARILY_UNFIT (id 41..47) ----------------------------
INSERT INTO dosimetry_fitness_assessment
    (worker_id, mine_id, medical_visit_id, assessment_date, valid_until,
     fitness, restrictions, public_restrictions_summary, review_required_date,
     physician_id, physician_name, signed, signed_at,
     created_at, created_by, updated_at, updated_by)
SELECT
    w.id, w.mine_id, NULL,
    DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY),
    DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY),
    'TEMPORARILY_UNFIT',
    CONCAT('Inaptitude temporaire : pathologie en cours d''investigation. ',
           'Revue prevue dans 60 jours apres bilan biologique. ',
           'Eviter tout poste expose categorie A en attendant.'),
    'Reaffectation poste non expose pendant 60 jours.',
    DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY),
    999, 'Dr Demo Medical', TRUE, DATE_SUB(NOW(6), INTERVAL 60 DAY),
    NOW(6), 1, NOW(6), 1
FROM dosimetry_exposed_worker w
WHERE w.active = TRUE AND w.id BETWEEN 41 AND 47;

-- ----- 3 workers UNFIT (id 48..50) ----------------------------------------
INSERT INTO dosimetry_fitness_assessment
    (worker_id, mine_id, medical_visit_id, assessment_date, valid_until,
     fitness, restrictions, public_restrictions_summary, review_required_date,
     physician_id, physician_name, signed, signed_at,
     created_at, created_by, updated_at, updated_by)
SELECT
    w.id, w.mine_id, NULL,
    DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY),
    NULL,
    'UNFIT',
    CONCAT('Inaptitude definitive au poste expose. Pathologie incompatible avec ',
           'l''exposition aux rayonnements ionisants. ',
           'Notification RH pour reclassement (R.4451-82 Code du Travail).'),
    'Inaptitude definitive - reclassement RH obligatoire.',
    NULL,
    999, 'Dr Demo Medical', TRUE, DATE_SUB(NOW(6), INTERVAL 30 DAY),
    NOW(6), 1, NOW(6), 1
FROM dosimetry_exposed_worker w
WHERE w.active = TRUE AND w.id BETWEEN 48 AND 50;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION POST-EXECUTION :
--   SELECT visit_type, status, COUNT(*) FROM dosimetry_medical_visit
--     GROUP BY visit_type, status;
--     -- INITIAL/PERFORMED : ~50 ; PERIODIC_ANNUAL/SCHEDULED : ~50
--
--   SELECT fitness, COUNT(*) FROM dosimetry_fitness_assessment
--     GROUP BY fitness;
--     -- FIT : 25 ; FIT_WITH_RESTRICTIONS : 15 ;
--     -- TEMPORARILY_UNFIT : 7 ; UNFIT : 3
-- ═══════════════════════════════════════════════════════════════════════════
