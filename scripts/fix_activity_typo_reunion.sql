-- Correctif de donnee — faute de frappe relevee au test du 2026-07-29.
--
-- L'activite de reference « Reuion de securite » (accent manquant + 'n' oublie)
-- s'affichait telle quelle dans la liste « Activite de reference » du formulaire
-- de reunion securite. C'est une donnee, pas un libelle du code : aucun deploiement
-- applicatif ne la corrige.
--
-- Idempotent : re-executable sans effet si la valeur est deja correcte.
-- A appliquer aux DEUX bases (Aiven et locale), comme tout referentiel partage.

-- IMPORTANT : executer le client avec --default-character-set=utf8mb4, sinon
-- l'accent du littéral est mal decode et l'UPDATE ne matche RIEN en silence.
-- La clause de recherche n'utilise volontairement QUE de l'ASCII ('Reuion'),
-- pour rester juste meme si l'encodage du client est mal configure.
SET NAMES utf8mb4;

UPDATE healthsafety.activity
SET    title = 'Réunion de sécurité'
WHERE  title LIKE 'Reuion%';

-- Controle : doit renvoyer 0 ligne apres application.
SELECT id, title
FROM   healthsafety.activity
WHERE  title LIKE '%euion%';
