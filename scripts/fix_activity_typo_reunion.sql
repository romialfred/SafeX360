-- Correctif de donnee — faute de frappe relevee au test du 2026-07-29.
--
-- L'activite de reference « Reuion de securite » (accent manquant + 'n' oublie)
-- s'affichait telle quelle dans la liste « Activite de reference » du formulaire
-- de reunion securite. C'est une donnee, pas un libelle du code : aucun deploiement
-- applicatif ne la corrige.
--
-- Idempotent : re-executable sans effet si la valeur est deja correcte.
-- A appliquer aux DEUX bases (Aiven et locale), comme tout referentiel partage.

UPDATE healthsafety.activity
SET    title = 'Réunion de sécurité'
WHERE  title = 'Reuion de sécurité';

-- Controle : doit renvoyer 0 ligne apres application.
SELECT id, title
FROM   healthsafety.activity
WHERE  title LIKE '%euion%';
