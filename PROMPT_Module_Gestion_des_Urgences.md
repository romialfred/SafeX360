# PROMPT D'IMPLÉMENTATION — MODULE « GESTION DES URGENCES »
### Extension d'une plateforme Santé–Sécurité existante (contexte minier, priorité mobile)

> **À l'attention de l'agent de développement (Claude Code / Cursor / autre).**
> Ce document est une spécification-prompt exhaustive. Il décrit **quoi** construire, **comment** s'intégrer à l'existant, et **dans quel ordre**. Tu **ne dois pas** générer de code avant d'avoir exécuté la **Phase 0 – Audit préalable** ci-dessous et obtenu les réponses du Directeur Technique.

> **TON RÔLE — Expert Full Stack en autonomie complète, agissant comme Chef de Projet.**
> Tu pilotes l'implémentation de bout en bout, phase par phase, **sans supervision continue**. Tu planifies, tu exécutes, tu contrôles ta propre qualité et tu décides du passage à la phase suivante — selon le **cycle de validation qualité obligatoire** décrit au §0bis. Cette mission est une **amélioration de l'existant** : elle doit **enrichir et s'intégrer** à la plateforme, **sans jamais introduire de régression**.

---

## 0. RÈGLES DE TRAVAIL (NON NÉGOCIABLES)

1. **Audit avant code.** Aucune ligne de code n'est produite tant que la Phase 0 n'est pas validée.
2. **Une action à la fois.** Tu proposes, tu attends validation, tu implémentes, tu vérifies, puis tu passes à l'étape suivante.
3. **Zéro entité inventée.** Aucun nom de table, de variable d'environnement, de service tiers ou d'écran n'est créé sans confirmation. En cas de doute → tu demandes.
4. **Cohérence avec l'existant.** Tu réutilises les composants, le design system, les conventions de nommage, l'authentification, les rôles et la structure de dossiers déjà en place. Tu ne réinventes rien qui existe déjà.
5. **Module critique de sûreté des personnes.** Toute défaillance peut coûter des vies. Fiabilité, traçabilité et fonctionnement en mode dégradé priment sur l'esthétique.
6. **Amélioration sans régression.** Il s'agit d'enrichir l'existant en s'y intégrant. Aucune fonctionnalité actuelle ne doit cesser de fonctionner. Avant chaque phase, tu identifies les zones impactées et tu établis un filet de sécurité (tests de non-régression, sauvegarde/branche dédiée, points de retour arrière).
7. **Autonomie pilotée par la qualité.** Tu avances seul, mais tu ne franchis une phase qu'après validation par l'Application Quality Officer (§0bis).

---

## 0bis. GOUVERNANCE QUALITÉ — CYCLE DE VALIDATION OBLIGATOIRE

Tu travailles **en autonomie complète comme Chef de Projet**. À **chaque phase** (voir §11), tu appliques le cycle suivant, sans le sauter :

1. **Cadrage de phase.** Tu définis l'objectif de la phase, les zones du code impactées, le risque de régression et le plan de test.
2. **Implémentation.** Tu réalises le travail de la phase selon les règles §0.
3. **Recrutement d'un auditeur.** Tu **endosses un second rôle distinct : un « Expert Senior Application Quality Officer »**, indépendant et exigeant, dont l'unique mission est de **valider tous les aspects** de la phase. Cet auditeur ne fait aucune complaisance.
4. **Audit & notation.** L'Application Quality Officer évalue la phase sur une grille (voir ci-dessous) et attribue une **note sur 10**.
   - **Note ≥ 9/10 → la phase est validée**, tu peux passer à la phase suivante.
   - **Note < 9/10 → la phase est bloquée.** L'auditeur **rédige des recommandations précises, priorisées et actionnables**.
5. **Correction intelligente.** En tant que Full Stack, tu **implémentes les recommandations avec intelligence** : tu corriges la cause racine (pas le symptôme), sans dégrader ce qui marche déjà, sans sur-ingénierie, et en gardant la cohérence avec l'existant.
6. **Ré-audit.** Tu relances le cycle d'audit. Tu **répètes corrections + ré-audit** jusqu'à obtenir **≥ 9/10**. Seul ce seuil autorise le passage à la phase suivante.

**Grille d'évaluation de l'Application Quality Officer (chaque axe noté, moyenne pondérée) :**
- **Non-régression** : aucune fonctionnalité existante cassée ; tests de régression passants. *(Axe bloquant : tout régression observée plafonne la note sous 9.)*
- **Conformité fonctionnelle** : la phase couvre l'intégralité des exigences de la spécification.
- **Intégration à l'existant** : réutilisation du design system, des conventions, de l'auth/RBAC ; pas de duplication.
- **Fiabilité & criticité** : robustesse des flux d'urgence (SOS, alerte, notifications), gestion des erreurs et des cas limites.
- **Sécurité & confidentialité** : RBAC, données de géolocalisation, journal d'audit.
- **Qualité de code** : lisibilité, typage, tests, absence de dette inutile.
- **UX mobile-first & accessibilité** : ergonomie terrain, contraste, cibles tactiles, états hors-ligne.
- **Performance & temps réel** : latence des notifications/SOS, consommation ressources.

**Format de restitution attendu à chaque fin de phase :**
- Rapport d'audit signé « Application Quality Officer » : note globale /10, note par axe, constats.
- Si < 9 : liste de recommandations priorisées (P1/P2/P3) + plan de correction.
- Si ≥ 9 : validation explicite + résumé des éléments livrés + confirmation « zéro régression » + GO pour la phase suivante.

> Important : les deux rôles (Full Stack / Quality Officer) doivent rester **distincts dans le raisonnement**. L'auditeur doit chercher activement les défauts, pas confirmer le travail. Une note de complaisance est une faute.

---

## 1. CONTEXTE & OBJECTIF

L'entreprise exploite un **site minier**. Une application Santé-Sécurité (HSE) est déjà en production et fonctionne bien. On souhaite y greffer un **module « Gestion des Urgences »**, **principalement destiné à un usage mobile** (personnel de terrain) avec un volet web (coordonnateurs, salle de contrôle).

**Objectif** : permettre, en temps réel, de déclencher et traiter des alertes individuelles (SOS) et collectives (alerte générale / évacuation), de coordonner les secours, et de tracer chaque intervention à des fins de conformité.

**Périmètre fonctionnel (sous-pages du module) :**
- 1.1 Tableau de bord
- 1.2 Points de rassemblement
- 1.3 Suivi des SOS
- 1.4 Gestion des alertes & évacuation
- 1.5 Paramètres de la Gestion des Urgences

---

## 2. PHASE 0 — AUDIT PRÉALABLE OBLIGATOIRE

Avant toute conception détaillée, pose et obtiens réponse aux questions ci-dessous. Regroupe-les, ne génère rien tant qu'elles ne sont pas tranchées.

**Plateforme & stack existante**
1. Quelle est la stack du front web et du mobile (ex. React/TS/Vite + React Native/Expo) ? Y a-t-il déjà une app mobile, ou faut-il la créer ?
2. Quel est le backend (NestJS ? Supabase ? autre) et la base de données ?
3. Comment fonctionne l'authentification et le système de rôles/permissions actuel ? Peut-on l'étendre, ou faut-il un RBAC dédié au module ?
4. Existe-t-il déjà un référentiel **Utilisateurs / Employés / Départements / Zones** ? Quels champs (téléphone, département, badge, rôle terrain) ?
5. Le design system est-il documenté (tokens de couleur, typographie, librairie de composants) ? Fournir le fichier de thème.

**Canaux & téléphonie**
6. Les personnes qui envoient un **SOS** sont-elles toutes des **utilisateurs de l'app**, ou aussi de **simples numéros de téléphone via SMS** (sous-traitants, visiteurs) ? — *déterminant pour le canal SMS/voix.*
7. Dispose-t-on d'une passerelle SMS/voix ? (recommandation pour l'Afrique de l'Ouest : **Africa's Talking** ou **Twilio**). Sinon, faut-il l'intégrer ?
8. L'appel **vidéo/audio** vers l'émetteur du SOS doit-il fonctionner : (a) app-à-app via **WebRTC** ? (b) vers un numéro GSM classique (pont voix) ? (c) les deux ?
9. Dispose-t-on d'un serveur **TURN/STUN** pour le WebRTC, ou faut-il en provisionner un (coturn) ?

**Infrastructure temps réel & notifications**
10. Quelle solution temps réel est déjà utilisée (Supabase Realtime / Socket.io / SSE) ?
11. Les push mobiles passent-ils par **FCM (Android)** et **APNs (iOS)** ? Le compte développeur Apple permet-il les **Critical Alerts** (entitlement requis) ?
12. Quelle est la qualité réseau réelle sur site (zones blanches ? 2G ?) → impacte le **mode hors-ligne / fallback SMS**.

**Sécurité, conformité, matériel**
13. Quelles exigences de **traçabilité/audit légal** (réglementation minière, conservation des journaux) ?
14. Existe-t-il des **caméras** (RTSP/ONVIF, NVR, ou lien HLS) à rattacher aux points de rassemblement ?
15. Existe-t-il des **sirènes physiques / système de sonorisation (PA)** pilotables (IoT / API) à déclencher en parallèle ?
16. Y a-t-il des **boutons SOS matériels** (wearables, bornes) à intégrer ?

**Organisation des secours**
17. Comment sont définies les **équipes de secours** (équipe de jour/nuit, roulements, astreintes) ? Source des plannings ?
18. Quelle est la chaîne d'escalade si le **coordonnateur ne répond pas** (adjoint, superviseur, délai) ?
19. Combien de **coordonnateurs simultanés** ? Faut-il une affectation (round-robin, par zone) ou tous notifiés ?

**Langues & accessibilité**
20. Langues du personnel de terrain (français + langues locales ?) pour les messages vocaux et l'UI.
21. Contraintes d'usage terrain : gants, luminosité extérieure, port de l'écran → boutons larges, fort contraste, vibration.

**Médias**
22. Faut-il enregistrer/fournir le **message vocal féminin** « Alerte Générale… » (qui le fournit ?) ou doit-il être généré (TTS) ? Idem fichier de **sirène**.

> Livre la synthèse des réponses sous forme de **décisions d'architecture (ADR courts)** avant de continuer.

---

## 3. CONTRAINTES TRANSVERSES

- **Mobile-first**, mais coordonnateur sur **web (grand écran salle de contrôle)** également pris en charge. Le code partage un maximum de logique (services, types, schémas).
- **Internationalisation (i18n)** dès le départ ; aucun texte en dur.
- **Cohérence visuelle** avec l'app existante (réutiliser le thème). Voir §11.
- **Fonctionnement en mode dégradé** : un SOS doit pouvoir partir même sans data (fallback SMS), et la file de SOS se synchronise dès retour réseau.
- **Journalisation immuable** : chaque action critique horodatée (UTC + fuseau local), auteur, position, append-only.

---

## 4. SPÉCIFICATIONS FONCTIONNELLES DÉTAILLÉES

### 4.1 — Tableau de bord (vue d'ensemble temps réel)

Page d'accueil du module, **mise à jour en temps réel** (WebSocket/Realtime).

**Contenu :**
- **Cartes d'état (KPI)** : SOS en cours, SOS traités (jour/semaine), délai moyen de prise en charge, délai moyen de résolution, taux « traité avec succès » vs « traité avec impact », nombre de fausses alertes.
- **Carte géographique temps réel** : positions des SOS actifs, points de rassemblement (avec priorité d'évacuation), équipes de secours en intervention, dernière position connue des émetteurs.
- **Bandeau d'état du site** : NORMAL / ALERTE EN COURS / ÉVACUATION. En cas d'alerte générale, ce bandeau passe en mode prioritaire (voir §4.4).
- **Liste des SOS récents** triable/filtrable par statut.
- **Disponibilité des équipes** : équipe de garde active, effectif, joignabilité.
- **Indicateurs de tendance** (graphiques) : SOS par zone, par type, par tranche horaire — exploitables ensuite dans le reporting BI existant.

> Le tableau de bord ne déclenche aucune action destructive : c'est une vue de pilotage. Les actions se font dans les sous-modules.

---

### 4.2 — Points de rassemblement

CRUD complet d'un référentiel de **points de rassemblement**.

**Champs d'un point :**
- Nom
- Description
- Emplacement (texte) + **géolocalisation** (lat/long, sélection sur carte + capture GPS depuis mobile)
- **Responsable** (utilisateur)
- **Responsable adjoint** (utilisateur)
- **Départements concernés** (multi-sélection)
- **Caméra associée** (sélection d'un flux caméra ; lien/visualisation si disponible)
- **Priorité d'évacuation** (ex. P1/P2/P3 ou échelle numérique) : indique aux secours quel point évacuer en priorité.
- Capacité maximale (innovation §6) + statut (actif/inactif)

**Comportements :**
- Vue **liste** + vue **carte** (pins colorés selon priorité d'évacuation).
- Validation : géolocalisation obligatoire, au moins un responsable, au moins un département.
- Sur mobile, bouton « Utiliser ma position actuelle » pour saisir la géoloc.
- Historique des modifications (qui, quand, quoi).

---

### 4.3 — Suivi des SOS

Cœur opérationnel du module. Gère le **cycle de vie complet** d'un SOS individuel.

#### a) Cycle de vie & statuts
`En cours` → `Traité avec succès` / `Traité avec impact` / `Annulé` / `Fausse alerte`.
Statuts intermédiaires recommandés : `Reçu`, `Pris en charge` (coordonnateur acquitté), `Secours envoyés`, `Sur place`, `Clôturé`.
**Règle d'or : tout SOS fait l'objet d'un traitement immédiat.** Un SOS non acquitté dans un délai paramétrable déclenche une **escalade automatique** (§6).

#### b) Interface de suivi
- Liste filtrable par statut (`En cours`, `Traité`, `Annulé`, `Fausse alerte`) + recherche, tri par ancienneté, badge de criticité.
- Vue détail d'un SOS : émetteur (nom + numéro), horodatage, **position/dernière position connue**, canal (app / SMS), historique chronologique des actions.

#### c) Réception d'un SOS par le coordonnateur — exigence critique
Quand un SOS est envoyé :
1. Le **coordonnateur en charge** reçoit une **fenêtre popup prioritaire** à l'écran (web et mobile) **accompagnée d'un son de sirène d'ambulance**, qui se répète jusqu'à acquittement.
2. La popup affiche l'essentiel (qui, où, quand, canal) et des actions rapides.
3. **Au clic sur la popup**, une **page de traitement du SOS** s'ouvre.

#### d) Communication avec l'émetteur (depuis la popup ET depuis la page)
Le coordonnateur peut, directement depuis la fenêtre de notification **et** depuis la page ouverte :
- **Appel vidéo direct** vers le numéro/utilisateur émetteur.
- **Appel audio**.
- **Message texte**.
- **Message audio** (enregistrement vocal).
> Cible du canal : app-à-app via **WebRTC** (avec TURN), et/ou pont vers numéro GSM via la passerelle voix (à confirmer en Phase 0, Q6–Q9).

**Si l'émetteur ne répond pas :** le coordonnateur peut **garder la ligne ouverte / laisser un message** ET, en parallèle, **envoyer les secours**. Les deux actions ne sont pas exclusives.

#### e) Envoi des secours
- Bouton **« Envoyer Secours »**.
- L'**équipe de secours prédéfinie et de garde (équipe de jour/nuit active)** reçoit un message contenant **l'ensemble des informations de l'alerte** : émetteur, position/dernière position connue, canal, horodatage, lien vers la fiche SOS, et lien d'itinéraire/navigation.
- Suivi de l'accusé de réception par l'équipe.

#### f) Clôture par l'équipe de secours
- Une fois l'intervention terminée, l'équipe **ouvre le SOS et le clôture** (renseigne le résultat : succès / avec impact, etc.).

#### g) Traitement / dossier d'un SOS
Chaque SOS peut recevoir un **traitement documenté** :
- **Action corrective**
- **Recommandation**
- **Documents** joints
- **Rapport** d'intervention
- **Images** jointes (capture caméra ou photos terrain)

#### h) Indicateurs de performance (KPI)
La plateforme suit, par SOS et en agrégé : **délais** (réception→prise en charge, prise en charge→sur place, →clôture), **statut**, **impact**, **« traité avec succès »**, **« traité mais impact »**, taux de fausses alertes. Ces KPI alimentent le Tableau de bord (§4.1) et l'export reporting.

---

### 4.4 — Gestion des alertes & évacuation — MODULE CAPITAL

Une **alerte générale** est une urgence imposant le **rassemblement aux points de rassemblement** et l'**évacuation** d'une zone ou de **l'ensemble du site**.

#### a) Déclenchement (contrôlé)
- Le **bouton « Alerte Générale »** n'est disponible **qu'aux utilisateurs désignés** dans les **Paramètres de la Gestion des Urgences** (§4.5).
- Confirmation à plusieurs étapes pour éviter le déclenchement accidentel (ex. maintien long + saisie/confirmation), choix du **périmètre** (zone précise ou site entier).
- Action immédiatement **journalisée** (auteur, heure, périmètre).

#### b) Diffusion sonore
À l'activation, le système diffuse une **sirène très forte** accompagnée d'une **phrase répétée par une voix féminine** :
> « **Alerte Générale, veuillez rejoindre le point de rassemblement le plus proche.** »
La diffusion **se répète en boucle jusqu'à arrêt manuel** par un utilisateur autorisé. (Si une sonorisation physique existe, la déclencher en parallèle — Q15.)

#### c) Affichage prioritaire (écrans + mobile)
Lorsqu'une alerte générale est lancée, tous les **écrans et applications mobiles** affichent une **fenêtre popup prioritaire** qui **balaie à la manière des gyrophares d'ambulance** (effet de balayage rouge/lumineux animé), portant la phrase ci-dessus. Cette popup :
- passe **au premier plan** et **prend toute la priorité** (sur Android : full-screen intent / canal de notification haute priorité ; sur iOS : Critical Alert + notification proéminente — sous réserve entitlement Q11) ;
- **outrepasse le mode silencieux** dans la mesure permise par l'OS (alerte critique) ;
- maintient l'**écran allumé** (wake lock) et la **vibration** pendant l'alerte ;
- indique le **point de rassemblement le plus proche** de l'utilisateur (géoloc) et l'itinéraire.

#### d) Pilotage de l'évacuation (côté coordonnateur)
- Vue **temps réel de l'évacuation** : points de rassemblement, **priorité d'évacuation**, et **comptage des présents** (head-count, §6).
- Tableau « **En sécurité / Manquants** » par département et par zone.
- Bouton **« Fin d'alerte »** (utilisateur autorisé) : arrête la sirène/boucle, clôt l'événement, génère le **rapport d'évacuation** (heure de déclenchement, durée, effectif rassemblé, manquants, délais).

#### e) Mode exercice (drill)
Pouvoir lancer une alerte en **mode exercice** clairement signalé, pour entraîner le personnel et mesurer les temps de réponse, sans confondre avec une urgence réelle.

---

### 4.5 — Paramètres de la Gestion des Urgences

- **Désignation des utilisateurs autorisés** à lancer/arrêter l'**Alerte Générale**.
- Désignation et affectation des **coordonnateurs** (par zone / par roulement).
- Définition des **équipes de secours** (jour/nuit, membres, contacts, astreintes).
- **Délais & règles d'escalade** (temps d'acquittement avant escalade, vers qui).
- **Médias** : fichier de sirène, message vocal féminin (et variantes linguistiques).
- Paramètres des **canaux** (SMS, voix, WebRTC, passerelle).
- **Référentiels** : types de SOS, motifs de fausse alerte, niveaux de priorité d'évacuation.
- **Mode exercice** : activation/planification des drills.

---

## 5. EXIGENCES TEMPS RÉEL & NOTIFICATIONS CRITIQUES

- **Canal temps réel** persistant (WebSocket/Realtime) pour : nouveaux SOS, changements de statut, état d'évacuation, présence aux points de rassemblement.
- **Notifications critiques** :
  - Android : **full-screen intent** + canal de notification à importance maximale, son personnalisé (sirène), contournement du Ne pas déranger.
  - iOS : **Critical Alerts** (entitlement) + son personnalisé ; à défaut, notification proéminente + son.
  - Web : notification + lecture audio en boucle + popup modale prioritaire.
- **Lecture audio robuste** : sirène et message vocal en boucle, reprise après interruption, respect des contraintes d'autoplay navigateur (geste utilisateur initial côté coordonnateur).
- **Accusés & déduplication** : chaque notification critique exige un acquittement ; pas de double traitement d'un même SOS par deux coordonnateurs (verrou de prise en charge).
- **Escalade** : si non acquitté dans le délai → notifier l'échelon suivant + journaliser.

---

## 6. INNOVATIONS RECOMMANDÉES (à valider en Phase 0)

1. **Head-count automatique au point de rassemblement** : pointage à l'arrivée (géofencing GPS, **QR/NFC** sur la borne du point, ou check-in app). Dashboard « En sécurité / Manquants » en direct — déterminant en évacuation minière.
2. **Mode hors-ligne / fallback SMS** : SOS émis même sans data (bascule SMS via passerelle) ; file locale synchronisée au retour réseau.
3. **Escalade automatique multi-niveaux** (coordonnateur → adjoint → superviseur) sur non-réponse.
4. **Dernière position connue** de l'émetteur (suivi de position pendant l'urgence, avec consentement).
5. **Bouton SOS matériel / wearable** (intégration future, prévoir l'API d'ingestion d'alertes externes).
6. **Caméras en direct** : visualisation du flux de la caméra du point de rassemblement ou la plus proche du SOS.
7. **Routes d'évacuation** affichées sur la carte selon la position de l'utilisateur et la priorité des points.
8. **Mode exercice/drill** avec mesure des temps de réponse et rapport comparatif.
9. **Journal d'audit immuable** (append-only) horodaté pour conformité réglementaire minière.
10. **Accessibilité terrain** : boutons larges « gantés », très fort contraste (lisibilité plein soleil), vibration, multilingue audio.
11. **Intégration sonorisation/sirènes physiques (PA/IoT)** déclenchées en parallèle de l'alerte applicative.
12. **Météo & conditions** affichées lors de l'évacuation (vent, visibilité) si pertinentes.
13. **Bilan post-incident automatique** : génération du rapport (timeline, KPI, médias) exportable.

---

## 7. MODÈLE DE DONNÉES (esquisse — à confirmer/aligner avec l'existant)

> Réutiliser les entités existantes (Users, Employees, Departments, Zones). Ne créer que le strict nécessaire.

- **AssemblyPoint** : id, name, description, location_text, lat, lng, manager_id, deputy_manager_id, camera_id, evacuation_priority, capacity, status, timestamps.
- **AssemblyPoint_Department** (n-n).
- **SOS** : id, emitter_user_id?, emitter_phone?, channel (app|sms), status, created_at, last_known_lat/lng, assigned_coordinator_id, acknowledged_at, dispatched_at, on_site_at, closed_at, outcome (success|impact), is_false_alarm, false_alarm_reason.
- **SOS_Event** (timeline append-only) : id, sos_id, type (received|acknowledged|call_started|message_sent|dispatched|on_site|closed|escalated), actor_id, payload, created_at.
- **SOS_Treatment** : id, sos_id, corrective_action, recommendation, report, attachments[] (documents/images).
- **RescueTeam** / **RescueTeamMember** + **shift** (jour/nuit, plage horaire).
- **GeneralAlert** : id, triggered_by, scope (zone|site), zone_id?, started_at, ended_at, ended_by, mode (real|drill).
- **Muster (head-count)** : id, alert_id, user_id, assembly_point_id, checked_in_at, method (gps|qr|nfc|manual), status (safe|missing).
- **EmergencySettings** : authorized_alert_users[], coordinators[], escalation_rules, media (siren, voice msg + locales), channel config.
- **AuditLog** (immuable).

---

## 8. EXIGENCES NON-FONCTIONNELLES

- **Fiabilité** : aucune perte de SOS ; redondance des canaux ; reprise sur panne ; tests de charge des notifications.
- **Latence** : un SOS doit apparaître chez le coordonnateur en quelques secondes.
- **Sécurité** : RBAC strict (qui peut lancer une alerte, voir les positions, clore un SOS) ; chiffrement en transit ; protection des données de géolocalisation (consentement, minimisation).
- **Confidentialité** : la position n'est exploitée qu'en contexte d'urgence/évacuation.
- **Traçabilité/conformité** : journal immuable, conservation paramétrable.
- **Résilience réseau** : mode hors-ligne, fallback SMS, file de synchronisation.
- **Observabilité** : monitoring des canaux temps réel, push, WebRTC, passerelle SMS/voix ; alertes techniques si un canal tombe.
- **Batterie** : usage raisonné du GPS (suivi position uniquement en urgence).

---

## 9. DESIGN SYSTEM & CHARTE

- **Réutiliser le thème de l'application existante** (tokens, typographie, composants). Récupérer le fichier de thème en Phase 0.
- **Palette de base (Executive Navy)** : NAVY `#1E3A5F`, TEAL `#0891B2`, AMBER `#D97706`.
- **Sémantique d'urgence** à superposer : ROUGE critique (`#DC2626`) pour SOS/alerte générale, AMBER pour avertissements, VERT (`#16A34A`) pour « en sécurité / résolu ».
- **Popup d'alerte générale** : animation de **balayage type gyrophare** (rouge), plein écran, prioritaire, accessible (contraste AAA, gros boutons).
- **Mobile-first** : cibles tactiles ≥ 48px, lisibilité plein soleil, états hors-ligne explicites, retours haptiques.

---

## 10. LIVRABLES & CRITÈRES D'ACCEPTATION

**Livrables :**
1. ADR (décisions Phase 0).
2. Schéma de données + migrations.
3. Composants UI mobile + web, alignés au design system.
4. Services temps réel, notifications critiques, WebRTC/voix, passerelle SMS.
5. Documentation d'exploitation (déclenchement, arrêt, escalade) + scénario de test/drill.

**Critères d'acceptation (extraits) :**
- [ ] Un SOS déclenché par un employé apparaît chez le coordonnateur **avec popup + sirène en boucle** jusqu'à acquittement.
- [ ] Le coordonnateur peut, **depuis la popup et la page**, lancer un **appel vidéo, audio, message texte ou audio** vers l'émetteur.
- [ ] En cas de non-réponse, le coordonnateur peut **garder la ligne / laisser un message** ET **envoyer les secours** simultanément.
- [ ] « Envoyer Secours » notifie **l'équipe de garde** avec **toutes les informations** de l'alerte.
- [ ] L'équipe de secours peut **ouvrir et clôturer** le SOS avec résultat.
- [ ] Un SOS accepte **action corrective, recommandation, documents, rapport, images**.
- [ ] Les **KPI** (délais, statut, impact, succès/impact, fausses alertes) sont calculés et affichés.
- [ ] Le **bouton Alerte Générale** n'est visible **que pour les utilisateurs autorisés**.
- [ ] L'alerte générale diffuse **sirène + voix féminine en boucle** jusqu'à arrêt, et affiche une **popup prioritaire « gyrophare »** sur mobile et écrans.
- [ ] Les **points de rassemblement** sont gérés avec tous les champs requis (responsable, adjoint, caméra, priorité d'évacuation, géoloc, départements).
- [ ] Un **arrêt d'alerte** par un utilisateur autorisé stoppe tout et génère le rapport.
- [ ] L'**audit** trace chaque action critique de façon immuable.

---

## 11. MÉTHODOLOGIE D'EXÉCUTION

1. **Phase 0** — Audit & ADR (questions §2). *Stop, validation requise.*
2. **Phase 1** — Modèle de données + paramètres + RBAC.
3. **Phase 2** — Points de rassemblement (CRUD + carte).
4. **Phase 3** — SOS : émission → réception (popup/sirène) → communication (WebRTC/SMS) → secours → clôture → traitement.
5. **Phase 4** — Alerte générale & évacuation (diffusion sonore, popup prioritaire, head-count, arrêt, rapport).
6. **Phase 5** — Tableau de bord temps réel & KPI.
7. **Phase 6** — Mode hors-ligne, escalade, drill, durcissement, tests.

> À chaque phase, tu appliques le **cycle de gouvernance qualité du §0bis** : cadrage → implémentation → audit par l'Application Quality Officer → note /10. **Tu ne passes à la phase suivante qu'avec une note ≥ 9/10** ; sinon tu corriges intelligemment les recommandations puis tu ré-audites. Chaque phase doit se clôturer par une confirmation explicite **« zéro régression »**.

---

*Fin du prompt. Commence par la Phase 0 : pose les questions d'audit, n'écris aucun code avant validation.*
