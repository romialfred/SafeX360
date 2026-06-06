# PROMPT D'IMPLÉMENTATION — MODULE « GESTION DE LA DOSIMÉTRIE & DES EXPOSITIONS »
### Extension d'une plateforme Santé–Sécurité existante (contexte minier, surveillance des travailleurs exposés)

> **À l'attention de l'agent de développement (Claude Code / Cursor / autre).**
> Ce document est une spécification-prompt exhaustive. Il décrit **quoi** construire, **comment** s'intégrer à l'existant, et **dans quel ordre**. Tu **ne dois pas** générer de code avant d'avoir exécuté la **Phase 0 – Audit préalable** et obtenu les réponses du Directeur Technique.

> **TON RÔLE — Expert Full Stack en autonomie complète, agissant comme Chef de Projet.**
> Tu pilotes l'implémentation de bout en bout, phase par phase, **sans supervision continue**. Tu planifies, tu exécutes, tu contrôles ta propre qualité et tu décides du passage à la phase suivante selon le **cycle de validation qualité obligatoire (§0bis)**. Cette mission est une **amélioration de l'existant** : elle doit **enrichir et s'intégrer** à la plateforme, **sans jamais introduire de régression**.

> **DOMAINE SENSIBLE & RÉGLEMENTÉ.** Ce module traite de données de santé et de radioprotection. Il doit être conforme aux principes internationaux (CIPR/ICRP 103, AIEA/IAEA GSR Part 3) et au **cadre national applicable** (à confirmer en Phase 0). Les données dosimétriques sont des **données de santé à caractère personnel** : confidentialité, intégrité et traçabilité sont impératives.

---

## 0. RÈGLES DE TRAVAIL (NON NÉGOCIABLES)

1. **Audit avant code.** Aucune ligne de code n'est produite tant que la Phase 0 n'est pas validée.
2. **Une action à la fois.** Tu proposes, tu attends validation, tu implémentes, tu vérifies, puis tu passes à l'étape suivante.
3. **Zéro entité inventée.** Aucun nom de table, de service tiers, de seuil réglementaire ou d'écran n'est créé sans confirmation. En cas de doute → tu demandes. **Aucune valeur de dose ou de limite ne doit être codée en dur** : tout est paramétrable (§6).
4. **Cohérence avec l'existant.** Tu réutilises composants, design system, conventions de nommage, authentification, rôles et structure de dossiers déjà en place. Tu ne réinventes rien qui existe.
5. **Module sensible (santé & radioprotection).** Fiabilité, exactitude des calculs de dose, confidentialité et traçabilité priment sur l'esthétique. Une erreur de dose peut avoir des conséquences sanitaires et légales.
6. **Amélioration sans régression.** Aucune fonctionnalité actuelle ne doit cesser de fonctionner. Avant chaque phase, tu identifies les zones impactées et tu établis un filet de sécurité (tests de non-régression, branche dédiée, points de retour arrière).
7. **Autonomie pilotée par la qualité.** Tu avances seul, mais tu ne franchis une phase qu'après validation par l'Application Quality Officer (§0bis).

---

## 0bis. GOUVERNANCE QUALITÉ — CYCLE DE VALIDATION OBLIGATOIRE

Tu travailles **en autonomie complète comme Chef de Projet**. À **chaque phase** (voir §12), tu appliques ce cycle sans le sauter :

1. **Cadrage de phase** : objectif, zones de code impactées, risque de régression, plan de test.
2. **Implémentation** selon les règles §0.
3. **Recrutement d'un auditeur** : tu **endosses un second rôle distinct, « Expert Senior Application Quality Officer »**, indépendant et exigeant, dont l'unique mission est de **valider tous les aspects** de la phase, sans complaisance.
4. **Audit & notation** : l'auditeur évalue sur la grille ci-dessous et attribue une **note /10**.
   - **≥ 9/10 → phase validée**, passage autorisé.
   - **< 9/10 → phase bloquée** : l'auditeur rédige des **recommandations précises, priorisées (P1/P2/P3) et actionnables**.
5. **Correction intelligente** : tu corriges la **cause racine**, sans dégrader l'existant, sans sur-ingénierie, en gardant la cohérence.
6. **Ré-audit** en boucle jusqu'à **≥ 9/10**.

**Grille d'évaluation (axes notés, moyenne pondérée) :**
- **Non-régression** *(axe bloquant : toute régression plafonne la note sous 9)*.
- **Exactitude des calculs de dose** (cumuls, glissants 5 ans, conversions, arrondis) — axe critique de ce module.
- **Conformité fonctionnelle** à la spécification.
- **Conformité réglementaire** (limites, catégories, périodicités, traçabilité).
- **Intégration à l'existant** (design system, conventions, auth/RBAC, pas de duplication).
- **Sécurité & confidentialité des données de santé** (RBAC fin, chiffrement, journal d'audit).
- **Qualité de code** (lisibilité, typage, tests).
- **UX & raffinement des formulaires** (précision, ergonomie, validations).
- **Performance & temps réel** (imports volumineux, tableau de bord).

**Restitution en fin de phase :** rapport « Application Quality Officer » (note globale + par axe), recommandations si < 9, ou validation explicite + confirmation **« zéro régression »** + GO si ≥ 9.

> Les deux rôles restent **distincts dans le raisonnement** : l'auditeur cherche les défauts, il ne valide pas par complaisance.

---

## 1. CONTEXTE & OBJECTIF

L'entreprise exploite un **site minier**. Une application Santé-Sécurité (HSE) est déjà en production. On y greffe un **module « Gestion de la Dosimétrie & des Expositions »** permettant le **suivi individuel et collectif des travailleurs exposés** : rayonnements ionisants (externe, interne, radon, poussières radioactives) et, plus largement, **agents d'exposition professionnelle** (bruit, poussières/silice, agents chimiques, vibrations, chaleur).

**Objectifs :**
- Tenir un **registre nominatif très précis** des travailleurs exposés.
- **Suivre chaque employé exposé** : doses reçues, cumuls, tendances, surveillance médicale, habilitations.
- Offrir un **tableau de bord** classant les employés **par niveau d'exposition**.
- Fournir des **formulaires de renseignement précis, professionnels et raffinés**.
- Garantir la **conformité réglementaire** et la **traçabilité** des données.

**Périmètre (sous-pages) :**
- 1.1 Tableau de bord (par niveau d'exposition)
- 1.2 Registre des travailleurs exposés
- 1.3 Gestion des dosimètres & instruments
- 1.4 Saisie & suivi des doses (dosimétrie)
- 1.5 Surveillance d'ambiance & expositions par agent
- 1.6 Surveillance médicale & aptitude
- 1.7 Seuils, alertes & dépassements
- 1.8 Rapports & conformité
- 1.9 Paramètres du module

---

## 2. PHASE 0 — AUDIT PRÉALABLE OBLIGATOIRE

Pose et obtiens réponse avant toute conception. Regroupe les questions ; ne génère rien tant qu'elles ne sont pas tranchées.

**Plateforme & existant**
1. Stack front/back, base de données, temps réel, i18n déjà en place ?
2. Authentification et RBAC : extensibles ? Le module exige un **RBAC très fin** (qui voit les doses nominatives vs agrégées).
3. Référentiel **Employés / Départements / Zones / Postes** existant ? Champs disponibles ?
4. Design system documenté (tokens, typographie, composants, formulaires) ? Fournir le thème.
5. Module de **santé au travail / médecine du travail** déjà présent dans l'app ? (pour lier la surveillance médicale).

**Cadre réglementaire & métier**
6. **Cadre national de radioprotection applicable** (autorité compétente, limites, périodicités, déclarations) ? Référentiel international par défaut : CIPR 103 / AIEA GSR Part 3 — à confirmer.
7. Types d'exposition réellement présents sur site : **rayonnement externe ? interne ? radon ? poussières radioactives (NORM/LLRD) ? bruit ? silice ? chimique ? vibrations ? chaleur ?**
8. Catégories de travailleurs utilisées (**Catégorie A / Catégorie B**) et critères de classement retenus ?
9. **Périodes dosimétriques** (mensuelle, trimestrielle) et grandeurs suivies : Hp(10), Hp(0,07), Hp(3), dose efficace, dose équivalente extrémités/peau/cristallin, dose engagée interne, exposition radon (WLM / mSv) ?
10. Existe-t-il un **service de dosimétrie agréé** externe fournissant les résultats ? Sous quel **format d'échange** (fichier, API) ? Quel délai de restitution ?

**Instruments & données**
11. Types de **dosimètres** utilisés : passifs (TLD, OSL, film) et/ou **EPD électroniques temps réel** ? Identification (n° série, QR) ?
12. Instruments de mesure d'ambiance (sonomètres, prélèvements air, etc.) et formats de données ?
13. Volumétrie : nombre de travailleurs exposés, fréquence et taille des imports de résultats ?

**Sécurité, conformité, mobilité**
14. Exigences de **conservation** des données dosimétriques (durée légale, souvent plusieurs décennies / jusqu'à âge avancé) ?
15. Contraintes de **confidentialité** (données de santé) : qui accède à quoi, anonymisation, consentement ?
16. Usage **mobile** attendu (saisie terrain, consultation par le travailleur de sa propre dose) ?
17. Faut-il produire des **déclarations/exports réglementaires** vers un registre national / l'autorité ?

> Livre la synthèse sous forme de **décisions d'architecture (ADR courts)** avant de continuer.

---

## 3. CONTRAINTES TRANSVERSES

- **Exactitude avant tout** : calculs de cumul, moyennes glissantes sur 5 ans, conversions d'unités et arrondis doivent être justes, testés et auditables.
- **Paramétrage total** : limites, niveaux, périodicités, catégories, agents et unités sont **configurables** (§6), jamais en dur.
- **Confidentialité des données de santé** : RBAC fin, chiffrement en transit et au repos, **journal d'audit immuable** de chaque accès/consultation de dose nominative.
- **Traçabilité & intégrité** : toute donnée dosimétrique est horodatée, attribuée (source, opérateur), versionnée ; corrections par écriture additive (pas d'effacement).
- **Internationalisation** : aucun texte en dur.
- **Cohérence visuelle** avec l'app (réutiliser le thème).
- **Mobile pris en charge** : saisie/consultation terrain ; un travailleur peut consulter **sa propre** dosimétrie.

---

## 4. SPÉCIFICATIONS FONCTIONNELLES DÉTAILLÉES

### 4.1 — Tableau de bord (classement par niveau d'exposition)

Vue de pilotage, temps réel, lisible et professionnelle.

**Contenu :**
- **Répartition des employés par niveau d'exposition** (bandes de dose paramétrables, code couleur du vert au rouge — voir §6 & §10) : nombre et % par bande, vue d'ensemble immédiate.
- **Cartes KPI** : effectif exposé total, répartition **Catégorie A / B**, dose collective (homme·mSv), dose individuelle moyenne/maximale, nombre de travailleurs **approchant un seuil**, **dépassements** en cours, mesures **en retard**.
- **Tendances** : évolution des doses dans le temps (par mois/trimestre), comparaison aux **contraintes de dose** et au principe **ALARA** (As Low As Reasonably Achievable).
- **Top expositions** : classement des employés/zones/postes les plus exposés (sous contrôle d'accès).
- **Cartographie d'exposition** (innovation §7) : heat-map des zones par agent (rayonnement, bruit, poussières).
- **Alertes actives** : franchissements de niveaux d'investigation/d'action, surveillances médicales dues, dosimètres non rendus/non lus.
- **Filtres** transverses : par département, zone, poste, catégorie, type d'exposition, période.

> Vue de pilotage uniquement : pas d'action destructive ; les saisies/corrections se font dans les sous-modules.

---

### 4.2 — Registre des travailleurs exposés (liste très précise)

Référentiel nominatif central des personnes suivies. **Liste très précise, triable, filtrable, exportable** (selon droits).

**Colonnes de la liste :** matricule, nom, poste, département, zone(s) de travail, **catégorie (A/B)**, type(s) d'exposition, **dosimètre attribué**, dernière dose, **cumul annuel**, **cumul glissant 5 ans**, niveau d'exposition (bande colorée), statut surveillance médicale, statut habilitation, date de classement.

**Fiche individuelle du travailleur (vue 360°) :**
- **Identité & emploi** : matricule, identité, date de naissance, poste, département, zone(s), date d'embauche/affectation au poste exposé.
- **Classement radioprotection** : catégorie (A/B), motif et date de classement, **personne compétente en radioprotection (PCR/RPO)** référente.
- **Profil d'exposition** : agents auxquels le travailleur est exposé, fréquence, conditions.
- **Historique dosimétrique** : doses par période, cumuls (annuel, glissant 5 ans, **cumulé vie professionnelle / passeport dose**), graphique de tendance, comparaison aux limites.
- **Dosimètres** attribués (historique).
- **Surveillance médicale** : aptitude, examens, échéances.
- **Habilitations & formations** radioprotection (validité, recyclage).
- **Statut particulier** : ex. **grossesse déclarée** → suivi renforcé et limite spécifique (§6).
- **Journal d'audit** des consultations de la fiche.

---

### 4.3 — Gestion des dosimètres & instruments

Inventaire et cycle de vie des dispositifs de mesure.

- **Inventaire des dosimètres** : n° de série, type (TLD, OSL, film, **EPD électronique**), QR/code-barres, statut (disponible, attribué, en lecture, perdu, endommagé, réformé).
- **Attribution** travailleur ↔ dosimètre (avec période, accusé de remise/retour).
- **Cycle de lecture** : envoi au service de dosimétrie, retour des résultats, rattachement automatique à la dose.
- **Étalonnage / vérification** des instruments d'ambiance : dates, certificats, échéances.
- **Alertes** : dosimètre non rendu, lecture en retard, étalonnage à échéance.

---

### 4.4 — Saisie & suivi des doses (dosimétrie)

Cœur métier : enregistrement, calcul et suivi des doses.

**Grandeurs gérées (paramétrables) :**
- **Externe** : Hp(10) (dose efficace / corps entier), Hp(0,07) (peau/extrémités), Hp(3) (cristallin).
- **Interne** : dose efficace engagée (à partir de bioessais / anthroporadiamétrie).
- **Radon** : exposition (WLM ou conversion en mSv).
- **Doses totales** : somme externe + interne, par période.
- **Cumuls** : annuel (année civile), **moyenne glissante sur 5 ans**, cumulé vie professionnelle.

**Fonctions :**
- **Import des résultats** du service de dosimétrie (fichier/API), avec **contrôles de cohérence** (travailleur reconnu, période, valeurs aberrantes signalées) et **rapprochement** dosimètre↔travailleur.
- **Saisie manuelle** encadrée (EPD, mesures ponctuelles) avec validation à double niveau pour les valeurs élevées.
- **Calculs automatiques** des cumuls et comparaison aux **niveaux d'investigation / d'action / limites** (§6).
- **Gestion des valeurs spéciales** : dose sous seuil de détection, dosimètre perdu (dose estimée/forfaitaire documentée), période manquante.
- **Corrections additives** tracées (pas de suppression silencieuse).
- **Notifications** automatiques en cas de franchissement de niveau.

---

### 4.5 — Surveillance d'ambiance & expositions par agent

Volet « Expositions » au-delà des rayonnements.

- **Mesures d'ambiance / poste** par agent : **bruit** (Lex,8h en dB(A), niveau crête), **poussières/silice** (mg/m³), **agents chimiques** (vs VLEP/VME-VLCT), **vibrations** (m/s²), **chaleur** (indices de contrainte thermique), **radon ambiant** (Bq/m³).
- Rattachement des mesures aux **zones** et **postes**, et estimation de l'**exposition individuelle** par appartenance zone/poste/temps de présence.
- Comparaison aux **valeurs limites d'exposition professionnelle** paramétrables.
- Historisation et cartographie (heat-map §7).

---

### 4.6 — Surveillance médicale & aptitude

Lien avec la santé au travail (réutiliser le module existant si présent — Q5).

- Suivi des **visites médicales** (embauche, périodiques, reprise, dose-déclenchées).
- **Aptitude** au poste exposé (apte / apte avec réserves / inapte) et échéances.
- **Déclenchement automatique** d'un examen lorsqu'un niveau d'action/limite est franchi.
- Confidentialité renforcée : seul le personnel médical autorisé accède au détail médical ; le HSE voit le **statut** (apte/échéance), pas le contenu clinique.

---

### 4.7 — Seuils, alertes & gestion des dépassements

- **Niveaux paramétrables** par grandeur : contrainte de dose, **niveau d'investigation**, **niveau d'action**, **limite réglementaire** (§6).
- **Alertes graduées** : approche de seuil (ex. 75 %/90 % d'une limite), franchissement d'un niveau d'investigation/d'action, dépassement de limite.
- **Procédure de dépassement** : ouverture d'un **dossier d'investigation** (cause, mesures correctives, décision médicale, déclaration éventuelle à l'autorité), workflow de clôture tracé.
- Notifications ciblées (PCR/RPO, médecine du travail, hiérarchie) selon le niveau.

---

### 4.8 — Rapports & conformité

- **Attestation/relevé individuel de dose** (certificat) par travailleur et période.
- **Rapports périodiques** : doses collectives, répartition par catégorie/zone, dépassements, ALARA.
- **Exports réglementaires** vers le registre national / l'autorité (format à confirmer Q17).
- **Bilans** annuels et exports vers le reporting BI existant.
- Tous les rapports portent l'horodatage, la source et la mention de confidentialité.

---

### 4.9 — Paramètres du module

- **Limites & niveaux** par grandeur et par catégorie de personne (travailleur, apprenti 16–18 ans, grossesse, public) — valeurs de référence pré-remplies (§6) **modifiables**.
- **Catégories** d'exposition (A/B) et critères de classement.
- **Agents d'exposition** et **unités** (référentiels).
- **Périodes** dosimétriques et calendrier des campagnes.
- **Service de dosimétrie** : paramètres d'import/API, mapping des champs.
- **Règles d'alerte & d'escalade**, destinataires.
- **Politique d'accès** (matrice RBAC du module) et durée de conservation.

---

## 5. FORMULAIRES — PRÉCIS, PROFESSIONNELS & RAFFINÉS

Exigence forte : des formulaires **rigoureux, ergonomiques et élégants**, avec validation en temps réel, libellés normalisés, unités explicites, aide contextuelle, et regroupement logique par sections (steppers sur mobile). Aucun champ ambigu.

**Principes de conception des formulaires :**
- Sections claires (accordéons / étapes), champs obligatoires signalés, **unités affichées** à côté de chaque valeur.
- **Validations** : plages plausibles, formats, cohérence inter-champs, blocage des valeurs aberrantes avec message explicite.
- **Listes maîtrisées** (référentiels) plutôt que saisie libre quand c'est possible.
- **Sauvegarde de brouillon**, reprise, et **piste d'audit** de la saisie.
- Mobile-first : cibles tactiles larges, clavier numérique pour les doses, mode hors-ligne pour la saisie terrain.

**Formulaires clés à livrer :**

1. **Fiche d'enregistrement du travailleur exposé** — Sections : Identité & emploi · Affectation/zones · Classement radioprotection (catégorie, motif, date, PCR) · Profil d'exposition (agents) · Habilitations/formations · Statut médical (échéance) · Statut particulier (grossesse, apprenti). Validations croisées (ex. catégorie A ⇒ surveillance médicale renforcée requise).

2. **Fiche d'attribution / restitution de dosimètre** — travailleur, dosimètre (scan QR), type, période, accusés de remise/retour, état du dispositif.

3. **Fiche de saisie de dose** — période, grandeurs (Hp(10), Hp(0,07), Hp(3), interne, radon), unité, source (service agréé / EPD / estimation), pièces justificatives, validation à double niveau si valeur élevée, calcul automatique des cumuls affiché en direct.

4. **Fiche de mesure d'ambiance / d'exposition par agent** — agent, zone, poste, méthode, valeur + unité, conditions, opérateur, comparaison automatique à la VLEP.

5. **Fiche de dépassement / investigation** — niveau franchi, circonstances, cause racine, mesures correctives, décision médicale, déclaration autorité, suivi et clôture.

6. **Déclaration de situation particulière** (grossesse, etc.) — bascule le travailleur en suivi renforcé avec limite dédiée.

---

## 6. LIMITES, NIVEAUX & BANDES D'EXPOSITION (PARAMÉTRABLES)

> Valeurs de **référence internationales** (CIPR 103 / AIEA GSR Part 3) **pré-remplies mais modifiables**. À **confirmer avec le cadre national** en Phase 0. Aucune valeur en dur.

**Limites de dose — travailleur (référence) :**
- **Dose efficace** : 20 mSv/an en moyenne sur 5 années consécutives, **sans dépasser 50 mSv** une année donnée (≤ 100 mSv sur 5 ans).
- **Cristallin** : 20 mSv/an (moyenne 5 ans, ≤ 50 mSv une année).
- **Peau** : 500 mSv/an (sur 1 cm²). **Extrémités (mains/pieds)** : 500 mSv/an.
- **Apprenti / étudiant 16–18 ans** : limites réduites (dose efficace 6 mSv/an, etc.).
- **Grossesse déclarée** : protection du fœtus (≈ 1 mSv pour la durée restante de la grossesse).
- **Public** (référence) : 1 mSv/an.

**Catégories de travailleurs (référence) :**
- **Catégorie A** : susceptible de recevoir > 6 mSv/an (ou > 3/10 d'une limite) → surveillance dosimétrique individuelle + médicale renforcée.
- **Catégorie B** : ≤ 6 mSv/an.

**Niveaux d'action paramétrables :** contrainte de dose < niveau d'investigation < niveau d'action < limite. Alertes d'approche configurables (ex. 75 % / 90 %).

**Bandes d'exposition (tableau de bord) — exemple paramétrable :**
- 🟢 Vert : faible (ex. < contrainte / plage Cat. B).
- 🟡 Jaune : à surveiller (approche niveau d'investigation).
- 🟠 Orange : élevé (niveau d'investigation / d'action atteint).
- 🔴 Rouge : critique (approche / dépassement de limite).

**Autres agents :** seuils selon VLEP/normes applicables (bruit Lex,8h, silice mg/m³, chimiques, vibrations, chaleur) — paramétrables.

---

## 7. INNOVATIONS RECOMMANDÉES (à valider en Phase 0)

1. **Projection de dose (forecasting)** : au rythme actuel, estimation de la dose annuelle/glissante et **alerte anticipée** de risque de dépassement.
2. **Passeport dosimétrique** : cumul vie professionnelle, portable, exportable lors d'un changement d'employeur.
3. **Cartographie d'exposition (heat-maps)** par zone et par agent (radioprotection, bruit, poussières).
4. **Intégration EPD temps réel / IoT** : remontée automatique des doses des dosimètres électroniques, alertes immédiates.
5. **Détection d'anomalies** : pic de dose, valeur incohérente, dosimètre non porté (sous-exposition suspecte).
6. **Indice d'exposition combinée** : agrégation multi-agents pour un score de risque par travailleur/poste.
7. **Reclassement automatique suggéré** (A↔B) selon l'historique de doses.
8. **Auto-planification de la surveillance médicale** déclenchée par la dose et les échéances.
9. **Suivi renforcé grossesse** automatique (limite dédiée, alerte au moindre incrément).
10. **QR-code dosimètres** : attribution/restitution par scan mobile.
11. **Optimisation ALARA** : suivi des actions de réduction et de leur effet mesuré.
12. **Génération automatique** des attestations individuelles et des exports réglementaires.
13. **Espace travailleur** : chaque employé consulte **sa propre** dosimétrie (transparence, sans voir celle des autres).
14. **Mode hors-ligne** pour la saisie de mesures d'ambiance sur le terrain, synchronisé au retour réseau.

---

## 8. MODÈLE DE DONNÉES (esquisse — à aligner avec l'existant)

> Réutiliser Employés / Départements / Zones / Postes. Ne créer que le nécessaire. Données dosimétriques **versionnées et append-only**.

- **ExposedWorker** : id, employee_id, category (A|B), classification_reason, classification_date, rpo_id, status, special_status (none|pregnancy|apprentice), timestamps.
- **ExposureProfile** : id, worker_id, agent_type, zone_id?, post_id?, frequency, conditions.
- **Dosimeter** : id, serial, type (TLD|OSL|film|EPD), qr_code, status, calibration_due?.
- **DosimeterAssignment** : id, dosimeter_id, worker_id, period_start, period_end, handover_ack, return_ack, device_condition.
- **DoseRecord** : id, worker_id, period, hp10, hp007, hp3, internal_dose, radon_exposure, total_effective, source (agency|epd|estimated), is_below_detection, attachments[], recorded_by, recorded_at, version.
- **DoseCumulative** (calculé/matérialisé) : worker_id, annual, rolling_5y, lifetime, updated_at.
- **AmbientMeasurement** : id, agent_type, zone_id, post_id?, value, unit, method, conditions, operator_id, measured_at, vlep_ref.
- **Threshold** : id, grandeur/agent, person_category, dose_constraint, investigation_level, action_level, limit, warn_percentages[].
- **ExposureAlert** : id, worker_id?, zone_id?, level, value, triggered_at, status.
- **OverexposureCase** : id, worker_id, level, cause, corrective_actions, medical_decision, authority_declaration?, status, timeline[].
- **MedicalSurveillance** : id, worker_id, type, fitness, exam_date, next_due, restricted_access (clinique).
- **Qualification** : id, worker_id, training, valid_from, valid_to.
- **AuditLog** (immuable, inclut consultations de doses nominatives).

---

## 9. EXIGENCES NON-FONCTIONNELLES

- **Exactitude & vérifiabilité** des calculs (tests unitaires sur cumuls, glissants 5 ans, conversions, arrondis) — non négociable.
- **Confidentialité** (données de santé) : chiffrement en transit et au repos, RBAC fin (dose nominative vs agrégée vs médicale).
- **Traçabilité** : journal d'audit immuable de toute création/modification/consultation de dose.
- **Conservation longue durée** des données (selon obligation légale, souvent plusieurs décennies) — à confirmer Q14.
- **Intégrité** : versionnement, corrections additives, pas d'effacement silencieux.
- **Fiabilité des imports** : contrôles de cohérence, idempotence, rejets tracés, reprise.
- **Performance** : tableau de bord et imports volumineux réactifs.
- **Disponibilité & sauvegarde** des données critiques.
- **Conformité** : alignement CIPR/AIEA et cadre national ; exports réglementaires fiables.

---

## 10. DESIGN SYSTEM & CHARTE

- **Réutiliser le thème de l'application existante** (récupéré en Phase 0).
- **Palette de base (Executive Navy)** : NAVY `#1E3A5F`, TEAL `#0891B2`, AMBER `#D97706`.
- **Échelle sémantique des bandes d'exposition** : VERT `#16A34A` (faible) → JAUNE `#CA8A04` (à surveiller) → ORANGE `#EA580C` (élevé) → ROUGE `#DC2626` (critique). Toujours doublée d'un libellé/icône (accessibilité, pas seulement la couleur).
- **Formulaires raffinés** : grille soignée, espacement cohérent, unités en suffixe, micro-aides, états de validation clairs, steppers sur mobile.
- **Tableau de bord** : data-visualisations sobres et lisibles (répartition par bande, tendances, jauges vs limites).
- **Mobile-first** : cibles ≥ 48px, clavier numérique pour les doses, fort contraste, états hors-ligne explicites.
- **Mention de confidentialité** visible sur les vues nominatives.

---

## 11. LIVRABLES & CRITÈRES D'ACCEPTATION

**Livrables :** ADR (Phase 0) · schéma de données + migrations · sous-modules UI mobile/web alignés au design system · moteur de calcul des doses testé · imports service de dosimétrie · moteur d'alertes/seuils · rapports & exports · documentation (RBAC, calculs, procédures de dépassement).

**Critères d'acceptation (extraits) :**
- [ ] Le **registre des travailleurs exposés** est précis, complet, filtrable et exportable selon droits.
- [ ] Chaque travailleur dispose d'une **fiche 360°** : doses, cumuls (annuel, glissant 5 ans, vie pro.), dosimètres, surveillance médicale, habilitations.
- [ ] Le **tableau de bord classe les employés par niveau d'exposition** (bandes colorées + libellés) et affiche la répartition A/B, dose collective, approches de seuil et dépassements.
- [ ] Les **cumuls et la moyenne glissante 5 ans** sont calculés correctement (couverts par tests).
- [ ] Les **limites, niveaux et bandes** sont **paramétrables** (aucune valeur en dur), pré-remplis aux références CIPR/AIEA.
- [ ] L'**import** des résultats du service de dosimétrie fonctionne avec contrôles de cohérence et rapprochement dosimètre↔travailleur.
- [ ] Les **alertes graduées** (approche / investigation / action / dépassement) se déclenchent et notifient les bons destinataires.
- [ ] Un **dossier de dépassement** peut être ouvert, instruit et clôturé, tracé.
- [ ] Les **formulaires** sont précis, validés en temps réel, raffinés, avec unités et aides.
- [ ] La **confidentialité** est respectée : RBAC fin, **journal d'audit** des consultations de doses, statut médical cloisonné.
- [ ] Le **suivi renforcé grossesse** applique une limite dédiée et des alertes spécifiques.
- [ ] Les **attestations individuelles** et **exports réglementaires** sont générés.
- [ ] **Zéro régression** sur l'existant à chaque phase.

---

## 12. MÉTHODOLOGIE D'EXÉCUTION

1. **Phase 0** — Audit & ADR (§2). *Stop, validation requise.*
2. **Phase 1** — Modèle de données + paramètres (limites/niveaux/agents) + RBAC fin.
3. **Phase 2** — Registre des travailleurs exposés + fiche 360° + formulaire d'enregistrement.
4. **Phase 3** — Dosimètres (inventaire, attribution/restitution, QR).
5. **Phase 4** — Saisie & suivi des doses : saisie manuelle, calculs/cumuls, import service de dosimétrie.
6. **Phase 5** — Seuils, alertes graduées, dossiers de dépassement.
7. **Phase 6** — Surveillance d'ambiance & expositions par agent + cartographie.
8. **Phase 7** — Surveillance médicale & aptitude (lien santé au travail).
9. **Phase 8** — Tableau de bord par niveau d'exposition & data-viz.
10. **Phase 9** — Rapports, attestations, exports réglementaires.
11. **Phase 10** — Innovations (forecasting, passeport dose, EPD temps réel, espace travailleur), mode hors-ligne, durcissement, tests.

> À chaque phase, tu appliques le **cycle de gouvernance qualité du §0bis** : cadrage → implémentation → audit par l'Application Quality Officer → note /10. **Tu ne passes à la phase suivante qu'avec une note ≥ 9/10** ; sinon tu corriges intelligemment les recommandations puis tu ré-audites. Chaque phase se clôt par une confirmation explicite **« zéro régression »**.

---

*Fin du prompt. Commence par la Phase 0 : pose les questions d'audit, n'écris aucun code avant validation.*
