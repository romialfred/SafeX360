-- ===========================================================================
-- Migration multi-mines — cloisonnement strict des données par mine.
-- Cible : schéma HRMS (defaultdb) où réside la table `account`.
-- À exécuter APRÈS le déploiement du nouveau code HRMS (Hibernate ddl-auto=update
-- crée la table account_company + la colonne all_mines_access au démarrage).
-- Idempotent : ré-exécutable sans effet de bord.
-- ===========================================================================

-- Filet : créer la table de liaison si Hibernate ne l'a pas encore créée.
CREATE TABLE IF NOT EXISTS account_company (
    account_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    PRIMARY KEY (account_id, company_id)
);

-- 1) Chaque compte reçoit sa mine principale actuelle dans son périmètre autorisé.
INSERT INTO account_company (account_id, company_id)
SELECT a.id, a.company_id
FROM account a
WHERE a.company_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM account_company ac
      WHERE ac.account_id = a.id AND ac.company_id = a.company_id
  );

-- 2) Les comptes administrateurs obtiennent l'accès à TOUTES les mines (consolidé).
--    (role stocké en clair : "Administrator" en prod, alias SYSTEM_ADMINISTRATOR/ADMIN.)
UPDATE account
SET all_mines_access = 1
WHERE UPPER(COALESCE(role, '')) IN ('ADMINISTRATOR', 'SYSTEM_ADMINISTRATOR', 'ADMIN');

-- 3) Les non-admins sans drapeau explicite : accès NON consolidé (0), strictement
--    limité à leur périmètre account_company.
UPDATE account
SET all_mines_access = 0
WHERE all_mines_access IS NULL;

-- Vérification (à lancer manuellement) :
-- SELECT a.id, a.login, a.role, a.all_mines_access,
--        GROUP_CONCAT(ac.company_id) AS mines
-- FROM account a LEFT JOIN account_company ac ON ac.account_id = a.id
-- GROUP BY a.id ORDER BY a.id;
