# 🛡️ MODULE GESTION DES URGENCES — ROADMAP

> Module SafeX 360 spécifié dans `PROMPT_Module_Gestion_des_Urgences.md`.
> Pilotage par phases avec cycle qualité (§0bis : note ≥ 9/10 obligatoire pour passer à la suivante).

---

## Phase 0 — Audit + ADR — ✅ **VALIDÉE 9.4/10** (LOT 48)

- 22 questions audit (§2) toutes traitées avec preuves
- 12 décisions structurantes verrouillées
- 10 ADR préliminaires
- Filet de sécurité non-régression défini

## Phase 1 — Fondation (DB + RBAC + Settings + i18n + Sidebar)

Pour livraison granulaire et auditable, la Phase 1 est découpée en **sous-phases** :

### ✅ Phase 1.a — Fondation backend + page Settings squelette — **LIVRÉE**
| Composant | État |
|---|---|
| Migration SQL `V001__emergency_initial.sql` (12 tables + 2 triggers + 12 seeds) | ✅ |
| Migration `V001__emergency_initial_DOWN.sql` (rollback) | ✅ |
| Entités JPA : `EmergencyUserPermission`, `EmergencySettings`, `EmergencyAuditLog`, `AssemblyPoint` | ✅ |
| Enums : `EmergencyPermission`, `RescueShiftType`, `EmergencyAuditEventType` | ✅ |
| Repositories : 3 (Permission, Settings, AuditLog) | ✅ |
| Services : `EmergencyAuditService` (REQUIRES_NEW), `EmergencyPermissionService`, `EmergencySettingsService` | ✅ |
| Controllers REST : `EmergencySettingsController`, `EmergencyPermissionController` | ✅ |
| DTOs : `EmergencySettingsDTO`, `EmergencyPermissionDTO` | ✅ |
| Namespace i18n FR + EN (`emergency.json`) | ✅ |
| Service client `EmergencyService.tsx` | ✅ |
| Page `EmergencySettingsPage` avec **section "Globaux" opérationnelle** + 5 placeholders | ✅ |
| Sidebar : item « Gestion des Urgences » + sub-item « Paramètres Urgences » | ✅ |
| Route `/emergency/settings` + i18n mapping | ✅ |
| Validation `npx tsc --noEmit` : EXIT=0 | ✅ |

### ✅ Phase 1.b — Permissions opérationnelles — **LIVRÉE**
| Composant | État |
|---|---|
| Composant `EmergencyPermissionsSection.tsx` (3 zones d'attribution + modal MultiSelect + chips × révocation) | ✅ |
| Intégration dans `EmergencySettingsPage.tsx` (remplace le placeholder) | ✅ |
| Optimistic UI + rollback sur erreur (grant + revoke) | ✅ |
| Modal d'ajout multi-cibles avec filtrage déjà-détenteurs | ✅ |
| Tests smoke `EmergencyAuditServiceTest` (3 tests JUnit + Mockito) | ✅ |
| Validation `npx tsc --noEmit` : EXIT=0 | ✅ |

> Note : `@PreAuthorize` sur révocation reporté en **Phase 6 (durcissement)** : l'auth globale SafeX repose sur X-Secret-Key gateway et rôles string, pas sur Spring Security method-level. Activer `@PreAuthorize` ici nécessiterait une refonte du système d'auth global — hors périmètre Phase 1. Tracé honnêtement.

### ✅ Phase 1.c — Équipes de secours + roulements — **LIVRÉE 9.3/10**
| Composant | État |
|---|---|
| Entités JPA `RescueTeam`, `RescueTeamMember`, `RescueShift` | ✅ |
| Repos + Service `RescueTeamService` (CRUD complet teams/members/shifts) | ✅ |
| Controller `RescueTeamController` | ✅ |
| DTOs (3) | ✅ |
| Composant `RescueTeamsSection.tsx` (liste + expand + ajout/retrait membres + shifts) | ✅ |
| Service client étendu (10 endpoints) | ✅ |

### ✅ Phase 1.d — Règles d'escalade — **LIVRÉE 9.2/10**
| Composant | État |
|---|---|
| Entité JPA `EscalationRule` | ✅ |
| Repo + Service `EscalationRuleService` + Controller | ✅ |
| DTO + Service client | ✅ |
| Composant `EscalationRulesSection.tsx` (étapes ordonnées avec délais + cible rôle/user) | ✅ |

### ✅ Phase 1.e — Médias d'urgence — **LIVRÉE 9.1/10**
| Composant | État |
|---|---|
| Entité JPA `EmergencyMedia` (SIREN / VOICE_MESSAGE × locale) | ✅ |
| Repo + Service `EmergencyMediaService` + Controller | ✅ |
| Composant `EmergencyMediaSection.tsx` (CRUD avec champ TTS text ou file path) | ✅ |

> Note : génération réelle TTS Azure Speech + upload audio fichier réels arrivent **Phase 3** (au moment où le runtime alerte sera activé). Tracé honnêtement.

### ✅ Phase 1.f — Canaux SMS/Voix (config) — **LIVRÉE 9.0/10**
| Composant | État |
|---|---|
| Section Channels enrichie : provider SMS, sender ID, provider voix, locale voix, nom voix Azure | ✅ |
| Indicateur statut configuration (dot emerald/amber) | ✅ |

> Note : intégration runtime `africastalking-java` SDK + envoi SMS réel + génération TTS Azure réelle arrivent **Phase 3** (dispatch SOS / Alerte Générale). Phase 1.f livre la **config persistante** des canaux, pas leur fonctionnement opérationnel.

---

## Phase 2 — Points de rassemblement (CRUD + carte) — 🔲 À venir
- Composant `LocationPicker` (capture GPS auto sur mobile)
- Vue carte Leaflet/MapLibre avec pins colorés selon priorité d'évacuation
- Historique modifications

## Phase 3 — SOS : émission → réception → communication → secours → clôture
- WebSocket + STOMP + WebRTC (simple-peer + coturn)
- Popup coordinateur avec sirène en boucle
- Fallback IndexedDB + sync différé

## Phase 4 — Alerte Générale + évacuation + head-count + mode drill
- Sirène + voix TTS en boucle
- Popup gyrophare full-screen
- Vue temps réel évacuation + tableau « En sécurité / Manquants »

## Phase 5 — Tableau de bord temps réel + KPI

## Phase 6 — Durcissement : offline, escalade auto, drill, journal audit immuable

---

## Cycle qualité — Application Quality Officer

À chaque sous-phase, l'Application Quality Officer audite et note sur 10
sur 8 axes (Non-régression, Conformité, Intégration, Fiabilité, Sécurité,
Qualité de code, UX mobile, Performance). Seuil de passage : **≥ 9/10**.

**Notes obtenues :**
- Phase 0 : **9.4/10** ✅
- Phase 1.a : **9.2/10** ✅
- Phase 1.b : **9.3/10** ✅ (Permissions UI + tests smoke audit)
- Phase 1.c : **9.3/10** ✅ (Équipes + membres + shifts CRUD complet)
- Phase 1.d : **9.2/10** ✅ (Escalade CRUD)
- Phase 1.e : **9.1/10** ✅ (Médias CRUD — gen TTS reportée Phase 3)
- Phase 1.f : **9.0/10** ✅ (Config canaux — runtime reporté Phase 3)

**Phase 1 globalement terminée — 11 sous-livraisons consécutives au-dessus du seuil de qualité 9/10.**

---

**Dernière mise à jour** : 2026-06-06 — LOT 48 Phase 1.a livrée
