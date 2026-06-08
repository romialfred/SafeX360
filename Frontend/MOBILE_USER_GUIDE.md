# SafeX 360 Field — Guide utilisateur terrain

Application mobile Android pour les équipes HSE en environnement minier.
Conçue pour fonctionner même en zone sans réseau (puits, galeries,
fond de fosse).

---

## Pour démarrer en 60 secondes

1. **Installer l'application** : ouvrir l'APK reçu par email ou SMS.
   Autoriser "Installer depuis sources inconnues" si demandé.
2. **Se connecter** : email + mot de passe SafeX 360 habituel.
3. **Autoriser les permissions** quand la première fenêtre apparaît :
   - **Localisation** (pour les SOS géolocalisés)
   - **Caméra** (pour les photos preuves d'incidents)
   - **Notifications** (pour les alertes tir T-10 minutes)

L'application est prête. Vous voyez l'écran d'accueil avec 6 tuiles.

---

## Écran d'accueil — vos 6 actions principales

| Tuile | Quand l'utiliser | Temps moyen |
|---|---|---|
| **SOS** | Urgence immédiate : blessure, malaise, incendie, effondrement | 5 sec |
| **Alerte générale** | Situation dangereuse pour le périmètre (gaz, fumée, panne) | 10 sec |
| **Signaler un incident** | Presqu'accident, dommage matériel, fuite (pas urgent) | 90 sec |
| **Inspections** | Voir les inspections planifiées + exécuter une checklist | Variable |
| **Prochain tir** | Voir le compte à rebours + alarme du prochain dynamitage | — |
| **Mon profil** | Mes EPI, formations, dosimétrie, suivi médical | — |

---

## Comment déclencher un SOS

> **Une vie peut être en jeu — n'hésitez jamais à appuyer.**

1. Tap **SOS** (tuile rouge, écran d'accueil).
2. Sélectionner le type :
   - **Médical** (malaise, blessure)
   - **Incendie**
   - **Effondrement / éboulement**
   - **Chimique / fuite**
   - **Agression**
   - **Inconnu** (si vous ne savez pas, prenez celui-là)
3. L'alerte est envoyée **immédiatement** avec votre position GPS.

**Si vous êtes hors réseau** : votre SOS est **sauvegardé localement**
et sera envoyé automatiquement dès que le réseau revient. Le statut
"En attente d'envoi" apparaît en haut de l'écran.

Le coordinateur HSE reçoit votre alerte sur sa console (carte avec
votre position + détails) et déclenche les équipes secours.

---

## Comment signaler un incident (mode rapide 90 secondes)

1. Tap **Signaler un incident** (tuile ambre).
2. Choisir le type : **Presqu'accident**, **Blessure**, **Dommage matériel**,
   **Environnement**.
3. Choisir la gravité : **Faible / Moyenne / Élevée / Critique**.
4. Décrire en quelques mots (10 caractères minimum).
5. **Optionnel** : joindre une photo — la caméra s'ouvre, l'image
   est compressée automatiquement à ~150 Ko (compatible 3G).
6. Tap **Déclarer l'incident**.

Vous recevez une confirmation. L'incident est dans votre historique
("Mes signalements" dans Mon profil) avec un statut qui évoluera :
**Ouvert → En analyse → Résolu**.

---

## Comment exécuter une inspection terrain

1. Tap **Inspections** (tuile cyan).
2. Choisir l'inspection planifiée du jour dans la liste.
3. Pour chaque point de contrôle :
   - **Conforme** ✅ ou **Non-conforme** ❌ ou **N/A**
   - Ajouter une photo en cas de non-conformité (recommandé)
   - Ajouter une note libre si nécessaire
4. À la fin, **soumettre** l'inspection.

**Mode hors ligne** : vous pouvez exécuter l'inspection complètement
sans réseau. Toutes les réponses + photos sont stockées localement
et envoyées au retour du réseau. L'icône cloud en haut indique le
nombre d'éléments en attente.

---

## Les alarmes de tir

L'application vous prévient **10 minutes avant** chaque tir de
dynamitage planifié dans votre zone :

1. **Notification push** : "Tir prévu à 14:30 — Évacuez la zone Fosse Sud"
2. **Page d'alarme plein écran** : sirène + compte à rebours
3. **Synthèse vocale** (TTS) : annonce d'évacuation
4. Vous devez **appuyer sur "J'ai compris"** pour acquitter
   (la sirène continue tant que vous n'avez pas acquitté).

Aucun acquittement ? Le coordinateur reçoit une alerte de tête de
non-acquittement.

---

## Mon profil — mes données HSE personnelles

Tap **Mon profil** depuis le menu du bas. Vous accédez à :

- **Mes EPI** : casque, gants, chaussures, lunettes en cours. Statut
  "À renouveler" si proche de l'expiration. Bouton pour demander un
  remplacement.
- **Mes formations** : habilitations ISO 45001 valides. Date d'expiration.
- **Ma dosimétrie** *(données sensibles)* : cumul mSv année courante vs
  limite annuelle 20 mSv. **Demande votre empreinte digitale** avant
  affichage (RGPD donnée de santé).
- **Mon dossier médical** *(données sensibles)* : visites + aptitude
  (Apte / Apte avec restrictions / Inapte). **Demande votre empreinte
  digitale**.
- **Mes signalements** : historique de tous vos incidents déclarés
  avec leur statut.

---

## Mode hors ligne — comment ça marche

L'application est conçue pour fonctionner **sans connexion** :

- **Tout ce que vous saisissez est sauvegardé localement** (IndexedDB
  chiffré côté navigateur).
- Une **icône bleue en haut** vous indique le nombre d'actions en
  attente d'envoi : "X saisies en attente d'envoi".
- Dès que le réseau revient (Wi-Fi de surface ou 3G), tout est envoyé
  **automatiquement** en arrière-plan, sans aucune action de votre
  part.
- Si une saisie échoue (conflit serveur, ex. inspection déjà soumise
  par un collègue), une **bannière ambre** vous demande si vous voulez
  réessayer ou abandonner.

---

## Économiser la batterie en zone difficile

1. Activer le **mode économie d'énergie** Android (paramètres système).
2. Désactiver le **Bluetooth** et le **Wi-Fi** si vous savez qu'aucun
   réseau n'est dispo.
3. Réduire la **luminosité de l'écran**.
4. L'application en arrière-plan consomme **moins de 1 % par heure**
   (uniquement pour vérifier le sync au retour réseau).

---

## En cas de problème

| Symptôme | Solution |
|---|---|
| L'application ne s'ouvre pas | Vider le cache : Paramètres > Apps > SafeX 360 Field > Stockage > Vider le cache |
| Mon SOS ne part pas | Vérifier que la localisation est activée + autoriser les permissions |
| Photo trop grosse | Normal : compressée auto à ~150 Ko |
| Inspection bloquée | Pull-to-refresh (tirer vers le bas) pour relancer le sync |
| Notification tir absente | Activer les notifications dans Paramètres Android > Apps > SafeX |
| Empreinte non reconnue | Re-saisir le mot de passe au prochain démarrage |

**Hotline support** : voir contact dans Mon profil → À propos
**Email** : support@safex360.com

---

## Pour les coordinateurs HSE — accès admin

L'application mobile sert **uniquement aux opérateurs terrain**.
Pour les coordinateurs HSE qui veulent voir la vision globale,
utiliser la **version web** :

- Tap **Mon profil** → **Basculer vers la version web**
- Ou ouvrir un navigateur sur ordinateur : https://safex360.data-univers.com

---

## Versions & mise à jour

L'application vérifie une fois par jour si une mise à jour est
disponible. Si oui, un **bandeau cyan en haut** vous invite à la
télécharger. Tap **Télécharger** → l'APK arrive, vous validez
l'installation.

**Aucune perte de données** lors des mises à jour : votre historique
local est conservé.

---

**SafeX 360 / BICONSULT — Mai 2026**
*Conforme ISO 45001 + Code minier OHADA + RGPD*
