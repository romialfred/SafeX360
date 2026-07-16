/**
 * inspectionLabels — Référentiels et libellés du module Inspections HSE.
 *
 * Deux référentiels y sont centralisés :
 *
 *  1. FAMILLES D'ÉQUIPEMENT (D1) — `equipment.type` stocke désormais une CLÉ
 *     canonique (HEAVY_TRUCK, EXCAVATOR…) alignée sur `InspectionTemplate.scopeRef`.
 *     C'est cet appariement clé↔clé qui permet de dériver le modèle d'inspection
 *     applicable à une cible (cf. D2). Le LIBELLÉ est porté par l'i18n
 *     (`inspection:equipment.family.<KEY>`), jamais par la base : les tables de
 *     repli ci-dessous ne servent que de `defaultValue` (convention *Labels.ts).
 *
 *  2. RÔLES D'ÉQUIPE D'INSPECTION (D4) — LEAD / INSPECTOR / SPECIALIST /
 *     EQUIPMENT_OWNER / OBSERVER, avec leur chip de couleur (charte R7).
 *
 * `normalizeFamilyKey` tolère les données NON MIGRÉES (anciens libellés FR
 * libres : « Camions », « Groupes électrogènes »…) et les rattache à leur clé.
 * Filet de sécurité : sans lui, une base pas encore migrée casserait
 * l'appariement cible→modèle et bloquerait toute planification.
 */

/** Fonction de traduction (signature minimale utilisée ici). */
type TFn = (key: string, options?: any) => string;

// ─── 1. Familles d'équipement (clés canoniques, alignées sur template.scopeRef) ──

export const EQUIPMENT_FAMILY_KEYS = [
    'HEAVY_TRUCK',
    'EXCAVATOR',
    'WHEEL_LOADER',
    'DRILL_RIG',
    'DOZER',
    'GRADER',
    'PICKUP',
    'LIGHT_VEHICLE',
    'CRUSHER',
    'CONVEYOR',
    'GENSET',
    'COMPRESSOR',
    'CRANE',
    'PUMP',
    'TOOLING',
    'OTHER',
] as const;

export type EquipmentFamilyKey = (typeof EQUIPMENT_FAMILY_KEYS)[number];

/** Repli FR (defaultValue i18n) — la source de vérité reste inspection.json. */
export const EQUIPMENT_FAMILY_FR: Record<EquipmentFamilyKey, string> = {
    HEAVY_TRUCK: 'Camions',
    EXCAVATOR: 'Pelles',
    WHEEL_LOADER: 'Chargeuses',
    DRILL_RIG: 'Foreuses',
    DOZER: 'Bulldozers',
    GRADER: 'Niveleuses',
    PICKUP: 'Pickups',
    LIGHT_VEHICLE: 'Véhicules légers',
    CRUSHER: 'Concasseurs',
    CONVEYOR: 'Convoyeurs',
    GENSET: 'Groupes électrogènes',
    COMPRESSOR: 'Compresseurs',
    CRANE: 'Grues',
    PUMP: 'Pompes',
    TOOLING: 'Outillage',
    OTHER: 'Autre',
};

const FAMILY_KEY_SET = new Set<string>(EQUIPMENT_FAMILY_KEYS);

/**
 * Anciens libellés libres (avant D1) → clé canonique. Utilisé UNIQUEMENT en
 * tolérance de lecture : plus aucune saisie libre n'est possible à l'écriture.
 */
const LEGACY_FAMILY_ALIASES: Record<string, EquipmentFamilyKey> = {
    CAMIONS: 'HEAVY_TRUCK',
    CAMION: 'HEAVY_TRUCK',
    'CAMIONS BENNE': 'HEAVY_TRUCK',
    'CAMION BENNE': 'HEAVY_TRUCK',
    TRUCKS: 'HEAVY_TRUCK',
    PELLES: 'EXCAVATOR',
    PELLE: 'EXCAVATOR',
    EXCAVATEURS: 'EXCAVATOR',
    EXCAVATEUR: 'EXCAVATOR',
    CHARGEUSES: 'WHEEL_LOADER',
    CHARGEUSE: 'WHEEL_LOADER',
    LOADERS: 'WHEEL_LOADER',
    FOREUSES: 'DRILL_RIG',
    FOREUSE: 'DRILL_RIG',
    BULLDOZERS: 'DOZER',
    BULLDOZER: 'DOZER',
    NIVELEUSES: 'GRADER',
    NIVELEUSE: 'GRADER',
    PICKUPS: 'PICKUP',
    'VEHICULES LEGERS': 'LIGHT_VEHICLE',
    'VEHICULE LEGER': 'LIGHT_VEHICLE',
    CONCASSEURS: 'CRUSHER',
    CONCASSEUR: 'CRUSHER',
    CONVOYEURS: 'CONVEYOR',
    CONVOYEUR: 'CONVEYOR',
    'GROUPES ELECTROGENES': 'GENSET',
    'GROUPE ELECTROGENE': 'GENSET',
    COMPRESSEURS: 'COMPRESSOR',
    COMPRESSEUR: 'COMPRESSOR',
    GRUES: 'CRANE',
    GRUE: 'CRANE',
    POMPES: 'PUMP',
    POMPE: 'PUMP',
    OUTILLAGE: 'TOOLING',
    AUTRE: 'OTHER',
    AUTRES: 'OTHER',
};

/**
 * Normalise une valeur de famille (clé canonique, ancien libellé FR, casse ou
 * accents variables) vers sa CLÉ. Renvoie `null` si non reconnue ou vide —
 * l'appelant décide alors du traitement (ex. « famille non renseignée »).
 */
export const normalizeFamilyKey = (raw?: string | null): EquipmentFamilyKey | null => {
    const s = String(raw ?? '').trim();
    if (!s) return null;
    const upper = s.toUpperCase().replace(/[\s-]+/g, '_');
    if (FAMILY_KEY_SET.has(upper)) return upper as EquipmentFamilyKey;
    // Repli sur les anciens libellés : on retire les accents pour comparer.
    const plain = s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase()
        .replace(/[\s_-]+/g, ' ');
    return LEGACY_FAMILY_ALIASES[plain] ?? null;
};

/** Libellé i18n d'une famille ; repli sur la table FR puis sur la clé brute. */
export const equipmentFamilyLabel = (t: TFn, raw?: string | null): string => {
    const key = normalizeFamilyKey(raw);
    if (!key) return String(raw ?? '').trim();
    return t(`equipment.family.${key}`, { defaultValue: EQUIPMENT_FAMILY_FR[key] });
};

/** Options d'un `Select` de familles, triées par libellé traduit. */
export const equipmentFamilyOptions = (t: TFn): { value: string; label: string }[] =>
    EQUIPMENT_FAMILY_KEYS.map((k) => ({ value: k, label: equipmentFamilyLabel(t, k) })).sort(
        // « Autre » toujours en dernier : c'est un fourre-tout, pas une famille.
        (a, b) =>
            a.value === 'OTHER' ? 1 : b.value === 'OTHER' ? -1 : a.label.localeCompare(b.label, 'fr'),
    );

// ─── 2. Rôles de l'équipe d'inspection (D4) ────────────────────────────────

export const INSPECTION_ROLES = [
    'LEAD',
    'INSPECTOR',
    'SPECIALIST',
    'EQUIPMENT_OWNER',
    'OBSERVER',
] as const;

export type InspectionRoleKey = (typeof INSPECTION_ROLES)[number];

/** Repli FR + chip charté (bordure + fond + texte, jamais la couleur seule). */
export const INSPECTION_ROLE_CONFIG: Record<InspectionRoleKey, { label: string; chip: string; avatar: string }> = {
    LEAD: {
        label: 'Inspecteur principal',
        chip: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        avatar: 'bg-cyan-600',
    },
    INSPECTOR: {
        label: 'Inspecteur',
        chip: 'bg-blue-50 text-blue-700 border-blue-200',
        avatar: 'bg-blue-500',
    },
    SPECIALIST: {
        label: 'Expert métier',
        chip: 'bg-violet-50 text-violet-700 border-violet-200',
        avatar: 'bg-violet-500',
    },
    EQUIPMENT_OWNER: {
        label: "Responsable de l'équipement",
        chip: 'bg-amber-50 text-amber-800 border-amber-200',
        avatar: 'bg-amber-500',
    },
    OBSERVER: {
        label: 'Observateur',
        chip: 'bg-slate-100 text-slate-600 border-slate-300',
        avatar: 'bg-slate-400',
    },
};

/** Libellé i18n d'un rôle ; repli sur la table FR. */
export const inspectionRoleLabel = (t: TFn, role: InspectionRoleKey): string =>
    t(`schedule.roles.${role}`, { defaultValue: INSPECTION_ROLE_CONFIG[role].label });

/** Options d'un `Select` de rôles (ordre métier : LEAD d'abord). */
export const inspectionRoleOptions = (t: TFn): { value: string; label: string }[] =>
    INSPECTION_ROLES.map((r) => ({ value: r, label: inspectionRoleLabel(t, r) }));

/** Initiales (2 max) pour la puce d'avatar d'un membre d'équipe. */
export const initialsOf = (name: string): string =>
    String(name ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || '?';
