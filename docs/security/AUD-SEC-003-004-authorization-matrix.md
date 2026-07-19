# AUD-SEC-003 / AUD-SEC-004 — Autorisation serveur et cloisonnement par mine

Date de mise à jour : 2026-07-19  
Périmètre : Gateway SafeX et microservice Health-Safety (HNS)  
Statut : socle P1 implémenté localement, validation de non-régression globale à poursuivre

## 1. Objectif du contrôle

Ce lot traite les deux constats suivants :

- **AUD-SEC-003** : autorisation serveur insuffisamment homogène sur les contrôleurs HNS ;
- **AUD-SEC-004** : risque d'accès inter-mine lorsque l'identifiant de mine est absent, forgé ou non vérifié.

Les contrôles contribuent notamment aux principes de responsabilités définies, de maîtrise opérationnelle et de protection des informations documentées attendus par ISO 45001 et ISO 9001. Ils ne constituent pas, à eux seuls, une certification ISO.

## 2. Chaîne de confiance appliquée

1. La Gateway supprime les en-têtes clients `X-Secret-Key`, `X-User-Id`, `X-Role`, `X-Permissions`, `X-User-Companies` et `X-All-Mines`.
2. Après validation du JWT, elle réinjecte l'identité, le rôle normalisé, les permissions et le périmètre issus des claims autoritaires.
3. HNS n'interprète ces en-têtes qu'après validation du secret interne Gateway.
4. Un appel interne n'est reconnu que s'il possède le secret valide **et aucun** marqueur utilisateur.
5. Un contexte utilisateur partiel, mal formé, sans mine ou portant un rôle inconnu est refusé par défaut.

## 3. Matrice rôle × opération

| Rôle normalisé | Lecture | Déclaration HSE | Libre-service | Écriture métier | Administration des habilitations | Export | Restriction complémentaire |
|---|---:|---:|---:|---:|---:|---:|---|
| `SYSTEM_ADMINISTRATOR`, `ADMINISTRATOR`, `ADMIN` | Oui | Oui | Oui | Oui | Oui | Oui | Mine assignée ou claim `allMines` |
| `HEALTH_SAFETY_COORDINATOR`, `HSE_MANAGER`, `HSE_OFFICER` | Oui | Oui | Oui | Oui | Non | Oui | Mine assignée ou claim `allMines` |
| `INCIDENT_INVESTIGATOR` | Oui | Oui | Oui | Oui | Non | Non | Mine assignée uniquement, sauf claim `allMines` explicitement émis |
| `AUDITOR` | Oui | Oui | Oui | Audits et inspections uniquement | Non | Oui | Mine assignée uniquement, sauf claim `allMines` explicitement émis |
| `EMPLOYEE` | Oui | Oui | Oui | Non | Non | Non | Mine assignée uniquement, sauf claim `allMines` explicitement émis |
| Rôle absent ou inconnu | Non | Non | Non | Non | Non | Non | Refus par défaut |
| Appel système interne | Oui | Oui | Oui | Oui | Oui | Oui | Secret interne valide et absence totale de contexte utilisateur |

### Classification des opérations

- **Lecture** : `GET` et `HEAD`, hors chemin d'export.
- **Déclaration HSE** : création d'incident, non-conformité, erreur, observation, quasi-accident ou signalement de danger.
- **Libre-service** : jeton push mobile, accusé de réception utilisateur et lecture de ses propres habilitations. L'identifiant `/by-account/{id}` doit égaler `X-User-Id`, sauf pour un administrateur.
- **Écriture métier** : autres `POST`, `PUT`, `PATCH` et `DELETE`.
- **Administration des habilitations** : mutations de `/users/permissions` et `/modules`, réservées aux administrateurs ou aux appels système internes.
- **Export** : chemins explicitement identifiés par `export`, `download`, `pdf`, `csv` ou `attestation`.
- Verbe non classé : refus.

## 4. Matrice de périmètre mine

| Contexte mine | Résultat |
|---|---|
| `companyId` appartient aux mines du JWT | Autorisé si le rôle autorise l'opération |
| `companyId` hors des mines du JWT | `403` avant le contrôleur |
| Plusieurs paramètres `companyId` | `403` — prévention de pollution de paramètres |
| `companyId` absent et au moins une mine assignée | Injection serveur de la première mine assignée |
| Aucune mine assignée et `allMines=false` | `403` — refus par défaut |
| `allMines=true`, en-tête Gateway authentifié | Accès consolidé selon le rôle |
| En-têtes de périmètre forgés sans secret valide | `401` — en-têtes non approuvés |
| Appel système sans marqueur utilisateur et avec secret valide | Autorisé ; responsabilité reportée sur l'identité technique |

## 5. Couverture technique

Le garde transversal couvre les contrôleurs HNS sans imposer une réécriture complète. Le filtre de mine vérifie ou injecte `companyId` avant l'exécution du contrôleur. Les services qui utilisent déjà `companyId` dans leurs requêtes de dépôt bénéficient donc immédiatement du refus inter-mine, notamment :

- incidents, non-conformités et gestion des erreurs ;
- audits, rapports d'audit et check-lists ;
- activités et rapports d'activités ;
- documents et versions ;
- équipements, indicateurs et risques chimiques.

`CompanyScopeGuard` reste disponible pour les mines présentes dans un corps de requête, une variable de chemin ou résolues depuis l'entité cible.

Les chemins publics strictement nécessaires (`actuator`, WebSocket et page d'erreur technique) ne sont pas soumis à ces filtres. Les modules urgence/SOS, tirs de mine et dosimétrie sont exclus du **nouveau filtre de rôles** parce qu'ils sont traités par des lots parallèles avec des permissions spécialisées ; le filtre de cloisonnement mine existant reste actif sur leurs requêtes HTTP métier.

## 6. Tests de sécurité associés

Les tests automatisés couvrent :

- acceptation d'une lecture dans la mine assignée ;
- rejet de la même opération sur une autre mine ;
- rejet d'une mutation et d'un export par un employé ;
- rejet d'un faux rôle administrateur sans secret Gateway valide ;
- rejet d'un contexte utilisateur incomplet ou mal formé ;
- rejet des paramètres `companyId` dupliqués ;
- clamp de la mine lorsque `companyId` est absent ;
- comportement `allMines` positif et négatif ;
- refus des rôles, verbes et périmètres inconnus.
- suppression des en-têtes falsifiés par la Gateway et réinjection de l'identité issue du JWT.
- lecture d'habilitations limitée à SELF ou ADMIN, avec rejet d'un autre identifiant de compte.

Validation locale du 2026-07-19 sous Java 17 : suite complète HNS réussie et suite complète Gateway réussie. Les traces d'erreurs simulées par certains tests de résilience (base indisponible, SMTP ou broker indisponible) sont attendues et n'ont pas entraîné d'échec de test.

## 7. Surfaces résiduelles — à ne pas considérer comme closes

| ID | Priorité | Surface résiduelle | Risque / action de clôture |
|---|---|---|---|
| SEC-R01 | Haute | Le secret Gateway est statique et partagé ; il ne s'agit pas d'une signature HMAC par requête ni d'une identité mTLS. | Compromission du secret = capacité d'usurper un appel interne. Mettre en place mTLS ou signature horodatée avec anti-rejeu et rotation. |
| SEC-R02 | Haute | Un filtre HTTP ne peut pas déduire la mine propriétaire d'un identifiant métier arbitraire. Les accès `/get/{id}`, mutations par ID et relations parent/enfant restent sûrs seulement si le service lie l'ID au `companyId`. | Achever l'inventaire dépôt par dépôt et imposer des requêtes `findByIdAndCompanyId` ou appeler `CompanyScopeGuard` après résolution du propriétaire. Priorité : communications, équipes d'incident, investigations, enseignements tirés et historiques. |
| SEC-R03 | Haute | Les référentiels accessibles par ID ne sont pas tous classés explicitement « globaux » ou « par mine ». | Documenter puis tester la propriété de `WorkProcess`, `WorkArea`, `AuditArea`, conditions météo, parties du corps, check-lists, types/catégories d'incident, sévérités, lieux et exigences. |
| SEC-R04 | Haute | Urgence/SOS, blast et dosimétrie ne passent pas par la nouvelle matrice générique de rôles. | Conserver et valider leurs gardes spécialisés dans les lots propriétaires, avec tests inter-mine dédiés. |
| SEC-R05 | Moyenne | Les claims de mines restent valides jusqu'à expiration/renouvellement du JWT. | Réduire la durée des tokens ou ajouter révocation/version de périmètre. |
| SEC-R06 | Moyenne | `allMines` est un privilège global binaire. | Introduire des périmètres explicites par groupe/région et journaliser toute utilisation consolidée. |
| SEC-R07 | Moyenne | La détection d'un export dépend aujourd'hui du nom du chemin. | Ajouter une permission explicite ou une annotation obligatoire pour chaque nouvel endpoint d'export, vérifiée par test d'architecture. |
| SEC-R08 | Moyenne | Les appels système internes disposent encore d'un périmètre large. | Donner une identité et des permissions propres à chaque service ; supprimer progressivement le fallback « secret seul ». |

## 8. Critères de clôture définitive

AUD-SEC-003 et AUD-SEC-004 ne devront être déclarés totalement clos qu'après :

1. inventaire exhaustif des endpoints par ID avec preuve de requête tenant-aware ;
2. tests d'intégration base de données sur au moins deux mines pour lectures, mutations et exports ;
3. tests des gardes spécialisés urgence, blast et dosimétrie ;
4. validation métier de la matrice par le responsable HSE et le propriétaire des habilitations ;
5. remplacement ou durcissement du secret partagé ;
6. test de non-régression complet Gateway + HNS + front local.
