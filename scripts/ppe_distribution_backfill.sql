-- ============================================================================
-- Incrément 4 (EPI) — normalisation des quantités de cycle de vie des LIGNES.
--
-- La colonne `quantity_returned` est créée par Hibernate (ddl-auto: update) ;
-- ce script ne touche QUE les données. Il met les compteurs de cycle de vie à 0
-- là où ils sont NULL, pour que les agrégats (SUM distribué / retourné du futur
-- tableau de bord) ne renvoient pas NULL et que la formule idempotente de
-- distribution « approuvé − distribué » travaille sur des entiers, jamais NULL.
--
-- IDEMPOTENT : ne réécrit que les NULL ; rejouable sans effet de bord.
-- À exécuter APRÈS le boot Hibernate (création de la colonne).
-- ============================================================================

-- Rien de distribué tant que ce n'est pas explicitement sorti.
UPDATE ppe_emp SET quantity_issued = 0 WHERE quantity_issued IS NULL;

-- Rien de retourné par défaut.
UPDATE ppe_emp SET quantity_returned = 0 WHERE quantity_returned IS NULL;

-- Contrôle : aucune ligne ne doit conserver un compteur de cycle de vie NULL.
SELECT
    SUM(quantity_issued   IS NULL) AS issued_nuls,
    SUM(quantity_returned IS NULL) AS returned_nuls
FROM ppe_emp;
