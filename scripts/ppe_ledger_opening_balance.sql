-- ─────────────────────────────────────────────────────────────────────────────
-- Incrément 1 — Solde d'ouverture du journal de mouvements EPI.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- CONTEXTE. Le journal `ppe_stock_movement` remplace la mutation directe du champ
-- `ppe.stock`. L'historique réel des mouvements N'EXISTE PAS (c'est précisément le
-- défaut corrigé : les sorties n'étaient jamais enregistrées, d'où la dérive
-- constatée en production le 2026-08-05). On n'invente donc pas un faux historique.
--
-- PRINCIPE COMPTABLE. À la mise en place d'un journal, on pose un SOLDE D'OUVERTURE
-- égal au stock physique actuel. Après ce script, l'invariant tient dès le départ :
--     ppe.stock == SUM(ppe_stock_movement.quantity)
-- et tous les mouvements ultérieurs (RECEIPT, ISSUE, CORRECTION…) le préservent
-- atomiquement (cf. PpeServiceImpl.applyStockMovement).
--
-- SÉQUENCE. La table `ppe_stock_movement` est créée par Hibernate au démarrage de
-- HNS (ddl-auto: update, entité PpeStockMovement). Ce script est DONNÉES SEULEMENT
-- et doit être exécuté APRÈS le déploiement de HNS. Il est IDEMPOTENT : il ne pose
-- un solde d'ouverture que pour les EPI qui n'ont encore AUCUN mouvement.
--
-- À exécuter avec --default-character-set=utf8mb4, sur les DEUX bases (local + Aiven).

INSERT INTO healthsafety.ppe_stock_movement
        (ppe_id, movement_type, quantity, balance_after, reference, reason, company_id, created_at)
SELECT  p.id,
        'INITIAL',
        COALESCE(p.stock, 0),
        COALESCE(p.stock, 0),
        'OPENING-BALANCE',
        'Solde d''ouverture a la mise en place du journal de mouvements',
        p.company_id,
        NOW()
FROM    healthsafety.ppe p
WHERE   NOT EXISTS (
            SELECT 1 FROM healthsafety.ppe_stock_movement m WHERE m.ppe_id = p.id
        );

-- Contrôle : doit renvoyer 0 ligne (aucun EPI dont l'agrégat diverge de ses mouvements).
SELECT p.id, p.name, p.stock AS agregat,
       IFNULL((SELECT SUM(m.quantity) FROM healthsafety.ppe_stock_movement m WHERE m.ppe_id = p.id), 0) AS somme_mouvements
FROM   healthsafety.ppe p
HAVING agregat <> somme_mouvements;
