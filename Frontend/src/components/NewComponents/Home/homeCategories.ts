/**
 * homeCategories — Regroupement thématique des modules HSE.
 *
 * Mapping ID module → catégorie d'onglet. Permet d'organiser la page
 * d'accueil en 6 grandes familles métier (au lieu d'une grille de 21
 * tuiles plates).
 *
 * Catégories alignées sur les domaines ISO :
 *  - Pilotage         : reporting, analytics, planification
 *  - Sécurité         : ISO 45001 — prévention + maîtrise + intervention
 *  - Santé            : ISO 45001 §9.2 — surveillance médicale
 *  - Opérations       : activités terrain à risque maîtrisé
 *  - Système ISO      : ISO 9001 + 19011 — pilotage qualité/audit
 *  - Administration   : configuration de la plateforme (méta)
 *
 * Note : un module non listé tombe dans "operations" par défaut.
 */

import {
    IconLayoutDashboard,
    IconShield,
    IconHeartbeat,
    IconCertificate,
    IconSettings,
} from '@tabler/icons-react';

export type HomeTabId =
    | 'pilotage'
    | 'securite'
    | 'sante'
    | 'iso'
    | 'admin';

export interface HomeTab {
    id: HomeTabId;
    label: string;
    icon: React.ComponentType<{ size?: number; stroke?: number; className?: string; style?: React.CSSProperties }>;
    description: string;
    accentHex: string;
    /** IDs des modules visibles dans cet onglet. */
    moduleIds: string[];
}

/**
 * Catégorisation des 21 modules existants.
 * L'ordre dans `moduleIds` détermine l'ordre d'affichage dans l'onglet.
 */
export const HOME_TABS: HomeTab[] = [
    {
        id: 'pilotage',
        label: 'Pilotage',
        icon: IconLayoutDashboard,
        description: 'Tableau de bord, rapports, analytics et planification annuelle',
        accentHex: '#0E7490', // cyan-700
        moduleIds: ['reports', 'planning', 'knowledge-management'],
    },
    {
        id: 'securite',
        label: 'Sécurité',
        icon: IconShield,
        description: 'Prévention, risques, EPI, communication et intervention d\'urgence',
        accentHex: '#B45309', // amber-700
        moduleIds: [
            'preventives-activities',
            'preventives-activities-2', // Surveillance des Activités
            'risk-management',
            'ppe-management',
            'communication-management',
            'emergency-management',
            'blast',
        ],
    },
    {
        id: 'sante',
        label: 'Santé',
        icon: IconHeartbeat,
        description: 'Dosimétrie, surveillance médicale, aptitudes professionnelles',
        accentHex: '#BE185D', // pink-700
        moduleIds: ['dosimetry'],
    },
    {
        id: 'iso',
        label: 'Normes ISO',
        icon: IconCertificate,
        description: 'Audits, non-conformités, actions correctives et documentation',
        accentHex: '#5B21B6', // violet-800
        moduleIds: [
            'audits-management',
            'actions-managers',
            'pending-actions-hub',
            'compliance-management',
            'iso-documents',
        ],
    },
    {
        id: 'admin',
        label: 'Administration',
        icon: IconSettings,
        description: 'Utilisateurs, modules, paramètres et centre d\'aide',
        accentHex: '#0F172A', // slate-900
        moduleIds: [
            'admin',
            'users-management-hub',
            'modules-management',
            'parameters',
            'help',
        ],
    },
];

/** Récupère l'onglet contenant un module donné (utile pour le deep linking). */
export function findTabForModule(moduleId: string): HomeTab | undefined {
    return HOME_TABS.find((tab) => tab.moduleIds.includes(moduleId));
}
