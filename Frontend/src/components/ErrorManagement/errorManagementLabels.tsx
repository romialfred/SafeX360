/**
 * errorManagementLabels — Libellés institutionnels FR + helpers de présentation
 * du module « Gestion des Erreurs ». Centralise la traduction des enums backend
 * et la charte couleur (accent signature NAVY #1E3A5F, teal #0891B2, ambre #D97706).
 *
 * Convention : aucune chaîne ENUM brute ne doit apparaître à l'écran ; on passe
 * toujours par ces tables de correspondance (repli sobre si valeur inconnue).
 */

import type {
    CausalMethod,
    CauseLevel,
    CriticalityLevel,
    ErrorEventStatus,
    ErrorNature,
    ErrorSourceModule,
    JustCultureOutcome,
    ViolationSubtype,
} from '../../services/ErrorManagementService';

// ─────────────────────────────────────────────────────────────────────────
//  Charte couleur signature
// ─────────────────────────────────────────────────────────────────────────

export const NAVY = '#1E3A5F';
export const NAVY_DEEP = '#15293F';
export const TEAL = '#0891B2';
export const AMBER = '#D97706';

// ─────────────────────────────────────────────────────────────────────────
//  Statuts du cycle de vie
// ─────────────────────────────────────────────────────────────────────────

/** Ordre canonique du workflow (REOPENED traité à part — régression contrôlée). */
export const STATUS_FLOW: ErrorEventStatus[] = [
    'DECLARED',
    'TRIAGED',
    'ANALYZING',
    'ACTION_PLAN',
    'IMPLEMENTING',
    'VERIFYING',
    'CLOSED',
    'CAPITALIZED',
];

export const STATUS_LABELS: Record<ErrorEventStatus, string> = {
    DECLARED: 'Déclaré',
    TRIAGED: 'Trié',
    ANALYZING: 'En analyse',
    ACTION_PLAN: "Plan d'action",
    IMPLEMENTING: 'En traitement',
    VERIFYING: 'Vérification',
    CLOSED: 'Clôturé',
    CAPITALIZED: 'Capitalisé',
    REOPENED: 'Réouvert',
};

export const STATUS_DESCRIPTIONS: Record<ErrorEventStatus, string> = {
    DECLARED: "L'événement vient d'être signalé et attend une prise en charge.",
    TRIAGED: 'Tri réalisé : gravité, potentiel et pertinence confirmés.',
    ANALYZING: 'Analyse causale en cours (taxonomie + méthode RCA).',
    ACTION_PLAN: 'Plan de mesures correctives en cours de définition.',
    IMPLEMENTING: 'Mesures correctives en cours de mise en œuvre.',
    VERIFYING: "Vérification de l'efficacité des mesures engagées.",
    CLOSED: "Traitement clôturé : les mesures sont jugées efficaces.",
    CAPITALIZED: 'Retour d\'expérience diffusé et leçons capitalisées.',
    REOPENED: 'Dossier réouvert pour reprise du traitement.',
};

export interface ChipTone {
    bg: string;
    border: string;
    text: string;
    dot: string;
}

export const STATUS_TONE: Record<ErrorEventStatus, ChipTone> = {
    DECLARED: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' },
    TRIAGED: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', dot: 'bg-sky-600' },
    ANALYZING: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', dot: 'bg-indigo-600' },
    ACTION_PLAN: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', dot: 'bg-cyan-600' },
    IMPLEMENTING: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', dot: 'bg-amber-600' },
    VERIFYING: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', dot: 'bg-violet-600' },
    CLOSED: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-600' },
    CAPITALIZED: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', dot: 'bg-teal-600' },
    REOPENED: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', dot: 'bg-orange-600' },
};

// ─────────────────────────────────────────────────────────────────────────
//  Criticité
// ─────────────────────────────────────────────────────────────────────────

export const CRITICALITY_LABELS: Record<CriticalityLevel, string> = {
    LOW: 'Faible',
    MEDIUM: 'Modérée',
    HIGH: 'Élevée',
    CRITICAL: 'Critique',
};

export const CRITICALITY_TONE: Record<CriticalityLevel, ChipTone> = {
    LOW: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    HIGH: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
    CRITICAL: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
};

// ─────────────────────────────────────────────────────────────────────────
//  Module source
// ─────────────────────────────────────────────────────────────────────────

export const SOURCE_MODULE_LABELS: Record<ErrorSourceModule, string> = {
    MANUAL: 'Déclaration manuelle',
    EMERGENCY: 'Gestion des urgences',
    BLAST: 'Dynamitages',
    DOSIMETRY: 'Dosimétrie',
};

// ─────────────────────────────────────────────────────────────────────────
//  Taxonomie de Reason (nature de l'erreur)
// ─────────────────────────────────────────────────────────────────────────

export const ERROR_NATURE_LABELS: Record<ErrorNature, string> = {
    SLIP_LAPSE: 'Raté / lapsus',
    MISTAKE: 'Erreur (règle / connaissance)',
    VIOLATION: 'Transgression',
};

export const ERROR_NATURE_HELP: Record<ErrorNature, string> = {
    SLIP_LAPSE:
        "Défaillance d'exécution involontaire (geste automatique manqué, oubli ponctuel). L'intention était correcte.",
    MISTAKE:
        "Défaillance de planification : mauvaise règle appliquée ou connaissance insuffisante. L'action exécutée correspond à une intention erronée.",
    VIOLATION:
        "Écart délibéré par rapport à une règle ou une procédure connue. À distinguer de l'erreur : la transgression est intentionnelle.",
};

export const VIOLATION_SUBTYPE_LABELS: Record<ViolationSubtype, string> = {
    ROUTINE: 'Routinière',
    EXCEPTIONAL: 'Exceptionnelle',
};

export const VIOLATION_SUBTYPE_HELP: Record<ViolationSubtype, string> = {
    ROUTINE: 'Écart devenu habituel, souvent toléré par le collectif (« on a toujours fait comme ça »).',
    EXCEPTIONAL: 'Écart ponctuel, lié à une situation particulière ou une pression du moment.',
};

// ─────────────────────────────────────────────────────────────────────────
//  Méthodes d'analyse causale (RCA)
// ─────────────────────────────────────────────────────────────────────────

export const CAUSAL_METHOD_LABELS: Record<CausalMethod, string> = {
    FIVE_WHYS: '5 Pourquoi',
    ISHIKAWA: 'Ishikawa (6M)',
    CAUSE_TREE: 'Arbre des causes',
    ICAM: 'ICAM',
};

export const CAUSAL_METHOD_HELP: Record<CausalMethod, string> = {
    FIVE_WHYS: "Chaîne de « pourquoi » successifs pour remonter d'un effet à sa cause racine.",
    ISHIKAWA: 'Diagramme en arêtes de poisson : causes regroupées par familles (les 6M).',
    CAUSE_TREE: 'Arborescence des faits et des causes, de l\'immédiat au systémique.',
    ICAM: 'Incident Cause Analysis Method : facteurs absents/défaillants, conditions, actions, défenses.',
};

// ─────────────────────────────────────────────────────────────────────────
//  Niveaux de cause
// ─────────────────────────────────────────────────────────────────────────

export const CAUSE_LEVEL_LABELS: Record<CauseLevel, string> = {
    IMMEDIATE: 'Immédiate',
    ROOT: 'Profonde (racine)',
    SYSTEMIC: 'Systémique',
};

export const CAUSE_LEVEL_TONE: Record<CauseLevel, ChipTone> = {
    IMMEDIATE: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
    ROOT: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', dot: 'bg-orange-500' },
    SYSTEMIC: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', dot: 'bg-rose-500' },
};

export const CAUSE_LEVEL_ORDER: CauseLevel[] = ['IMMEDIATE', 'ROOT', 'SYSTEMIC'];

/** Familles 6M d'Ishikawa (catégories proposées pour la méthode ISHIKAWA). */
export const ISHIKAWA_6M: string[] = [
    'Main-d’œuvre',
    'Matériel',
    'Méthode',
    'Milieu',
    'Matière',
    'Management',
];

// ─────────────────────────────────────────────────────────────────────────
//  Culture juste (Just Culture)
// ─────────────────────────────────────────────────────────────────────────

export const JUST_CULTURE_LABELS: Record<JustCultureOutcome, string> = {
    HONEST_ERROR: 'Erreur honnête',
    AT_RISK: 'Comportement à risque',
    RECKLESS: 'Imprudence / témérité',
};

export const JUST_CULTURE_HELP: Record<JustCultureOutcome, string> = {
    HONEST_ERROR:
        "Erreur involontaire d'une personne agissant de bonne foi. Réponse attendue : consoler, soutenir, corriger le système.",
    AT_RISK:
        "Choix qui augmente le risque sans conscience claire du danger (dérive de la norme). Réponse attendue : coacher, ré-aligner.",
    RECKLESS:
        "Mépris conscient et injustifiable d'un risque substantiel. Seul ce cas peut relever d'une dimension disciplinaire.",
};

export const JUST_CULTURE_TONE: Record<JustCultureOutcome, ChipTone> = {
    HONEST_ERROR: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-600' },
    AT_RISK: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', dot: 'bg-amber-600' },
    RECKLESS: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', dot: 'bg-red-600' },
};

// ─────────────────────────────────────────────────────────────────────────
//  Helpers d'affichage
// ─────────────────────────────────────────────────────────────────────────

export const statusLabel = (s?: ErrorEventStatus | null): string =>
    s ? STATUS_LABELS[s] ?? s : 'n/d';

export const criticalityLabel = (c?: CriticalityLevel | null): string =>
    c ? CRITICALITY_LABELS[c] ?? c : 'n/d';

/** Formate une chaîne ISO LocalDateTime en date+heure FR lisible. */
export const formatDateTime = (iso?: string | null): string => {
    if (!iso) return 'Non renseigné';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/** Formate une chaîne ISO en date FR (sans l'heure). */
export const formatDay = (iso?: string | null): string => {
    if (!iso) return 'Non renseigné';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};
