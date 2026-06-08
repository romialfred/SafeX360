-- =============================================================================
-- V019__inspection_refonte.sql
--
-- Refonte 2026-06 du module Inspections HSE.
--
-- Note : les tables `inspection_template`, `inspection_checkpoint`,
-- `inspection_finding` et `inspection_approval` sont creees automatiquement
-- par Hibernate (ddl-auto=update) a partir des entites JPA. Cette migration
-- s'occupe uniquement :
--   1. de la migration des donnees legacy (statuts -> ARCHIVED)
--   2. des indexes additionnels si besoin
--
-- Strategie de migration (validee par le owner) : MIGRER + ARCHIVER.
-- Toutes les inspections creees avant cette refonte deviennent ARCHIVED,
-- preservant l'historique sans permettre de modification future. Les
-- nouveaux flux passeront par le workflow refondu (SCHEDULED -> ARCHIVED).
-- =============================================================================

-- 1. Migration des statuts legacy vers ARCHIVED pour figer l'historique.
--    On preserve la trace : PENDING -> ARCHIVED, COMPLETED -> ARCHIVED,
--    CANCELLED reste CANCELLED (deja cloture).
UPDATE general_inspection
SET status = 'ARCHIVED',
    archived_at = COALESCE(archived_at, updated_at, created_at, NOW())
WHERE status IN ('PENDING', 'COMPLETED', 'IN_PROGRESS');

-- Note : on ne touche pas aux CANCELLED ni aux statuts deja dans le nouveau
-- workflow (s'il y en a deja). UPDATE idempotent : rejouable sans effet.

-- 2. Pas d'index supplementaire ici : ceux declares dans les @Table JPA
--    suffisent (idx_inspection_status, idx_inspection_template, etc.).
