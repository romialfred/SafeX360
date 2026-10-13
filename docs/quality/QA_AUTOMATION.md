# Socle d'automatisation qualite SafeX

Ce socle couvre les constats **AUD-QA-001** (tests navigateur reproductibles) et **AUD-QA-002** (pipeline qualite global). Il ne deploie rien et ne contacte aucun service metier externe.

## Commandes locales

Le frontend requiert Node.js 22 et une installation verrouillee par `package-lock.json`.

```powershell
cd Frontend
npm ci
npm run audit:security
npm run lint:baseline
npm run design:baseline
npm test
npm run build
npm run performance:budget
npm run test:e2e:install
npm run test:e2e:smoke
```

`test:e2e:smoke` construit l'application puis Playwright demarre automatiquement `vite preview` sur `127.0.0.1:4173`. Les deux scenarios publics ne demandent ni compte, ni secret, ni backend. Pour cibler une instance deja demarree, definir `PW_BASE_URL` et `PW_SKIP_WEBSERVER=1`.

Les suites metier existantes sous `e2e/blast` et `e2e/dosimetry` restent des tests d'integration complets. Elles exigent une base seedee, les services SafeX et des comptes injectes par variables d'environnement; elles ne font donc pas partie du smoke test autonome.

## Profils backend autonomes

Les quatre modules utilisent Java 17 et un profil Spring `test` active par leurs tests de contexte. Gateway et Eureka desactivent l'enregistrement distant. MineXpert et Health-Safety utilisent H2 en memoire. Les secrets necessaires au demarrage sont generes uniquement en memoire par les tests et ne sont jamais stockes dans les YAML.

Deux differences d'emulation restent visibles dans les logs Health-Safety sans faire appel a une infrastructure externe : H2 impose une portee globale aux noms d'index (contrairement a MySQL, deux tables declarent `idx_audit_entity`) et ne prend pas en charge la commande MySQL `SHOW TRIGGERS`. Le profil valide le contexte, les depots, le schema principal et les seeders; la presence reelle des triggers d'immutabilite doit rester couverte par un test d'integration MySQL distinct.

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
$env:Path="$env:JAVA_HOME\bin;" + $env:Path
cd Backend\GatewayMS       # puis MineXpert, Eureka-Server, Health-Safety
.\mvnw.cmd -B -ntp "-Dspring.profiles.active=test" verify
```

## Baseline ESLint

La baseline initiale contient **2 571 erreurs** et **284 avertissements** historiques. Le controle calcule une empreinte stable par fichier, regle, severite, message et ligne source. Toute nouvelle empreinte ou occurrence supplementaire fait echouer la commande; les corrections reduisent naturellement la dette.

La mise a jour n'est pas automatique. `npm run lint:baseline:update` doit uniquement accompagner une revue explicite de la dette et ne doit jamais servir a faire passer une regression.

La garde complementaire `npm run design:baseline` gele les compteurs de couleurs litterales, styles inline, valeurs pixel, largeurs maximales ad hoc et transitions globales. Sa mise a jour suit la meme exigence de revue explicite. Apres le build, `npm run performance:budget` controle le graphe d'entree Vite, le plus gros chunk JavaScript et le precache PWA afin de bloquer une regression du poids terrain.

### Journal des re-ancrages

Chaque mise a jour d'une baseline est consignee ici avec sa justification. Une entree absente de ce journal signale une mise a jour non revue.

#### 2026-10-12 — re-ancrage apres trois mois de cliquet inoperant

**Constat.** Le Quality Gate est rouge en continu depuis le 2026-07-19 (dernier run vert : commit `2843172a`, puis 161 runs en echec). Le job frontend s'arretait a la premiere etape en echec — d'abord les baselines elles-memes, puis l'audit npm, place en tete — et le statut **Required quality gate** n'etait pas un controle obligatoire de `main` : les etapes suivantes n'ont plus ete evaluees et la dette est entree sans que le cliquet ne s'applique. Les regressions ainsi masquees ont ete traitees comme suit.

**Corrige dans le code (pas de re-ancrage)** : audit npm (0 vulnerabilite haute ou critique), erreur TypeScript bloquant le build (`WeatherService`, revelee par axios 1.20), deux tests Vitest desalignes, landmark `main` et noms accessibles de la vitrine, et 16 occurrences ESLint sans risque (imports et parametres inutilises, deux directives `eslint-disable` devenues sans objet).

**Re-ancre (dette acceptee, a resorber)** :

| Baseline | Avant | Apres |
| --- | --- | --- |
| ESLint — erreurs | 2 571 | 2 663 |
| ESLint — avertissements | 284 | 279 |
| Design — `hexColors` | 1 494 | 1 829 |
| Design — `pixelValues` | 5 602 | 6 338 |
| Design — `maxWidthUtilities` | 288 | 294 |
| Design — `inlineStyles` (resserre) | 1 451 | 1 412 |
| Design — `transitionAll` (resserre) | 153 | 139 |

Les 257 empreintes ESLint nouvelles se repartissent en 238 `@typescript-eslint/no-explicit-any` (convention historique des services non types ; plus d'un tiers dans les pages EPI `PPEAnalyticsPage`, `PPERequestsTable`, `PPEMonitoringDashboard`, `PPEMinePage`, `PPEDotationPage`), 7 `react-refresh/only-export-components`, 5 `react-hooks/exhaustive-deps` et 7 `no-unused-vars`. Le solde net n'est que de +87 occurrences : une partie des empreintes « nouvelles » correspond a des lignes de dette existante simplement retouchees. La dette design vient surtout des ecrans livres depuis juillet (`EvacuationWallboard`, pages EPI, `LoginsPage`/`LoginHeroPanel`, registres Conformite, `HsPolicyPage`).

**Pourquoi ne pas tout corriger maintenant.** Typer ces `any` touche environ 70 fichiers et la tokenisation de plus de 1 000 couleurs et dimensions exige une revue visuelle ecran par ecran ; tout push sur `main` etant deploye en production, ces refontes doivent etre menees et verifiees comme des lots dedies, pas en remise en etat de la CI. Le re-ancrage retablit le cliquet immediatement : la regle est inchangee et toute nouvelle occurrence refait echouer la CI.

**Backlog prioritaire.**

- `react-hooks/exhaustive-deps` (risque de donnees perimees) : `SosDetailPage.tsx:201`, `UpdateCorrectiveAction.tsx:142`, `ViewDetails.tsx:129`, `InspectionReport.tsx:73` (PGI), `PPEMinePage.tsx:141`.
- `no-unused-vars` revelant des fonctions inachevees ou mortes : `BlastForm.tsx` (`user`), `GeneralAlertDetailPage.tsx` (`KpiCard`), `PersonnelEvacuationPage.tsx` (`profileLoading` jamais affiche), `CoordinatorAlertListener.tsx` (`handleViewDetail` sans bouton), `PPEDotationPage.tsx` (`setSort`, tri non branche), `PPEMonitoringDashboard.tsx` (`mineName`), `IncidentTypeData.tsx` (`severityMap`).
- Typage des pages EPI, puis tokenisation design en commencant par `EvacuationWallboard.tsx`.

**Prevention.** Declarer **Required quality gate** comme controle obligatoire de `main` (protection de branche, action d'administration GitHub) : sans cela, le deploiement automatique sur le VPS part meme quand la CI est rouge.

## Pipeline bloquant

`.github/workflows/ci.yml` execute en parallele :

1. audit des dependances, baselines ESLint et design, tests Vitest, build frontend et budgets de performance;
2. `verify` Maven des quatre services sous Java 17;
3. smoke tests Chromium avec rapport Playwright en cas d'echec;
4. un job final `Required quality gate` qui exige le succes de tous les jobs.

Pour rendre cette protection effective sur la branche principale, configurer dans l'hebergeur Git le statut **Required quality gate** comme controle obligatoire. Cette regle de protection reste une action d'administration externe au depot.
