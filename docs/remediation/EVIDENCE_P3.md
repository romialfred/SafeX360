# Preuves de remédiation — priorité P3

## AUD-PERF-001 — Performance terrain

- Le précache PWA est limité à `index.html` (plafond 512 Kio) au lieu de précharger tous les JS, CSS, polices et images.
- Les scripts, styles, polices et images réellement consultés restent mis en cache progressivement par le service worker.
- Les 154 pages auparavant importées statiquement par le routeur sont chargées à la demande derrière un fallback `Suspense` commun.
- Tests de politique PWA/routeur : 3 scénarios réussis, complétés par les 2 contrôles de non-cache API.
- Build de production mesuré le 19 juillet 2026 : 8 915 modules, chunk principal 1 097,70 Kio minifié / 324,55 Kio gzip, contre 4 752,95 Kio minifiés lors de l'audit.
- Graphe JavaScript initial : 1 665 591 octets sur 4 fichiers ; CSS initial : 536 872 octets ; plus grand chunk : 1 097 695 octets.
- Précache : 2 fichiers et 4 908 octets (sortie Workbox 2,76 Kio), contre 34 352,81 Kio lors de l'audit.
- Une garde CI lit le manifeste Vite et refuse les dépassements : JS initial 2 Mio, CSS initial 1 Mio, chunk 1,5 Mio, précache 512 Kio.

Statut : en validation locale. Les essais sur Android bas de gamme et réseau réellement contraint restent une validation matérielle externe.

## AUD-DES-001 — Design system

- Le thème versionné contient les palettes sémantiques HSE, les statuts d'incident, l'échelle typographique, les espacements et les composants Mantine communs.
- Une baseline mesurable gèle désormais les couleurs hexadécimales, styles inline, valeurs pixel, `max-w-*` et `transition-all` ; toute augmentation échoue.
- Baseline initiale : 1 494 couleurs, 1 451 styles inline, 5 602 valeurs pixel, 288 utilitaires de largeur maximale et 153 `transition-all`.
- Tests de politique design : 2 scénarios réussis.

Statut : en traitement. La réduction progressive de la dette existante continue sans refonte globale.

## AUD-UX-003 — Langue et encodage

- Les libellés génériques anglais détectés dans les écrans historiques ont été remplacés par des libellés français factuels.
- Un contrôle parcourt toutes les sources UI et refuse les signatures usuelles de mojibake ainsi que le caractère Unicode de remplacement.
- Tests de langue/encodage : 2 scénarios réussis.

Statut : en validation.

## AUD-DATA-001 — Données visibles

- Le classement fictif « Top Projects » et ses identités génériques ne sont plus présentés comme des résultats : l'interface affiche un état vide tant que source, périmètre, période et responsable ne sont pas validés.
- Les identités restantes de démonstration sont explicitement libellées comme fictives.
- Tests de politique des données visibles : 2 scénarios réussis.
- Les quatre anciens scripts dosimétriques DEV/QA/DEMO ont été retirés des ressources principales et placés sous `src/test/resources/db/fixtures/dosimetry/legacy` : ils ne sont plus embarqués dans l'artefact de production.
- Une fixture canonique `DATASET_SAFEX_DOSIMETRY_V1` utilise une date fixe, une mine et des identités synthétiques réservées, des valeurs explicites et une insertion idempotente, sans aléa ni date courante.
- Trois tests backend bloquent le retour de seeds demo/test dans les migrations de production, contrôlent la provenance/déterminisme et la quarantaine des quatre scripts historiques.

Statut : en validation locale. Toute base existante ayant reçu un ancien script doit faire l'objet d'un inventaire et d'une purge approuvée avant usage réel.
