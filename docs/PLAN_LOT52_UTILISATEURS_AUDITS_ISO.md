# LOT 52 — Plan d'implémentation
## Module A : Gestion des utilisateurs (refonte professionnelle) · Module B : Gestion des Audits conforme ISO 19011:2018

> Statut : **EN ATTENTE DE VALIDATION** — rédigé le 2026-06-10 après cartographie exhaustive du code existant.
> Après validation, exécution en autonomie, puis évaluation par un Expert indépendant (gate ≥ 9/10, sinon itération).

---

# MODULE A — Gestion des utilisateurs

## A.0 État des lieux (constats sur le code actuel)

| Exigence | État actuel | Écart |
|---|---|---|
| Utilisateur rattaché à une Mine | `Account.company_id` existe mais **nullable**, non exigé à la création | Rattachement obligatoire à imposer (DB + serveur + UI) |
| Création non modale | `CreateUserWizard` = **Modal** Mantine 3 étapes | Page pleine largeur à créer |
| Import AD ou identité locale | **Aucune** trace LDAP/AD/Entra/SSO dans le code | Connecteur à construire de zéro |
| Mot de passe temporaire + changement forcé | ✅ déjà en place (`firstLogin=true`, page `/first-login` bloquante, OWASP) | À durcir : expiration de l'invitation, renvoi |
| Rôle + accès par module obligatoires | Rôle requis, **modules optionnels** (CSV nullable) | Validation stricte serveur à imposer |
| Sidebar filtrée par droits | ❌ filtre uniquement par module actif **global**, pas par droits utilisateur | Filtrage par permissions à implémenter |
| RBAC endpoints admin | `@PreAuthorize` absent des endpoints sensibles | Durcissement |

## A.1 Backend — fondations de rigueur (HRMS + HNS)

1. **Mine obligatoire** : `companyId` requis dans `CreateUserRequest` (validation 400 sinon), FK `account.company_id NOT NULL` après **migration de rattrapage** des comptes existants (écran admin « comptes sans mine » + assignation en masse).
2. **Source d'identité** : nouveau champ `identity_source` (`LOCAL` | `ACTIVE_DIRECTORY`) sur `account`.
3. **Connecteur Active Directory (LDAP/LDAPS)** :
   - Paramétrage dans Administration → Annuaire : hôte, port, baseDN, compte de service (chiffré AES — infra `SAFEX_ENCRYPTION_KEY` déjà en place), mapping attributs (sAMAccountName→login, mail, displayName, department).
   - **Recherche/import** : endpoint `GET /hrms/directory/search?q=` (bind technique, lecture seule).
   - **Authentification déléguée** : si `identity_source=AD` → bind LDAP au login (aucun mot de passe local stocké, pas de page first-login pour ces comptes).
   - **Mode démo configurable** : si aucun annuaire branché (cas Render actuel), un annuaire simulé (jeu de données réaliste) permet de démontrer le flux complet — clairement étiqueté « Démo ».
4. **Création stricte** : rôle **et** matrice de modules obligatoires (refus serveur si vide) ; transaction atomique existante conservée ; échec d'init des permissions HNS → **rollback** (fini le best-effort).
5. **Invitation à durée limitée** : mot de passe temporaire expirant (72 h), endpoint « renvoyer l'invitation », statut visuel (Invité / Actif / Expiré / Désactivé).
6. **Durcissement RBAC** : `@PreAuthorize("hasAuthority('USERS_MANAGE')")` sur tous les endpoints admin (create/reset/toggle/directory) + journal d'administration immuable (qui a créé/modifié/désactivé qui, quand).

## A.2 Frontend — création/édition en page pleine (non modale)

- **Nouvelle page `/users-admin/new`** (conventions plateforme R1 : pleine largeur, titre Source Serif 4, fond #FAF8F3), remplaçant le modal. Parcours en 4 étapes avec rail de progression :
  1. **Source d'identité** : choix visuel LOCAL ↔ ACTIVE DIRECTORY ; si AD → recherche dans l'annuaire et pré-remplissage (identité verrouillée, badge AD).
  2. **Identité & rattachement** : nom, email, téléphone, **Mine (obligatoire)**, département, poste, lien Employé existant.
  3. **Rôle & accès** : rôle (presets existants) + **matrice par module raffinée** (par catégorie, droits R/W/D, « tout cocher » par catégorie, héritage du preset avec écarts visibles), impossible de valider sans au moins 1 module.
  4. **Récapitulatif & création** : synthèse complète, création, affichage unique du mot de passe temporaire (si LOCAL) + envoi email.
- **Édition** : même page en mode édition (`/users-admin/:id/edit`).
- `CreateUserWizard` (modal) supprimé après bascule — zéro régression sur la liste existante.

## A.3 Sidebar et navigation pilotées par les permissions

- Le menu est filtré par `usePermissions` : **un module sans droit Lecture n'apparaît pas** ; les catégories vides disparaissent ; `ALWAYS_ACCESSIBLE` réduit à l'essentiel (accueil, profil).
- Cohérence totale : les gardes du Router renvoient `PermissionDenied` sur accès URL direct (pas seulement le masquage visuel).
- Cache des permissions au login + invalidation à la modification par un admin.

## A.4 Critères d'acceptation Module A

- Impossible de créer un utilisateur sans mine, sans rôle ou sans aucun module (vérifié côté serveur).
- Création en page pleine, jamais en modal ; parcours AD complet démontrable (réel ou mode démo).
- Compte LOCAL : connexion → page de changement obligatoire → accès ; lien expiré → écran dédié + renvoi possible.
- Un utilisateur « EMPLOYEE » ne voit dans la sidebar **que** ses 5 modules ; l'URL directe d'un module interdit → écran « accès refusé ».
- Journal d'administration consultable ; endpoints admin refusés (403) à un non-admin.

---

# MODULE B — Gestion des Audits conforme ISO 19011:2018

## B.0 État des lieux

Le socle est réel (plan d'audit, équipe, exécution par domaine, observations avec preuves, rapport avec approbation, recommandations suivies) mais **non conforme ISO 19011** sur des points structurants :

| Exigence ISO 19011 | État | Écart |
|---|---|---|
| §5 Programme d'audit fondé sur les **risques** | Plan annuel simple (PENDING/APPROVED) | Pas de programme formel ni priorisation par risque |
| §7 **Compétence** des auditeurs | `InternalAuditor.role` texte libre | Pas de qualifications, certifications, domaines, indépendance |
| §6.2 Réunions d'**ouverture/clôture** distinctes | 1 entité Meeting générique | Pas de distinction ni feuille de présence |
| §6.4 Critères d'audit / checklists | Références en texte libre | Pas de checklist structurée par référentiel |
| Classification des constats | severity 1-5 libre | Pas de **NC majeure / NC mineure / Observation / Opportunité** + clause |
| §6.5 Rapport diffusé | Report DRAFT→APPROVED | Pas de génération PDF ni diffusion tracée |
| §6.6 Suivi d'audit | Recommendation + progress | Pas de **vérification d'efficacité** post-clôture |
| §5.7 Surveillance du programme | KPI par statut uniquement | Pas de taux de réalisation, conformité par clause, tendances |

## B.1 Programme d'audit fondé sur les risques (ISO §5)

- Nouvelle entité **AuditProgram** (année, objectifs, périmètre, ressources, statut) regroupant les audits.
- **Priorisation par le risque** : score par processus/site (criticité × historique NC × date du dernier audit) suggérant la fréquence ; matrice visible et modifiable.
- Workflow d'approbation du programme (proposé → approuvé par la direction) ; le plan annuel actuel devient une vue du programme.

## B.2 Référentiel de compétences auditeurs (ISO §7)

- `InternalAuditor` enrichi : qualifications, certifications (avec échéance), formations, domaines de compétence, langue, historique d'audits, **évaluation périodique**.
- Règles d'affectation : un audit exige un **Lead Auditor qualifié** ; contrôle d'**indépendance** (un auditeur n'audite pas son propre département) — blocage à la composition de l'équipe.

## B.3 Cycle d'audit complet (ISO §6)

1. **Plan d'audit formel** : critères (référentiels + clauses), périmètre précis, méthodes, calendrier détaillé par domaine/jour, plan diffusé à l'audité.
2. **Réunion d'ouverture** et **réunion de clôture** distinctes (type, participants, feuille de présence, points obligatoires pré-remplis ISO).
3. **Checklists d'audit** : bibliothèques de questions par référentiel (ISO 9001/14001/45001 fournies en seed), questions cochées conformes/non conformes/N.A. avec preuve — la checklist guide l'exécution.
4. **Constats classés ISO** : NC majeure / NC mineure / Observation / Opportunité d'amélioration, **clause du référentiel obligatoire**, preuve obligatoire pour les NC.
5. **Intégration plateforme** : une NC d'audit crée automatiquement un **Constat central** (NonConformity) lié + action corrective pré-remplie — un seul flux de traitement des écarts dans SafeX.
6. **Rapport conforme** : génération **PDF** structurée ISO (en-tête, critères, équipe, synthèse par domaine, constats classés, conclusions), circuit d'approbation existant conservé + diffusion tracée.
7. **Vérification d'efficacité** (§6.6) : après clôture des actions, étape dédiée avec échéance, évaluateur, verdict (efficace / partiellement / inefficace → réouverture).

## B.4 Innovations

- **Assistance IA** (infrastructure AnthropicClient du LOT 50 réutilisée, toujours optionnelle) : aide à la rédaction factuelle des constats, suggestion de classification + clause, **revue de cohérence du rapport** avant soumission.
- **Tableau de bord du programme** : taux de réalisation du programme, répartition des constats par clause/domaine/mine, délai moyen de traitement, aging des actions, tendances inter-années.
- **Exports** : rapport PDF, registre des constats CSV.

## B.5 Critères d'acceptation Module B

- Un cycle complet est démontrable de bout en bout : programme → audit priorisé par risque → équipe qualifiée contrôlée → plan diffusé → réunion d'ouverture → checklist exécutée → constats classés ISO avec preuves → réunion de clôture → rapport PDF approuvé → NC centrales + actions → vérification d'efficacité → KPI programme à jour.
- Blocages de rigueur effectifs (pas de NC sans clause/preuve, pas d'équipe sans lead qualifié, pas de clôture sans rapport approuvé).
- i18n FR/EN complet, conventions visuelles plateforme (R1/R7), zéro régression sur l'existant.

---

# Déroulement, ordre et gate qualité

| Phase | Contenu | Dépendances |
|---|---|---|
| 52.A1 | Backend utilisateurs (mine obligatoire, AD, rigueur, RBAC) | — |
| 52.A2 | Page création/édition non modale | A1 |
| 52.A3 | Sidebar + Router pilotés par permissions | A1 |
| 52.A4 | Tests + données + journal admin | A1-A3 |
| 52.B1 | Programme d'audit + risques | — (parallèle à A) |
| 52.B2 | Compétences auditeurs | B1 |
| 52.B3 | Cycle ISO complet (plan, réunions, checklists, constats, rapport PDF, efficacité) | B1-B2 |
| 52.B4 | IA + tableau de bord programme | B3 |
| 52.GATE | **Expert indépendant** (agent dédié, grille de notation) : conformité ISO 19011, sécurité/IAM, robustesse, performance, UX — **note < 9/10 ⇒ itération corrective puis re-évaluation** | tout |

**Points nécessitant votre arbitrage avant lancement :**
1. **Active Directory** : avez-vous un annuaire réel à brancher (LDAP on-premise ou Azure/Entra ID) ? Sinon je livre le connecteur LDAP complet + le mode démo configurable.
2. **Référentiels prioritaires** pour les checklists d'audit : ISO 45001 + 14001 + 9001 (les trois en seed) ?
3. La **migration** des comptes existants sans mine : assignation automatique à la mine principale ou écran de rattrapage manuel ?
