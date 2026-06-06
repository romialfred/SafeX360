/**
 * Catégorisation métier des départements de la mine (LOT 48 Phase 2.b).
 *
 * <p>Regroupe les ~30 départements HRMS en 3 grandes familles pour structurer
 * l'affichage dans le formulaire de point de rassemblement et dans la vue
 * Couverture du détail.</p>
 *
 * <p>Match par nom normalisé (lowercase + trim) plutôt que par ID — ainsi un
 * département renommé ou un nouvel ajout HRMS reste catégorisé via mots-clés.</p>
 */

export type DepartmentCategory = 'general' | 'operations' | 'technical';

export interface CategoryMeta {
    key: DepartmentCategory;
    label: string;
    description: string;
    accent: 'sky' | 'amber' | 'emerald';
    icon: 'IconBuildingBank' | 'IconShovel' | 'IconTool';
}

export const CATEGORIES: CategoryMeta[] = [
    {
        key: 'general',
        label: 'Services Généraux',
        description: 'Administration, finance, RH, communication, IT, communauté',
        accent: 'sky',
        icon: 'IconBuildingBank',
    },
    {
        key: 'operations',
        label: 'Opérations',
        description: 'Production : mine, traitement, usine, laboratoire, magasin',
        accent: 'amber',
        icon: 'IconShovel',
    },
    {
        key: 'technical',
        label: 'Technique & HSE',
        description: 'Maintenance, sécurité, environnement, sûreté',
        accent: 'emerald',
        icon: 'IconTool',
    },
];

// ── Règles de classification (en minuscules, sans accents pour robustesse) ──
// Note : ordre = priorité (premier match l'emporte si un nom contient
// plusieurs mots-clés).
const RULES: Array<{ category: DepartmentCategory; patterns: string[] }> = [
    {
        category: 'technical',
        patterns: [
            'maintenance',
            'safety',           // HSE Safety
            'environnement',
            'environment',
            'security',         // Sûreté
            'amelioration',     // Amélioration Continue (qualité technique)
        ],
    },
    {
        category: 'operations',
        patterns: [
            'mining',
            'mine',
            'processing',
            'usine',
            'laboratoire',
            'lab',
            'warehouse',
            'magasin',
            'production',
            'extraction',
        ],
    },
    {
        category: 'general',
        patterns: [
            'administration',
            'admin',
            'finance',
            'comptabilite',
            'comptabilité',
            'human resources',
            'rh',
            'budget',
            'capex',
            'audit',
            'sox',
            'recruit',
            'recrutement',
            'avantage',
            'travel',
            'voyage',
            'camp',
            'information technology',
            'it',
            'communication',
            'community',
            'communaute',
            'communauté',
            'corporate',
            'regional',
            'transport',           // Géré ici (logistique support)
            'hebergement',
            'promotion',
        ],
    },
];

// Suppression accents pour comparaison robuste
const normalize = (s: string) =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // marqueurs diacritiques
        .trim();

/**
 * Catégorise un département par son nom. Retourne {@code 'general'} par défaut
 * si aucun pattern ne matche (les services support sont la catégorie la plus
 * large et le défaut le moins surprenant pour un département inconnu).
 */
export const categorizeDepartment = (name: string): DepartmentCategory => {
    if (!name) return 'general';
    const norm = normalize(name);
    for (const rule of RULES) {
        if (rule.patterns.some((p) => norm.includes(p))) {
            return rule.category;
        }
    }
    return 'general';
};

export interface CategorizedDepartments<T> {
    general: T[];
    operations: T[];
    technical: T[];
}

/**
 * Groupe une liste de départements (avec champ {@code name}) par catégorie.
 * Le tri à l'intérieur de chaque catégorie est alphabétique.
 */
export const groupByCategory = <T extends { name: string }>(
    items: T[]
): CategorizedDepartments<T> => {
    const acc: CategorizedDepartments<T> = { general: [], operations: [], technical: [] };
    items.forEach((item) => {
        const cat = categorizeDepartment(item.name);
        acc[cat].push(item);
    });
    // Tri alphabétique stable à l'intérieur de chaque groupe
    for (const k of ['general', 'operations', 'technical'] as const) {
        acc[k].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
    }
    return acc;
};
