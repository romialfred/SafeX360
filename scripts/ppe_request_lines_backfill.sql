-- ─────────────────────────────────────────────────────────────────────────────
-- Incrément 2 — Backfill des quantités sur les lignes de demande EPI existantes.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- La table `ppe_emp` (ligne : bénéficiaire × EPI × demande) porte désormais des
-- quantités (quantity_requested / quantity_approved / quantity_issued). Les colonnes
-- sont ajoutées par Hibernate au déploiement (ddl-auto: update), à NULL sur les
-- lignes existantes. Ce script leur donne une valeur cohérente avec le modèle
-- historique (1 unité par ligne), en respectant le statut de la demande parente.
--
-- IDEMPOTENT : ne touche qu'aux lignes dont quantity_requested est encore NULL.
-- Données seulement (la table est déjà créée). À exécuter APRÈS le déploiement HNS,
-- sur les DEUX bases, avec --default-character-set=utf8mb4.

-- Toutes les lignes : 1 unité demandée (modèle historique = 1 EPI par employé).
UPDATE healthsafety.ppe_emp
SET    quantity_requested = 1
WHERE  quantity_requested IS NULL;

-- Lignes rattachées à une demande APPROUVÉE ou LIVRÉE : réputées approuvées et
-- sorties du stock (dans l'ancien modèle, approuver décrémentait déjà le stock).
UPDATE healthsafety.ppe_emp e
JOIN   healthsafety.ppe_request r ON r.id = e.ppe_request_id
SET    e.quantity_approved = 1,
       e.quantity_issued   = 1
WHERE  (e.quantity_approved IS NULL OR e.quantity_issued IS NULL)
  AND  r.status IN ('APPROVED', 'DELIVERED');

-- Lignes d'une demande encore en attente ou rejetée : rien n'est sorti.
UPDATE healthsafety.ppe_emp e
JOIN   healthsafety.ppe_request r ON r.id = e.ppe_request_id
SET    e.quantity_approved = 0,
       e.quantity_issued   = 0
WHERE  (e.quantity_approved IS NULL OR e.quantity_issued IS NULL)
  AND  r.status IN ('PENDING', 'REJECTED');

-- Filet : toute ligne encore non renseignée (demande orpheline) → 0 approuvé/sorti.
UPDATE healthsafety.ppe_emp
SET    quantity_approved = COALESCE(quantity_approved, 0),
       quantity_issued   = COALESCE(quantity_issued, 0)
WHERE  quantity_approved IS NULL OR quantity_issued IS NULL;

-- Contrôle : aucune ligne ne doit rester sans quantité.
SELECT COUNT(*) AS lignes_sans_quantite
FROM   healthsafety.ppe_emp
WHERE  quantity_requested IS NULL OR quantity_approved IS NULL OR quantity_issued IS NULL;
