-- DATASET_SAFEX_DOSIMETRY_V1
-- Données entièrement synthétiques, réservées aux environnements DEV/QA/DEMO.
-- Référence temporelle fixe : 2026-01-01. Aucun nom ni identifiant réel.
-- Pré-requis : schéma V003. Exécution manuelle et idempotente uniquement.

START TRANSACTION;

INSERT INTO dosimetry_exposed_worker
    (employee_id, category, classification_reason, classification_date, active,
     mine_id, created_at, updated_at, created_by, updated_by)
SELECT 990001, 'WORKER_A',
       'DATASET_SAFEX_DOSIMETRY_V1 - opérateur synthétique zone contrôlée',
       '2025-01-15', TRUE, 990001, '2026-01-01 08:00:00', '2026-01-01 08:00:00', 990001, 990001
WHERE NOT EXISTS (
    SELECT 1 FROM dosimetry_exposed_worker
    WHERE employee_id = 990001 AND mine_id = 990001
);

INSERT INTO dosimetry_exposed_worker
    (employee_id, category, classification_reason, classification_date, active,
     mine_id, created_at, updated_at, created_by, updated_by)
SELECT 990002, 'WORKER_B',
       'DATASET_SAFEX_DOSIMETRY_V1 - technicien synthétique accès occasionnel',
       '2025-02-03', TRUE, 990001, '2026-01-01 08:00:00', '2026-01-01 08:00:00', 990001, 990001
WHERE NOT EXISTS (
    SELECT 1 FROM dosimetry_exposed_worker
    WHERE employee_id = 990002 AND mine_id = 990001
);

SET @fixture_worker_a := (
    SELECT id FROM dosimetry_exposed_worker
    WHERE employee_id = 990001 AND mine_id = 990001
    ORDER BY id LIMIT 1
);
SET @fixture_worker_b := (
    SELECT id FROM dosimetry_exposed_worker
    WHERE employee_id = 990002 AND mine_id = 990001
    ORDER BY id LIMIT 1
);

INSERT INTO dosimetry_dose_record
    (worker_id, period, hp10, hp007, hp3, source, below_detection, notes,
     recorded_by, recorded_at, version, created_at, updated_at, created_by, updated_by)
SELECT @fixture_worker_a, '2025-10', 0.82, 0.67, 0.71, 'AGENCY', FALSE,
       'DATASET_SAFEX_DOSIMETRY_V1 - mesure synthétique A-01',
       990001, '2025-11-05 09:00:00', 1, '2025-11-05 09:00:00', '2025-11-05 09:00:00', 990001, 990001
WHERE NOT EXISTS (
    SELECT 1 FROM dosimetry_dose_record
    WHERE worker_id = @fixture_worker_a AND period = '2025-10' AND version = 1
      AND notes LIKE 'DATASET_SAFEX_DOSIMETRY_V1%'
);

INSERT INTO dosimetry_dose_record
    (worker_id, period, hp10, hp007, hp3, source, below_detection, notes,
     recorded_by, recorded_at, version, created_at, updated_at, created_by, updated_by)
SELECT @fixture_worker_b, '2025-10', 0.19, 0.15, 0.17, 'AGENCY', FALSE,
       'DATASET_SAFEX_DOSIMETRY_V1 - mesure synthétique B-01',
       990001, '2025-11-05 09:05:00', 1, '2025-11-05 09:05:00', '2025-11-05 09:05:00', 990001, 990001
WHERE NOT EXISTS (
    SELECT 1 FROM dosimetry_dose_record
    WHERE worker_id = @fixture_worker_b AND period = '2025-10' AND version = 1
      AND notes LIKE 'DATASET_SAFEX_DOSIMETRY_V1%'
);

COMMIT;
