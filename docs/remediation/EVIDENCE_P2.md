# Preuves de remédiation — priorité P2

## AUD-FUN-001 — Cohérence du tableau d'audit

- Les cartes KPI et la distribution utilisent la même liste d'audits que le registre visible.
- Les compteurs ne sont plus alimentés par une requête indépendante susceptible d'avoir un périmètre différent.
- Tests : `auditDashboardMetrics.test.ts`, 2 scénarios réussis ; compilation TypeScript réussie.

## AUD-FUN-002 — États du registre de gestion des erreurs

- Les lectures structurantes du registre sont bornées à 15 secondes.
- Un échec de la liste principale n'est plus transformé en liste vide : l'écran distingue délai dépassé, droits insuffisants et indisponibilité.
- Chaque état d'échec affiche une explication factuelle et une action « Réessayer le chargement ».
- Le rafraîchissement rétablit son état même en cas d'exception.
- Tests : `registerLoadFailure.test.ts`, 3 scénarios réussis ; compilation TypeScript globale réussie.

Statut : en validation. La validation E2E globale doit encore confirmer le comportement avec un backend lent, indisponible et un compte sans droit.
