# SafeX 360 Field — APK Android

## Téléchargement

### Distribution validee

Le depot ne publie plus d'APK par commit Git. Recuperer un artefact release depuis le
workflow [SafeX 360 Field - Build APK Android](https://github.com/BICONSULT/SafeX360/actions/workflows/android-build.yml),
puis verifier `SHA256SUMS.txt` et l'attestation GitHub avant installation.

Le lien public historique reste temporairement disponible, mais il n'est plus
mis a jour par le workflow et ne doit pas etre considere comme la derniere
release validee.

### Lien depuis la page web

Le bouton **"Télécharger SafeX 360 Field"** sur la page de connexion
(`https://safex360.data-univers.com/login`) pointe vers cette APK.

---

## Caractéristiques de l'APK

| Élément | Valeur |
|---|---|
| Version | 1.0.0 (versionCode 10000) |
| Bundle ID | com.safex360.field |
| Android minimum | 9.0 (API 28) |
| Cible compilation | Android 14 (API 34) |
| Architecture | universal (arm64-v8a + armeabi-v7a) |
| Backend | https://safex360-gateway.onrender.com (BD Aiven prod) |
| Taille | ~12-18 MB |

## Identifiants de test (compte démo)

Pour évaluer l'application sans créer de compte :

- **Identifiant** : `SAFEX360DEMO`
- **Mot de passe** : (voir contact administrateur)

Le compte démo a accès en lecture à toutes les fonctionnalités
HSE (SOS, inspections, incidents, blast, profil) mais avec
permissions restreintes en écriture (pas de gestion utilisateurs).

## Que faire après installation ?

1. Ouvrir l'application
2. Autoriser les permissions :
   - **Localisation** (pour les SOS géolocalisés)
   - **Caméra** (pour les photos preuves)
   - **Notifications** (pour les alarmes tir T-10 min)
3. Se connecter avec votre identifiant SafeX 360
4. Lire le guide utilisateur : [MOBILE_USER_GUIDE.md](../Frontend/MOBILE_USER_GUIDE.md)

## Comment l'APK est buildé ?

L'APK est produit automatiquement par GitHub Actions à chaque
push sur `main` qui touche `Frontend/`. Workflow :
`.github/workflows/android-build.yml`

Pour déclencher un build manuel :
```bash
gh workflow run android-build.yml -f build_type=release
```

L'artefact immuable, son SHA-256, son SBOM CycloneDX et ses attestations
apparaissent ensuite dans l'onglet **Actions** du depot.

## Mise à jour

L'application vérifie automatiquement les nouvelles versions
toutes les 30 minutes via l'endpoint `/hns/mobile/app-version`.
Si une nouvelle version est disponible, un bandeau cyan apparait
en haut de l'écran avec un lien de téléchargement direct.

## Documentation complète

- [Guide utilisateur terrain](../Frontend/MOBILE_USER_GUIDE.md)
- [Procédure de déploiement APK](../Frontend/MOBILE_DEPLOY.md)
- [Audit final v1.0.0](../Frontend/MOBILE_FINAL_AUDIT.md)
- [Changelog](../Frontend/CHANGELOG_MOBILE.md)

---

**SafeX 360 / BICONSULT — 2026**
*Conforme ISO 45001 + Code minier OHADA + RGPD*
