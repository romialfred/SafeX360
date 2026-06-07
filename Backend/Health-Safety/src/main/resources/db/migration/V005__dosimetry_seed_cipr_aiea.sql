-- ═══════════════════════════════════════════════════════════════════════════
-- V005 — Seed des seuils de reference CIPR 103 / AIEA GSR Part 3
-- ═══════════════════════════════════════════════════════════════════════════
-- Insere les seuils dosimetriques par defaut (mine_id NULL = globaux) :
--
--   * WORKER_A  (travailleur expose categorie A) :
--       HP10   : doseConstraint=15, investigation=18, action=20, limit=50   mSv (an glissant)
--                CIPR 103 §247 : limite reglementaire = 100 mSv / 5 ans
--                consecutifs avec max 50 mSv / an. On utilise ici la limite
--                annuelle plafond.
--       HP007  : doseConstraint=400, investigation=450, action=500, limit=500 mSv (peau)
--       HP3    : doseConstraint=15, investigation=18, action=20, limit=50    mSv (cristallin)
--                CIPR 118 : limite revisee a 20 mSv/an moyennee sur 5 ans,
--                jamais > 50 mSv/an. (Position post-ICRP 2011).
--
--   * WORKER_B  (categorie B, faiblement expose) :
--       HP10   : limit=6 mSv (annuelle, simplifie)
--
--   * APPRENTICE / STUDENT (16-18 ans) :
--       HP10   : limit=6 mSv (CIPR 103 §253)
--
--   * PREGNANCY (declaration grossesse) :
--       HP10   : limit=1 mSv (fetus, du moment de la declaration a la fin
--                de la grossesse — CIPR 103 §187)
--
--   * PUBLIC :
--       HP10   : limit=1 mSv / an (CIPR 103 §242 / AIEA GSR Part 3 sched. III)
--
-- IDEMPOTENCE : INSERT ... WHERE NOT EXISTS sur (grandeur, person_category,
-- mine_id IS NULL, reference_framework). Rejouage sans danger.
--
-- Application :
--   mysql -u root -p healthsafety < V005__dosimetry_seed_cipr_aiea.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- WORKER_A
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO dosimetry_threshold
    (mine_id, grandeur, person_category, dose_constraint, investigation_level,
     action_level, regulatory_limit, warn_percentages, unit, reference_framework,
     active, created_at, updated_at)
SELECT NULL, 'HP10', 'WORKER_A', 15, 18, 20, 50, '[75,90]', 'mSv', 'CIPR_103',
       TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM dosimetry_threshold
    WHERE grandeur = 'HP10' AND person_category = 'WORKER_A'
      AND mine_id IS NULL AND reference_framework = 'CIPR_103'
);

INSERT INTO dosimetry_threshold
    (mine_id, grandeur, person_category, dose_constraint, investigation_level,
     action_level, regulatory_limit, warn_percentages, unit, reference_framework,
     active, created_at, updated_at)
SELECT NULL, 'HP007', 'WORKER_A', 400, 450, 500, 500, '[75,90]', 'mSv', 'CIPR_103',
       TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM dosimetry_threshold
    WHERE grandeur = 'HP007' AND person_category = 'WORKER_A'
      AND mine_id IS NULL AND reference_framework = 'CIPR_103'
);

INSERT INTO dosimetry_threshold
    (mine_id, grandeur, person_category, dose_constraint, investigation_level,
     action_level, regulatory_limit, warn_percentages, unit, reference_framework,
     active, created_at, updated_at)
SELECT NULL, 'HP3', 'WORKER_A', 15, 18, 20, 50, '[75,90]', 'mSv', 'CIPR_103',
       TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM dosimetry_threshold
    WHERE grandeur = 'HP3' AND person_category = 'WORKER_A'
      AND mine_id IS NULL AND reference_framework = 'CIPR_103'
);

-- ───────────────────────────────────────────────────────────────────────────
-- WORKER_B (simplifie : seul HP10)
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO dosimetry_threshold
    (mine_id, grandeur, person_category, dose_constraint, investigation_level,
     action_level, regulatory_limit, warn_percentages, unit, reference_framework,
     active, created_at, updated_at)
SELECT NULL, 'HP10', 'WORKER_B', NULL, NULL, NULL, 6, '[75,90]', 'mSv', 'AIEA_GSR_PART3',
       TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM dosimetry_threshold
    WHERE grandeur = 'HP10' AND person_category = 'WORKER_B'
      AND mine_id IS NULL AND reference_framework = 'AIEA_GSR_PART3'
);

-- ───────────────────────────────────────────────────────────────────────────
-- APPRENTICE (16-18 ans)
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO dosimetry_threshold
    (mine_id, grandeur, person_category, dose_constraint, investigation_level,
     action_level, regulatory_limit, warn_percentages, unit, reference_framework,
     active, created_at, updated_at)
SELECT NULL, 'HP10', 'APPRENTICE', NULL, NULL, NULL, 6, '[75,90]', 'mSv', 'CIPR_103',
       TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM dosimetry_threshold
    WHERE grandeur = 'HP10' AND person_category = 'APPRENTICE'
      AND mine_id IS NULL AND reference_framework = 'CIPR_103'
);

-- ───────────────────────────────────────────────────────────────────────────
-- PREGNANCY (declaration grossesse - protection foetus)
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO dosimetry_threshold
    (mine_id, grandeur, person_category, dose_constraint, investigation_level,
     action_level, regulatory_limit, warn_percentages, unit, reference_framework,
     active, created_at, updated_at)
SELECT NULL, 'HP10', 'PREGNANCY', NULL, NULL, NULL, 1, '[50,75]', 'mSv', 'CIPR_103',
       TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM dosimetry_threshold
    WHERE grandeur = 'HP10' AND person_category = 'PREGNANCY'
      AND mine_id IS NULL AND reference_framework = 'CIPR_103'
);

-- ───────────────────────────────────────────────────────────────────────────
-- PUBLIC
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO dosimetry_threshold
    (mine_id, grandeur, person_category, dose_constraint, investigation_level,
     action_level, regulatory_limit, warn_percentages, unit, reference_framework,
     active, created_at, updated_at)
SELECT NULL, 'HP10', 'PUBLIC', NULL, NULL, NULL, 1, '[50,75]', 'mSv', 'AIEA_GSR_PART3',
       TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM dosimetry_threshold
    WHERE grandeur = 'HP10' AND person_category = 'PUBLIC'
      AND mine_id IS NULL AND reference_framework = 'AIEA_GSR_PART3'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification post-execution :
--   SELECT grandeur, person_category, regulatory_limit, unit, reference_framework
--   FROM dosimetry_threshold
--   WHERE mine_id IS NULL
--   ORDER BY person_category, grandeur;
--
-- Attendu : 7 lignes (3 WORKER_A + 1 WORKER_B + 1 APPRENTICE + 1 PREGNANCY + 1 PUBLIC)
-- ═══════════════════════════════════════════════════════════════════════════
