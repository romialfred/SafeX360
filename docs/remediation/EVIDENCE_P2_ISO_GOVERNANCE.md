# Preuves P2 — référentiels ISO, gouvernance et documentation

Date de qualification locale : 19 juillet 2026  
Périmètre : `AUD-ISO-001`, `AUD-ISO-002`, `AUD-ISO-003`, `AUD-DOC-001`, `AUD-GOV-002`

## Sources officielles contrôlées

Les éditions et statuts ont été vérifiés uniquement sur les fiches ISO officielles :

- [ISO 19011:2026 — édition 4 publiée en mai 2026](https://www.iso.org/standard/19011) ; l’édition 2018 est retirée.
- [ISO 45001:2018 — édition publiée, confirmée en 2024](https://www.iso.org/standard/63787.html), avec amendement 2024.
- [ISO 9001:2015 — édition publiée](https://www.iso.org/standard/62085.html), avec amendement 2024 ; la révision annoncée n’est pas présentée comme publiée.
- [ISO 14001:2026 — édition 4 publiée en avril 2026](https://www.iso.org/standard/14001) ; l’édition 2015 est retirée.
- [ISO 31000:2018 — édition publiée confirmée en 2023](https://www.iso.org/standard/65694.html).

Le dépôt ne contient aucune copie du texte intégral de ces normes. Les libellés de cartographie sont des repères paraphrasés ; la copie officielle sous licence reste la seule référence.

## AUD-ISO-001 — référentiel ISO 19011

Modifications vérifiées :

- registre unique versionné `2026.07.19-1` avec édition, numéro d’édition, date de publication, statut, source officielle, propriétaire, date de revue, prochaine revue, état d’approbation et analyse d’impact ;
- approbation organisationnelle explicitement maintenue « en attente » : la revue technique de la source n’est pas assimilée à une approbation métier ;
- ISO 19011 positionnée sur l’édition 2026 publiée ; ISO 14001 également corrigée vers l’édition 2026 publiée ;
- références de l’interface, badges, glossaire, commentaires du module d’audit et assistants IA mises à jour ;
- prompts IA reformulés comme assistance à un auditeur humain, sans fausse qualité d’« auditeur certifié » ;
- renvois de sous-clauses 2018 fragiles remplacés par des domaines de contrôle factuels lorsque l’équivalence 2026 n’est pas démontrée dans le dépôt.

Résiduel obligatoire : le responsable du programme d’audit doit disposer d’une copie officielle sous licence et faire approuver l’analyse d’impact 2026 (principes, risques/opportunités, programme, conduite, suivi et compétences) par un auditeur compétent.

## AUD-ISO-002 — matrice de traçabilité

La matrice distingue désormais :

`référence → processus → responsable → preuve attendue → méthode de contrôle → niveau de support → résultat → écart → module`

Garde-fous mis en œuvre :

- identifiant composite `norme:clause`, sans collision entre les clauses de même numéro ;
- suppression de la pseudo-clause `8.1.2.PPE` ; l’EPI est traité comme un moyen de maîtrise associé à la hiérarchie des mesures ;
- ajout des zones ISO 45001 signalées absentes dans le rapport ;
- routes corrigées vers les routes réellement déclarées par le routeur ;
- aucun pourcentage de conformité ni libellé « clause couverte » ;
- les lignes restent aux niveaux `NOT_SUPPORTED` ou `SUPPORTED` et au résultat « Non évalué » tant qu’aucune preuve réelle n’est examinée ;
- comptage basé sur les lignes uniques du registre, ce qui supprime les doublons de clé et les faux positifs d’agrégation.

Résiduel obligatoire : validation de la matrice par les propriétaires de processus et spécialistes des normes, sur les preuves réelles de chaque mine.

## AUD-ISO-003 — processus organisationnels

Neuf processus structurants possèdent un dossier de contrôle explicite : contexte/périmètre, politique, rôles, participation, compétences, management du changement, fournisseurs, permis de travail et revue de direction.

Chaque dossier définit le responsable, les entrées, les décisions, les participants, la preuve signée attendue, la règle d’échéance, le versionnage, la conservation, l’indicateur d’efficacité, les routes disponibles et le résiduel. Le statut `OUTSIDE_PRODUCT` est utilisé pour le MOC et les permis de travail, au lieu de simuler une couverture.

Résiduel obligatoire : l’organisation doit choisir et approuver les workflows externes ou les extensions produit, produire les signatures, fixer les durées légales de conservation et démontrer l’efficacité. Un registre logiciel vide ne constitue pas une mise en œuvre du SMSST/QMS.

## AUD-DOC-001 — documentation ISO

Le centre documentaire a été remplacé par un registre de métadonnées contrôlées en français : source officielle, édition, statut, propriétaire, dates de revue, analyse d’impact et complément suivi. Le bouton inactif de téléchargement et les longs extraits anglais du texte normatif ont été retirés. Un avertissement de droits indique qu’une licence externe est requise pour le contenu intégral.

Résiduel obligatoire : achat/licence par l’organisation, affectation nominative des approbateurs, conservation des preuves d’approbation et contrôle juridique des droits de reproduction.

## AUD-GOV-002 — allégations publiques

- registre des allégations publiables volontairement vide ;
- gate exigeant statut approuvé, source HTTPS, propriétaire, période, population, méthode de calcul, limites, validateur, date de validation et expiration ;
- rejet automatique des dossiers incomplets, non approuvés ou expirés ;
- test d’inventaire des surfaces publiques maintenu contre les anciennes promesses chiffrées et affirmations non démontrées.

Résiduel obligatoire : aucune allégation mesurable ne peut être réintroduite avant constitution et revue indépendante du dossier de preuve réel.

## Validation reproductible

Depuis `Frontend` :

```powershell
node node_modules/vitest/vitest.mjs run src/Data/IsoMappingData.test.ts src/governance/IsoDocumentationPolicy.test.ts src/governance/PublicClaimsRegistry.test.ts src/__tests__/components/PublicClaimsPolicy.test.tsx
node node_modules/typescript/bin/tsc -b --pretty false
```

Résultats locaux :

- 4 fichiers de tests réussis ;
- 13 tests réussis ;
- type-check TypeScript global réussi ;
- aucune référence `ISO 19011:2018` ni `ISO 14001:2015` dans les sources applicatives ou Java du module Health-Safety.
