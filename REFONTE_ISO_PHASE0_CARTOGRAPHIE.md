# Refonte ISO — Phase 0 — Cartographie & Design System

**Date** : 2026-06-08
**Lead** : Senior Full Stack
**Statut** : Phase 0 complétée → prêt pour audit Quality Officer

---

## 1. Règle d'or

🛡️ Le module **Non-conformité** (`src/components/LeadingIndicator/Non-conformity/*`)
est la **SOURCE DE VÉRITÉ** et reste **INTOUCHABLE**. Les patterns sont extraits
dans `src/design-system/premium/` pour réutilisation dans les autres modules.

## 2. Design System Premium livré

**Localisation** : `Frontend/src/design-system/premium/`

| Fichier | Rôle | Source d'inspiration |
|---|---|---|
| `README.md` | Documentation du DS | — |
| `tokens.ts` | Couleurs sémantiques + gradients + ISO refs | NonConformityDashboard.tsx l.46-117, 236-262 |
| `PremiumKpiTile.tsx` | KPI tile gradient cliquable | NonConformityDashboard.tsx l.210-235 |
| `PremiumStatusBadge.tsx` | Badge statut/sévérité/priorité unifié | NonConformityDashboard.tsx l.281-299 |
| `PremiumFormSection.tsx` | Section formulaire avec entête raffinée | DeclarationStep / TreatmentStep |
| `PremiumPageHeader.tsx` | Wrapper PageHeader + référence ISO auto | NonConformityForm.tsx l.406-451 |
| `index.ts` | Exports centralisés | — |

## 3. Inventaire des modules

### 3.1 Déjà refondus (NE PAS REFAIRE)

| Module | Statut |
|---|---|
| **Non-conformité (Constats Centraux)** | ✅ Référence absolue — INTOUCHABLE |
| Login / Authentification | ✅ LOT 41 |
| AppShell / Sidebar / Topbar | ✅ LOT 17 |
| Dashboard HSE (page principale) | ✅ LOT 22 (à enrichir avec onglets en Phase 1) |
| Dosimétrie (radioprotection) | ✅ Phases 1-10 complètes |
| Blast Management (dynamitages) | ✅ Phases P1-P8 |
| Emergency Management (SOS) | ✅ LOT 48 P1-P5 |
| Mobile (M0-M6) | ✅ Programme complet |
| Module Manager (matrice mines × modules) | ✅ LOT 46 |
| Module Documentation | ✅ LOT 41 B |
| Détail Incident | ✅ LOT 23 (à renforcer côté formulaire création) |

### 3.2 À refondre (ordre prioritaire)

| # | Module | Fichiers principaux | Note actuelle estimée |
|---|---|---|---|
| 1 | **Gestion des Audits** | `components/Audit/*`, `pages/AuditPage.tsx` | 7.0 → 9.8 |
| 2 | **Gestion des Incidents** (formulaire création) | `components/ReportIncident/*` | 7.5 → 9.8 |
| 3 | **Investigations** | `components/Investigation/*` | 6.5 → 9.8 |
| 4 | **Plans d'Action CAPA** | `components/ActionPlan/*` | 6.5 → 9.8 |
| 5 | **Actions Correctives** | `components/CorrectiveAction/*` | 7.0 → 9.8 |
| 6 | **Gestion des EPI** | `components/PPE/*` | 7.0 → 9.8 |
| 7 | **Gestion des Risques** | `components/Risk/*` | 7.5 → 9.8 |
| 8 | **Formations & Habilitations** | `components/Training/*` | 6.5 → 9.8 |
| 9 | **Module Environnement** | `components/Environment/*` | À créer/compléter |
| 10 | **Conformité Réglementaire** | `components/RegulatoryCompliance/*` | 7.0 → 9.8 |
| 11 | **Communications & Réunions HSE** | `components/SafetyCommunication/*` | 7.0 → 9.8 |
| 12 | **Centre Connaissances + Rapports** | `components/KnowledgeCenter/*` | 7.5 → 9.8 (polish) |

### 3.3 Page d'Accueil — Phase 1

À refondre avec **6 onglets thématiques** :
- 🎯 Pilotage
- 🛡️ Sécurité (regroupe Incidents, Investigations, EPI, Risques, Communications)
- ❤️ Santé (regroupe Dosimétrie, Visites médicales, Aptitudes)
- 🌍 Environnement (regroupe Déchets, Émissions, Substances chimiques)
- 📜 Système ISO (regroupe Audits, Non-conformités, CAPA, Conformité)
- ⚙️ Opérations (regroupe Inspections, Blast, Urgences, Réunions)

## 4. Protocole anti-régression

Pour chaque module refondu :

```
1. Avant refonte :
   - git log --oneline <module-dir>  → derniers commits
   - grep des imports vers les composants du module (consommateurs)
   - liste des endpoints backend utilisés
   - capture des 3-5 cas d'usage principaux

2. Refonte iso-fonctionnelle :
   - Même endpoints, mêmes payloads, même flows
   - SEULS l'UI et l'UX changent
   - Aucun changement de signature de service public

3. Après refonte :
   - Tous les liens entrants depuis Router/Sidebar/Dashboard fonctionnent
   - Tous les payloads API identiques
   - Recherche globale / filtres / tris fonctionnent
   - Permissions RBAC inchangées

4. Audit Quality Officer
   - Critère anti-régression : "Aucun lien entrant cassé, aucun consommateur impacté"
```

## 5. Métriques d'audit (rubric Quality Officer)

Pour validation à ≥ 9.8/10 par module :

| Critère | Poids | Source |
|---|---|---|
| Conformité ISO du module | 15% | Référencement explicite dans subtitle PageHeader |
| Fidélité au DS Premium | 15% | Utilise PremiumPageHeader / PremiumKpiTile / etc. |
| Fonctionnement CRUD complet sans bug | 20% | Tests manuels + endpoints |
| Performance perçue | 10% | Loading time + perceived snappy |
| Accessibilité WCAG 2.2 AA | 10% | Contraste, keyboard nav, aria |
| Innovation UX | 10% | Au moins 1 élément différenciant par module |
| Cohérence design plateforme | 10% | Aligné avec Non-conformité + sobriété |
| Qualité code (TS strict, no debt) | 10% | tsc 0 erreur, no `any` injustifié |

**Échec si** : régression détectée OU note critère < 8/10

## 6. Prochaine étape

→ **Audit Quality Officer Phase 0** (validation extraction DS)
→ Si ≥ 9.8 : démarrage **Phase 1 (Page d'accueil 6 onglets)**

---

**SafeX 360 / BICONSULT — Refonte ISO 9001 / 14001 / 19011 / 45001**
*Phase 0 finalisée. Documentation prête, composants prêts, plan validé.*
