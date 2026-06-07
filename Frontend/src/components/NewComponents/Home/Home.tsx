import React from 'react';
import {
    IconShield,
    IconAlertTriangle,
    IconActivity,
    IconClipboardCheck,
    IconSquareCheck,
    IconFileText,
    IconBook,
    IconMessage,
    IconSettings,
    IconHelmet,
    IconTarget,
    IconChartBar,
    IconCircleCheck,
    IconCalendar,
    IconLifebuoy,
    IconUrgent,
    IconUsers,
    IconLayoutDashboard,
    IconCrosshair,
    IconArrowRight,
    IconAtom2,
} from '@tabler/icons-react';
import ModuleSubscriptionModal from './ModuleSubscriptionModal';
import { isModuleEnabled } from '../data/ModuleConfig';
import { useNavigate } from 'react-router-dom';

/**
 * NewHomePage — Tableau de bord HSE / portail d'accès aux modules.
 *
 * LOT 41 (P2 demande utilisateur) :
 *   - Suppression des 4 tuiles KPI top (le tableau de bord dédié /dashboard
 *     les expose déjà ; doublon non utile sur l'accueil)
 *   - Tuiles modules redesignées : icône + titre + **petite définition
 *     1-2 lignes** (au lieu du "N sous-modules" peu parlant)
 *   - Layout aéré, focus sur la lisibilité métier
 */

type ModuleItem = string | { label: string; url: string; moduleId?: string };

interface ModuleCard {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;     // text color class
    bgColor: string;   // composite : bg + border
    items: ModuleItem[];
    url: string;
    requiredModuleId?: string;
}

/**
 * Les `description` ci-dessous sont la NOUVELLE source d'information
 * principale sur chaque tuile. Format : 1-2 lignes, ~12-20 mots,
 * verbe d'action en tête quand pertinent.
 */
/**
 * Map des couleurs hex pour la barre d'accent supérieure des tuiles.
 * Utilisé en `style={{ backgroundColor }}` pour éviter la purge Tailwind
 * sur les classes dynamiques `bg-${color}-500`.
 */
const MODULE_ACCENT_HEX: Record<string, string> = {
    'preventives-activities':    '#10b981', // green-500
    'preventives-activities-2':  '#3b82f6', // blue-500
    'actions-managers':          '#f97316', // orange-500
    'pending-actions-hub':       '#14b8a6', // teal-500
    'risk-management':           '#ef4444', // red-500
    'ppe-management':            '#eab308', // yellow-500
    'audits-management':         '#6366f1', // indigo-500
    'compliance-management':     '#10b981', // emerald-500
    'planning':                  '#f59e0b', // amber-500
    'knowledge-management':      '#06b6d4', // cyan-500
    'communication-management':  '#ec4899', // pink-500
    'reports':                   '#14b8a6', // teal-500
    'help':                      '#8b5cf6', // violet-500
    'iso-documents':             '#64748b', // slate-500
    'settings':                  '#64748b', // slate-500
    // LOT 48 — Module Emergency : rouge profond (red-700) pour le différencier
    // du module Gestion des Risques qui utilise red-500.
    'emergency-management':      '#b91c1c', // red-700
    // LOT 48 P6.f — Eclatement Administration en 4 modules
    'admin':                     '#0d9488', // teal-600
    'parameters':                '#64748b', // slate-500
    'users-management-hub':      '#ea580c', // orange-600
    'modules-management':        '#4f46e5', // indigo-600
    // LOT Dosimétrie & Expositions — module radioprotection (violet/indigo)
    'dosimetry':                 '#7c3aed', // violet-600
};

const moduleGroups: ModuleCard[] = [
    {
        id: 'preventives-activities',
        title: 'Activités Préventives',
        description: 'Inspections, observations terrain et signalements proactifs pour anticiper les risques.',
        icon: IconShield,
        color: 'text-green-700',
        bgColor: 'bg-green-50/70 border-green-200/60',
        items: ['Central Findings', 'Inspections', 'Réunions', 'Leadership Walk'],
        url: '/non-conformity',
    },
    {
        id: 'preventives-activities-2',
        title: 'Surveillance des Activités',
        description: 'Déclaration et investigation des incidents, accidents et quasi-accidents HSE.',
        icon: IconActivity,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50/70 border-blue-200/60',
        items: ['Incidents', 'Investigations', "Plans d'action"],
        url: '/incidents',
    },
    {
        id: 'actions-managers',
        title: 'Actions Correctives',
        description: "Suivi des plans d'action issus d'incidents, audits et non-conformités (ISO 45001 §10.2).",
        icon: IconTarget,
        color: 'text-orange-700',
        bgColor: 'bg-orange-50/70 border-orange-200/60',
        items: ['En attente', 'Plans actifs', 'Recommandations', 'Idées'],
        url: '/corrective',
    },
    {
        id: 'pending-actions-hub',
        requiredModuleId: 'pending-actions',
        title: 'Hub de Suivi',
        description: "Centralise toutes les validations et approbations en attente de l'utilisateur.",
        icon: IconCircleCheck,
        color: 'text-teal-700',
        bgColor: 'bg-teal-50/70 border-teal-200/60',
        items: [
            { label: 'Actions en attente', url: '/pending-actions', moduleId: 'pending-actions' },
            { label: 'Demandes EPI', url: '/ppe-request', moduleId: 'ppe-request' },
            { label: 'Validation docs', url: '/document-validation', moduleId: 'document-validation' },
            { label: 'Gestion documentaire', url: '/document-management', moduleId: 'documents' },
        ],
        url: '/pending-actions',
    },
    {
        id: 'risk-management',
        title: 'Gestion des Risques',
        description: 'Identification, évaluation et traitement des risques selon la méthodologie ISO 31000.',
        icon: IconAlertTriangle,
        color: 'text-red-700',
        bgColor: 'bg-red-50/70 border-red-200/60',
        items: ['Vue globale', 'Registre', 'Évaluation', 'Produits chimiques'],
        url: '/risks-overview',
    },
    {
        // LOT 48 — Module Gestion des Urgences : exposition portail Home.
        // requiredModuleId pointe sur emergency-dashboard (sous-module pivot
        // exposé en sidebar), aligné avec la convention des autres modules.
        id: 'emergency-management',
        requiredModuleId: 'emergency-dashboard',
        title: 'Gestion des Urgences',
        description: 'SOS, alertes générales, évacuations et points de rassemblement temps réel (ISO 45001 §8.2).',
        icon: IconUrgent,
        color: 'text-red-800',
        bgColor: 'bg-red-50/70 border-red-300/60',
        items: ['Tableau de bord', 'Suivi SOS', 'Points de rassemblement', 'Paramètres'],
        url: '/emergency/dashboard',
    },
    {
        // LOT Dosimétrie & Expositions — radioprotection des travailleurs
        // exposés aux rayonnements ionisants (mines uranifères, radon, NORM).
        // requiredModuleId = sous-module pivot (dashboard) aligné sur les 10
        // sous-modules présents dans ModuleConfig.tsx (catégorie "Dosimetry & Exposures").
        id: 'dosimetry',
        requiredModuleId: 'dosimetry-dashboard',
        title: 'Dosimétrie & Expositions',
        description: 'Suivi des doses individuelles, surveillance médicale et alertes de dépassement (CIPR 103 / AIEA GSR Part 3).',
        icon: IconAtom2,
        color: 'text-violet-700',
        bgColor: 'bg-violet-50/70 border-violet-200/60',
        items: ['Tableau de bord', 'Registre travailleurs', 'Suivi des doses', 'Mon dossier médical'],
        url: '/dosimetry',
    },
    {
        id: 'ppe-management',
        title: 'Gestion des EPI',
        description: 'Catalogue, dotation individuelle et suivi des équipements de protection.',
        icon: IconHelmet,
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50/70 border-yellow-200/60',
        items: ['Catalogue', 'Suivi dotations', 'Demandes'],
        url: '/ppe-management',
    },
    {
        id: 'audits-management',
        title: 'Audits Internes',
        description: 'Programme annuel, exécution sur site et recommandations selon ISO 19011.',
        icon: IconClipboardCheck,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50/70 border-indigo-200/60',
        items: ['Plan annuel', 'Audits', 'Recommandations'],
        url: '/audit-management',
    },
    {
        id: 'compliance-management',
        title: 'Conformité Réglementaire',
        description: 'Veille des exigences légales, attribution aux postes et documents probants.',
        icon: IconSquareCheck,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50/70 border-emerald-200/60',
        items: ['Exigences', 'Attributions', 'Documents'],
        url: '/compliance-dashboard',
    },
    {
        id: 'planning',
        title: 'Planification Annuelle',
        description: 'Calendrier HSE 12 mois × 7 catégories avec thèmes mensuels et activités.',
        icon: IconCalendar,
        color: 'text-amber-700',
        bgColor: 'bg-amber-50/70 border-amber-200/60',
        items: ['Activités HSE', 'Thèmes', 'Audit annuel'],
        url: '/hs-activities-planning',
    },
    {
        id: 'knowledge-management',
        title: 'Centre de Connaissances',
        description: "Capitalisation des retours d'expérience et bibliothèque documentaire.",
        icon: IconBook,
        color: 'text-cyan-700',
        bgColor: 'bg-cyan-50/70 border-cyan-200/60',
        items: ['REX / Lessons learned', 'Documents'],
        url: '/lesson-learn',
    },
    {
        id: 'communication-management',
        title: 'Communication Sécurité',
        description: 'Causeries, notifications ciblées et campagnes de sensibilisation HSE.',
        icon: IconMessage,
        color: 'text-pink-700',
        bgColor: 'bg-pink-50/70 border-pink-200/60',
        items: ['Tableau de bord', 'Communications', 'Notifications'],
        url: '/communication-dashboard',
    },
    {
        id: 'reports',
        title: 'Rapports & Analytics',
        description: "Tableaux de bord, indicateurs LTIFR/TRIFR et analyses de tendances multi-périodes.",
        icon: IconChartBar,
        color: 'text-teal-700',
        bgColor: 'bg-teal-50/70 border-teal-200/60',
        items: ['Mensuels', 'KPI', 'Performance', 'Corporate'],
        url: '/monthly-reports',
    },
    {
        id: 'help',
        title: "Centre d'Aide",
        description: 'Guides utilisateur, vue d\'ensemble fonctionnelle et documentation technique.',
        icon: IconLifebuoy,
        color: 'text-violet-700',
        bgColor: 'bg-violet-50/70 border-violet-200/60',
        items: ['Guides', 'Fonctionnalités', 'Doc technique'],
        url: '/how-to',
    },
    {
        id: 'iso-documents',
        title: 'Documentation ISO',
        description: 'Bibliothèque des normes applicables : 45001, 14001, 9001, 19011, 31000.',
        icon: IconFileText,
        color: 'text-slate-700',
        bgColor: 'bg-slate-50/70 border-slate-200/60',
        items: ['ISO 45001', 'ISO 19011', 'ISO 9001'],
        url: '/iso-documents',
    },
    // LOT 48 P6.f — Eclatement Administration en 4 modules de premier niveau
    // (auparavant une seule tuile "Administration" englobait toute la configuration ;
    // maintenant 1 tuile par axe metier pour une meilleure decouvrabilite.)
    {
        id: 'admin',
        title: 'Administration',
        description: 'Definition des cibles HSE annuelles et previsions de performance (LTIFR, TRIFR, formations).',
        icon: IconCrosshair,
        color: 'text-teal-700',
        bgColor: 'bg-teal-50/70 border-teal-200/60',
        items: ['Cibles et previsions'],
        url: '/performance',
    },
    {
        id: 'parameters',
        title: 'Parametres',
        description: 'Referentiels operationnels (sites, types incidents, gravites) et parametres systeme avances.',
        icon: IconSettings,
        color: 'text-slate-700',
        bgColor: 'bg-slate-50/70 border-slate-200/60',
        items: ['References (donnees operationnelles)', 'Parametres systeme'],
        url: '/settings',
    },
    {
        id: 'users-management-hub',
        title: 'Gestion des utilisateurs',
        description: 'Comptes utilisateurs, roles metiers HSE et permissions granulaires par module.',
        icon: IconUsers,
        color: 'text-orange-700',
        bgColor: 'bg-orange-50/70 border-orange-200/60',
        items: ['Liste des utilisateurs', 'Roles et permissions'],
        url: '/users-management',
    },
    {
        id: 'modules-management',
        title: 'Gestion des Modules',
        description: "Activation/desactivation des modules HSE par mine (matrice mines x modules, conformite ISO 45001).",
        icon: IconLayoutDashboard,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50/70 border-indigo-200/60',
        items: ['Matrice mines x modules'],
        url: '/modules-management',
    },
];

const NewHomePage = () => {
    const [showModal, setShowModal] = React.useState(false);
    const [selectedModuleName, setSelectedModuleName] = React.useState('');
    const navigate = useNavigate();

    const alwaysAccessibleModuleIds = React.useMemo(
        () => new Set([
            'users-management', 'settings', 'iso-documents', 'help',
            // LOT 48 P6.f — Modules administration (toujours accessibles, pas d'abonnement requis)
            'admin', 'parameters', 'users-management-hub', 'modules-management',
        ]),
        [],
    );

    const isFeatureEnabled = React.useCallback(
        (moduleId?: string) => {
            if (!moduleId) return true;
            if (alwaysAccessibleModuleIds.has(moduleId)) return true;
            return isModuleEnabled(moduleId);
        },
        [alwaysAccessibleModuleIds],
    );

    const handleModuleClick = (module: ModuleCard) => {
        const moduleKey = module.requiredModuleId ?? module.id;
        if (!isFeatureEnabled(moduleKey)) {
            setSelectedModuleName(module.title || 'Module');
            setShowModal(true);
            return;
        }
        navigate(module.url);
    };

    return (
        <>
            <div className="flex flex-col gap-6">

                {/* En-tête sobre — la page se concentre sur l'accès rapide */}
                <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            SafeX 360 · Espace de pilotage
                        </p>
                        <h1
                            className="text-slate-900 mt-1.5"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 500,
                                fontSize: 'clamp(24px, 3vw, 30px)',
                                letterSpacing: '-0.014em',
                            }}
                        >
                            Modules métier
                        </h1>
                    </div>
                    <span className="text-[12px] text-slate-500 self-start sm:self-end">
                        {moduleGroups.length} modules disponibles
                    </span>
                </header>

                {/* LOT 43 v11 — Grille compacte (+1 col aux 2 breakpoints supérieurs, gap réduit) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {moduleGroups.map((module) => {
                        const moduleEnabled = isFeatureEnabled(module.requiredModuleId ?? module.id);
                        const subCount = module.items?.length ?? 0;
                        // Couleur lookup pour barre d'accent supérieure (inline style — évite la purge Tailwind)
                        const accentColor = MODULE_ACCENT_HEX[module.id] ?? '#0f766e';
                        return (
                            <button
                                key={module.id}
                                type="button"
                                disabled={!moduleEnabled}
                                aria-label={`Ouvrir le module ${module.title}, ${subCount} sous-modules`}
                                className={`group relative text-left rounded-xl border-2 transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                                    moduleEnabled
                                        ? `${module.bgColor} hover:shadow-xl hover:-translate-y-1 cursor-pointer active:scale-[0.99]`
                                        : 'bg-slate-50/40 border-slate-200 opacity-55 cursor-not-allowed'
                                }`}
                                onClick={() => handleModuleClick(module)}
                            >
                                {/* Barre d'accent supérieure colorée (signature du module) */}
                                {moduleEnabled && (
                                    <div
                                        className="absolute top-0 left-0 right-0 h-1"
                                        style={{ backgroundColor: accentColor }}
                                        aria-hidden="true"
                                    />
                                )}

                                <div className="p-3.5 flex flex-col h-full min-h-[138px]">
                                    {/* En-tête : icône compacte à gauche + badge compteur à droite */}
                                    <div className="flex items-start justify-between mb-2 gap-2">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white border ${moduleEnabled ? 'border-white shadow-sm' : 'border-slate-200'} group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform duration-200`}>
                                            <module.icon
                                                className={moduleEnabled ? module.color : 'text-slate-400'}
                                                size={17}
                                                stroke={1.8}
                                                aria-hidden="true"
                                            />
                                        </div>
                                        {/* Badge compteur sous-modules — version compacte (chiffre seul) */}
                                        {moduleEnabled && subCount > 0 && (
                                            <span
                                                className={`inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-full bg-white/85 border border-white text-[10px] font-semibold ${module.color} shadow-sm`}
                                                title={`${subCount} sous-modules disponibles`}
                                            >
                                                {subCount}
                                            </span>
                                        )}
                                    </div>

                                    {/* Titre — serif accentué, taille réduite */}
                                    <h3
                                        className={`${moduleEnabled ? 'text-slate-900' : 'text-slate-500 italic'} transition-colors`}
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            letterSpacing: '-0.012em',
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {module.title}
                                    </h3>

                                    {/* Description — 2 lignes max, taille réduite */}
                                    <p
                                        className={`mt-1 text-[11.5px] leading-snug flex-1 line-clamp-2 ${
                                            moduleEnabled ? 'text-slate-600' : 'text-slate-400'
                                        }`}
                                    >
                                        {module.description}
                                    </p>

                                    {/* Footer CTA permanent — compact */}
                                    <div className="mt-2 pt-2 border-t border-white/70 flex items-center justify-between">
                                        {moduleEnabled ? (
                                            <>
                                                <span className={`text-[10px] uppercase tracking-[0.10em] font-medium ${module.color}`}>
                                                    Ouvrir
                                                </span>
                                                <span
                                                    className={`w-5 h-5 rounded-full bg-white border border-white shadow-sm flex items-center justify-center ${module.color} group-hover:translate-x-1 group-hover:shadow-md transition-all`}
                                                    aria-hidden="true"
                                                >
                                                    <IconArrowRight size={11} stroke={2.4} />
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-[10px] uppercase tracking-[0.10em] text-slate-400 font-medium">
                                                Non inclus
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <ModuleSubscriptionModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                moduleName={selectedModuleName}
            />
        </>
    );
};

export default NewHomePage;
