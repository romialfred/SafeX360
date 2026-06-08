# SafeX 360 Field — Guide développeur Android

**Cible** : développeur intervenant sur la version mobile Android de SafeX 360.

---

## 1. Démarrage local — première fois

### Prérequis

| Outil | Version mini |
|---|---|
| Node.js | 20.x LTS |
| npm | 10.x |
| JDK | 17 (Temurin recommandé) |
| Android Studio | Hedgehog (2023.1.1) ou plus récent |
| Android SDK | API 34 (Android 14) + build-tools 34.0.0 |

### Installation des dépendances

```bash
cd Frontend
npm install
```

L'installation ajoute automatiquement les 11 plugins Capacitor déclarés dans `package.json` :
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
- `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/haptics`
- `@capacitor/network`, `@capacitor/preferences`, `@capacitor/status-bar`
- `@capacitor/push-notifications`, `@capacitor/local-notifications`
- `@capacitor/splash-screen`, `@capacitor/app`

### Premier build du projet Android

```bash
# Génère le dossier android/ (à faire une seule fois)
npm run build
npx cap add android

# Pour les builds suivants
npm run cap:sync
```

### Lancer dans Android Studio

```bash
npm run cap:android
```

Cela ouvre Android Studio sur le projet `Frontend/android`. Connecter un appareil Android en mode debug USB (ou lancer un émulateur API 30+) et cliquer "Run".

### Lancer dans un émulateur en ligne de commande

```bash
npm run cap:android:run
```

---

## 2. Architecture des sources mobile

```
Frontend/
├── capacitor.config.ts         # Configuration Capacitor (appId, plugins)
├── public/
│   └── manifest.webmanifest    # Manifest PWA
├── src/
│   └── m/                      # Module mobile (cohabite avec le web)
│       ├── MobileShell.tsx     # Layout racine (bottom nav + safe areas)
│       ├── components/
│       │   ├── MobileBottomNav.tsx
│       │   └── MobileTopBar.tsx
│       ├── hooks/
│       │   ├── useCapacitorRuntime.ts
│       │   ├── useNetworkStatus.ts
│       │   ├── useHaptics.ts
│       │   └── useStatusBarColor.ts
│       ├── offline/            # Sync engine (Phase M4)
│       ├── pages/
│       │   ├── MobileHome.tsx
│       │   └── MobilePlaceholder.tsx
│       └── services/           # Services API mobile (Phase M2)
├── android/                    # Projet Android Studio (généré par cap add android)
└── MOBILE_AUDIT.md             # Périmètre + décisions
```

---

## 3. Routes mobile

| Path | Composant | Phase de livraison |
|---|---|---|
| `/m` ou `/m/home` | `MobileHome` | ✅ M0 |
| `/m/inspections` | placeholder | M2 |
| `/m/inspections/:id` | placeholder | M2 |
| `/m/sos` | placeholder | M2 |
| `/m/incident/new` | placeholder | M2 |
| `/m/blast/next` | placeholder | M2 |
| `/m/profile`, `/m/profile/*` | placeholder | M2 |

---

## 4. Test depuis le navigateur (sans APK)

Pour itérer rapidement sur le design mobile sans build Android :

```bash
cd Frontend
npm run dev
```

Puis ouvrir Chrome DevTools en mode device toolbar (Ctrl+Shift+M) — taille recommandée **Pixel 7 (412×915)** ou **Galaxy S20 (412×915)**.

URL : `http://localhost:3000/m/home`

L'app détecte automatiquement qu'elle tourne dans un navigateur web (pas Capacitor) et :
- ✅ Layout mobile shell s'affiche
- ✅ Bottom nav fonctionnelle
- ❌ Pas de haptics natifs (fallback `navigator.vibrate`)
- ❌ Pas de caméra native (fallback `<input capture>`)
- ❌ Pas de push FCM (mais Service Worker présent)

---

## 5. Build APK debug (signé automatiquement)

```bash
cd Frontend
npm run android:build:debug
```

L'APK est généré dans `Frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

Installation sur appareil connecté en USB :

```bash
adb install -r Frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 6. Build APK release (signé production)

### Génération du keystore (une seule fois)

```bash
keytool -genkey -v -keystore safex360.keystore \
    -alias safex360 \
    -keyalg RSA -keysize 2048 -validity 10000
```

Renseigner :
- **Mot de passe** : à conserver précieusement (perte = impossible de signer une mise à jour)
- **Nom & organisation** : SafeX 360 / Data Universe
- **Pays** : BF (Burkina Faso) ou autre

Placer `safex360.keystore` dans `Frontend/android/app/`.

Créer `Frontend/android/keystore.properties` :

```properties
storeFile=safex360.keystore
storePassword=<MOT_DE_PASSE>
keyAlias=safex360
keyPassword=<MOT_DE_PASSE>
```

⚠️ **Ce fichier ne doit JAMAIS être commité.** Ajouter dans `.gitignore`.

### Build

```bash
cd Frontend
npm run android:build:release
```

L'APK signé est dans `Frontend/android/app/build/outputs/apk/release/app-release.apk`.

---

## 7. CI/CD — Build automatique sur push

Le workflow `.github/workflows/android-build.yml` build automatiquement un APK debug à chaque push sur `main` qui touche `Frontend/**`.

L'artefact APK est attaché à chaque run d'Actions, téléchargeable pendant 14 jours.

### Build release via Actions

Aller sur **Actions** → **SafeX 360 Field — Build APK Android** → **Run workflow** → choisir `release`.

Secrets GitHub requis pour le build release :
- `ANDROID_KEYSTORE_BASE64` : keystore encodé en base64 (`base64 -w 0 safex360.keystore`)
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

---

## 8. Distribution

### Phase pilote : Firebase App Distribution

1. Créer le projet Firebase lié au bundle `com.safex360.field`
2. Installer `firebase-tools` : `npm install -g firebase-tools`
3. Login : `firebase login`
4. Uploader un APK :
   ```bash
   firebase appdistribution:distribute app-debug.apk \
       --app <FIREBASE_APP_ID> \
       --groups testeurs-safex
   ```
5. Les testeurs reçoivent un email avec lien d'installation

### Phase production : Google Play Store

1. Créer un compte Google Play Developer (25 USD one-shot)
2. Build AAB signed (à la place de l'APK) :
   ```bash
   cd Frontend/android
   ./gradlew bundleRelease
   ```
3. Upload dans la Play Console
4. Documentation requise : politique confidentialité, description, screenshots 16:9 et 9:16, icône 512×512

---

## 9. Test offline

1. Lancer l'APK debug sur un appareil
2. Activer le mode avion → vérifier que le bandeau orange "Hors ligne" apparaît
3. Saisir une inspection / soumettre un SOS → vérifier le message "Sauvegardé hors ligne"
4. Désactiver le mode avion → la queue se vide automatiquement (Phase M4)

---

## 10. Liens utiles

- [Capacitor 6 docs](https://capacitorjs.com/docs/v6)
- [Android Material 3 design](https://m3.material.io)
- [Web App Manifest spec](https://www.w3.org/TR/appmanifest/)
- Audit modules : `MOBILE_AUDIT.md`
- Charte design : `../REGLES.MD`

---

*Document maintenu pendant la durée du projet SafeX 360 Field. Toute évolution de stack mobile doit être documentée ici.*
