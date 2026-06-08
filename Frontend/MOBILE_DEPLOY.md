# SafeX 360 Field — Déploiement Android

Guide opérationnel pour produire un APK signé prêt à l'installation
sur les smartphones terrain (techniciens HSE, chefs de poste, secouristes).

> **Périmètre** : Phase M5 du programme mobile. Couvre le build local
> (poste développeur), la signature production, et la distribution
> hors store (APK direct + Firebase App Distribution). Play Store
> Internal Testing reste en option (voir §6).

---

## 1. Prérequis poste développeur

| Outil | Version min. | Notes |
|---|---|---|
| Node.js | 20.x | LTS active jusqu'à 2026-04 |
| npm | 10.x | Inclus avec Node 20 |
| Java JDK | 17 (Temurin) | Requis par Gradle 8.x et Capacitor 6 |
| Android Studio | Hedgehog (2023.1.1) ou + | Inclut Android SDK + emulators |
| Android SDK | API 34 (Android 14) | Cible compilation |
| Android Build Tools | 34.0.0 | Via SDK Manager |
| Gradle | 8.x | Inclus avec Android Studio |

**Variables d'environnement à exporter** (Windows : Variables système) :
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x"
$env:ANDROID_HOME = "$env:USERPROFILE\AppData\Local\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"
```

Vérification : `adb devices` doit lister un appareil ou émulateur.

---

## 2. Build du bundle web + sync Capacitor

À partir du dossier `Frontend/` :

```bash
# 1) Build production du bundle Vite + PWA (Workbox SW)
npm run build

# 2) Synchroniser le dist/ vers le projet Android natif
npx cap sync android

# 3) (optionnel) Ouvrir Android Studio sur le projet
npx cap open android
```

Le `cap sync` :
- copie `dist/` dans `android/app/src/main/assets/public/`
- met à jour `capacitor.config.ts` → `capacitor.config.json` natif
- réinstalle les plugins natifs Capacitor (Camera, Geolocation, etc.)

---

## 3. Génération du keystore production (à faire **une seule fois**)

> **CRITIQUE — Le keystore est la clé unique de signature de l'APK pour
> toute sa durée de vie. Si tu le perds, tu ne pourras plus publier de
> mise à jour de l'application sous le même `appId`. Sauvegarde-le.**

```bash
keytool -genkey -v \
  -keystore safex360-field-release.keystore \
  -alias safex360-field \
  -keyalg RSA -keysize 4096 \
  -validity 9125 \
  -storepass <STORE_PASSWORD_FORT> \
  -keypass <KEY_PASSWORD_FORT>
```

Renseigner :
- CN: `SafeX 360 Field`
- O: `BICONSULT / SafeX 360`
- L, ST, C: ville/pays opérationnel

**Sauvegarde** :
1. Copie chiffrée (`age` ou GPG) du `.keystore` dans un coffre-fort
   d'entreprise (1Password, Bitwarden Business, Vault).
2. Hash SHA-256 du fichier publié dans le journal SBOM du projet.
3. Aucune copie en clair sur un repo Git ou Slack.

---

## 4. Configuration de la signature

### 4.1 Créer `android/key.properties` (NE PAS commit)

Template fourni : `Frontend/key.properties.template` — copier dans
`Frontend/android/key.properties` (le dossier `android/` est lui-même
gitignored, mais on protège explicitement `key.properties` aussi
pour éviter toute fuite si le `.gitignore` parent change).

```properties
# android/key.properties  (gitignored)
storeFile=C:/secure/safex360-field-release.keystore
storePassword=<STORE_PASSWORD_FORT>
keyAlias=safex360-field
keyPassword=<KEY_PASSWORD_FORT>
```

### 4.2 Modifier `android/app/build.gradle`

Ajouter en haut du fichier :
```groovy
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Dans `android { ... }` :
```groovy
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

Le `key.properties` est référencé dans `.gitignore` (vérifier).

---

## 5. Build APK signé

```bash
# Depuis Frontend/
npm run android:build:release:signed
```

Ce script (à ajouter à `package.json`) exécute :
```bash
npm run build && \
  npx cap sync android && \
  cd android && \
  ./gradlew assembleRelease
```

APK produit : `android/app/build/outputs/apk/release/app-release.apk`

**Vérifications avant distribution** :
```bash
# Signature
apksigner verify --verbose app-release.apk

# SHA-256 du certificat (à publier avec l'APK)
keytool -printcert -jarfile app-release.apk
```

---

## 6. Distribution

### 6.1 APK direct (mode interne / pilote)
- Héberger l'APK sur un endpoint authentifié SafeX 360 (`/admin/mobile/download`)
- Distribuer le lien aux utilisateurs internes via email/SMS authentifié
- Documenter "Installer depuis sources inconnues" pour Android
- Maintenir un journal de version (`apkVersion`, `sha256`, `releaseDate`) dans la table `mobile_app_version`

### 6.2 Firebase App Distribution (recommandé pilote terrain)
1. Créer projet Firebase + lier au `appId: com.safex360.field`
2. Ajouter SDK Firebase au build Gradle
3. Pipeline CI (`.github/workflows/android-build.yml`) :
   ```yaml
   - name: Upload to Firebase App Distribution
     uses: wzieba/Firebase-Distribution-Github-Action@v1
     with:
       appId: ${{ secrets.FIREBASE_ANDROID_APP_ID }}
       serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
       groups: hse-coordinators, field-supervisors
       file: android/app/build/outputs/apk/release/app-release.apk
   ```
4. Les testeurs reçoivent l'invitation par email + installent en 2 taps

### 6.3 Google Play Internal Testing (optionnel)
- Créer le compte Play Console (compte BICONSULT, frais d'inscription 25 USD)
- Uploader un AAB (`./gradlew bundleRelease`) plutôt qu'APK
- Configurer fiche app : 8 captures d'écran, description FR, classification "Productivité"
- Soumettre en "Internal testing" : déploiement immédiat aux testeurs listés

---

## 7. Versioning

Le fichier `android/app/build.gradle` contient :
```groovy
defaultConfig {
    versionCode 1     // entier monotone, incrémenter à chaque release
    versionName "1.0.0"  // semver, visible utilisateur
}
```

Convention SafeX 360 Field :
- `versionName` aligné sur le tag git `mobile-vX.Y.Z`
- `versionCode` = `X*10000 + Y*100 + Z` (ex. 1.2.3 → 10203)
- Tag annotation : `git tag -a mobile-v1.0.0 -m "M5 release"`

---

## 8. Vérifications pré-release (checklist)

- [ ] `npm run build` passe sans erreur ni warning critique
- [ ] `npm run typecheck` : 0 erreur TypeScript
- [ ] `npx cap sync android` ne signale aucun plugin manquant
- [ ] Lighthouse mobile sur dist/ : score ≥ 90 (perf, accessibility, PWA)
- [ ] Test installation sur device réel (Android 9+ minimum)
- [ ] Test mode avion → enqueue d'un SOS → retour réseau → flush OK
- [ ] Test capture photo → compression visible (< 200 KB) → upload OK
- [ ] Test biométrique sur écran Dosimétrie/Médical → unlock OK
- [ ] APK signé vérifié par `apksigner verify`
- [ ] Notes de version rédigées (CHANGELOG_MOBILE.md)
- [ ] Backup du keystore et `key.properties` confirmé

---

## 9. Rollback

Si une release introduit une régression critique sur le terrain :
1. **Backend** : ne PAS rollback — l'API doit rester compatible
   (cf. politique de versionnement progressif).
2. **APK** : redistribuer la version N-1 via Firebase App Distribution
   (les versions antérieures restent disponibles 90 jours).
3. **Utilisateurs** : push-notification "Mise à jour critique" via FCM
   avec lien de téléchargement de l'APK stable.

---

## 10. Annexes

- Configuration Capacitor : `Frontend/capacitor.config.ts`
- Manifeste Android : `android/app/src/main/AndroidManifest.xml`
- Permissions exigées : INTERNET, ACCESS_FINE_LOCATION, CAMERA,
  USE_BIOMETRIC, POST_NOTIFICATIONS, VIBRATE
- Audit Phase M0 (architecture mobile) : `MOBILE_AUDIT.md`
- README mobile (vue d'ensemble) : `MOBILE_README.md`

---

**Phase M5 — Mai 2026 — SafeX 360 / BICONSULT**
