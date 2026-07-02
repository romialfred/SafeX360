# PROMPT D'IMPLÉMENTATION — MODULE « GESTION DES ERREURS » (ERROR MANAGEMENT)
## Plateforme SafeX360 — Sécurité, Santé & Environnement (Secteur Minier)

> **Destinataire :** Claude Code (agent de développement)
> **Émetteur :** Direction Technique — PORDES S.A.R.L
> **Stack imposée :** NestJS (back-end) · React / TypeScript (front-end) · PostgreSQL
> **Charte visuelle :** Executive Navy — `NAVY #1E3A5F` · `TEAL #0891B2` · `AMBER #D97706`

---

## 0. RÈGLES DE TRAVAIL IMPÉRATIVES (à lire avant toute action)

1. **Pré-audit obligatoire.** Avant toute génération de code, réalise un audit exhaustif de l'existant SafeX360 : architecture des modules (Emergency Management, Dosimétrie, Blast Management), schéma de base de données, conventions de nommage, système d'authentification et de rôles, design system. Restitue cet audit et **attends ma validation**.
2. **Une action à la fois.** N'enchaîne jamais plusieurs étapes structurantes sans validation explicite. Propose, attends l'aval, exécute, rends compte.
3. **Zéro artefact de style « IA ».** Tout texte d'interface, libellé, message et documentation est rédigé en **français, registre institutionnel**, sans tournures génériques.
4. **Cohérence visuelle stricte.** Application systématique de la palette Executive Navy. Aucune couleur hors charte sans justification.
5. **Aucune dette silencieuse.** Toute hypothèse, tout écart ou toute limite est signalé explicitement.

---

## 1. CONTEXTE & FONDEMENT THÉORIQUE

Le module ne doit **pas** être un simple registre d'incidents. Il matérialise une **culture de gestion des erreurs** (*Error Management Culture*, van Dyck & Frese, 2005), dont la littérature établit le lien direct avec la performance et la résilience de l'organisation.

Il s'appuie sur quatre fondements scientifiques à incarner dans la conception :

- **Taxonomie de l'erreur (J. Reason)** : ratés/lapsus, erreurs de jugement, transgressions ; défaillances latentes vs actives (modèle du fromage suisse).
- **Just Culture (Reason, Dekker)** : distinction erreur honnête / faute, condition d'une déclaration sans crainte de sanction.
- **Fiabilité organisationnelle (HRO, Weick & Sutcliffe)** : la préoccupation de l'échec comme moteur d'apprentissage.
- **Pyramide de la sécurité (Bird/Heinrich)** : valorisation des presqu'accidents comme signaux précurseurs.

Le **Retour d'Expérience (REX)** est intégré comme **couche de capitalisation** du module, et non comme finalité unique.

---

## 2. OBJECTIF FONCTIONNEL

Permettre à l'organisation de **déclarer, qualifier, analyser, traiter, capitaliser et prévenir** l'ensemble des erreurs et événements indésirables, dans une logique apprenante et non punitive, avec traçabilité intégrale et pilotage par indicateurs.

---

## 3. PÉRIMÈTRE FONCTIONNEL

### 3.1 Typologie des événements (référentiel paramétrable)
- Situation dangereuse / condition dangereuse (*unsafe condition*)
- Comportement à risque (*unsafe act*)
- Presqu'accident (*near-miss*)
- Incident
- Accident (avec/sans arrêt, premiers soins)
- Non-conformité
- **Événement à haut potentiel (HiPo / potentiel SIF — Serious Injury & Fatality)**

### 3.2 Classification de l'erreur (taxonomie Reason)
- Raté / lapsus
- Erreur de jugement
- Transgression (avec sous-typage : routinière, exceptionnelle)

### 3.3 Cycle de vie (workflow à états)
```
Déclaration → Qualification/Triage → Investigation & Analyse causale
→ Plan d'actions (CAPA) → Mise en œuvre → Vérification d'efficacité
→ Clôture → Capitalisation (REX)
```
Chaque transition est horodatée, tracée et associée à un responsable. États non régressifs sauf réouverture justifiée.

### 3.4 Déclaration
- Formulaire structuré (qui, quoi, où, quand, conséquences réelles & potentielles, pièces jointes).
- **Mode anonyme optionnel** (pilier Just Culture).
- Pré-qualification automatique de la gravité via **matrice de criticité (probabilité × gravité)**.

### 3.5 Analyse causale (RCA — moteur méthodologique)
Proposer un assistant d'analyse supportant a minima :
- **5 Pourquoi**
- **Diagramme d'Ishikawa (5M/6M)**
- **Arbre des causes** (méthode INRS, usuelle dans l'analyse d'accident)
- Cadre **ICAM** (causes immédiates → conditions latentes → facteurs organisationnels) — référence sectorielle minière.

Distinguer explicitement : **causes immédiates / causes profondes / défaillances systémiques & organisationnelles**.

### 3.6 CAPA — Actions Correctives et Préventives
- Action corrective (curative immédiate) et action préventive (récurrence).
- Champs : responsable, échéance, statut, ressources, preuve de réalisation, **évaluation d'efficacité** (efficace / partiellement / inefficace → réouverture).
- Relances automatiques sur échéances et alertes de retard.

### 3.7 Just Culture
- Arbre décisionnel de culpabilité (test de substitution).
- Séparation stricte de l'analyse apprenante et de toute dimension disciplinaire.

### 3.8 REX — Capitalisation
- Génération de **fiches REX** synthétiques à partir des événements clôturés.
- Base de connaissances consultable (recherche, filtres, tags).
- **Alertes sécurité** diffusables (HiPo, événements récurrents).

---

## 4. INDICATEURS & TABLEAUX DE BORD

Tableau de bord direction (palette Executive Navy) avec a minima :
- **Taux de fréquence (TF)** et **taux de gravité (TG)**.
- **Ratio presqu'accidents / accidents** (suivi de la pyramide de la sécurité).
- **Taux de récurrence** par type / zone / cause profonde.
- **Délai moyen de traitement** et **taux de clôture des actions CAPA** dans les délais.
- **Indice de maturité de la culture erreur** (volume de déclarations sans blâme, part de presqu'accidents, taux de participation).
- Cartographie thermique des zones / causes.

---

## 5. MODÈLE DE DONNÉES (entités principales à valider avant migration)

- `evenement` (déclaration, type, statut, gravité réelle/potentielle, anonymat, géolocalisation/zone, dates)
- `classification_erreur` (taxonomie Reason)
- `analyse_causale` (méthode employée, causes hiérarchisées)
- `cause` (libellé, niveau : immédiate/profonde/systémique)
- `action_capa` (type, responsable, échéance, statut, efficacité, preuves)
- `fiche_rex` (synthèse, enseignements, diffusion)
- `referentiel_*` (types, gravités, matrices — paramétrables)
- `piece_jointe`, `historique_evenement` (audit trail intégral)

Respecter le schéma et les conventions PostgreSQL existants de SafeX360. Proposer les migrations **avant** exécution.

---

## 6. RÔLES & HABILITATIONS

- **Déclarant** (tout collaborateur) : déclarer, suivre ses déclarations.
- **Animateur HSE** : qualifier, conduire l'analyse, piloter les CAPA.
- **Responsable d'action** : exécuter et justifier les actions assignées.
- **Manager / Direction** : tableaux de bord, validation, clôture.
- **Administrateur** : référentiels et paramétrage.

Réutiliser le système RBAC existant de SafeX360 ; ne pas créer un mécanisme parallèle.

---

## 7. INTÉGRATION DANS SAFEX360

- Réutiliser le **design system, l'authentification, la navigation et le socle technique** existants.
- Prévoir des **passerelles** vers les modules connexes : déclenchement d'un événement depuis Emergency Management ; corrélation possible avec Blast Management et Dosimétrie.
- Le module apparaît comme une **brique native**, jamais comme un greffon.

---

## 8. LIVRABLES ATTENDUS (par étapes validées)

1. **Rapport de pré-audit** de l'existant + plan d'intégration. *(STOP — validation)*
2. **Modèle de données** + migrations proposées. *(STOP — validation)*
3. **Back-end NestJS** : entités, services, contrôleurs, validation, RBAC, tests.
4. **Front-end React/TS** : formulaires, workflow, assistant RCA, tableaux de bord (charte Executive Navy).
5. **Référentiels paramétrables** initialisés (jeux de données minier réalistes).
6. **Documentation** technique et fonctionnelle (français institutionnel).

---

## 9. PREMIÈRE ACTION DEMANDÉE

Ne génère **aucun code** maintenant. Commence par le **rapport de pré-audit (livrable 1)** : restitue l'architecture SafeX360 existante, les points d'intégration, les contraintes identifiées et ta proposition de plan d'implémentation par étapes. Puis attends ma validation.
