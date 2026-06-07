# Module « Gestion des Dynamitages » / Blast Management
### Extension de la plateforme Santé–Sécurité (contexte minier) — interface bilingue Français / Anglais

> **Pour l'agent de développement (Claude Code / Cursor).**
> Ce document décrit le module à construire, la manière de l'intégrer à la plateforme existante, et l'ordre des travaux. Ne produis aucun code avant d'avoir mené la **Phase 0 – Audit** et obtenu les réponses du Directeur Technique.

> **Ton rôle.** Tu interviens comme **développeur full-stack en autonomie, à la manière d'un chef de projet** : tu planifies, tu réalises, tu contrôles ta propre qualité et tu décides du passage à l'étape suivante selon le cycle décrit au §0bis. Ce module est une **amélioration** de l'existant : il doit s'y fondre proprement, sans casser quoi que ce soit qui fonctionne déjà.

> **Une exigence d'écriture, ferme.** L'interface, les e-mails et les libellés doivent être rédigés comme le ferait un professionnel des opérations minières — en français et en anglais. Pas de tournures de machine, pas de superlatifs creux, pas d'emoji dans les titres, pas de microcopie ampoulée. On nomme les choses simplement : « Heure de tir prévue », pas « Configuration de l'horodatage d'exécution ». Voir la consigne complète au §11.

---

## 0. Règles de travail

1. **L'audit précède le code.** Rien n'est écrit tant que la Phase 0 n'est pas tranchée.
2. **Un pas à la fois.** Tu proposes, on valide, tu réalises, tu vérifies, tu avances.
3. **Pas d'invention.** Aucun nom de table, de service, de seuil ou d'écran sorti de nulle part. Dans le doute, tu demandes.
4. **On réutilise l'existant.** Composants, thème, conventions de nommage, authentification, rôles, arborescence : tout ce qui existe est repris, rien n'est dupliqué.
5. **Sécurité des personnes.** Un tir mal annoncé peut tuer. La fiabilité de la planification, des rappels et du déclenchement de l'alerte prime sur tout le reste.
6. **Aucune régression.** Avant chaque étape, tu repères les zones touchées et tu prévois un filet (tests de non-régression, branche dédiée, point de retour).
7. **Réutiliser l'Alerte Générale existante.** Le déclenchement à T-10 min s'appuie sur le module « Gestion des Urgences » déjà en place ; le comptage des présents alimente le rapport d'évacuation. Ne réimplémente pas ces briques.

---

## 0bis. Contrôle qualité par phase

Tu avances en autonomie, mais chaque phase passe par le même contrôle :

- Tu cadres la phase (objectif, zones de code touchées, risque de régression, plan de test).
- Tu réalises.
- Tu changes de casquette et tu deviens un **auditeur qualité senior, indépendant et sévère**, dont le seul travail est de chercher les défauts.
- L'auditeur note la phase **sur 10**. À **9/10 ou plus**, on continue. En dessous, il rédige des **recommandations claires et hiérarchisées (P1/P2/P3)**, tu les corriges à la racine — sans rien dégrader — puis tu fais ré-auditer. On répète jusqu'à 9/10.

L'auditeur regarde notamment : la non-régression (bloquant), la justesse de la planification et des rappels, la fiabilité de l'envoi des e-mails, le bon déclenchement de l'alerte à T-10, la conformité fonctionnelle, l'intégration au design existant, la sécurité, la qualité du code, et la qualité bilingue des libellés. Chaque phase se clôt par un mot d'audit : note, constats, et confirmation « aucune régression ».

---

## 1. De quoi il s'agit

La mine procède régulièrement à des **tirs de mine (dynamitages)**. Aujourd'hui, leur planification et l'annonce au personnel reposent sur des moyens dispersés. Ce module rassemble tout au même endroit : on **enregistre les tirs prévus**, on **déclenche automatiquement les rappels et les alertes**, on **fait évacuer** la zone au bon moment, et on **garde la trace** de chaque tir.

Le fil conducteur d'un tir :

1. Un responsable **enregistre** un tir prévu (zone, heure, plan de tir, explosifs, périmètre d'exclusion, équipe).
2. Le tir reste **Planifié** tant qu'il n'est pas verrouillé.
3. Quand il est **Confirmé**, la machine à rappels démarre : e-mails à **24 h, 6 h et 30 min**, puis fenêtres de rappel **toutes les 15 min à partir de 2 h avant**.
4. À **10 minutes du tir**, l'**Alerte Générale** se déclenche avec un message sans ambiguïté : *ce n'est pas un exercice, évacuez*.
5. Le tir est exécuté, la zone est inspectée, le **« site dégagé »** est prononcé.
6. Un **rapport d'évacuation** clôt l'événement.

**Sous-pages du module :**
- Tableau de bord
- Registre des tirs (liste)
- Enregistrer / modifier un tir (formulaire)
- Planification des rappels et alertes
- Suivi du jour J (compte à rebours, popups, alerte)
- Rapports d'évacuation
- Paramètres

---

## 2. Phase 0 — Audit avant de commencer

Pose ces questions, regroupe-les, ne code rien tant qu'elles ne sont pas réglées.

**Plateforme & existant**
1. Stack front/back, base de données, mécanisme temps réel (WebSocket/Realtime), i18n déjà en place ?
2. Le module **Gestion des Urgences** (Alerte Générale, points de rassemblement, comptage des présents) est-il déjà déployé et exploitable comme dépendance ?
3. Authentification et rôles : comment ajouter les rôles propres au tir (boutefeu/blaster, responsable des opérations, garde de tir, agent HSE) ?
4. Référentiels disponibles : fosses, gradins, zones, employés, départements ?
5. Thème et bibliothèque de composants : fournir le fichier de design tokens.

**E-mail & planification**
6. **Serveur SMTP** disponible (hôte, port, TLS, identifiants, adresse d'expédition) ? Sinon, qui le fournit ?
7. Existe-t-il déjà un **ordonnanceur de tâches** (cron, file de jobs persistante type BullMQ/Agenda, pg_cron…) réutilisable, ou faut-il l'introduire ?
8. Les destinataires des e-mails viennent-ils de l'annuaire des employés, de listes de diffusion, ou des deux ?

**Métier & réglementaire**
9. Fuseau horaire de référence du site et format d'heure attendu.
10. Cadre réglementaire des tirs applicable (préavis aux autorités, riverains, limites de vibration/airblast) à respecter ?
11. Types de tirs pratiqués (production, développement, secondaire/pétardage, présplit, tir de finition) ?
12. Procédure de **ratés (misfire)** : que doit faire la plateforme si un tir est déclaré raté (maintien du périmètre, blocage du « site dégagé », alerte spécifique) ?

**Diffusion de l'alerte**
13. À T-10, l'Alerte Générale doit-elle couvrir une **zone** précise ou tout le site ? Qui peut l'interrompre ?
14. Faut-il piloter en parallèle une **sirène / sonorisation physique** (si elle existe dans la Gestion des Urgences) ?

> Restitue tes choix sous forme de courtes décisions d'architecture avant d'aller plus loin.

---

## 3. Contraintes qui traversent tout le module

- **Bilingue de bout en bout.** Interface, e-mails et message d'alerte existent en **français et en anglais**, suivant la langue de l'utilisateur ou du destinataire. Aucun texte écrit en dur dans le code.
- **L'heure est sacrée.** Tout est calculé dans le fuseau du site, sans dérive lors des changements d'heure ; les calculs de rappels sont déterministes et testés.
- **La planification survit aux redémarrages.** Les rappels et alertes reposent sur une planification **persistée** (pas seulement en mémoire), **idempotente** (jamais deux fois le même e-mail), et **recalculée** si le tir est déplacé ou annulé.
- **Traçabilité.** Chaque envoi, chaque changement de statut, chaque déclenchement d'alerte est horodaté et attribué, en écriture additive.
- **Mobile pris en charge.** Consultation et confirmation possibles depuis le terrain ; les popups du jour J s'affichent aussi sur mobile.
- **On épouse le style existant.** Mêmes composants, même grille, même palette.

---

## 4. Les écrans, un par un

### 4.1 Tableau de bord

La page d'accueil du module donne en un coup d'œil l'état des tirs. Elle se rafraîchit en temps réel.

On y trouve : les **tirs à venir** (aujourd'hui, cette semaine) avec leur statut ; un **compte à rebours** vers le prochain tir confirmé ; une **carte** des tirs planifiés avec leur périmètre d'exclusion ; la **répartition par statut** ; l'**état des notifications** (e-mails partis, en attente, en échec) ; les **derniers tirs** et leur issue ; et quelques indicateurs utiles au responsable : nombre de tirs dans le mois, quantité d'explosifs consommée, charge spécifique moyenne (powder factor), taux de tirs réalisés à l'heure, ratés éventuels.

Le tableau de bord observe ; il ne déclenche rien d'irréversible. Les actions se font dans les écrans dédiés.

### 4.2 Registre des tirs

La liste de tous les tirs, filtrable par statut, par fosse, par période, par boutefeu. Chaque ligne montre la référence, la zone, l'heure prévue, le statut (avec sa couleur), le boutefeu en charge et l'état des rappels. On peut ouvrir un tir, le dupliquer pour en planifier un similaire, l'exporter.

### 4.3 Enregistrer un tir — le formulaire

Un formulaire **soigné, dense mais clair**, organisé en sections (en étapes sur mobile). Chaque valeur affiche son unité ; chaque champ est validé en direct ; on peut enregistrer un brouillon. Les sections :

- **Identification du tir** : référence (générée, ex. `BLT-2026-0142`), date et **heure de tir prévue**, type de tir.
- **Localisation** : fosse, gradin/banc, panneau/bloc, coordonnées, accès concernés.
- **Plan de tir** : nombre de trous, diamètre, profondeur, banquette (burden), espacement, maille, bourrage (stemming).
- **Explosifs & amorçage** : nature de l'explosif (ANFO, émulsion…), quantité totale (kg), charge spécifique, système d'amorçage (détonateurs électroniques, non-électriques…), séquence de retards.
- **Périmètre & abris** : rayon d'exclusion, points de rassemblement concernés (repris de la Gestion des Urgences), postes des gardes de tir (sentinelles).
- **Équipe & responsabilités** : boutefeu agréé en charge, équipe de tir, gardes, responsable HSE.
- **Environnement** : contraintes météo (vent pour les fumées, foudre), récepteurs sensibles à proximité, limites de vibration/airblast (PPV en mm/s).
- **Annonce** : liste des destinataires des e-mails, langue préférée de chacun, et zone couverte par l'Alerte Générale à T-10.
- **Autorisations & pièces jointes** : permis de tir, préavis réglementaire, analyse de risque/JSA, plan de tir, schéma de foration.
- **Notes** libres.

À l'enregistrement, le tir est **Planifié**. Tant qu'il l'est, on peut tout modifier. Une fois **Confirmé**, les champs qui touchent à l'heure et au périmètre sont verrouillés (toute modification ultérieure exige une raison tracée et **recalcule** la planification).

### 4.4 Planification des rappels et alertes

C'est ici qu'on voit, pour un tir confirmé, **ce qui va partir et quand** :

| Échéance | Canal | Contenu |
|---|---|---|
| **24 h avant** | E-mail | Rappel J-1 : tir prévu, zone, heure, consignes |
| **6 h avant** | E-mail | Rappel du matin / de la veille rapprochée |
| **2 h avant → tir** | Popup plateforme **toutes les 15 min** | Rappel de l'heure du tir et du décompte |
| **30 min avant** | E-mail | Dernier rappel par e-mail |
| **10 min avant** | **Alerte Générale** (audio + popup prioritaire) | « Ceci n'est pas un exercice. Évacuez. » |

Chaque échéance affiche son état : programmée, envoyée, en échec (avec relance possible). Si le tir est déplacé ou annulé, tout est reprogrammé ou annulé proprement.

### 4.5 Le jour J — compte à rebours, popups, alerte

À partir de **2 heures avant** un tir confirmé, une **fenêtre de rappel s'affiche toutes les 15 minutes** sur la plateforme (web et mobile) : elle rappelle la zone, l'heure exacte et le temps restant. Discrète mais visible, elle s'acquitte d'un geste et revient au cycle suivant.

À **10 minutes du tir**, on bascule dans l'urgence : la plateforme déclenche l'**Alerte Générale** (le module existant), avec son audio fort et sa **popup prioritaire balayante**, portant ce message — dans la langue de chacun :

> **FR —** « Ceci n'est pas un exercice. Attention, dynamitage imminent. Veuillez évacuer immédiatement et rejoindre le point de rassemblement le plus proche. »
>
> **EN —** “This is not a drill. Warning: blasting imminent. Evacuate immediately and proceed to the nearest assembly point.”

Le message tourne en boucle jusqu'à ce qu'un utilisateur autorisé y mette fin, après le tir et l'inspection. Le statut du tir suit le mouvement : **Imminent** pendant le décompte, **Tiré** après le tir, **Site dégagé** une fois l'inspection faite et le périmètre levé.

En cas de **raté (misfire)**, le « site dégagé » est bloqué : le périmètre reste actif et une consigne spécifique s'affiche tant que la situation n'est pas levée par le boutefeu.

### 4.6 Rapports d'évacuation

Chaque tir confirmé produit un **rapport d'évacuation** consultable et exportable : heure de déclenchement de l'alerte, **présents aux points de rassemblement** (repris du comptage de la Gestion des Urgences), manquants éventuels, délai d'évacuation, heure du tir, heure du « site dégagé », incidents, et **validation signée** par le responsable du tir.

### 4.7 Paramètres

Modèles d'e-mails (FR/EN), réglages SMTP, échéances de rappel (par défaut 24 h / 6 h / 30 min, **ajustables**), cadence et fenêtre des popups (par défaut toutes les 15 min dès 2 h avant), libellé et langue du message d'alerte, zone par défaut de l'Alerte Générale, référentiels (types de tir, types d'explosifs, fosses), et qui peut confirmer un tir, lancer ou arrêter l'alerte.

---

## 5. Les statuts d'un tir

Cycle proposé (libellés bilingues) :

- **Brouillon / Draft** — en cours de saisie.
- **Planifié / Planned** — enregistré, modifiable, pas encore verrouillé.
- **Confirmé / Confirmed** — verrouillé ; **déclenche la planification des rappels et alertes**.
- **Imminent / Imminent** — dans le décompte (popups en cours, alerte à T-10).
- **Tiré / Fired** — le tir a eu lieu, inspection en cours.
- **Site dégagé / All Clear** — périmètre levé, tir clôturé.
- **Raté / Misfire** — anomalie au tir ; périmètre maintenu, traitement spécifique.
- **Annulé / Cancelled** et **Reporté / Postponed** — avec motif tracé ; la planification est annulée ou recalculée.

---

## 6. La mécanique de planification et d'e-mails (à implémenter avec le SMTP)

C'est le cœur technique. À construire avec soin.

**L'ordonnanceur.** À la confirmation d'un tir, le système calcule les instants exacts (T-24 h, T-6 h, T-30 min pour les e-mails ; la série de popups de T-2 h jusqu'au tir ; T-10 min pour l'alerte) et les **enregistre comme tâches planifiées persistées** (table dédiée + file de jobs / cron persistant — pas de simple `setTimeout` en mémoire). Au démarrage de l'application, les tâches en attente sont rechargées. Chaque tâche est **idempotente** : si elle a déjà tourné, elle ne renvoie rien. Si le tir change d'heure, est reporté ou annulé, les tâches en attente sont **recalculées ou annulées**.

**Les e-mails par SMTP.** L'envoi passe par le **serveur SMTP** configuré (hôte, port, TLS, identifiants, expéditeur — tous en variables d'environnement, jamais en dur). Les messages sont **bilingues**, à partir de modèles : l'e-mail part dans la **langue préférée du destinataire**, ou en version bilingue à défaut. Chaque envoi est **journalisé** (destinataire, échéance, statut), avec **relance automatique** en cas d'échec et alerte au responsable si l'échec persiste.

**Le temps réel du jour J.** Les popups toutes les 15 min et la bascule en Alerte Générale à T-10 sont poussées via le canal temps réel existant ; l'ordonnanceur en est le métronome.

Exemples de sujets d'e-mail :
- T-24 h — FR : « Tir prévu demain — {{zone}} à {{heure}} » / EN : “Blast scheduled tomorrow — {{zone}} at {{time}}”.
- T-30 min — FR : « Tir dans 30 minutes — évacuation de {{zone}} » / EN : “Blast in 30 minutes — clear {{zone}}”.

---

## 7. Idées qui renforcent le module (à valider en Phase 0)

- **Détection de conflits** : alerte si deux tirs se chevauchent en heure et en périmètre, ou si une équipe est doublement affectée.
- **Météo intégrée** au jour J (vent, foudre) avec recommandation de report.
- **Préavis riverains / autorités** automatisé selon le cadre réglementaire.
- **Carnet de tir** : historique consolidé par fosse pour le suivi de la charge spécifique et des vibrations.
- **Mode report en un clic** qui recalcule toute la chaîne de rappels.
- **Accusé de lecture** des popups par utilisateur (qui a bien vu l'annonce).
- **Suivi des vibrations/airblast** post-tir (PPV mesuré vs limite) rattaché au tir.

---

## 8. Modèle de données (esquisse, à aligner avec l'existant)

- **Blast** : id, reference, scheduled_at, timezone, type, pit, bench, block, coordinates, status, exclusion_radius, blaster_id, hse_lead_id, alarm_zone_scope, created_by, timestamps.
- **BlastPlan** : blast_id, hole_count, hole_diameter, depth, burden, spacing, stemming, explosive_type, explosive_qty_kg, powder_factor, initiation_system, delay_sequence.
- **BlastGuard** : blast_id, employee_id, position.
- **BlastRecipient** : blast_id, employee_id?/email?, preferred_language.
- **NotificationJob** : id, blast_id, type (email_24h|email_6h|email_30m|popup_15m|general_alarm_10m), scheduled_at, status (scheduled|sent|failed|cancelled), attempts, last_error, sent_at.
- **EmailLog** : id, job_id, to, subject, language, status, error?, sent_at.
- **BlastStatusEvent** (append-only) : blast_id, from_status, to_status, actor_id, reason, at.
- **EvacuationReport** : blast_id, alarm_triggered_at, mustered_count, missing_count, evac_duration, fired_at, all_clear_at, incidents, signed_off_by, signed_at.

(Le périmètre, les points de rassemblement et le comptage des présents s'appuient sur le module Gestion des Urgences.)

---

## 9. Sécurité, fiabilité, conformité

- **Rôles fins** : seul un boutefeu/responsable habilité peut **confirmer** un tir, **lancer** ou **arrêter** l'alerte.
- **Aucune perte de notification** : planification persistée, idempotente, relances, supervision des envois.
- **Heure fiable** : calculs dans le fuseau du site, robustes aux changements d'heure.
- **Traçabilité complète** : statuts, envois, alertes, tous horodatés et attribués.
- **Confidentialité** des données d'exploitation selon les droits.
- **Procédure raté** verrouillant la clôture tant que la situation n'est pas levée.

---

## 10. Design

- **On reprend le thème existant** (tokens, typo, composants), récupéré en Phase 0.
- **Palette de base** : NAVY `#1E3A5F`, TEAL `#0891B2`, AMBER `#D97706`.
- **Couleurs de statut**, doublées d'un libellé (jamais la couleur seule) : Planifié (bleu/teal), Confirmé (ambre), Imminent (orange `#EA580C`), Tiré (gris), Site dégagé (vert `#16A34A`), Raté (rouge `#DC2626`), Annulé/Reporté (gris atténué).
- **Formulaire raffiné** : sections nettes, unités en suffixe, validations lisibles, brouillon, étapes sur mobile.
- **Popups du jour J** sobres et claires ; **alerte T-10** prioritaire et balayante (via la Gestion des Urgences).
- **Mobile-first** : cibles ≥ 48 px, fort contraste pour l'extérieur, clavier numérique pour les valeurs de tir.

---

## 11. Écriture : humaine, pas robotique

Le contenu visible — titres, sous-titres, libellés de champs, messages, e-mails — doit sonner comme rédigé par un professionnel des opérations, dans les deux langues. Concrètement :

- **Des titres simples et opérationnels.** « Tirs à venir », « Enregistrer un tir », « Le jour J ». Pas de « Bienvenue sur votre tableau de bord de gestion des dynamitages nouvelle génération ».
- **Des libellés directs.** « Heure de tir prévue », « Rayon d'exclusion », « Boutefeu en charge ». Pas de périphrases techniques inutiles.
- **Des messages utiles, pas bavards.** On dit ce qu'il faut faire, brièvement.
- **À bannir** : « seamless », « robuste », « optimisé », « élevez votre… », « en toute simplicité », les emoji dans les titres, les tirets cadratins à répétition, les exclamations, les formules d'enthousiasme automatique.
- **Bilingue naturel** : la version anglaise est une vraie traduction de métier, pas un calque mot à mot du français.

Avant de livrer un écran, relis-le et demande-toi : « est-ce qu'un chef de tir écrirait ça ? » Si la réponse est non, réécris.

---

## 12. Données d'exemple à charger pour tester

Insère un **jeu de données réaliste** (clairement marqué comme exemple, dans une mine d'or à ciel ouvert) pour valider toute la chaîne. Suggestion :

**Tirs**
| Référence | Zone | Type | Date & heure (site) | Statut | Boutefeu |
|---|---|---|---|---|---|
| BLT-2026-0142 | Fosse Nord — Gradin 1080 | Production | 18/06/2026 14:00 | Confirmé | K. Ouédraogo (agréé) |
| BLT-2026-0143 | Fosse Sud — Gradin 1065 | Développement | 19/06/2026 11:30 | Planifié | A. Koné (agréé) |
| BLT-2026-0144 | Carrière Est — Bloc B3 | Secondaire (pétardage) | 17/06/2026 16:00 | Confirmé | K. Ouédraogo (agréé) |
| BLT-2026-0139 | Fosse Nord — Gradin 1095 | Production | 12/06/2026 15:00 | Site dégagé | A. Koné (agréé) |
| BLT-2026-0140 | Fosse Ouest — Gradin 1050 | Production | 14/06/2026 10:00 | Reporté | K. Ouédraogo (agréé) |

**Détails plausibles (pour BLT-2026-0142)** : 48 trous, Ø 115 mm, profondeur 10 m, banquette 3,2 m, espacement 3,7 m, bourrage 2,8 m, émulsion ~2 100 kg, charge spécifique ≈ 0,72 kg/m³, amorçage par détonateurs électroniques, rayon d'exclusion 500 m, limite PPV 10 mm/s, points de rassemblement R-Nord-1 et R-Nord-2.

**Destinataires d'exemple** (annuaire) : Responsable HSE, Chef de mine, Poste de garde, Infirmerie/clinique, Salle de contrôle, Liaison communautés — avec langue préférée (FR ou EN) pour vérifier l'envoi dans la bonne langue.

**À vérifier avec ce jeu** : la confirmation de BLT-2026-0142 programme bien les e-mails à 24 h / 6 h / 30 min, les popups toutes les 15 min dès 12:00, et l'Alerte Générale à 13:50 ; le report de BLT-2026-0140 a bien annulé/recalculé sa planification ; BLT-2026-0139 dispose d'un rapport d'évacuation complet.

---

## 13. Livrables & critères d'acceptation

**Livrables** : décisions d'architecture (Phase 0) ; schéma de données + migrations ; écrans web/mobile alignés au thème ; ordonnanceur persistant ; envoi d'e-mails bilingues par SMTP ; intégration de l'Alerte Générale à T-10 ; rapports d'évacuation ; jeu de données d'exemple ; documentation (rôles, planification, procédure raté).

**On considère le module réussi quand :**
- [ ] On enregistre un tir via un **formulaire clair, complet et validé**, avec brouillon.
- [ ] Le **tableau de bord** montre l'état des tirs, le prochain compte à rebours et l'état des notifications.
- [ ] Un tir passe par les **statuts** prévus ; la **confirmation verrouille** et **démarre la planification**.
- [ ] Les **e-mails partent à 24 h, 6 h et 30 min**, dans la **bonne langue**, via le **SMTP** configuré, avec journal et relance.
- [ ] Une **popup s'affiche toutes les 15 min dès 2 h avant**, sur web et mobile.
- [ ] À **T-10 min**, l'**Alerte Générale** se lance avec le **message bilingue** « Ceci n'est pas un exercice… / This is not a drill… » et tourne jusqu'à arrêt autorisé.
- [ ] Un **report ou une annulation recalcule/annule** proprement toute la chaîne.
- [ ] Le cas **raté (misfire)** bloque la clôture et maintient le périmètre.
- [ ] Un **rapport d'évacuation** est disponible et signable pour chaque tir confirmé.
- [ ] L'interface et les e-mails sont **bilingues** et **rédigés de façon humaine**, sans artefacts IA.
- [ ] La planification **survit à un redémarrage** et n'envoie jamais deux fois le même rappel.
- [ ] **Aucune régression** à chaque phase.

---

## 14. Ordre des travaux

1. **Phase 0** — Audit & décisions. *On valide avant de coder.*
2. **Phase 1** — Données + paramètres + rôles, sur l'existant.
3. **Phase 2** — Registre + formulaire d'enregistrement + statuts.
4. **Phase 3** — Ordonnanceur persistant + e-mails SMTP bilingues (24 h / 6 h / 30 min).
5. **Phase 4** — Popups du jour J (toutes les 15 min dès 2 h) + intégration Alerte Générale à T-10.
6. **Phase 5** — Report/annulation/recalcul + procédure raté.
7. **Phase 6** — Rapports d'évacuation.
8. **Phase 7** — Tableau de bord & indicateurs.
9. **Phase 8** — Jeu de données d'exemple, idées du §7, durcissement, tests.

> À chaque phase, le contrôle qualité du §0bis s'applique : on cadre, on réalise, on fait auditer, on note sur 10. On ne passe la main qu'à **9/10 ou plus**, sinon on corrige les recommandations et on ré-audite. Chaque phase se termine par une confirmation « aucune régression ».

---

*Fin du document. Commence par la Phase 0 : pose les questions d'audit, n'écris aucun code avant validation.*
