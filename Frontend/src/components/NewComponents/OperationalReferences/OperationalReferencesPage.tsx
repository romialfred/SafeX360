import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from '@mantine/core';
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
    IconInfoCircle,
} from '@tabler/icons-react';
import SegmentedFilter, { SegmentedFilterOption } from '../../UtilityComp/SegmentedFilter';

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
    items: ReferenceItem[];
}

const TABS: TabSection[] = [
    {
        id: 'places',
        label: 'Sites et environnement',
        shortLabel: 'Sites & env.',
        description: 'Cartographie des sites miniers, zones, processus et conditions de surveillance.',
        icon: IconMapPin,
        color: 'emerald',
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

const colorClassMap: Record<TabSection['color'], { bg: string; text: string; bgSoft: string; border: string }> = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', bgSoft: 'bg-emerald-50', border: 'border-emerald-200' },
    blue:    { bg: 'bg-blue-500',    text: 'text-blue-600',    bgSoft: 'bg-blue-50',    border: 'border-blue-200' },
    red:     { bg: 'bg-red-500',     text: 'text-red-600',     bgSoft: 'bg-red-50',     border: 'border-red-200' },
    violet:  { bg: 'bg-violet-500',  text: 'text-violet-600',  bgSoft: 'bg-violet-50',  border: 'border-violet-200' },
};

function ReferenceCard({ item, tabColor, onOpen }: { item: ReferenceItem; tabColor: TabSection['color']; onOpen: () => void }) {
    const disabled = item.status === 'coming';
    const colors = colorClassMap[tabColor];

    return (
        <Tooltip label={item.description} multiline w={220} withArrow position="bottom" openDelay={300}>
            <button
                type="button"
                disabled={disabled}
                onClick={onOpen}
                className={`group relative flex items-center gap-3 text-left bg-white rounded-lg border border-slate-200 px-3 py-2.5 transition-all duration-150 w-full ${
                    disabled
                        ? 'opacity-55 cursor-not-allowed'
                        : 'hover:border-slate-300 hover:shadow-md cursor-pointer active:scale-[0.99]'
                }`}
            >
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg ${colors.bg}`} aria-hidden="true" />

                <div className={`w-8 h-8 rounded-md ${colors.bgSoft} flex items-center justify-center flex-shrink-0 ${disabled ? 'opacity-60' : ''}`}>
                    <item.icon size={15} stroke={1.8} className={colors.text} />
                </div>

                <span className="flex-1 text-[13px] text-slate-800 font-medium truncate">{item.name}</span>

                {item.status === 'configured' ? (
                    <IconCircleCheck size={14} stroke={2} className="text-emerald-500 flex-shrink-0" />
                ) : item.status === 'partial' ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                ) : (
                    <IconClock size={13} stroke={1.8} className="text-slate-400 flex-shrink-0" />
                )}

                {!disabled && (
                    <IconArrowRight size={13} stroke={2} className="text-slate-400 group-hover:text-slate-600 flex-shrink-0 transition-colors" />
                )}
            </button>
        </Tooltip>
    );
}

const INFO_TEXT = "Ces référentiels constituent le socle de toutes les déclarations HSE. Chaque module métier (Incidents, Audits, Risques…) puise dans ces listes. Modifier un référentiel impacte les formulaires et tableaux de bord associés.";

const OperationalReferencesPage = () => {
    const navigate = useNavigate();
    const [activeTabId, setActiveTabId] = useState<string>(TABS[0].id);
    const [searchTerm, setSearchTerm] = useState('');

    const activeTab = useMemo(() => TABS.find((t) => t.id === activeTabId)!, [activeTabId]);

    const filteredItems = useMemo(() => {
        const needle = searchTerm.trim().toLowerCase();
        if (!needle) return activeTab.items;
        return activeTab.items.filter(
            (it) =>
                it.name.toLowerCase().includes(needle) ||
                it.description.toLowerCase().includes(needle),
        );
    }, [activeTab, searchTerm]);

    const stats = useMemo(() => {
        let total = 0;
        let configured = 0;
        TABS.forEach((tab) => tab.items.forEach((item) => {
            total++;
            if (item.status === 'configured') configured++;
        }));
        return { total, configured, coverage: Math.round((configured / total) * 100) };
    }, []);

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
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-5">
            <div className="max-w-[1200px] mx-auto">

                {/* Header compact */}
                <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                        <span className="uppercase tracking-[0.14em] font-medium">SafeX 360</span>
                        <IconChevronRight size={9} className="text-slate-400" />
                        <span className="uppercase tracking-[0.14em] font-medium">Paramètres</span>
                        <IconChevronRight size={9} className="text-slate-400" />
                        <span className="uppercase tracking-[0.14em] text-slate-700 font-medium">Données de Références</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
                                <IconDatabase size={17} stroke={1.8} className="text-white" />
                            </div>
                            <h1
                                className="text-slate-900"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 'clamp(20px, 2.2vw, 24px)',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                Données de Références
                            </h1>
                            <Tooltip label={INFO_TEXT} multiline w={300} withArrow position="bottom-start">
                                <span className="cursor-help text-slate-400 hover:text-teal-600 transition-colors">
                                    <IconInfoCircle size={16} stroke={1.6} />
                                </span>
                            </Tooltip>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-600">
                            <span className="font-semibold text-teal-700">{stats.configured}</span>
                            <span>/ {stats.total} configurés</span>
                        </div>
                    </div>
                </div>

                {/* Tabs + recherche */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 mb-4 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
                        <div className="flex-1 min-w-0">
                            <SegmentedFilter
                                value={activeTabId}
                                onChange={setActiveTabId}
                                options={tabOptions}
                                size="md"
                            />
                        </div>
                        <div className="relative lg:w-[220px] flex-shrink-0">
                            <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher…"
                                className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Section active label */}
                <div className="flex items-center gap-2 mb-3 px-0.5">
                    <activeTab.icon size={15} stroke={1.8} className={colorClassMap[activeTab.color].text} />
                    <h2 className="text-[14px] font-semibold text-slate-800">{activeTab.label}</h2>
                    <span className="text-[11px] text-slate-500">— {activeTab.description}</span>
                </div>

                {/* Grille compacte */}
                {filteredItems.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-lg py-8 text-center">
                        <p className="text-[13px] text-slate-500">
                            Aucun référentiel ne correspond à « {searchTerm} ».
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
            </div>
        </div>
    );
};

export default OperationalReferencesPage;
