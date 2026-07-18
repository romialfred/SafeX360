/**
 * Libellés et palette du module Non-conformités / Constats centraux.
 *
 * Centralise (charte R7) :
 *   - les libellés FR des statuts du cycle de vie (le backend stocke
 *     REPORTED / ANALYSIS / AC_IMPLEMENTATION / CLOSED / CANCELLED / REJECTED),
 *   - les couleurs Mantine et chips Tailwind associées,
 *   - les chips de sévérité et de priorité.
 *
 * Palette R7 : cyan = déclaré/planifié · amber = en analyse (en cours) ·
 * orange = en traitement · emerald = clôturé · slate = annulé · rose/rouge = rejeté.
 */

// ─── Statuts du cycle de vie ────────────────────────────────────────────────

export const NC_STATUS_LABELS: Record<string, string> = {
    REPORTED: 'Déclaré',
    ANALYSIS: 'Analyse',
    AC_IMPLEMENTATION: 'Traitement',
    CLOSED: 'Clôturé',
    CANCELLED: 'Annulé',
    REJECTED: 'Rejeté',
};

export const ncStatusLabel = (status?: string | null): string =>
    NC_STATUS_LABELS[String(status ?? '').toUpperCase()] ?? String(status ?? '—');

/** Couleurs Mantine (Badge). 'amber' est une couleur custom du thème SafeX. */
export const NC_STATUS_COLORS: Record<string, string> = {
    REPORTED: 'cyan',
    ANALYSIS: 'amber',
    AC_IMPLEMENTATION: 'orange',
    CLOSED: 'green',
    CANCELLED: 'gray',
    REJECTED: 'red',
};

export const ncStatusColor = (status?: string | null): string =>
    NC_STATUS_COLORS[String(status ?? '').toUpperCase()] ?? 'gray';

/** Chips Tailwind (cartes / tuiles). */
export const NC_STATUS_CHIPS: Record<string, string> = {
    REPORTED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    ANALYSIS: 'bg-amber-50 text-amber-700 border-amber-200',
    AC_IMPLEMENTATION: 'bg-orange-50 text-orange-700 border-orange-200',
    CLOSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const ncStatusChip = (status?: string | null): string =>
    NC_STATUS_CHIPS[String(status ?? '').toUpperCase()] ?? 'bg-slate-50 text-slate-700 border-slate-200';

/** Options FR pour les filtres / Select (valeurs backend conservées). */
export const NC_STATUS_OPTIONS = [
    { value: 'REPORTED', label: 'Déclaré' },
    { value: 'ANALYSIS', label: 'Analyse' },
    { value: 'AC_IMPLEMENTATION', label: 'Traitement' },
    { value: 'CLOSED', label: 'Clôturé' },
    { value: 'CANCELLED', label: 'Annulé' },
];

// ─── Priorités (stockées en FR : Urgente / Élevée / Normale / Faible) ──────

export const NC_PRIORITY_COLORS: Record<string, string> = {
    Urgente: 'red',
    Élevée: 'orange',
    Normale: 'yellow',
    Faible: 'green',
};

export const ncPriorityColor = (priority?: string | null): string =>
    NC_PRIORITY_COLORS[String(priority ?? '')] ?? 'gray';

/** Chips Tailwind statiques (les classes dynamiques `text-${x}-700` ne sont
 *  pas générées par Tailwind — utiliser ces classes complètes). */
export const NC_PRIORITY_CHIPS: Record<string, string> = {
    Urgente: 'bg-white text-red-700 border-red-200',
    Élevée: 'bg-white text-orange-700 border-orange-200',
    Normale: 'bg-white text-yellow-700 border-yellow-200',
    Faible: 'bg-white text-green-700 border-green-200',
};

export const ncPriorityChip = (priority?: string | null): string =>
    NC_PRIORITY_CHIPS[String(priority ?? '')] ?? 'bg-white text-slate-700 border-slate-200';

// ─── Sections conditionnelles de l'étape 1 (Déclaration) ────────────────────
//
// SOURCE DE VÉRITÉ UNIQUE de « quel bloc de champs s'applique à quel type ».
//
// POURQUOI CETTE SECTION EXISTE. Le prédicat vivait en TROIS exemplaires :
// le rendu (`DeclarationStep`) affichait le bloc non-conformité sur
// `type === 'NON_CONFORMITY'`, tandis que les validations de
// `NonConformityForm` ET de `NonConformityEdit` rendaient les mêmes champs
// obligatoires sur `type != 'NEAR_MISS'`. Les deux formulations coïncidaient
// tant qu'il n'existait que deux types — l'ajout d'un TROISIÈME type, HAZARD,
// les a fait diverger : ses quatre champs devenaient obligatoires sans être
// rendus nulle part. L'étape 1 était donc INFRANCHISSABLE pour toute
// déclaration de situation dangereuse, et comme les champs fautifs n'étaient
// pas à l'écran, aucune erreur inline ne pouvait s'afficher : l'utilisateur ne
// voyait qu'un « complétez tous les champs obligatoires » sans champ à
// compléter.
//
// La leçon n'est pas « il fallait écrire != autrement » mais « un prédicat
// dupliqué finit toujours par diverger ». Rendu et validation appellent
// désormais la MÊME fonction.

/** Le bloc « Spécifique non-conformité » (exigence, détection, gravité, action immédiate). */
export const hasNonConformityFields = (type?: string | null): boolean =>
    type === 'NON_CONFORMITY';

/** Le bloc « Spécifique quasi-accident » (type, facteurs, préventive, amélioration). */
export const hasNearMissFields = (type?: string | null): boolean =>
    type === 'NEAR_MISS';

// HAZARD (situation dangereuse) n'a AUCUN bloc spécifique : une situation
// dangereuse se déclare avec les seules informations générales. C'est
// délibéré — la règle métier du projet est qu'on verrouille la PLANIFICATION,
// jamais la DÉCLARATION : ajouter de la friction au signalement d'un danger
// produit de la sous-déclaration, c'est-à-dire l'inverse du but recherché.

/**
 * La carte « Leçons apprises » de l'étape de clôture.
 *
 * Rendue pour la non-conformité et le quasi-accident, PAS pour la situation
 * dangereuse. Le prédicat est exposé ici pour la même raison que les deux
 * précédents : `ClosureStep` le testait à la main tandis que la validation
 * d'édition exigeait `lessonLearned` SANS aucune garde de type — clôturer un
 * HAZARD était donc impossible, la carte n'étant pas montée.
 */
export const hasLessonsLearnedSection = (type?: string | null): boolean =>
    type === 'NON_CONFORMITY' || type === 'NEAR_MISS';
