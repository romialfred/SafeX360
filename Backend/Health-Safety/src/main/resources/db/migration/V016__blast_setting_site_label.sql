-- ═══════════════════════════════════════════════════════════════════════════
-- V016 — Blast Management : libelle site per-mine
-- Phase P4 / LOT « Blast » — Correctifs residuels P3
--
-- AJOUT :
--   blast_setting.site_label  VARCHAR(160) NULL
--
-- POURQUOI :
--   Le service d'envoi d'e-mails resolvait jusqu'ici le « site » via la
--   property globale `blast.site.label`, ce qui est faux en multi-mines :
--   chaque mine a son propre libelle de signature ("Mine de Boungou",
--   "Mine de Houndé", etc.). On stocke desormais ce libelle par mine dans
--   `blast_setting.site_label`. La property reste utilisee comme fallback
--   ultime (cas d'une mine sans setting persiste).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE blast_setting
    ADD COLUMN site_label VARCHAR(160) NULL AFTER control_room_label;

-- Defaut pour mine_id=1 (seedee par V014).
UPDATE blast_setting
   SET site_label = 'Mine — Site principal'
 WHERE mine_id = 1 AND site_label IS NULL;
