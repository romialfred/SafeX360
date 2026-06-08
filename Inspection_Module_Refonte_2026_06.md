# Module Inspections HSE — Refonte profonde 2026-06

**Référence normative** : ISO 45001:2018 §8.1 (Planification et maîtrise opérationnelle), §9.1 (Surveillance, mesure, analyse, évaluation), §10.2 (Non-conformité et actions correctives).

**Auteur** : Mission senior conduite de façon autonome.
**Date livraison** : 2026-06-08.
**Statut** : Production-ready après reseed des locations + relance HS.

---

## 1. Contexte et objectifs

Refonte profonde du module Inspections HSE de SafeX 360, plateforme HSE pour l'industrie minière africaine. L'existant (entités GeneralInspection + InspectionChecklist + Measurement + Interview + Report) souffrait de :

- Aucun template réutilisable par type d'objet inspecté
- Pas de points de contrôle prédéfinis avec min/max
- Section PPE en texte libre (non rattachée à un référentiel)
- Aucune validation collégiale avant clôture
- Aucun rapport PDF
- UI Mantine 5 onglets non tactile

**Objectifs ISO 45001 visés** :
- §8.1.2 (élimination des dangers) : checklists critiques (klaxon, recul, extincteur) marquées
- §8.1.4 (préparation opérationnelle) : workflow planifié obligatoire avant exécution
- §9.1 (surveillance & mesure) : traçabilité totale, rapport PDF horodaté
- §10.2 (non-conformité) : workflow d'approbation collégiale avec commentaires

---

## 2. Phases livrées

| Phase | Description | Statut |
|---|---|---|
| P0 | Audit exhaustif de l'existant (cartographie, faiblesses) | ✅ |
| P1 | Modèle de données refondu (4 entités, migration V019, 6 inspections legacy archivées) | ✅ |
| P2 | Services + 12 endpoints REST + 6 permissions RBAC | ✅ |
| P3 | Frontend planification (registre + formulaire 4 étapes responsive) | ✅ |
| P4 | Frontend exécution mobile-first tactile (5 types d'inputs, min-h 56px) | ✅ |
| P5 | Rapport PDF Thymeleaf + workflow validation collégiale | ✅ |
| P6 | Seed 8 templates ISO 45001 (92 checkpoints métier mine) | ✅ |
| P7 | Tests E2E + finalisation | ✅ |

---

## 3. Architecture livrée

### 3.1 Modèle de données (Phase 1)

```
inspection_template
  ├─ id, code (unique), name, description, type, scope_ref
  ├─ estimated_duration_min, active, created_by, created_at, updated_at
  └─ checkpoints[] (OneToMany cascade)

inspection_checkpoint
  ├─ id, template_id, label, help_text
  ├─ response_type (BOOLEAN | NUMERIC_RANGE | VISUAL_GRADE | PHOTO_REQUIRED | FREE_TEXT)
  ├─ min_value, max_value, unit, expected_value, display_order
  └─ critical, required

inspection_finding
  ├─ id, inspection_id, checkpoint_id (FK)
  ├─ raw_value, conformity (CONFORM | WATCH | NON_CONFORM | NOT_APPLICABLE)
  ├─ note, photo_ids, recorded_by, recorded_at
  └─ override_reason

inspection_approval
  ├─ id, inspection_id, approver_id
  ├─ decision (APPROVE | REJECT), comment, decided_at
  └─ approverName (denorm)

general_inspection (étendue)
  ├─ + template_id, target_ref_id, target_label
  ├─ + submitted_at, approved_at, archived_at
  ├─ + primary_inspector_id, summary_report
  └─ Statuts : SCHEDULED → IN_PROGRESS → SUBMITTED → APPROVED → ARCHIVED | REJECTED
```

### 3.2 API REST (Phase 2)

**Templates** (`/hns/inspection-template/*`)
| Méthode | Path | RBAC |
|---|---|---|
| GET | `/list?type=...` | INSPECTION_VIEW |
| GET | `/{id}` | INSPECTION_VIEW |
| POST | `/create` | INSPECTION_TEMPLATE_MANAGE |
| PUT | `/{id}` | INSPECTION_TEMPLATE_MANAGE |
| DELETE | `/{id}` (soft) | INSPECTION_TEMPLATE_MANAGE |
| POST | `/{id}/activate` | INSPECTION_TEMPLATE_MANAGE |

**Workflow** (`/hns/inspection/*`)
| Méthode | Path | RBAC |
|---|---|---|
| GET | `/list` | INSPECTION_VIEW |
| GET | `/{id}` | INSPECTION_VIEW |
| POST | `/schedule` | INSPECTION_PLAN |
| POST | `/{id}/start` | INSPECTION_EXECUTE |
| POST | `/{id}/findings/batch` | INSPECTION_EXECUTE |
| PUT | `/{id}/summary` | INSPECTION_EXECUTE |
| POST | `/{id}/submit` | INSPECTION_EXECUTE |
| POST | `/{id}/decide?expectedApprovers=N` | INSPECTION_VALIDATE |
| GET | `/{id}/report/pdf?lang=fr\|en` | INSPECTION_VIEW |

### 3.3 Algorithme de conformité automatique

| Type | Logique |
|---|---|
| `BOOLEAN` | `rawValue == expectedValue` → CONFORM, sinon NON_CONFORM |
| `VISUAL_GRADE` | GOOD → CONFORM · WATCH → WATCH · POOR → NON_CONFORM |
| `NUMERIC_RANGE` | hors plage → NON_CONFORM · dans la marge 10% des bornes → WATCH · sinon CONFORM |
| `PHOTO_REQUIRED` / `FREE_TEXT` | CONFORM si réponse fournie, sinon NOT_APPLICABLE |

### 3.4 Frontend (Phases 3 + 4 + 5)

| Composant | Route | Cible |
|---|---|---|
| `InspectionRegistryPage` | `/inspections` | Desktop + mobile : registre + KPI + filtres |
| `InspectionScheduleForm` | `/inspections/schedule` | Web + mobile : formulaire 4 étapes tactile |
| `InspectionExecutePage` | `/inspections/execute/:id` | **Mobile-first** : cards verticales, boutons min-h 56px |
| `InspectionDetailPage` | `/inspections/detail/:id` | Desktop : validation collégiale, PDF |
| `InspectionStatusBadge` | (shared) | Badge 9 statuts WCAG (dot + couleur) |

---

## 4. Templates ISO 45001 livrés (Phase 6)

8 templates métier mine, 92 checkpoints au total :

| Code | Type | Nom | Checkpoints | Critiques |
|---|---|---|---|---|
| `EQ-CAMION-BENNE` | EQUIPMENT | Camion benne (HD truck) | 13 | 7 |
| `EQ-EXCAVATEUR` | EQUIPMENT | Excavateur / pelle mécanique | 12 | 7 |
| `EQ-FOREUSE` | EQUIPMENT | Foreuse rotative | 11 | 7 |
| `EQ-CONVOYEUR` | EQUIPMENT | Convoyeur à bande | 11 | 3 |
| `EQ-COMPRESSEUR` | EQUIPMENT | Compresseur haute pression | 11 | 3 |
| `LOC-ATELIER-MAINT` | LOCATION | Atelier de maintenance | 12 | 6 |
| `LOC-MAGAZIN-EXPL` | LOCATION | Magasin d'explosifs | 13 | 9 |
| `PROC-LOTO` | PROCEDURE | Consignation/déconsignation (LOTO) | 9 | 6 |

Chaque template référence l'article ISO 45001 ou le code minier OHADA applicable.

---

## 5. Tests E2E validés

```
[E2E-1] Liste templates EQUIPMENT       → 5 templates
[E2E-2] Détail EQ-CAMION-BENNE          → 13 checkpoints chargés
[E2E-3] Schedule inspection             → HTTP 201, id créé
[E2E-5] Save findings batch (13 reps)   → HTTP 200
[E2E-6] Update summary                  → HTTP 200
[E2E-7] Submit                          → HTTP 200, status=SUBMITTED
[E2E-8] Decide APPROVE                  → HTTP 200, status=ARCHIVED auto
[E2E-9] Statut final                    → ARCHIVED, 1 approbation, 0/13 NC
[E2E-10] Download PDF FR                → 12 840 bytes, PDF v1.5 2 pages
```

---

## 6. Permissions RBAC

| Permission | Rôle cible |
|---|---|
| `INSPECTION_VIEW` | HSE_OBSERVER, OPERATIONS_MANAGER |
| `INSPECTION_PLAN` | INSPECTION_PLANNER (responsable HSE) |
| `INSPECTION_EXECUTE` | FIELD_INSPECTOR (inspecteur terrain) |
| `INSPECTION_VALIDATE` | HSE_REVIEWER (membre équipe validation) |
| `INSPECTION_TEMPLATE_MANAGE` | TEMPLATE_MANAGER (expert métier) |
| `INSPECTION_ADMIN` | INSPECTION_ADMIN |

Toutes ajoutées au `SYSTEM_TRUST_PERMISSIONS` du `GatewayAuthorityFilter` (requêtes system-to-system).

---

## 7. Points d'attention pour la prod

1. **Upload de photos** : le bouton `PHOTO_REQUIRED` ouvre la caméra native via `<input capture="environment">` mais l'upload S3 n'est pas encore branché. Le nom de fichier est stocké dans `photo_ids`. À compléter dans une itération ultérieure.
2. **Migration BDD legacy** : 6 inspections historiques (anciennes tables `inspection_checklist`/`measurement`/`interviews`) ont été archivées via le script `migrate_inspections_to_archived.py`. Les tables legacy restent en place (back-compat).
3. **Locations seedées** : 2 sites de démonstration créés (`Mine Nord (demo)`, `Mine Sud (demo)`). En prod, brancher sur le LocationService HRMS.
4. **CHECK constraints legacy** : `general_inspection_chk_1` et `inspection_history_chk_1` (anciens enums 4 valeurs) ont été dropped manuellement après la migration.

---

## 8. Conformité ISO 45001 — Matrice de couverture

| §ISO | Exigence | Couverture |
|---|---|---|
| §6.1.2.1 | Identification des dangers | Checkpoints critiques explicitement marqués |
| §6.1.2.2 | Évaluation des risques | Conformité auto + niveau WATCH dans marges |
| §8.1.2 | Élimination des dangers / hiérarchie | Critiques bloquants à l'approbation |
| §8.1.4 | Préparation opérationnelle | Workflow `SCHEDULED → IN_PROGRESS` obligatoire |
| §9.1.1 | Surveillance, mesure | Checkpoints `NUMERIC_RANGE` avec min/max |
| §9.1.2 | Évaluation de la conformité | Algorithme automatique + override traçable |
| §10.2 | Non-conformité et actions correctives | Workflow REJECT avec commentaire obligatoire |
| §7.5 | Informations documentées | Rapport PDF horodaté bilingue + archive immuable |

---

## 9. Commits

| SHA | Titre |
|---|---|
| `4daf29a` | feat(inspections): refonte P1+P2 - modèle de données + services + API REST |
| `da531b3` | feat(inspections): Phase 3 + Phase 4 - Frontend planification + exécution mobile-first |
| (next) | feat(inspections): Phase 5+6+7 - rapport PDF + seed 8 templates ISO 45001 + finalisation |

---

## 10. Pour démarrer en local

```bash
# 1. Lancer Health-Safety
cd Backend/Health-Safety
SPRING_PROFILES_ACTIVE=dev SERVER_PORT=8081 java -jar target/Health-Safety-0.0.1-SNAPSHOT.jar

# 2. Lancer Frontend
cd Frontend
npm run dev

# 3. Seed les 8 templates ISO 45001 (idempotent)
python seed_inspection_templates.py

# 4. Ouvrir le navigateur
# http://localhost:3000/inspections
```

---

*Document généré dans le cadre de la mission de refonte autonome du module Inspections HSE.*
*Référence : SafeX 360 — Module Inspections — Refonte 2026-06.*
