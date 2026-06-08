# SafeX 360 Field — Journal des versions

> Suit la chronologie des releases APK de l'application mobile terrain.
> Versions internes (compte versionCode) et publiques (versionName).

---

## v1.0.0 — 2026-06-08 (Phase M5 — Release pilote)

**Build candidat à la distribution pilote BICONSULT.**

### Nouveautés
- **Capture photo** terrain avec compression côté client (1024 px, JPEG q70, EXIF strip)
- **Sirène + TTS** d'évacuation pour tirs (Phase 4 existante, déjà testée)
- **Mode offline complet** : SOS, incidents, constats d'inspection synchronisés au retour réseau
- **Re-authentification biométrique** sur écrans sensibles (dosimétrie, suivi médical)
- **Notifications locales** : rappels inspection T-30, T-0
- **Drawer résolution conflits** : interface utilisateur pour mutations échouées

### Conformité
- ISO 45001 (Santé et sécurité au travail)
- Code minier OHADA
- RGPD : biométrique sur données de santé, strip EXIF photos

### Compatibilité
- Android 9+ (API 28)
- Architecture cible : arm64-v8a (devices terrain standards)
- WebView : Chrome system (mise à jour automatique via Play Store)

### Limitations connues
- Les vues "Mes EPI / formations / dosimétrie / médical" affichent
  des listes vides : endpoints backend en place mais non encore
  branchés sur les services métier HSE (planifié Phase M6).
- Plugin biométrique non livré dans l'APK par défaut (fallback web).
- Backend `/hns/mobile/photo-upload` stocke localement —
  intégration object storage S3 prévue Phase M6.

### Métriques cibles (pilote)
- Démarrage à froid : < 2 s sur Galaxy A14 (entry-level)
- Compression photo : 3 MB → ~150 KB (-95%)
- Time-to-SOS : ouverture app → SOS envoyé < 5 s
- Queue sync : flush 10 mutations + 5 photos en < 30 s sur 3G

---

## v0.x — Préliminaires (Phases M0–M4)

Phases internes non distribuées :
- **M0** (Phase 1) — Fondation Capacitor + Shell + bottom nav
- **M1** (Phase 2) — Service Worker + Sync Engine + IndexedDB
- **M2** (Phase 3) — 6 modules terrain (SOS, Inspections, Incidents, Blast, Profile)
- **M3** (Phase 4) — APIs natives Capacitor + 4 sous-pages profil
- **M4** (Phase 5) — Durcissement sync + Conflict UI + Photo upload

---

## Convention de version

| Élément | Format | Exemple | Notes |
|---|---|---|---|
| versionName | SemVer | `1.0.0` | Visible utilisateur |
| versionCode | Int monotone | `10000` | `X*10000 + Y*100 + Z` |
| Tag git | `mobile-vX.Y.Z` | `mobile-v1.0.0` | Annoté avec changelog |
| Date | ISO 8601 | `2026-06-08` | Date de signature APK |

---

**SafeX 360 / BICONSULT — Programme mobile terrain**
