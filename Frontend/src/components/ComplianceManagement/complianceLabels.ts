/**
 * Libellés et conventions du module Conformité Réglementaire (LOT 49).
 *
 * Le backend conserve des codes historiques en anglais (catégories, fréquences,
 * statuts de documents, libellés du tableau de bord). Toute la traduction et
 * la palette de statuts (charte R7) sont centralisées ici : un seul endroit
 * à maintenir pour l'ensemble des pages du module.
 */

// ─── Référentiels exigences ────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, string> = {
    Medical: 'Médical',
    Legal: 'Légal',
    Training: 'Formation',
    Regulatory: 'Réglementaire',
    Safety: 'Sécurité',
    Other: 'Autre',
};

/** Couleurs Mantine par catégorie (badges). */
export const CATEGORY_COLORS: Record<string, string> = {
    Medical: 'cyan',
    Legal: 'indigo',
    Training: 'blue',
    Regulatory: 'violet',
    Safety: 'teal',
    Other: 'gray',
};

export const FREQUENCY_LABELS: Record<string, string> = {
    Monthly: 'Mensuel',
    Quarterly: 'Trimestriel',
    'Semi-Annually': 'Semestriel',
    Annually: 'Annuel',
    Biennially: 'Biennal',
    'On Demand': 'À la demande',
};

export const DOCTYPE_LABELS: Record<string, string> = {
    PDF: 'PDF',
    Image: 'Image',
    Scan: 'Scan',
    Certificate: 'Certificat',
    Other: 'Autre',
};

/** Options prêtes pour <Select> : valeur = code backend, libellé = FR. */
export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
export const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }));
export const DOCTYPE_OPTIONS = Object.entries(DOCTYPE_LABELS).map(([value, label]) => ({ value, label }));

// ─── Criticité (nouveau champ LOT 49) ──────────────────────────────────────

export interface CriticalityConfig {
    label: string;
    /** Classes Tailwind pour les sceaux / chips custom. */
    chip: string;
    description: string;
}

export const CRITICALITY_CONFIG: Record<string, CriticalityConfig> = {
    CRITIQUE: {
        label: 'Critique',
        chip: 'bg-rose-50 text-rose-700 border-rose-200',
        description: 'Bloquant pour le poste : sans justificatif valide, le salarié ne doit pas être affecté.',
    },
    MAJEURE: {
        label: 'Majeure',
        chip: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Écart majeur : régularisation prioritaire sous 30 jours.',
    },
    STANDARD: {
        label: 'Standard',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
        description: 'Suivi normal dans le cycle de renouvellement.',
    },
};

export const CRITICALITY_OPTIONS = Object.entries(CRITICALITY_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

// ─── Statuts de conformité (tableau de bord) — palette charte R7 ───────────

export type ComplianceBucket = 'compliant' | 'upcoming' | 'expired' | 'missing' | 'pending';

export const BUCKET_CONFIG: Record<ComplianceBucket, { label: string; hex: string }> = {
    compliant: { label: 'Conformes', hex: '#059669' },          // emerald
    upcoming: { label: 'Échéances proches', hex: '#D97706' },   // amber
    expired: { label: 'Expirés', hex: '#E11D48' },              // rose
    missing: { label: 'Manquants', hex: '#64748B' },            // slate
    pending: { label: 'En attente', hex: '#7C3AED' },           // violet
};

/** Convertit un statut renvoyé par le backend (anglais) en bucket interne. */
export const bucketFromBackendStatus = (status: string): ComplianceBucket => {
    const s = (status || '').toLowerCase();
    if (s.startsWith('compliant')) return 'compliant';
    if (s.startsWith('upcoming')) return 'upcoming';
    if (s.startsWith('expired')) return 'expired';
    if (s.startsWith('pending')) return 'pending';
    return 'missing';
};

/** Libellés FR des onglets "Actions requises" (codes backend). */
export const ACTION_TAB_LABELS: Record<string, string> = {
    expired: 'Expirés',
    upcoming: 'Échéances proches',
    missing: 'Manquants',
    pending: 'En attente',
};

// ─── Statuts des documents de conformité ───────────────────────────────────

// Canon : REJECTED (le backend stocke INVALID, normalisé côté client).
// Expiré = rose partout (charte R7) ; amber est réservé aux échéances proches.
export const DOC_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    VALID: { label: 'Validé', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PENDING: { label: 'En attente', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    INVALID: { label: 'Rejeté', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    REJECTED: { label: 'Rejeté', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    EXPIRED: { label: 'Expiré', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const docStatusConfig = (status?: string | null) =>
    DOC_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

// ─── Statut de conformité agrégé d'un employé (backend : Compliance /
// Non-Compliance / Uploaded) ───────────────────────────────────────────────

export const EMP_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    COMPLIANCE: { label: 'Conforme', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'NON-COMPLIANCE': { label: 'Non conforme', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    UPLOADED: { label: 'En attente de validation', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
};

export const empStatusConfig = (status?: string | null) =>
    EMP_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

// ─── Traductions des détails de statut générés par le backend ──────────────

/**
 * Le backend produit des phrases d'état en anglais ("Expired 12 days ago",
 * "Expires in 5 days"...). On les convertit en français lisible.
 */
export const translateStatusDetail = (detail?: string | null): string => {
    if (!detail) return '';
    const d = detail.trim();
    const jours = (n: string) => `${n} jour${Number(n) > 1 ? 's' : ''}`;
    if (d === 'Expired') return 'Expiré';
    if (d === 'Expired < 30 Days') return 'Expiré depuis moins de 30 jours';
    let m = d.match(/^Expired (\d+) days ago$/);
    if (m) return `Expiré depuis ${jours(m[1])}`;
    if (d === 'Expires today') return "Expire aujourd'hui";
    if (d === 'Expires soon') return 'Expire bientôt';
    m = d.match(/^Expires in (\d+) days$/);
    if (m) return `Expire dans ${jours(m[1])}`;
    if (d === 'Document missing') return 'Document manquant';
    if (d === 'Pending review') return 'En attente de validation';
    if (d === 'Compliant') return 'Conforme';
    return d;
};

// ─── Formatage ─────────────────────────────────────────────────────────────

/**
 * Sérialise une Date en 'yyyy-MM-dd' en fuseau LOCAL (jamais UTC) : évite le
 * recul d'un jour quand axios convertit minuit local en ISO UTC pour un
 * LocalDate backend.
 */
export const toIsoDateLocal = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const formatDateFr = (value?: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Libellé FR d'une catégorie / fréquence / type doc, avec repli sur le code brut. */
export const categoryLabel = (code?: string | null) => (code ? CATEGORY_LABELS[code] ?? code : '—');
export const frequencyLabel = (code?: string | null) => (code ? FREQUENCY_LABELS[code] ?? code : '—');
export const docTypeLabel = (code?: string | null) => (code ? DOCTYPE_LABELS[code] ?? code : '—');
