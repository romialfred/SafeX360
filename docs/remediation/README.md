# Remédiation SafeX 360 — registre d’implémentation

Ce dossier est la source de vérité technique pour l’implémentation locale des 39 constats du rapport d’audit du 18 juillet 2026. Il complète le registre directeur sans le remplacer.

## Règles de pilotage

- Une correction reste limitée au périmètre du constat et de ses dépendances démontrées.
- Aucun constat n’est clôturé sur la seule base d’une modification de code.
- Chaque clôture exige des tests ciblés, une non-régression du parcours adjacent et une preuve reproductible.
- Les changements restent locaux sur la branche `codex/iso-remediation-39` tant que le propriétaire n’a pas validé l’application.
- Aucun déploiement, push ou changement d’infrastructure externe n’est autorisé dans cette mission.
- Les constats nécessitant une décision juridique, réglementaire, organisationnelle ou d’hébergement conservent un statut résiduel explicite tant que cette preuve externe n’existe pas.

## États

| État | Définition |
|---|---|
| À qualifier | Cause et périmètre technique à confirmer |
| Prêt | Cause, dépendances et tests de référence identifiés |
| En traitement | Modification locale en cours |
| En validation | Critères exécutés, preuves en revue |
| Clôturé localement | Code et tests validés localement ; aucune mise en production |
| Résiduel externe | Une preuve ou décision hors dépôt reste obligatoire |

## Registre des 39 constats

| Priorité | Identifiant | Domaine | État initial | Gate de clôture |
|---|---|---|---|---|
| P0 | AUD-GOV-001 | Allégations de certification | En validation | Inventaire public sans allégation ISO non démontrée |
| P0 | AUD-SEC-001 | Données locales sensibles | En traitement | Chiffrement/minimisation, partitionnement et purge multi-compte testés |
| P0 | AUD-SEC-002 | WebSocket/STOMP | En validation | Jeton vérifié et autorisation rôle/mine sur CONNECT, SEND et SUBSCRIBE |
| P0 | AUD-OPS-001 | Disponibilité SOS | En traitement | Mode dégradé, supervision et preuve d’alerte ; hébergement résiduel documenté |
| P0 | AUD-SAF-001 | Tir confirmé | En validation | Verrouillage serveur, override contrôlé, motif et audit immuable testés |
| P0 | AUD-REG-002 | Seuil dosimétrique | En validation | Règle versionnée et validée par juridiction, avec recalcul contrôlé |
| P0 | AUD-SEC-005 | Secrets de démonstration | En validation | Aucun secret suivi ; rotation/révocation et scan bloquant démontrés |
| P0 | AUD-SEC-006 | Cache PWA authentifié | En validation | API sensible exclue du cache ; purge logout et changement de compte testés |
| P1 | AUD-SEC-003 | Autorisation serveur | En validation | Matrice d’accès et refus par défaut couverts par tests positifs/négatifs |
| P1 | AUD-SEC-004 | Cloisonnement par mine | En validation | Lecture, mutation et export inter-mine refusés dans tous les modules |
| P1 | AUD-SEC-007 | Sessions et CSRF | En validation | Modèle cookie/CSRF homogène et scénarios cross-site rejetés |
| P1 | AUD-SEC-008 | Content Security Policy | En validation | CSP en enforcement et parcours critiques fonctionnels |
| P1 | AUD-SEC-009 | Dépendances | En validation | Vulnérabilités élevées corrigées/acceptées et SBOM produit |
| P1 | AUD-SEC-010 | Identité interservice | À qualifier | Identités distinctes, portée minimale et tests de mouvement latéral |
| P1 | AUD-QA-001 | Qualité et pipeline | En validation | Lint/build/tests reproductibles et bloquants |
| P1 | AUD-QA-002 | Tests E2E et profils | En validation | Runner déclaré et quatre services testables sans secrets externes |
| P1 | AUD-REL-001 | Livraison Android | En validation | Signature, checksum, SBOM et provenance vérifiés localement |
| P1 | AUD-OPS-002 | Supervision | En validation | Sondes, métriques, alertes et échec réel du keep-warm testés |
| P1 | AUD-IAM-001 | MFA privilégiée | À qualifier | MFA imposée aux rôles sensibles et récupération contrôlée |
| P1 | AUD-SEC-011 | Swagger/OpenAPI | En validation | Documentation non publique hors profil explicitement autorisé |
| P1 | AUD-SEC-012 | CORS | En validation | Origines autorisées centralisées et tests preflight/cross-origin |
| P1 | AUD-SES-001 | Durée de session | En validation | Cookie et JWT alignés, expiration et renouvellement testés |
| P2 | AUD-ISO-001 | Référentiel ISO 19011 | En validation | Édition et métadonnées documentaires à jour ; analyse d’impact humaine résiduelle |
| P2 | AUD-ISO-002 | Matrice ISO | En validation | Exigences, preuves, propriétaires et résultats séparés |
| P2 | AUD-ISO-003 | Workflows SMSST/QMS | En validation | Périmètre produit/hors produit et contrôles documentés ; preuves organisationnelles résiduelles |
| P2 | AUD-REG-001 | Moteur juridictionnel | À qualifier | Règles versionnées par pays/site/population et dates d’effet |
| P2 | AUD-GOV-002 | Indicateurs publics | En validation | Gate source/périmètre/date/propriétaire ; aucun indicateur approuvé sans dossier |
| P2 | AUD-FUN-001 | Tableau d’audit | En validation | KPI et liste issus d’une source et d’un périmètre uniques |
| P2 | AUD-DOC-001 | Documentation ISO | En validation | Métadonnées et droits maîtrisés ; licence et approbations humaines résiduelles |
| P2 | AUD-FUN-002 | Gestion des erreurs | En validation | États succès/vide/erreur/timeout et reprise testés |
| P2 | AUD-DATA-001 | Données de démonstration | En validation | Fixtures plausibles, versionnées, fictives et reproductibles |
| P3 | AUD-PERF-001 | Performance terrain | En validation | Budgets par route et tests Android/réseau lent respectés |
| P3 | AUD-UX-001 | Responsive mobile | En validation | Parcours critiques sans débordement aux largeurs cibles |
| P3 | AUD-UX-002 | Ancienne landing | En validation | Route retirée ou redirigée vers l’identité SafeX officielle |
| P3 | AUD-A11Y-001 | Sémantique accessible | En validation | Landmarks, noms accessibles, clavier et WCAG automatisé/manuels |
| P3 | AUD-DES-001 | Design system | En traitement | Tokens/composants versionnés et garde contre valeurs arbitraires |
| P3 | AUD-UX-003 | Langue et encodage | En validation | UTF-8, glossaire et contrôles de chaînes invalides |
| P3 | AUD-A11Y-002 | Mouvement réduit | En validation | Toute animation non essentielle neutralisée en mode réduit |
| P3 | AUD-UX-004 | Hiérarchie H1 | En validation | Un seul `h1` descriptif par route |

## Ordre de travail

1. Stabiliser l’environnement de validation et figer les tests de référence.
2. Traiter P0 par petits lots indépendants, avec tests négatifs avant correction.
3. Traiter P1 en renforçant simultanément les gates qualité.
4. Traiter P2 après confirmation des règles métier, juridictions et propriétaires documentaires.
5. Traiter P3 sur le design existant, sans réécriture globale.
6. Exécuter la qualification globale et produire les preuves de clôture.
