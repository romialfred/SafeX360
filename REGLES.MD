# REGLES — Charte de conception SafeX 360

**À lire AVANT toute modification, implémentation, refonte ou ajout de page.**
Ce fichier est la référence ultime. En cas de conflit avec une décision ponctuelle, ces règles l'emportent. Toute exception doit être justifiée par écrit.

---

## R1 — Largeur d'affichage : la page utilise TOUTE la largeur disponible

**Interdit** : `max-w-2xl`, `max-w-3xl`, `max-w-4xl`, `max-w-5xl` sur le **conteneur racine** d'une page de gestion / registre / dashboard / détail.

**Obligatoire** : `w-full` (avec padding latéral cohérent `px-4 sm:px-5 lg:px-6`).

**Pourquoi** : sur un écran 1920px, un `max-w-4xl` (~896px) laisse 1000px de vide gris à droite et à gauche. Le contenu est étouffé au centre. C'est ridicule. Une plateforme HSE professionnelle doit exploiter l'écran.

**Exception unique** : les formulaires de saisie séquentielle (Multi-step Form) peuvent garder un cadre interne `max-w-3xl mx-auto`, MAIS la page elle-même reste `w-full`. Le formulaire s'inscrit dans une carte centrée, le reste de l'écran respire.

**Exception mobile** : les pages d'exécution terrain (saisie tactile mobile) peuvent garder `max-w-2xl mx-auto` car le contenu est conçu pour une colonne unique. Mais quand on les ouvre sur desktop, elles doivent paraître **équilibrées dans le viewport**, pas perdues.

---

## R2 — Titres, sous-titres, libellés : raffinés, humanisés, sans automatisme

**Interdit** :
- Phrases marketing creuses ("Une expérience unique !")
- Points d'exclamation
- Emojis dans les titres
- Jargon technique nu ("CRUD inspection entity")
- Verbes auto-référentiels ("Le système traite la donnée...")
- Formules génériques ("Bienvenue sur la plateforme")
- Listes mécaniques de fonctionnalités

**Obligatoire** :
- **Phrases courtes** qui décrivent ce que la personne va faire ou voir
- **Vocabulaire métier HSE** (inspection, constat, conformité, plan d'action) en français correct
- **Ton sobre et factuel**, type rapport d'expert HSE
- **Une seule idée par sous-titre**, pas d'accumulation

**Exemples corrects** :
- ✅ "Suivi des tirs et de la chaîne d'annonce"
- ✅ "Planifier une inspection"
- ✅ "Décisions de l'équipe"
- ✅ "Camion en bon état général. Apte au service."

**Exemples interdits** :
- ❌ "Bienvenue dans le module Inspections, ici vous pouvez gérer..."
- ❌ "Tableau de bord intelligent pour piloter vos opérations ✨"
- ❌ "Plateforme tout-en-un de gestion HSE"
- ❌ "Cliquez pour créer votre première inspection !"

---

## R3 — Textes de test et données seed : humanisés

**Interdit** :
- `"Test E2E"` comme valeur de note dans une vraie démo
- `"Camion 1"`, `"Employé 2"` comme noms d'exemple
- `"Lorem ipsum"` partout
- `"value": "abc"` pour les saisies de test

**Obligatoire** :
- Noms réels : `"Camion Volvo A40G #18"`, `"Foreuse Atlas Copco DM45"`, `"K. Ouédraogo"`
- Phrases métier : `"Apte au service après vérification complète des 13 points"`, `"Pneu avant gauche présente une usure sur la bande de roulement, à remplacer sous 7 jours"`
- Mesures plausibles : pression huile 4.2 bar (pas 100), température 65°C (pas 999)
- Vraies localisations : `"Atelier maintenance Nord"`, `"Magasin explosifs Site B"`

---

## R4 — Densité visuelle : compacte mais pas oppressante

- Padding intérieur de carte : `p-3` ou `p-4` selon contexte, pas `p-8`
- Hauteur de header de page : compact, max 3 lignes de contenu
- Espacement entre sections : `mb-3` ou `mb-4`, pas `mb-12`
- Boutons tactiles mobile : `min-h-56px` impératif
- Boutons desktop : `py-1.5` à `py-2` suffit
- Typographie : Source Serif 4 pour les titres principaux uniquement, sans-serif pour le reste

---

## R5 — Pas d'animation automatique sans usage métier

**Interdit** :
- Pulse continu d'arrière-plan
- Scintillements décoratifs
- Hover-scale sur boutons d'action (provoque tremblement de layout)
- Transitions sur toutes les propriétés (`transition-all`)

**Obligatoire** :
- Animations uniquement quand elles signalent une information : alerte SOS, état critique, chargement
- Transitions ciblées : `transition-[filter,box-shadow,background-color]` plutôt que `transition-all`
- Filters (drop-shadow, brightness) pour les effets — pas de transforms qui déplacent le layout

---

## R6 — Conformité ISO sur les modules HSE

Tout module de domaine HSE (Inspections, Dosimétrie, Dynamitages, Urgences) doit référencer l'article ISO applicable dans :
- Le rapport PDF généré (pied de page)
- La documentation interne du module
- Les commentaires d'audit dans les services

Normes prioritaires :
- **ISO 45001** : santé et sécurité au travail
- **ISO 14001** : management environnemental
- **ISO 22301** : continuité d'activité
- **AIEA GSR Part 3** : protection radiologique (Dosimétrie)

---

## R7 — Cohérence multi-module

- Même structure de breadcrumb sur toutes les pages (`UPPERCASE › Section`)
- Même typographie de titre (Source Serif 4, clamp 17-22px)
- Même palette de statuts (cyan=planifié, amber=en cours, violet=en attente, emerald=approuvé, slate=archivé, rose=rejeté/erreur)
- Même pattern de KPI tile (icône colorée + valeur tabulaire + label uppercase + sublabel)
- Même footer fixe sur les pages d'action (bouton primaire à droite)

---

## R8 — Validation avant push

Avant chaque commit/push :
1. Vérifier que les pages utilisent toute la largeur (`w-full`, pas `max-w-Xxl`)
2. Relire les libellés à voix haute — s'ils sonnent marketing ou robotiques, les réécrire
3. Vérifier les textes seed (pas de "test", "lorem", "abc")
4. Tester en mode responsive DevTools (375px et 1920px)
5. Vérifier qu'aucune animation ne tremble en idle

---

## R9 — Ne JAMAIS demander d'autorisation pour appliquer ces règles

Si je détecte un écart à ces règles dans le code existant ou dans une modification en cours, je le corrige **dans le commit en cours**, sans demander. Ces règles sont la baseline non négociable.

---

*Document de référence — SafeX 360 — Charte conception.*
*Toute modification de ce fichier doit être validée par le propriétaire du projet.*
