-- ═══════════════════════════════════════════════════════════════════════════
-- V012 — Seed DEMO snapshots KPI Dosimetrie (Phase 8)
-- ═══════════════════════════════════════════════════════════════════════════
-- ATTENTION : donnees synthetiques pour DEV / QA / DEMO uniquement.
--
-- Genere 12 mois (J-360 ... J0) x 5 categories x N mines de snapshots avec des
-- valeurs progressives realistes (tendance haussiere amortie, jitter par sin)
-- pour rendre les dashboards immediatement vivants.
--
-- Hypotheses :
--   * V003 + V006 deja appliques (dosimetry_exposed_worker peuple).
--   * V011 deja applique (dosimetry_kpi_snapshot existe).
--
-- Application :
--   mysql -u root -p healthsafety < V012__dosimetry_seed_kpi.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Nettoyage idempotent (re-run intra-day)
DELETE FROM dosimetry_kpi_snapshot
WHERE snapshot_date >= DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY);

-- ───────────────────────────────────────────────────────────────────────────
-- Generateur : 12 mois (J-330, J-300, ... J0 = aujourd'hui) par mine et categorie.
--
-- Strategie : on prend les workers existants pour calculer un workers_count
-- realiste par mine et par categorie. Pour eviter de cross-joiner trop de
-- lignes, on agrege en CTE puis on cross-join avec une serie temporelle (table
-- derivee de 12 valeurs).
-- ───────────────────────────────────────────────────────────────────────────

-- Series temporelles : 12 offsets en jours (330, 300, ..., 30, 0)
-- via UNION ALL pour rester MySQL 5.7+ compatible (pas de recursive CTE requis).

INSERT INTO dosimetry_kpi_snapshot (
    mine_id, snapshot_date, category,
    workers_count, dose_records_count,
    avg_annual_dose, median_annual_dose, max_annual_dose,
    workers_over_50_pct, workers_over_75_pct, workers_over_90_pct, workers_over_100_pct,
    active_alerts_count, overexposure_cases_open, fitness_expiring_soon,
    measurement_points_count, ambient_avg_usvh,
    created_at
)
SELECT
    base.mine_id,
    DATE_SUB(CURRENT_DATE, INTERVAL t.offset_days DAY) AS snapshot_date,
    base.category,

    -- workers_count : base reelle (compte exact ExposedWorker actifs par categorie KPI)
    base.workers_count,

    -- dose_records_count : ~2.4 records / worker / mois cumules sur l'annee (croissance lineaire)
    ROUND(base.workers_count * 28 * (1 - t.offset_days / 365.0)) AS dose_records_count,

    -- avg : valeur de base par categorie + tendance + sin pour effet "vague"
    ROUND(base.base_avg * (0.7 + 0.5 * (1 - t.offset_days / 365.0)) +
          base.base_avg * 0.1 * SIN(t.offset_days * 0.5), 4) AS avg_annual_dose,
    ROUND(base.base_avg * (0.65 + 0.45 * (1 - t.offset_days / 365.0)), 4) AS median_annual_dose,
    ROUND(base.base_avg * (1.5 + 1.0 * (1 - t.offset_days / 365.0)), 4) AS max_annual_dose,

    -- buckets : approximation gaussienne autour de avg
    GREATEST(0, ROUND(base.workers_count * 0.35 * (0.5 + 0.5 * (1 - t.offset_days / 365.0)))) AS workers_over_50_pct,
    GREATEST(0, ROUND(base.workers_count * 0.15 * (0.4 + 0.6 * (1 - t.offset_days / 365.0)))) AS workers_over_75_pct,
    GREATEST(0, ROUND(base.workers_count * 0.06 * (0.3 + 0.7 * (1 - t.offset_days / 365.0)))) AS workers_over_90_pct,
    GREATEST(0, ROUND(base.workers_count * 0.02 * (0.2 + 0.8 * (1 - t.offset_days / 365.0)))) AS workers_over_100_pct,

    -- alertes/cases : faible et bursty
    GREATEST(0, ROUND(base.workers_count * 0.04 * (0.5 + 0.5 * SIN(t.offset_days * 0.3)))) AS active_alerts_count,
    GREATEST(0, ROUND(base.workers_count * 0.005 * (0.4 + 0.6 * (1 - t.offset_days / 365.0)))) AS overexposure_cases_open,
    GREATEST(0, ROUND(base.workers_count * 0.08)) AS fitness_expiring_soon,

    -- mesurages et ambiance moyenne (uSv/h)
    8 AS measurement_points_count,
    ROUND(0.4 + 0.15 * SIN(t.offset_days * 0.4), 4) AS ambient_avg_usvh,

    NOW(6) AS created_at

FROM (
    SELECT
        mine_id,
        CASE
            WHEN special_status = 'PREGNANCY' THEN 'PREGNANCY'
            WHEN special_status = 'APPRENTICE' THEN 'APPRENTICE'
            WHEN category = 'A' THEN 'WORKER_A'
            WHEN category = 'B' THEN 'WORKER_B'
            ELSE 'PUBLIC'
        END AS category,
        COUNT(*) AS workers_count,
        CASE
            WHEN special_status = 'PREGNANCY' THEN 0.4
            WHEN special_status = 'APPRENTICE' THEN 1.8
            WHEN category = 'A' THEN 8.0
            WHEN category = 'B' THEN 2.5
            ELSE 0.3
        END AS base_avg
    FROM dosimetry_exposed_worker
    WHERE active = TRUE
    GROUP BY mine_id, category, special_status
) base
CROSS JOIN (
    SELECT 0   AS offset_days
    UNION ALL SELECT 30
    UNION ALL SELECT 60
    UNION ALL SELECT 90
    UNION ALL SELECT 120
    UNION ALL SELECT 150
    UNION ALL SELECT 180
    UNION ALL SELECT 210
    UNION ALL SELECT 240
    UNION ALL SELECT 270
    UNION ALL SELECT 300
    UNION ALL SELECT 330
) t
ON DUPLICATE KEY UPDATE
    -- en cas de collision (re-run du seed), on conserve la ligne existante.
    -- le trigger append-only ne permet pas la mutation reelle ; on ne touche
    -- qu'a created_at qui n'est pas dans le trigger (en realite il l'est, donc
    -- pratiquement aucune mutation ne passe). Cette clause est defensive.
    id = id;
