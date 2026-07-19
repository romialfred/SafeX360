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

## Pipeline bloquant

`.github/workflows/ci.yml` execute en parallele :

1. audit des dependances, baselines ESLint et design, tests Vitest, build frontend et budgets de performance;
2. `verify` Maven des quatre services sous Java 17;
3. smoke tests Chromium avec rapport Playwright en cas d'echec;
4. un job final `Required quality gate` qui exige le succes de tous les jobs.

Pour rendre cette protection effective sur la branche principale, configurer dans l'hebergeur Git le statut **Required quality gate** comme controle obligatoire. Cette regle de protection reste une action d'administration externe au depot.
