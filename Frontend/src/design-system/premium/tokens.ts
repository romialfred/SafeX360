/**
 * Design System Premium — Design Tokens
 *
 * Extrait des patterns du module Non-conformité (qui reste intouchable).
 * Centralise les couleurs sémantiques pour cohérence entre tous les modules
 * refondus (Audits, Incidents, Investigations, EPI, Risques, etc.).
 *
 * Référence : src/components/LeadingIndicator/Non-conformity/NonConformityDashboard.tsx
 */

// ─────────────────────────────────────────────────────────────────────────
//  Couleurs sémantiques par dimension métier
// ─────────────────────────────────────────────────────────────────────────

/**
 * Couleurs par niveau de sévérité (incidents, NC, risques).
 * Aligné sur l'échelle 5 niveaux de Non-conformité.
 */
export const SEVERITY_COLORS = {
    Insignifiante: 'green',
    Mineure: 'lime',
    Modérée: 'yellow',
    Majeure: 'orange',
    Catastrophique: 'red',
} as const;

export type SeverityLevel = keyof typeof SEVERITY_COLORS;

/**
 * Couleurs par priorité de traitement.
 */
export const PRIORITY_COLORS = {
    Faible: 'green',
    Normale: 'yellow',
    Élevée: 'orange',
    Urgente: 'red',
} as const;

export type PriorityLevel = keyof typeof PRIORITY_COLORS;

/**
 * Couleurs par statut workflow.
 * REPORTED → ANALYSIS → AC_IMPLEMENTATION → CLOSED (heureux)
 * Variantes : REJECTED, CANCELLED.
 */
export const STATUS_COLORS = {
    REPORTED: 'blue',
    ANALYSIS: 'yellow',
    AC_IMPLEMENTATION: 'orange',
    PENDING_VALIDATION: 'cyan',
    CLOSED: 'green',
    REJECTED: 'red',
    CANCELLED: 'gray',
} as const;

export type StatusValue = keyof typeof STATUS_COLORS;

// ─────────────────────────────────────────────────────────────────────────
//  Gradients des KPI Tiles (5 emplacements cycliques)
//  Source: NonConformityDashboard.tsx ligne 236-242
// ─────────────────────────────────────────────────────────────────────────

export const KPI_GRADIENTS = [
    'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', // blue
    'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', // orange
    'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)', // amber
    'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', // emerald
    'linear-gradient(135deg, #ede9fe 0%, #e0f2fe 100%)', // indigo
] as const;

export const KPI_ICON_BG = [
    'bg-blue-100/80 group-hover:bg-blue-200/90',
    'bg-orange-100/80 group-hover:bg-orange-200/90',
    'bg-amber-100/80 group-hover:bg-amber-200/90',
    'bg-emerald-100/80 group-hover:bg-emerald-200/90',
    'bg-indigo-100/80 group-hover:bg-indigo-200/90',
] as const;

export const KPI_ICON_COLOR = [
    'text-slate-600',
    'text-amber-600',
    'text-blue-600',
    'text-emerald-600',
    'text-indigo-600',
] as const;

// ─────────────────────────────────────────────────────────────────────────
//  Helpers de résolution
// ─────────────────────────────────────────────────────────────────────────

/** Couleur Mantine pour une sévérité. */
export function getSeverityColor(severity?: string | null): string {
    if (!severity) return 'gray';
    return SEVERITY_COLORS[severity as SeverityLevel] ?? 'gray';
}

/** Couleur Mantine pour une priorité. */
export function getPriorityColor(priority?: string | null): string {
    if (!priority) return 'gray';
    return PRIORITY_COLORS[priority as PriorityLevel] ?? 'gray';
}

/** Couleur Mantine pour un statut workflow. */
export function getStatusColor(status?: string | null): string {
    if (!status) return 'gray';
    return STATUS_COLORS[status as StatusValue] ?? 'gray';
}

/** Cycle modulo sur les 5 gradients KPI. */
export function getKpiGradient(index: number): string {
    return KPI_GRADIENTS[index % KPI_GRADIENTS.length];
}

export function getKpiIconBg(index: number): string {
    return KPI_ICON_BG[index % KPI_ICON_BG.length];
}

export function getKpiIconColor(index: number): string {
    return KPI_ICON_COLOR[index % KPI_ICON_COLOR.length];
}

// ─────────────────────────────────────────────────────────────────────────
//  ISO References — pour les sous-titres des PageHeader des modules
// ─────────────────────────────────────────────────────────────────────────

export const ISO_REFS = {
    NC: 'ISO 9001 §10.2 — Non-conformité et action corrective',
    NEAR_MISS: 'ISO 45001 §10.2 — Incidents et non-conformités',
    AUDIT: 'ISO 19011 — Audits des systèmes de management',
    INCIDENT: 'ISO 45001 §10.2 — Incidents',
    INVESTIGATION: 'ISO 45001 §10.2 — Investigation des incidents',
    CAPA: 'ISO 9001 §10.2 — Action corrective et préventive',
    EPI: 'ISO 45001 §8.1.2 — EPI et équipements de protection',
    RISK: 'ISO 31000 / ISO 45001 §6.1 — Maîtrise des risques',
    ENV: 'ISO 14001 — Système de management environnemental',
    TRAINING: 'ISO 45001 §7.2-7.3 — Compétence et formation',
    DOC: 'ISO 9001 §7.5 — Informations documentées',
} as const;
