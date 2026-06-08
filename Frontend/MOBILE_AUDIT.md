# SafeX 360 Field — Audit modules pour version mobile Android

**Date** : 2026-06-08
**Version** : Phase M0 — Foundation
**Auteur** : Mission Senior Mobile Developer

---

## 1. Matrice de décision — modules embarqués / exclus

### ✅ Modules embarqués (terrain, ROUTES `/m/*`)

| Module | Source réutilisée | Adaptations mobile requises |
|---|---|---|
| **Accueil** | nouveau composant `m/MobileHome.tsx` | Pas d'équivalent web — créé pour mobile |
| **Inspections (exécution)** | `components/Inspection/InspectionExecutePage.tsx` | Déjà tactile ; ajouter pull-to-refresh + cache SQLite |
| **Inspections (registre)** | `components/Inspection/InspectionRegistryPage.tsx` | Simplifier filtres + retirer KPI desktop |
| **SOS** | `components/Dashboard/Header/SosButton.tsx` (modal) | Promu en écran plein écran, FAB persistant |
| **Alerte Générale** | `components/Dashboard/Header/GeneralAlertButton.tsx` | Promu en écran, restriction `INSPECTION_VALIDATE`+ |
| **Déclaration Incident** | mode rapide 90s (déjà existant) | Adapter input mobile + caméra native |
| **Prochain tir + alarme** | `BlastEvacuationAlarm.tsx` (déjà refait) | Réutiliser tel quel, ajouter notification locale T-10 |
| **Mes EPI** | `components/PPE/PpePersonalDotation` (lecture seule) | Lecture cache + sync au reconnect |
| **Mes formations** | `components/Compliance/MyTrainings` (lecture seule) | Lecture cache |
| **Mon dossier dosimétrie** | `components/Dosimetry/MyExposureCard` (lecture seule) | Lecture cache + biométrique requis |

### ❌ Modules exclus (web only)

| Module | Raison de l'exclusion |
|---|---|
| Administration | Pas de cas d'usage terrain |
| Gestion utilisateurs | Réservé administrateurs bureau |
| Module Manager | Configuration plateforme |
| Paramètres système | Configuration plateforme |
| Référentiels (Activity, IncidentCategory, Risk Type) | Gestion experts bureau |
| Templates Inspection (CRUD) | Gestion experts bureau |
| Dashboard exécutif Blast | Graphiques Recharts lourds, non tactiles |
| Dashboard exécutif Dosimétrie | Idem |
| Rapports & Analytics | Lourd, non terrain |
| Centre de Connaissances | Lecture longue, mieux adapté desktop |
| Documentation technique | Idem |
| Validation collégiale Inspection | Workflow équipe, mieux adapté desktop |
| Gestion EPI (admin) | Distinct de "Mes EPI" |

### ⚠️ Dépendances à supprimer du bundle mobile

Le `vite.config.ts` mobile excluera ces dépendances lourdes via dynamic import + code splitting :

- `recharts` (graphiques) — non utilisé sur les écrans mobile
- `@mantine/charts` — idem
- `@fullcalendar/*` — pas de planning sur mobile v1
- `leaflet` + `react-leaflet` — pas de carte v1 (Phase v1.3)
- `primereact` DataTable — remplacé par listes natives mobile
- `@tiptap/*` — éditeur riche non requis sur mobile
- `embla-carousel-react` — non utilisé en mobile

**Économie estimée** : ~450 KB gzip (bundle initial passe de ~850 KB à ~400 KB).

---

## 2. Architecture des routes mobile

```
/m                        → MobileShell + redirect /m/home
/m/home                   → MobileHome (KPI perso, prochain tir, raccourcis)
/m/inspections            → MobileInspectionsList
/m/inspections/:id        → MobileInspectionExecute (alias mobile)
/m/sos                    → MobileSosScreen
/m/alert                  → MobileGeneralAlertScreen (RBAC restreint)
/m/incident/new           → MobileIncidentQuickDeclare
/m/incident/:id           → MobileIncidentDetail
/m/blast/next             → MobileNextBlast + alarme
/m/profile                → MobileProfile (lecture)
/m/profile/ppe            → MobilePersonalPpe
/m/profile/trainings      → MobilePersonalTrainings
/m/profile/dosimetry      → MobilePersonalDosimetry (biométrique)
/m/profile/medical        → MobilePersonalMedical (biométrique)
```

Routes legacy `/blast`, `/inspections`, `/incidents` restent accessibles mais redirigent vers `/m/...` si la WebView est détectée comme Capacitor (User-Agent contient `safex-field`).

---

## 3. Architecture offline

### Tables SQLite locales (via @capacitor-community/sqlite)

```sql
CREATE TABLE IF NOT EXISTS mutation_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    payload TEXT NOT NULL,        -- JSON serialisé
    headers TEXT,                  -- JSON
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    status TEXT DEFAULT 'pending'  -- pending | syncing | done | failed
);

CREATE TABLE IF NOT EXISTS inspection_cache (
    id INTEGER PRIMARY KEY,
    payload TEXT NOT NULL,
    cached_at INTEGER NOT NULL,
    dirty INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS blast_cache (
    id INTEGER PRIMARY KEY,
    payload TEXT NOT NULL,
    cached_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS template_cache (
    id INTEGER PRIMARY KEY,
    payload TEXT NOT NULL,
    cached_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profile_cache (
    user_id INTEGER PRIMARY KEY,
    payload TEXT NOT NULL,
    cached_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS photo_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    finding_id INTEGER,
    file_path TEXT NOT NULL,
    size_bytes INTEGER,
    created_at INTEGER NOT NULL,
    uploaded INTEGER DEFAULT 0
);
```

### Stratégie de cache

| Donnée | TTL | Politique |
|---|---|---|
| Templates inspection | 7 jours | Stale-while-revalidate |
| Profil utilisateur | 24 h | Idem |
| Liste inspections du jour | 5 min | Cache-first (refresh au pull-to-refresh) |
| Prochain tir | 30 s | Network-first, fallback cache |
| EPI / formations / dosimétrie | 24 h | Cache-first |

### Sync engine — algorithme

```
À chaque mutation :
  1. Si online && réseau ok → POST direct + cache local en parallèle
  2. Si offline → enqueue dans mutation_queue + UI feedback "sauvegardé hors ligne"

Au reconnect (Network plugin event) :
  1. Charger toutes les mutations status='pending' triées par created_at
  2. Pour chaque : POST avec retry exponentiel (1s, 2s, 5s, 15s, 60s)
  3. Sur succès : status='done' + cleanup après 7 jours
  4. Sur échec définitif (5 retries) : status='failed' + alerte UI

Au foreground (App.addListener('appStateChange')) :
  1. Si online → lancer sync queue
  2. Si offline → afficher badge "X actions en attente"
```

---

## 4. Permissions Android requises (AndroidManifest.xml)

```xml
<!-- Connectivité -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Géolocalisation pour SOS et inspections -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Caméra + galerie pour photos d'inspection -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<!-- Notifications push + locales -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Biométrique -->
<uses-permission android:name="android.permission.USE_BIOMETRIC" />

<!-- Wake lock pour la sirène SOS et l'alarme évacuation -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

**Pas demandé** : SMS, contacts, agenda, stockage externe complet (scoped storage Android 13+).

---

## 5. Standards visuels

- **Dimension de référence** : 360x800 dp (Galaxy A series ~70% du parc Afrique)
- **Tap target** : 48x48 dp minimum (WCAG)
- **Densité texte** : 14sp body, 16sp titres section, 22sp titre principal
- **Safe areas** : respect du notch + navigation gestuelle Android 12+
- **Couleurs dynamiques** : opt-in Material You (Android 13+) sur les écrans non critiques (Profil) — pas d'override des couleurs d'alerte (SOS rouge reste rouge même en theming système)

---

## 6. Critères d'acceptance Phase M0

- ✅ `capacitor.config.ts` créé et valide
- ✅ `package.json` à jour avec les 11 plugins Capacitor essentiels
- ✅ Scripts npm `cap:*` et `android:build:*` opérationnels
- ✅ `MOBILE_AUDIT.md` (ce document) versionné
- ✅ Manifest PWA `public/manifest.webmanifest`
- ✅ Shell mobile `src/m/MobileShell.tsx` + bottom nav
- ✅ Hooks Capacitor (`useNetworkStatus`, `useHaptics`, `useStatusBarColor`)
- ✅ Routes `/m/*` câblées dans `Router.tsx`
- ✅ Workflow CI `android-build.yml` qui build l'APK debug à chaque push main
- ✅ Document développeur `MOBILE_README.md`
- ✅ TypeScript : 0 erreur sur le nouveau code
- ✅ Build web (`npm run build`) toujours fonctionnel — la version mobile cohabite

---

## 7. Phase suivante (M1)

Foundation PWA mobile-first :
- Implémenter le shell mobile complet (bottom nav, FAB, safe areas, dark mode auto)
- Service worker offline (Workbox 7) avec stratégies par route
- Hook `useSyncQueue()` qui orchestre le sync engine
- Détection Capacitor vs navigateur web pour adapter l'UX
- Pull-to-refresh global

Estimation Phase M1 : **3 jours**.

---

*Document versionné sous `Frontend/MOBILE_AUDIT.md` — toute modification du périmètre mobile doit passer par une mise à jour de cette matrice.*
