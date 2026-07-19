# Baseline locale de validation

Date : 19 juillet 2026  
Branche : `codex/iso-remediation-39`  
Statut : mesure initiale avant correction

## Frontend

| Contrôle | Résultat initial | Observation |
|---|---|---|
| `npm test` | 49 tests réussis sur 49 | Vitest fonctionne avec le runtime Node explicite |
| `npm run lint` | Timeout supérieur à 120 s | Gate non exploitable en l’état ; le rapport signale 2 570 erreurs |
| `npm run build` | Timeout supérieur à 180 s | Compilation/build à diagnostiquer avant gate globale |

Le terminal local doit exposer le runtime Node fourni par l’espace de travail. Le premier lancement échouait parce que `npm` ne retrouvait pas `node` dans son processus enfant.

## Backend

Le projet déclare Java 17. Un premier lancement avec Java 25 provoquait des erreurs Mockito/Byte Buddy non représentatives du code. Les mesures de référence utilisent donc `C:\Program Files\Java\jdk-17`.

| Service | Résultat initial sous Java 17 | Cause principale observée |
|---|---|---|
| MineXpert | 1 test, 1 erreur | `${DB_URL}` non résolu ; aucun profil de test autonome |
| GatewayMS | 1 test, 1 erreur | Variables de configuration requises non fournies |
| Eureka-Server | 1 test, 1 erreur | `${SERVER_PORT}` non résolu |
| Health-Safety | À requalifier sous Java 17 | Premier passage faussé par Java 25 ; suite volumineuse |

## Interprétation

Cette baseline confirme AUD-QA-001 et AUD-QA-002 : la validation n’est pas reproductible sur un poste vierge sans préparer manuellement le PATH, le JDK et plusieurs variables d’environnement. Les corrections devront conserver les valeurs de production obligatoires tout en ajoutant des profils de test hermétiques et non sensibles.

## Gate cible

- un script local unique prépare les runtimes sans secret ;
- le lint, le build et les tests frontend terminent avec un résultat déterministe ;
- chaque service backend possède un profil de test autonome ;
- les tests ciblés d’un constat précèdent la qualification globale ;
- aucun échec existant n’est supprimé ou ignoré sans justification versionnée.

