/**
 * REGISTRES RÉGLEMENTAIRES PAR MINE — libellés, options et styles sémantiques.
 *
 * Source unique côté front pour les 4 registres mine (licences & permis,
 * autorisations de travaux, inspections d'équipements, obligations & code minier).
 * Mirroir de `ppeLabels.ts` : chips, options de Select, formateurs. Le statut de
 * conformité est CALCULÉ CÔTÉ SERVEUR (champ `conformity`) — ici on ne fait que
 * l'habiller.
 */

// ─── Conformité (calculée serveur : RegulatoryConformity) ────────────────────
export type Conformity = 'CONFORME' | 'A_RENOUVELER' | 'EXPIRE' | 'A_EVALUER' | 'SUSPENDU';

export interface ConfCfg {
    label: string;
    /** Classes Tailwind du chip (bg/text/border). */
    chip: string;
    /** Couleur pleine (barres, pastilles, anneaux). */
    dot: string;
}

export const CONFORMITY_CONFIG: Record<Conformity, ConfCfg> = {
    CONFORME:      { label: 'Conforme',      chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#10b981' },
    A_RENOUVELER:  { label: 'À renouveler',  chip: 'bg-amber-50 text-amber-700 border-amber-200',       dot: '#f59e0b' },
    EXPIRE:        { label: 'Expiré',        chip: 'bg-rose-50 text-rose-700 border-rose-200',           dot: '#f43f5e' },
    A_EVALUER:     { label: 'À évaluer',     chip: 'bg-slate-50 text-slate-600 border-slate-200',        dot: '#94a3b8' },
    SUSPENDU:      { label: 'Suspendu',      chip: 'bg-slate-100 text-slate-500 border-slate-300',       dot: '#64748b' },
};

export const conformityConfig = (c?: string | null): ConfCfg =>
    CONFORMITY_CONFIG[(c as Conformity)] ?? CONFORMITY_CONFIG.A_EVALUER;

/** Base commune d'un chip (identique à la charte EPI). */
export const CHIP_BASE =
    'inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider font-medium';

// ─── Licences & permis d'exploitation ────────────────────────────────────────
export const LICENSE_TYPE_LABELS: Record<string, string> = {
    PERMIS_EXPLOITATION:    "Permis d'exploitation",
    PERMIS_RECHERCHE:       'Permis de recherche',
    PERMIS_SEMI_MECANISE:   'Permis semi-mécanisé',
    AUTORISATION_ARTISANALE:'Autorisation artisanale',
    PERMIS_ENVIRONNEMENTAL: 'Permis environnemental',
    AUTORISATION_EAU:       "Autorisation de prélèvement d'eau",
    AUTORISATION_EXPLOSIFS: "Autorisation d'explosifs",
    AUTORISATION_REJETS:    'Autorisation de rejets',
    AUTRE:                  'Autre titre',
};

export const licenseTypeLabel = (code?: string | null): string =>
    LICENSE_TYPE_LABELS[code || ''] || code || '—';

export const LICENSE_TYPE_OPTIONS = Object.entries(LICENSE_TYPE_LABELS)
    .map(([value, label]) => ({ value, label }));

// ─── Autorisations de travaux ────────────────────────────────────────────────
export const AUTHORIZATION_TYPE_LABELS: Record<string, string> = {
    EXCAVATION:         'Excavation / terrassement',
    TRAVAIL_EN_HAUTEUR: 'Travail en hauteur',
    FORAGE:             'Forage',
    DYNAMITAGE:         'Dynamitage / tir de mines',
    TRAVAIL_A_CHAUD:    'Travail à chaud (permis feu)',
    ESPACE_CONFINE:     'Espace confiné',
    TERRASSEMENT:       'Terrassement',
    LEVAGE:             'Levage',
    ELECTRIQUE:         'Travaux électriques',
    AUTRE:              'Autre travail',
};
export const authorizationTypeLabel = (c?: string | null): string =>
    AUTHORIZATION_TYPE_LABELS[c || ''] || c || '—';
export const AUTHORIZATION_TYPE_OPTIONS = Object.entries(AUTHORIZATION_TYPE_LABELS)
    .map(([value, label]) => ({ value, label }));

/** Statut de vie d'une autorisation (calculé serveur). */
export const AUTH_STATUS_CONFIG: Record<string, ConfCfg> = {
    EN_COURS:  { label: 'En cours',   chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#10b981' },
    PLANIFIE:  { label: 'Planifié',   chip: 'bg-sky-50 text-sky-700 border-sky-200',             dot: '#0284c7' },
    EXPIRE:    { label: 'Expiré',     chip: 'bg-rose-50 text-rose-700 border-rose-200',           dot: '#f43f5e' },
    CLOTURE:   { label: 'Clôturé',    chip: 'bg-slate-100 text-slate-500 border-slate-300',       dot: '#64748b' },
    A_EVALUER: { label: 'À évaluer',  chip: 'bg-slate-50 text-slate-600 border-slate-200',        dot: '#94a3b8' },
};
export const authStatusConfig = (c?: string | null): ConfCfg =>
    AUTH_STATUS_CONFIG[c || ''] ?? AUTH_STATUS_CONFIG.A_EVALUER;

export const RISK_LEVEL_CONFIG: Record<string, ConfCfg> = {
    FAIBLE:   { label: 'Faible',   chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#10b981' },
    MODERE:   { label: 'Modéré',   chip: 'bg-amber-50 text-amber-700 border-amber-200',       dot: '#f59e0b' },
    ELEVE:    { label: 'Élevé',    chip: 'bg-orange-50 text-orange-700 border-orange-200',    dot: '#ea580c' },
    CRITIQUE: { label: 'Critique', chip: 'bg-rose-50 text-rose-700 border-rose-200',           dot: '#f43f5e' },
};
export const riskLevelConfig = (c?: string | null): ConfCfg | null =>
    c ? (RISK_LEVEL_CONFIG[c] ?? null) : null;
export const RISK_LEVEL_OPTIONS = Object.entries(RISK_LEVEL_CONFIG)
    .map(([value, cfg]) => ({ value, label: cfg.label }));

// ─── Inspections réglementaires d'équipements ────────────────────────────────
export const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
    CUVE_SOUS_PRESSION:    'Cuve sous pression',
    APPAREIL_LEVAGE:       'Appareil de levage',
    GRUE:                  'Grue',
    PONT_ROULANT:          'Pont roulant',
    COMPRESSEUR:           'Compresseur',
    CHAUDIERE:             'Chaudière',
    RESERVOIR_HYDROCARBURE:"Réservoir d'hydrocarbures",
    INSTALLATION_ELECTRIQUE:'Installation électrique',
    EXTINCTEUR:            'Extincteurs',
    CONVOYEUR:             'Convoyeur',
    AUTRE:                 'Autre équipement',
};
export const equipmentTypeLabel = (c?: string | null): string =>
    EQUIPMENT_TYPE_LABELS[c || ''] || c || '—';
export const EQUIPMENT_TYPE_OPTIONS = Object.entries(EQUIPMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export const INSPECTION_TYPE_LABELS: Record<string, string> = {
    VGP:                    'VGP (visite générale périodique)',
    REQUALIFICATION:        'Requalification',
    EPREUVE:                'Épreuve',
    CONTROLE_REGLEMENTAIRE: 'Contrôle réglementaire',
    VERIFICATION_PERIODIQUE:'Vérification périodique',
    AUTRE:                  'Autre contrôle',
};
export const inspectionTypeLabel = (c?: string | null): string =>
    INSPECTION_TYPE_LABELS[c || ''] || c || '—';
export const INSPECTION_TYPE_OPTIONS = Object.entries(INSPECTION_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export const INSPECTION_RESULT_CONFIG: Record<string, ConfCfg> = {
    CONFORME:               { label: 'Conforme',        chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#10b981' },
    CONFORME_AVEC_RESERVES: { label: 'Avec réserves',   chip: 'bg-amber-50 text-amber-700 border-amber-200',       dot: '#f59e0b' },
    NON_CONFORME:           { label: 'Non conforme',    chip: 'bg-rose-50 text-rose-700 border-rose-200',           dot: '#f43f5e' },
};
export const inspectionResultConfig = (c?: string | null): ConfCfg | null =>
    c ? (INSPECTION_RESULT_CONFIG[c] ?? null) : null;
export const INSPECTION_RESULT_OPTIONS = Object.entries(INSPECTION_RESULT_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

// ─── Formateurs (fr-FR) ──────────────────────────────────────────────────────
export const formatDateFr = (value?: string | null): string => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtInt = (n?: number | null): string =>
    n == null ? '—' : new Intl.NumberFormat('fr-FR').format(n);

/** Montant XOF compact (M / k FCFA). */
export const fmtXof = (n?: number | null): string => {
    if (n == null) return '—';
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M FCFA`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k FCFA`;
    return `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;
};

export const fmtArea = (ha?: number | null): string =>
    ha == null ? '—' : `${new Intl.NumberFormat('fr-FR').format(ha)} ha`;

/** Sérialisation date locale (évite le décalage UTC d'un jour). */
export const toIsoDateLocal = (d?: Date | null): string | null => {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/** Libellé « J-30 » / « échue depuis 12 j » à partir d'un nombre de jours. */
export const dueLabel = (days?: number | null): string => {
    if (days == null) return '—';
    if (days < 0) return `échue depuis ${Math.abs(days)} j`;
    if (days === 0) return "aujourd'hui";
    return `J-${days}`;
};
