-- ═══════════════════════════════════════════════════════════════════════════
-- V015 — Module Blast Management : 7 champs additionnels (P2.1)
-- ═══════════════════════════════════════════════════════════════════════════
-- Contexte : l'audit P2 a identifie 7 champs saisis cote frontend mais non
-- persistes en base, entrainant une perte silencieuse a chaque enregistrement
-- ou edition. Cette migration ajoute les colonnes correspondantes sur la
-- table blast et les rend nullables (pas de back-fill obligatoire).
--
-- Conformite : tracabilite legale des tirs de mine (les notes et limites PPV
-- ressortent en audit DGM/DREAL et doivent etre conservees).
--
-- Compatible MySQL 8.0+.
--
-- Idempotence : MySQL 8.0+ ne supporte pas "ADD COLUMN IF NOT EXISTS" en
-- natif sur les versions anterieures ; on utilise un test sur
-- information_schema.COLUMNS avant le ALTER TABLE.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1) access_concerned     : voies d'acces a fermer (texte libre)
-- 2) assembly_points      : liste des points de rassemblement (CSV ou IDs)
-- 3) team                 : composition de l'equipe de tir (texte libre)
-- 4) ppv_limit            : limite reglementaire de vibration (mm/s)
-- 5) sensitive_receivers  : recepteurs sensibles (hopital, ligne HT...)
-- 6) attachments_note     : notes pieces jointes (metadata + cas legacy)
-- 7) notes                : notes libres de fin de fiche
-- ───────────────────────────────────────────────────────────────────────────

DELIMITER $$

DROP PROCEDURE IF EXISTS p_v015_add_blast_columns $$

CREATE PROCEDURE p_v015_add_blast_columns()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'blast'
           AND COLUMN_NAME  = 'access_concerned'
    ) THEN
        ALTER TABLE blast ADD COLUMN access_concerned TEXT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'blast'
           AND COLUMN_NAME  = 'assembly_points'
    ) THEN
        ALTER TABLE blast ADD COLUMN assembly_points TEXT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'blast'
           AND COLUMN_NAME  = 'team'
    ) THEN
        ALTER TABLE blast ADD COLUMN team VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'blast'
           AND COLUMN_NAME  = 'ppv_limit'
    ) THEN
        ALTER TABLE blast ADD COLUMN ppv_limit DOUBLE NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'blast'
           AND COLUMN_NAME  = 'sensitive_receivers'
    ) THEN
        ALTER TABLE blast ADD COLUMN sensitive_receivers TEXT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'blast'
           AND COLUMN_NAME  = 'attachments_note'
    ) THEN
        ALTER TABLE blast ADD COLUMN attachments_note TEXT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'blast'
           AND COLUMN_NAME  = 'notes'
    ) THEN
        ALTER TABLE blast ADD COLUMN notes TEXT NULL;
    END IF;
END $$

CALL p_v015_add_blast_columns() $$

DROP PROCEDURE IF EXISTS p_v015_add_blast_columns $$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification :
--   DESCRIBE blast;
-- Les 7 colonnes doivent apparaitre : access_concerned, assembly_points,
-- team, ppv_limit, sensitive_receivers, attachments_note, notes.
-- ═══════════════════════════════════════════════════════════════════════════
