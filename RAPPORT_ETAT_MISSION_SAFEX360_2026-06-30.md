# RAPPORT D'ETAT DE MISSION — SafeX 360
## Audit complet : Workflows, Securite, Robustesse, Validation
**Date** : 30 juin 2026 | **Commit production** : `c90d5f0` | **179 commits** sur `main`

---

# PARTIE 1 — SYNTHESE EXECUTIVE

## Etat global de la plateforme

| Dimension | Score | Commentaire |
|-----------|-------|-------------|
| Fonctionnalites metier | **8/10** | 15+ modules HSE livres, UI premium |
| Securite applicative | **3/10** | 12/13 points critiques encore ouverts |
| Machine a etats (workflows) | **2/10** | 2 modules corrects sur 10 audites |
| Validation des entrees | **2/10** | 226/270 endpoints sans @Valid |
| Concurrence / Integrite | **2/10** | 3/165 entites avec @Version |
| Gestion d'erreurs | **3/10** | 139 catch vides, intercepteur mort |
| i18n | **6/10** | P0 deploye, P1 commite, ~550 chaines restantes |
| UX / Coherence UI | **7/10** | Quelques composants de date et etats vides manquants |

---

# PARTIE 2 — TACHES COMPLETEES (Livrees en production)

## LOTs livres et deployes

| LOT | Commit | Description | Statut |
|-----|--------|-------------|--------|
| LOT 49 | `082dbb0` | Refonte modules + Risques ISO 45001 + audits formulaires | DEPLOYE |
| LOT 50 | `d3afc4e` | Assistance IA inspections (photo + relecture) | DEPLOYE |
| LOT 51 | `ca2f1d4` | Outillage base MySQL locale + sablier d'attente | DEPLOYE |
| LOT 52 A | `c8ec2ac`→`747fb9b` | Utilisateurs AD + rigueur + sidebar permissions | DEPLOYE |
| LOT 52 B | `940091d`→`253e710` | Audits ISO 19011 backend + frontend | DEPLOYE |
| LOT 53 | `27327fb` | Rigueur ISO 19011 renforcee + referentiel minier + IA | DEPLOYE |
| LOT 54 | `d42179c` | Tuiles dynamiques (zoom + retournement 3D) | DEPLOYE |
| LOT 55-57 | `67fc42c` | Incidents, actions en attente, investigation premium | DEPLOYE |
| LOT 58 | `7102411` | i18n P0 — Accueil + Sidebar + Header FR/EN | DEPLOYE |
| LOT 59 | `1b2afbd`→`b436248` | i18n P1 — Incidents, Audits, Adhoc bilingues | DEPLOYE |
| LOT 60 | `1d730ac` | i18n P2 — EPI, Risques, Communication bilingues | DEPLOYE |
| LOT 61 | `41df600` | Module utilisateurs premium (sessions, suppression) | DEPLOYE |
| LOT 62 | `8e8a377` | Remediation audit P0→P1 (RBAC, fusion ecrans) | DEPLOYE |
| SEC-01/02/03 | `c90d5f0` | Secrets hardcodes + rate-limiting + nettoyage CORS | DEPLOYE |

## Securite — 3 items corriges (sur 15 identifies)

| ID | Description | Commit | Statut |
|----|-------------|--------|--------|
| SEC-01 | Supprimer JWT_SECRET par defaut du code source | `c90d5f0` | FAIT |
| SEC-02 | Rate-limiting sur /auth/login (anti brute-force) | `c90d5f0` | FAIT |
| SEC-03 | Retirer @CrossOrigin redondant + nettoyage CORS | `c90d5f0` | FAIT |

## Workflows — 2 modules correctement implementes

| Module | Fichier | Mecanisme | Statut |
|--------|---------|-----------|--------|
| Blasting | `BlastServiceImpl.java:519-566` | Switch-case `assertTransition()` — 9 statuts explicites | GOLD STANDARD |
| Inspections (refonte) | `InspectionWorkflowService.java:353-359` | `assertStatusIn()` — gardes sur 4 transitions | BON |
| SOS Alertes | `SosAlertService.java:57-64,144-180` | Map TRANSITIONS + validation explicite | BON |

---

# PARTIE 3 — TACHES INCOMPLETES (Partiellement traitees)

## 3.1 Securite — 12 points critiques ENCORE OUVERTS

### P0-CRITIQUE — A corriger IMMEDIATEMENT

| # | Vulnerabilite | Fichier:Ligne | Impact | Correction |
|---|---------------|---------------|--------|------------|
| SEC-04 | **AdminRepairController en production** | `Backend/MineXpert/.../AdminRepairController.java:41` | Secret hardcode `SAFEX_REPAIR_2026`, SQL brut. Le commentaire dit "DOIT etre supprime apres usage" | **SUPPRIMER LE FICHIER ENTIER** |
| SEC-05 | **AccountAPI — mass assignment** | `Backend/MineXpert/.../AccountAPI.java:47-155` | 3+ endpoints sans auth : `/add` (L47), `/update` (L55), `/updatePermissions` (L151). Role, mot de passe, 20+ champs de permissions controlables par un attaquant | Ajouter `@PreAuthorize("hasRole('ADMIN')")` + activer `@EnableMethodSecurity` + separer les DTOs (CreateAccountDTO, UpdatePermissionsDTO) |
| SEC-06 | **Mot de passe dans les reponses API** | `Backend/MineXpert/.../Account.java:45` + `Account.toDTO():111` | Hash BCrypt du mot de passe copie dans AccountDTO et retourne par GET /account/get, /getAll | Ajouter `@JsonIgnore` sur `Account.password` + supprimer `dto.setPassword()` de `toDTO()` |
| SEC-07 | **Donnees financieres employe exposees** | `Backend/MineXpert/.../Employee.java:97-124` | 59 champs dont IBAN, bank, accountNumber, tous les salaires, CNPS — ZERO @JsonIgnore | Ajouter `@JsonIgnore` sur les champs financiers + creer `EmployeeSummaryDTO` pour les endpoints publics |
| SEC-08 | **WebSocket auth desactivee** | `Backend/Health-Safety/.../StompSecurityInterceptor.java:48-52` | Enforcement commente : "soft policy en dev local". WebSocket CONNECT sans token valide possible | Decommenter le `throw new IllegalArgumentException` (L51-52) |
| SEC-09 | **WebClientConfig secret hardcode** | `Backend/GatewayMS/.../WebClientConfig.java:13` | Literal `"SECRET"` au lieu de la variable d'env `INTERNAL_GATEWAY_SECRET`. Envoi du mauvais secret | Remplacer par `@Value("${INTERNAL_GATEWAY_SECRET:}")` |

### P1-ELEVE

| # | Vulnerabilite | Fichier:Ligne | Correction |
|---|---------------|---------------|------------|
| SEC-10 | **TokenFilter bypass par path.contains()** | `Backend/GatewayMS/.../TokenFilter.java:40` | Remplacer `path.contains("/actuator/health")` par `path.startsWith("/actuator/health")` |
| SEC-11 | **ProtectedRoute permissions commentees** | `Frontend/src/routes/ProtectedRoutes.tsx:26-39` | Decommenter la verification `permissions?.[permission][op]` |
| SEC-12 | **Swagger permitAll en production** | `MyConfig.java:41-42` + `SecurityConfig.java:67-68` | Conditionner avec `@Profile("dev")` ou supprimer en prod |
| SEC-13 | **DirectorySettings LDAP password expose** | `Backend/MineXpert/.../DirectorySettings.java:53` | Ajouter `@JsonIgnore` sur `bindPasswordEnc` |
| SEC-14 | **ExceptionControllerAdvice fuite** | `MineXpert:L44` + `HNS:L55` | Retourner message generique, logger `exception.getMessage()` cote serveur |
| SEC-15 | **DemoDirectory mot de passe hardcode** | `Backend/MineXpert/.../DemoDirectory.java:18` | Externaliser dans variable d'env + forcer `demoMode=false` en prod |

### Point utilisateur TOUJOURS en attente

| # | Description | Statut |
|---|-------------|--------|
| SEC-00 | **Rotation mot de passe Aiven** | Fuite publique depuis 2026-03-12. Scripts purges mais mot de passe NON TOURNE. **Action utilisateur requise dans la console Aiven** |

---

## 3.2 Workflows — 7 modules SANS machine a etats

| # | Module | Fichier:Ligne | Probleme | Correction recommandee |
|---|--------|---------------|----------|------------------------|
| WF-01 | **Incidents** | `IncidentServiceImpl.java:259-265` | `updateIncidentStatus()` accepte N'IMPORTE QUEL statut. Un brouillon peut passer directement en "clos" | Implementer `assertTransition()` sur le modele BlastServiceImpl. Transitions : DRAFT→REPORTED→UNDER_INVESTIGATION→RESOLVED→CLOSED |
| WF-02 | **Audits (partiel)** | `AuditServiceImpl.java:153-162` | Seule la transition vers CLOSED est validee (ISO 19011). Aucune garde sur PLANNING→EXECUTION, CANCELLED→PLANNING | Completer avec gardes sur TOUTES les transitions. Un audit non valide NE PEUT PAS etre planifie |
| WF-03 | **Non-conformites** | `NonConformityServiceImpl.java:139-145` | ZERO validation. N'importe quel EventStatus accepte + catch vide (L57-63) qui masque les echecs d'actions correctives | Ajouter machine a etats + propager les exceptions |
| WF-04 | **Risques** | `RiskServiceImpl.java:82-87` + `Risk.java:42` | Statut = `String` libre (pas un enum). Aucune machine a etats | Convertir en enum `RiskStatus` (IDENTIFIED, ASSESSED, TREATED, MONITORED, CLOSED) + assertTransition |
| WF-05 | **Actions correctives** | `CorrectiveActionServiceImpl.java:317-322,340-345` | `approveAction()` met INCONDITIONNELLEMENT IN_PROGRESS. `cancelAction()` met INCONDITIONNELLEMENT CANCELLED. Aucune precondition | Verifier statut courant avant transition. Seul PENDING→IN_PROGRESS, seul {PENDING,IN_PROGRESS}→CANCELLED |
| WF-06 | **Inspections (legacy)** | `GeneralInspectionServiceImpl.java:110-117` | `updateInspectionStatus()` accepte n'importe quel InspectionStatus | Migrer vers le modele InspectionWorkflowService ou ajouter gardes equivalentes |
| WF-07 | **Processus d'action** | `ActionProcessServiceImpl.java:55-66` | Statut du parent CorrectiveAction ecrase depuis le DTO sans aucune verification | Valider la transition avant d'ecraser le statut |

### BLOQUEUR

| # | Module | Fichier:Ligne | Probleme |
|---|--------|---------------|----------|
| WF-08 | **Rapports d'audit** | `ReportServiceImpl.java:55-58` | `updateReport()` lance `UnsupportedOperationException`. Aucun rapport ne peut etre approuve → aucun audit ne peut etre correctement cloture via le workflow complet |

### Catch blocks vides (masquent les erreurs)

| Fichier | Lignes | Impact |
|---------|--------|--------|
| `NonConformityServiceImpl.java` | 57-63 | Creation d'action corrective echoue silencieusement |
| `InvestigationServiceImpl.java` | 71-78, 169-170 | Mise a jour d'actions correctives echoue silencieusement |

---

## 3.3 i18n — Partiellement livre

| Phase | Scope | Statut | Chaines restantes |
|-------|-------|--------|-------------------|
| P0 | Accueil, Sidebar, Header, ProfileMenu | DEPLOYE | 0 |
| P1 | Incidents, Audits, Adhoc | DEPLOYE | 0 |
| P2 | EPI, Risques, Communication | DEPLOYE | 0 |
| P3 | Settings (~200 chaines EN) | **NON DEMARRE** | ~200 |
| P4 | CRUD labels (~344 chaines FR) | **NON DEMARRE** | ~344 |
| Divers | NotificationUtility "Success"/"Error", DropdownData ~15 labels | **NON DEMARRE** | ~15 |

---

# PARTIE 4 — TACHES NON DEMARREES

## 4.1 Validation des entrees — Etat critique

### Backend Health-Safety
- **182 endpoints POST/PUT sans @Valid** sur 202 au total (10% de couverture)
- Seuls les modules Dosimetrie, Blast, et Inspections (refonte) sont valides

### Backend MineXpert
- **44 endpoints POST/PUT sans @Valid** sur 68 au total (35% de couverture)
- Seuls Employee, LeaveSettings, Contract, Department, Company sont valides

### DTOs sans annotations
- **31 DTOs ont des annotations** de validation sur des centaines dans le codebase
- La grande majorite des DTOs sont des POJOs nus sans @NotNull, @Size, @Pattern

### Corrections requises (par priorite)

| Priorite | Action | Fichiers concernes |
|----------|--------|--------------------|
| P0 | Ajouter @Valid sur les 182 endpoints HNS | Tous les controllers HNS |
| P0 | Ajouter @Valid sur les 44 endpoints MineXpert | Tous les controllers MineXpert |
| P1 | Ajouter @NotNull/@Size/@Pattern sur les DTOs critiques | IncidentDTO, AuditDTO, NonConformityDTO, RiskDTO, CorrectiveActionDTO |
| P2 | Valider les 9 endpoints avec `Map<String,Object>` | Remplacer par des DTOs types |

---

## 4.2 Concurrence et integrite des donnees — Non demarre

### Optimistic Locking (@Version)
- **3 entites sur 165+** ont @Version (Blast, MeasurementPoint + 1 reference)
- **162 entites sans protection** contre les mises a jour concurrentes

### Race conditions critiques identifiees

| # | Module | Probleme | Correction |
|---|--------|----------|------------|
| RC-01 | **Stock EPI** | Read-modify-write sans verrou sur PpeStockServiceImpl | Ajouter @Version sur PpeStock + @Lock PESSIMISTIC_WRITE |
| RC-02 | **Solde conges** | Deduction sans verrou sur LeaveBalance | Ajouter @Version + catch OptimisticLockException |
| RC-03 | **Comptage approbation inspections** | COUNT concurrent non protege | Requete atomique UPDATE...WHERE |
| RC-04 | **Numeros de reference** | 5 generateurs avec pattern COUNT+1 (duplication possible) | Sequence BD ou SELECT FOR UPDATE |
| RC-05 | **SOS AlertService** | Machine a etats correcte MAIS sans @Version ni @Lock — race avec SosEscalationScheduler | Ajouter @Version sur SosAlert |

### Integrite referentielle

| Probleme | Scope | Correction |
|----------|-------|------------|
| 19 FK bare `Long` sans relation JPA | Blast, Dosimetrie, Emergency | Convertir en `@ManyToOne` avec FK constraint |
| 25 endpoints DELETE sans verification enfants | Tous les modules | Ajouter validation d'existence d'enfants avant suppression |
| 4 suppressions critiques | IncidentCategory (cascade 3 niveaux), AuditAreas, ExposedWorker, Account | Implementer `@PreRemove` ou verification manuelle |
| Employee sans `orphanRemoval = true` | Employee.java | Ajouter `orphanRemoval = true` sur les @OneToMany |

---

## 4.3 Gestion d'erreurs — Non demarre

### Frontend

| Probleme | Scope | Correction |
|----------|-------|------------|
| **139 `.catch(() => {})` vides** | 53+ fichiers composants | Remplacer par `notifyError()` ou au minimum `console.error()` |
| **setupResponseInterceptor = code mort** | `AxiosInterceptor.tsx:106` | Activer l'intercepteur (401 → redirect login, 500 → notification) ou supprimer |
| **Aucun React ErrorBoundary** | App entiere | Creer `<ErrorBoundary>` pour capturer les crashes de rendu |
| **notifyError() = 0 consommateurs** | `NotificationUtility` | Brancher sur les catch blocks |
| **jwtDecode(localStorage) crash** | `UserSlice.tsx:5` | Ajouter try-catch autour de jwtDecode |
| **FirstLoginGuard fails open** | Sur erreur reseau/500 | Faire echouer cote securite (deny), pas cote ouvert |

### Backend

| Probleme | Scope | Correction |
|----------|-------|------------|
| **3 comparaisons Long !=** | CompanyServiceImpl:58, DepartmentServiceImpl:62, EmployeeServiceImpl:145/148 | Remplacer `!=` par `!Objects.equals()` |
| **String == au lieu de .equals()** | `PpeServiceImpl.java:129` | `"ADD".equals(operation)` |
| **8 e.printStackTrace()** | Services divers | Remplacer par `log.error("...", e)` |
| **11 log-only catch blocks** | Dosimetrie/Blast | Propager l'exception ou gerer proprement |
| **IncidentAnalysisServiceImpl retourne null** | L27-28 | Implementer ou supprimer la methode morte |
| **parallelStream + ArrayList non thread-safe** | `PositionAssignmentServiceImpl:131-138` | Utiliser `Collectors.toList()` ou CopyOnWriteArrayList |

---

## 4.4 RBAC Backend — Non demarre

| Probleme | Scope | Correction |
|----------|-------|------------|
| **23/26 controllers HNS sans @PreAuthorize** | ~170 endpoints | Tout utilisateur authentifie = CRUD complet sur tous les modules HSE |
| **@EnableMethodSecurity absent** | SecurityConfig HNS | Activer + definir les roles (ADMIN, MANAGER, USER, VIEWER) |
| **~80+ routes frontend sans garde** | ProtectedRoutes.tsx | Decommenter la verification de permissions (L26-39) |
| **ModuleGuard ne verifie PAS les permissions** | ModuleGuard.tsx | Ajouter verification `usePermissions()` en plus de l'activation module |

---

## 4.5 Upload de fichiers — Non demarre

| Probleme | Fichier | Correction |
|----------|---------|------------|
| Pas de validation type MIME | Employee uploads, Mobile photo | Verifier extension + magic bytes |
| Pas de limite taille multipart sur HNS | application.yml HNS | Ajouter `spring.servlet.multipart.max-file-size` |
| Pas de scan antivirus | Tous les uploads | Integrer ClamAV ou equivalent |

---

## 4.6 Logging et donnees sensibles — Non demarre

| Probleme | Fichier | Correction |
|----------|---------|------------|
| Email en clair dans les logs INFO | `EmailServiceImpl:73,75,78,126-127` | Masquer avec `e***@domain` |
| Corps complet Anthropic API en WARN | `AnthropicClient:183` | Logger seulement le status + token count |
| 2 System.out.println en prod | `PpeStockServiceImpl:32`, `AuditAPI:114` | Remplacer par `log.debug()` |

---

## 4.7 UX / Frontend — Non demarre

| Probleme | Scope | Correction |
|----------|-------|------------|
| 14 champs date avec `TextInput type="date"` | Dosimetrie (7) + Non-conformite (7) | Migrer vers `<DateInput>` de Mantine |
| 5 composants filtre sans "aucun resultat" | Recherche/filtres | Ajouter `<EmptyState>` |
| 3 DataTables sans etat vide | Settings pages | Ajouter `emptyMessage` |
| Dead JWT infrastructure | `JwtSlice`, `UserSlice:5` | Nettoyer le code mort localStorage |
| `Math.random()` pour generation mdp | Frontend | Remplacer par `crypto.getRandomValues()` |
| Pas de mecanisme refresh token | JWT 8h → hard logout | Implementer token refresh ou session sliding |

---

# PARTIE 5 — PLAN DE FINALISATION PRIORISE

## Sprint 1 — SECURITE CRITIQUE (3-4 jours)

```
Jour 1 : SEC-04 (supprimer AdminRepairController)
         SEC-06 (password @JsonIgnore)
         SEC-07 (Employee @JsonIgnore financier)
         SEC-09 (WebClientConfig env var)
         SEC-13 (DirectorySettings @JsonIgnore)
Jour 2 : SEC-05 (AccountAPI — separer DTOs + @PreAuthorize + @EnableMethodSecurity)
Jour 3 : SEC-08 (WebSocket auth) + SEC-10 (TokenFilter startsWith)
         SEC-11 (ProtectedRoute decommenter) + SEC-12 (Swagger profil dev)
Jour 4 : SEC-14 (ExceptionControllerAdvice) + SEC-15 (DemoDirectory)
         Test de regression complet
```

## Sprint 2 — WORKFLOWS / MACHINES A ETATS (4-5 jours)

```
Jour 1 : WF-08 (BLOQUEUR — implementer ReportServiceImpl.updateReport)
Jour 2 : WF-01 (Incidents — assertTransition) + WF-03 (Non-conformites)
Jour 3 : WF-02 (Audits — completer gardes) + WF-05 (Actions correctives)
Jour 4 : WF-04 (Risques — enum + machine a etats) + WF-06 (Inspections legacy)
         WF-07 (ActionProcess) + catch blocks vides
Jour 5 : Tests d'integration sur tous les workflows
```

## Sprint 3 — VALIDATION + CONCURRENCE (3-4 jours)

```
Jour 1 : Ajouter @Valid sur les 182 endpoints HNS (par batch de controllers)
Jour 2 : Ajouter @Valid sur les 44 endpoints MineXpert
         Annotations Bean Validation sur DTOs critiques
Jour 3 : @Version sur les 5 entites avec race condition identifiee
         Corriger les 3 Long != et le String ==
Jour 4 : FK bare Long → @ManyToOne (19 champs)
         Verification enfants sur les 25 DELETE endpoints
```

## Sprint 4 — ERREURS + RBAC + UX (3-4 jours)

```
Jour 1 : Activer setupResponseInterceptor + ErrorBoundary React
         Remplacer les 139 catch vides par notifyError()
Jour 2 : @PreAuthorize sur les 23 controllers HNS
         Decommenter ProtectedRoute.tsx
Jour 3 : i18n P3 (Settings ~200 chaines) + P4 (CRUD ~344 chaines)
Jour 4 : 14 DateInput + 8 empty states + nettoyage code mort
         Logging : masquer emails, System.out, Anthropic body
```

## Sprint 5 — DEPLOIEMENT + VALIDATION FINALE (1-2 jours)

```
Jour 1 : npm run build (verification zero erreur)
         Tests de regression manuels sur tous les modules
         Verifier le seed sur les 2 bases (locale + Aiven)
Jour 2 : Push + verification Vercel + Render
         Rotation Aiven (ACTION UTILISATEUR)
         Validation finale en production
```

---

# PARTIE 6 — METRIQUES RESUME

| Categorie | Total identifie | Complete | Incomplet | Non demarre |
|-----------|----------------|----------|-----------|-------------|
| Securite | 15 points | 3 (20%) | 0 | 12 (80%) |
| Workflows | 10 modules | 3 (30%) | 0 | 7 (70%) |
| Validation @Valid | 270 endpoints | 44 (16%) | 0 | 226 (84%) |
| Concurrence @Version | 165 entites | 3 (2%) | 0 | 162 (98%) |
| Gestion erreurs FE | ~145 points | 0 | 0 | 145 (100%) |
| Gestion erreurs BE | ~27 points | 0 | 0 | 27 (100%) |
| RBAC backend | 26 controllers | 3 (12%) | 0 | 23 (88%) |
| i18n | 5 phases | 3 (60%) | 0 | 2 (40%) |
| UX coherence | ~25 points | 0 | 0 | 25 (100%) |

**Effort total estime** : 15-19 jours de developpement (5 sprints)

---

# PARTIE 7 — FICHIERS CLES A MODIFIER (Top 30)

| # | Fichier | Actions |
|---|---------|---------|
| 1 | `AdminRepairController.java` | SUPPRIMER |
| 2 | `AccountAPI.java` | Separer DTOs, @PreAuthorize, @EnableMethodSecurity |
| 3 | `Account.java` | @JsonIgnore password |
| 4 | `Employee.java` | @JsonIgnore champs financiers (IBAN, salaires, bank) |
| 5 | `IncidentServiceImpl.java` | assertTransition() |
| 6 | `AuditServiceImpl.java` | Completer gardes toutes transitions |
| 7 | `ReportServiceImpl.java` | IMPLEMENTER updateReport() |
| 8 | `NonConformityServiceImpl.java` | Machine a etats + propager exceptions |
| 9 | `RiskServiceImpl.java` + `Risk.java` | Enum RiskStatus + assertTransition |
| 10 | `CorrectiveActionServiceImpl.java` | Preconditions sur approve/cancel |
| 11 | `GeneralInspectionServiceImpl.java` | Gardes de transition |
| 12 | `ActionProcessServiceImpl.java` | Validation statut parent |
| 13 | `InvestigationServiceImpl.java` | Supprimer catch vides |
| 14 | `ProtectedRoutes.tsx` | Decommenter verification permissions |
| 15 | `StompSecurityInterceptor.java` | Activer enforcement auth |
| 16 | `TokenFilter.java` | startsWith au lieu de contains |
| 17 | `WebClientConfig.java` | @Value env var |
| 18 | `DirectorySettings.java` | @JsonIgnore bindPasswordEnc |
| 19 | `MyConfig.java` + `SecurityConfig.java` | Swagger @Profile("dev") |
| 20 | `ExceptionControllerAdvice.java` (x2) | Message generique |
| 21 | `AxiosInterceptor.tsx` | Activer setupResponseInterceptor |
| 22 | `App.tsx` ou equivalent | Ajouter ErrorBoundary |
| 23 | `CompanyServiceImpl.java` | Long != → Objects.equals |
| 24 | `DepartmentServiceImpl.java` | Long != → Objects.equals |
| 25 | `EmployeeServiceImpl.java` | Long != → Objects.equals (x2) |
| 26 | `PpeServiceImpl.java` | String == → .equals() |
| 27 | `PositionAssignmentServiceImpl.java` | parallelStream thread safety |
| 28 | `UserSlice.tsx` | try-catch jwtDecode |
| 29 | `DemoDirectory.java` | Externaliser password |
| 30 | 53+ fichiers composants | .catch(() => {}) → notifyError() |

---

*Rapport genere le 30 juin 2026 par analyse automatisee multi-agents.*
*Toutes les lignes et fichiers ont ete verifies sur le commit c90d5f0 (HEAD de main).*
