# Preuves de remédiation — priorité P1

## AUD-QA-001 et AUD-QA-002 — qualité reproductible

État local : **en validation**.

- Une CI unique bloque sur audit des dépendances, dette ESLint/design, tests unitaires, build, budgets terrain, quatre services backend, E2E et gate agrégé.
- Playwright exécute Chromium contre un serveur Vite local reproductible.
- Gateway, MineXpert, Eureka et Health-Safety ont chacun un profil de test H2 autonome, sans dépendance ni secret externe persistant.
- Les actions CI sont épinglées par SHA, les permissions sont minimales et la conservation des credentials Git est désactivée.

```text
Playwright public : 2/2
Vitest global : 123/123 avant les derniers ajouts de qualification
Gateway : 5/5
MineXpert : 7/7
Eureka : 1/1
Health-Safety : 355/355
Isolation fixtures : 3/3
Audit npm : 0 vulnérabilité
```

La qualification finale rejoue l'ensemble après intégration des derniers lots. Le profil H2 ne remplace pas le contrôle MySQL des triggers et de la portée des noms d'index.

## AUD-SEC-003 et AUD-SEC-004 — autorisation serveur et cloisonnement mine

État local : **en validation**, avec résiduels répertoriés.

- La Gateway supprime les en-têtes d'identité forgés puis reconstruit rôle, permissions et périmètre à partir du JWT validé.
- HNS applique une matrice centralisée rôle × opération, refuse les rôles/verbes/contextes inconnus et contrôle le périmètre mine avant les contrôleurs.
- Les mutations d'habilitations sont réservées aux administrateurs et la lecture `/by-account/{id}` est limitée à soi-même ou à un administrateur.
- Les scénarios négatifs couvrent le faux rôle, la mine hors périmètre, les paramètres dupliqués, l'absence de mine, les exports et les mutations non autorisées.

```text
Health-Safety : 355 tests réussis
Gateway : 5 tests réussis
```

La matrice détaillée et les huit risques résiduels sont documentés dans `docs/security/AUD-SEC-003-004-authorization-matrix.md`. La clôture définitive exige encore l'inventaire dépôt par dépôt des accès par identifiant, deux mines réelles de test et la validation humaine de la matrice.

## AUD-REL-001 — livraison Android

État local : **en validation**.

- permissions GitHub minimales et actions épinglées par SHA ;
- secrets et keystore obligatoires, signature et vérification bloquantes ;
- aucun commit/push automatique d'APK ;
- APK nommé par commit, checksum SHA-256, SBOM CycloneDX, métadonnées et attestations de provenance ;
- durcissement Android rejoué après `cap sync`.

```text
Vitest androidBuildWorkflow : 5 tests réussis
YAML, TypeScript et ESLint ciblé : succès
```

L'APK historique public reste inchangé. Un premier run de release autorisé et un canal permanent d'artefacts attestés restent nécessaires avant clôture finale.

## AUD-SEC-007 et AUD-SEC-012 — CSRF, session et CORS

État local : **en validation**.

- Les origines sont centralisées dans `SAFEX_ALLOWED_ORIGINS` et comparées exactement.
- CORS n'accepte plus tous les en-têtes ; les méthodes et en-têtes exposés sont bornés.
- Toute mutation `/hrms/**` ou `/hns/**` sans origine approuvée est rejetée par la Gateway avec `403`.
- La déconnexion utilise `POST` au lieu d'un `GET` à effet de bord.

La défense CSRF repose sur la validation stricte de l'en-tête navigateur `Origin`, adaptée au cookie `SameSite=None` nécessaire aux origines web/native séparées.

```text
Gateway CsrfOriginFilterTest : 3 tests réussis
Scénarios : absence d'origine, origine hostile, origine approuvée et lecture sûre
```

## AUD-SEC-008 — Content Security Policy

État local : **en validation**.

La CSP du site public est émise en enforcement pour toutes les routes. Elle borne scripts, styles, polices, images, connexions, workers et manifeste ; interdit objets, framing et base URI externe. La Gateway ajoute en complément une politique fermée à ses réponses API.

## AUD-SEC-011 — Swagger/OpenAPI

État local : **en validation**.

Health-Safety et MineXpert utilisent `API_DOCS_ENABLED=false` par défaut. Les routes Swagger/OpenAPI ne sont plus `permitAll` ; lorsqu'elles sont explicitement activées, elles restent derrière la garde interne.

## AUD-SEC-009 — dépendances frontend

État local : **en validation**.

Le `tar@6.2.1` vulnérable utilisé par `@capacitor/cli@6.2.1` est remplacé de façon ciblée par `tar@7.5.19`, sans montée majeure de la plateforme Capacitor. Le lockfile enregistre la résolution reproductible et un script bloquant `audit:security` est disponible pour le pipeline.

```text
npm ls @capacitor/cli tar : tar@7.5.19 overridden
npm audit --json : 0 vulnérabilité (0 élevée, 0 critique)
Capacitor CLI : démarrage réussi en version 6.2.1
```

Le `cap sync` complet sera rejoué après le build global ; sa première tentative a été arrêtée proprement faute de répertoire `dist`, sans modification de release.

## AUD-SES-001 — durée de session

État local : **en validation**.

Le `Max-Age` du cookie est calculé depuis la même durée que l'expiration JWT. La configuration est refusée hors de la plage 1–24 heures.

```text
MineXpert JwtHelperTest : 2 tests réussis
Vitest politique plateforme + session : 9 tests réussis
```
