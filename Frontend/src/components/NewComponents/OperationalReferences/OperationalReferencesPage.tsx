import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconMapPin,
    IconUsers,
    IconAlertTriangle,
    IconTools,
    IconCloudRain,
    IconClipboardCheck,
    IconBriefcase,
    IconGitBranch,
    IconBuildingFactory2,
    IconUserCheck,
    IconAward,
    IconCategory,
    IconList,
    IconGauge,
    IconDevicesCog,
    IconCalendarClock,
    IconAlertSquare,
    IconBodyScan,
    IconChevronRight,
    IconArrowRight,
    IconCircleCheck,
    IconClock,
    IconSearch,
    IconDatabase,
} from '@tabler/icons-react';
import SegmentedFilter, { SegmentedFilterOption } from '../../UtilityComp/SegmentedFilter';

/**
 * Données de Références — Page hub des référentiels opérationnels HSE.
 *
 * LOT 48 P6.g — Refonte UX premium.
 *
 * Ancienne expérience : la page "/settings" exposait les référentiels via une
 * colonne de gauche + colonnes catégories. Peu raffiné, hierarchie peu claire.
 *
 * Nouvelle expérience : navigation horizontale par onglets (Sites & env / RH /
 * Incidents / Outils), chaque onglet présente une grille de référentiels en
 * cartes colorées avec :
 *   - Icône et couleur d'accent par référentiel
 *   - Description courte 1-2 lignes
 *   - Badge de statut (Configuré / Bientôt)
 *   - CTA "Ouvrir" explicite
 *   - Recherche transverse sur tous les référentiels
 *
 * Pattern UX : SegmentedFilter (cohérent avec le reste de la plateforme) +
 * grille adaptative (1/2/3/4 colonnes selon la largeur) + animations subtiles
 * au survol.
 */

type ItemStatus = 'configured' | 'partial' | 'coming';

interface ReferenceItem {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    url: string | null;
    status: ItemStatus;
}

interface TabSection {
    id: string;
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ComponentType<any>;
    color: 'emerald' | 'blue' | 'red' | 'violet';
    accent: string; // hex pour la barre d'accent
    items: ReferenceItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION DES ONGLETS
// ─────────────────────────────────────────────────────────────────────────────
const TABS: TabSection[] = [
    {
        id: 'places',
        label: 'Sites et environnement',
        shortLabel: 'Sites & env.',
        description: 'Cartographie des sites miniers, zones, processus et conditions de surveillance.',
        icon: IconMapPin,
        color: 'emerald',
        accent: '#10b981',
        items: [
            {
                id: 'locations',
                name: 'Sites & emplacements',
                description: 'Géolocalisation des mines, sites secondaires et bureaux administratifs',
                icon: IconBuildingFactory2,
                url: '/location',
                status: 'configured',
            },
            {
                id: 'env-conditions',
                name: 'Conditions environnementales',
                description: 'Météo, qualité air et paramètres de surveillance ambiants',
                icon: IconCloudRain,
                url: '/weatherCondition',
                status: 'configured',
            },
            {
                id: 'audit-area',
                name: "Zones d'audit",
                description: 'Définition des périmètres auditables selon ISO 19011',
                icon: IconClipboardCheck,
                url: '/audit-area',
                status: 'configured',
            },
            {
                id: 'work-area',
                name: 'Zones de travail',
                description: 'Découpage opérationnel avec niveau de risque associé',
                icon: IconMapPin,
                url: '/work-area',
                status: 'configured',
            },
            {
                id: 'work-process',
                name: 'Processus de travail',
                description: 'Cartographie des processus opérationnels HSE',
                icon: IconGitBranch,
                url: '/work-process',
                status: 'configured',
            },
        ],
    },
    {
        id: 'hr',
        label: 'Ressources humaines',
        shortLabel: 'RH',
        description: 'Équipes opérationnelles, structure organisationnelle, postes et compétences.',
        icon: IconUsers,
        color: 'blue',
        accent: '#3b82f6',
        items: [
            {
                id: 'teams',
                name: 'Équipes',
                description: 'Constitution des équipes opérationnelles et de secours HSE',
                icon: IconUsers,
                url: '/team-setup',
                status: 'configured',
            },
            {
                id: 'departments',
                name: 'Départements',
                description: "Structure organisationnelle de l'entreprise (Opérations, Maintenance...)",
                icon: IconBriefcase,
                url: null,
                status: 'coming',
            },
            {
                id: 'positions',
                name: 'Postes & fonctions',
                description: 'Référentiel des fonctions et hiérarchie',
                icon: IconUserCheck,
                url: null,
                status: 'coming',
            },
            {
                id: 'competencies',
                name: 'Compétences HSE',
                description: 'Habilitations, formations obligatoires et certifications',
                icon: IconAward,
                url: null,
                status: 'coming',
            },
        ],
    },
    {
        id: 'incidents',
        label: 'Référentiel Incidents',
        shortLabel: 'Incidents',
        description: 'Classification, types et niveaux de gravité des événements HSE déclarables.',
        icon: IconAlertTriangle,
        color: 'red',
        accent: '#ef4444',
        items: [
            {
                id: 'incident-category',
                name: "Catégories d'incidents",
                description: 'Classification fonctionnelle des événements (Sécurité, Santé, Env.)',
                icon: IconCategory,
                url: '/incidentCategory',
                status: 'configured',
            },
            {
                id: 'incident-type',
                name: "Types d'incidents",
                description: 'LTI, MTI, FAI, Near Miss, Conditions dangereuses',
                icon: IconList,
                url: '/incidentType',
                status: 'configured',
            },
            {
                id: 'severity-level',
                name: 'Niveaux de gravité',
                description: 'Matrice de criticité conforme ISO 31000 (Insignifiante → Catastrophique)',
                icon: IconAlertSquare,
                url: '/severityLevel',
                status: 'configured',
            },
            {
                id: 'body-parts',
                name: 'Parties du corps',
                description: 'Zones anatomiques sélectionnables lors de la déclaration d\'incidents avec blessure',
                icon: IconBodyScan,
                url: '/bodyParts',
                status: 'configured',
            },
        ],
    },
    {
        id: 'tools',
        label: 'Outils & Métrologie',
        shortLabel: 'Outils',
        description: 'Équipements de mesure, calibration et seuils de surveillance des paramètres.',
        icon: IconTools,
        color: 'violet',
        accent: '#8b5cf6',
        items: [
            {
                id: 'measurement-tools',
                name: 'Appareils de mesure',
                description: 'Inventaire des instruments métrologiques (sonomètre, luxmètre, gaz...)',
                icon: IconDevicesCog,
                url: null,
                status: 'coming',
            },
            {
                id: 'calibration',
                name: 'Plan de calibration',
                description: 'Échéances de vérification métrologique périodique',
                icon: IconCalendarClock,
                url: null,
                status: 'coming',
            },
            {
                id: 'monitoring',
                name: 'Seuils de surveillance',
                description: 'Paramètres et alarmes des capteurs HSE temps réel',
                icon: IconGauge,
                url: null,
                status: 'coming',
            },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SOUS-COMPOSANTS
// ─────────────────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ItemStatus }) {
    if (status === 'configured') {
        return (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-700">
                <IconCircleCheck size={10} stroke={2.2} />
                Configuré
            </span>
        );
    }
    if (status === 'partial') {
        return (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-medium text-amber-700">
                Partiel
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-medium text-slate-500">
            <IconClock size={10} stroke={2.2} />
            Bientôt
        </span>
    );
}

const colorClassMap: Record<TabSection['color'], { ring: string; bg: string; text: string; bgSoft: string }> = {
    emerald: { ring: 'ring-emerald-200', bg: 'bg-emerald-500', text: 'text-emerald-700', bgSoft: 'bg-emerald-50' },
    blue:    { ring: 'ring-blue-200',    bg: 'bg-blue-500',    text: 'text-blue-700',    bgSoft: 'bg-blue-50' },
    red:     { ring: 'ring-red-200',     bg: 'bg-red-500',     text: 'text-red-700',     bgSoft: 'bg-red-50' },
    violet:  { ring: 'ring-violet-200',  bg: 'bg-violet-500',  text: 'text-violet-700',  bgSoft: 'bg-violet-50' },
};

function ReferenceCard({ item, tabColor, onOpen }: { item: ReferenceItem; tabColor: TabSection['color']; onOpen: () => void }) {
    const disabled = item.status === 'coming';
    const colors = colorClassMap[tabColor];

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onOpen}
            className={`group relative text-left bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-200 ${
                disabled
                    ? 'opacity-65 cursor-not-allowed'
                    : 'hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer active:scale-[0.99]'
            }`}
        >
            {/* Barre d'accent supérieure colorée (signature de l'onglet) */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${colors.bg}`} aria-hidden="true" />

            <div className="p-4 pt-5 flex flex-col gap-2.5 min-h-[140px]">
                {/* En-tête : icône + statut */}
                <div className="flex items-start justify-between gap-2">
                    <div className={`w-10 h-10 rounded-lg ${colors.bgSoft} flex items-center justify-center ${disabled ? 'opacity-60' : ''}`}>
                        <item.icon size={18} stroke={1.8} className={colors.text} />
                    </div>
                    <StatusPill status={item.status} />
                </div>

                {/* Titre */}
                <h3
                    className="text-slate-900 leading-tight"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: '14.5px',
                        letterSpacing: '-0.012em',
                    }}
                >
                    {item.name}
                </h3>

                {/* Description */}
                <p className="text-[12px] text-slate-600 leading-snug line-clamp-2 flex-1">
                    {item.description}
                </p>

                {/* CTA footer */}
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100">
                    {disabled ? (
                        <span className="text-[10px] uppercase tracking-[0.10em] text-slate-400 font-medium">
                            Disponible bientôt
                        </span>
                    ) : (
                        <>
                            <span className={`text-[10px] uppercase tracking-[0.10em] font-medium ${colors.text}`}>
                                Ouvrir
                            </span>
                            <span className={`w-5 h-5 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center ${colors.text} group-hover:translate-x-0.5 group-hover:shadow-md transition-all`}>
                                <IconArrowRight size={11} stroke={2.4} />
                            </span>
                        </>
                    )}
                </div>
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const OperationalReferencesPage = () => {
    const navigate = useNavigate();
    const [activeTabId, setActiveTabId] = useState<string>(TABS[0].id);
    const [searchTerm, setSearchTerm] = useState('');

    const activeTab = useMemo(() => TABS.find((t) => t.id === activeTabId)!, [activeTabId]);

    // Items filtrés par recherche (sur l'onglet actif)
    const filteredItems = useMemo(() => {
        const needle = searchTerm.trim().toLowerCase();
        if (!needle) return activeTab.items;
        return activeTab.items.filter(
            (it) =>
                it.name.toLowerCase().includes(needle) ||
                it.description.toLowerCase().includes(needle),
        );
    }, [activeTab, searchTerm]);

    // Stats globales
    const stats = useMemo(() => {
        let total = 0;
        let configured = 0;
        TABS.forEach((tab) => tab.items.forEach((item) => {
            total++;
            if (item.status === 'configured') configured++;
        }));
        return { total, configured, coverage: Math.round((configured / total) * 100) };
    }, []);

    // Compteurs par onglet pour les pills
    const tabOptions: SegmentedFilterOption[] = useMemo(
        () => TABS.map((tab) => {
            const cfg = tab.items.filter((i) => i.status === 'configured').length;
            return {
                value: tab.id,
                label: tab.shortLabel,
                count: cfg,
                color: tab.color === 'emerald' ? 'green'
                    : tab.color === 'red' ? 'red'
                    : tab.color === 'blue' ? 'blue'
                    : 'indigo',
            };
        }),
        [],
    );

    const handleOpenItem = (item: ReferenceItem) => {
        if (item.url) navigate(item.url);
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1500px] mx-auto">

                {/* ─── Header premium ─── */}
                <div className="mb-5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5">
                        <span className="uppercase tracking-[0.16em] font-medium">SafeX 360</span>
                        <IconChevronRight size={10} className="text-slate-400" />
                        <span className="uppercase tracking-[0.16em] font-medium">Paramètres</span>
                        <IconChevronRight size={10} className="text-slate-400" />
                        <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">Données de Références</span>
                    </div>

                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shadow-teal-200">
                                <IconDatabase size={20} stroke={1.8} className="text-white" />
                            </div>
                            <div>
                                <h1
                                    className="text-slate-900 leading-tight"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(22px, 2.4vw, 28px)',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    Données de Références
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    Référentiels opérationnels HSE de la plateforme — sites, équipes, types d'événements et outils de mesure.
                                </p>
                            </div>
                        </div>

                        {/* Mini-KPI couverture */}
                        <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="relative w-9 h-9 flex-shrink-0">
                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                    <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="15"
                                        fill="none"
                                        stroke="#14b8a6"
                                        strokeWidth="3"
                                        strokeDasharray={`${(stats.coverage / 100) * 94.25} 94.25`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-teal-700">
                                    {stats.coverage}%
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 leading-none">Couverture</p>
                                <p className="text-[12.5px] text-slate-800 mt-0.5 leading-none">
                                    <span className="font-semibold">{stats.configured}</span>
                                    <span className="text-slate-500"> / {stats.total} référentiels</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Tabs + recherche ─── */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <SegmentedFilter
                                value={activeTabId}
                                onChange={setActiveTabId}
                                options={tabOptions}
                                size="md"
                            />
                        </div>
                        <div className="relative lg:w-[240px] flex-shrink-0">
                            <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher dans cet onglet…"
                                className="w-full pl-8 pr-3 py-2 text-[12.5px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* ─── En-tête de la section active ─── */}
                <div className="flex items-start gap-3 mb-4 px-1">
                    <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClassMap[activeTab.color].bgSoft}`}
                    >
                        <activeTab.icon size={16} stroke={1.8} className={colorClassMap[activeTab.color].text} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2
                            className="text-slate-900 leading-tight"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '17px',
                                letterSpacing: '-0.014em',
                            }}
                        >
                            {activeTab.label}
                        </h2>
                        <p className="text-[12.5px] text-slate-600 mt-0.5 leading-snug">
                            {activeTab.description}
                        </p>
                    </div>
                </div>

                {/* ─── Grille de cartes ─── */}
                {filteredItems.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-xl py-12 text-center">
                        <p className="text-[13.5px] text-slate-500">
                            Aucun référentiel ne correspond à « {searchTerm} » dans cet onglet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {filteredItems.map((item) => (
                            <ReferenceCard
                                key={item.id}
                                item={item}
                                tabColor={activeTab.color}
                                onOpen={() => handleOpenItem(item)}
                            />
                        ))}
                    </div>
                )}

                {/* ─── Note de bas de page explicative ─── */}
                <div className="mt-6 bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-teal-100 text-teal-700 flex-shrink-0">
                        <IconDatabase size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5">
                            À propos des données de références
                        </p>
                        <p>
                            Ces référentiels constituent le socle de toutes les déclarations HSE de la plateforme.
                            Chaque module métier (Incidents, Audits, Risques…) puise dans ces listes maîtresses.
                            Modifier ou enrichir un référentiel impacte automatiquement les formulaires et tableaux de bord associés.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationalReferencesPage;
