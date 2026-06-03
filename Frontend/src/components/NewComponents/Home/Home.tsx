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
    IconAlertOctagon,
    IconFlame,
    IconCircleDashedCheck,
    IconChartPie,
    IconHelp,
} from '@tabler/icons-react';
import ModuleSubscriptionModal from './ModuleSubscriptionModal';
import { isModuleEnabled } from '../data/ModuleConfig';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tooltip } from '@mantine/core';

type ModuleItem = string | { label: string; url: string; moduleId?: string };

interface ModuleCard {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;     // text color class (text-{color}-700)
    bgColor: string;   // composite classes for translucent backgrounds
    items: ModuleItem[];
    url: string;
    requiredModuleId?: string;
}

const moduleGroups: ModuleCard[] = [
    {
        id: 'preventives-activities',
        title: 'Activités Préventives',
        description: 'Gestion proactive des risques et prévention',
        icon: IconShield,
        color: 'text-green-700',
        bgColor: 'bg-green-50/70 border-green-200/60',
        items: ['Central Findings', 'Inspections Managers', 'Meeting Managers', 'Leadership Walk'],
        url: '/non-conformity'
    },
    {
        id: 'preventives-activities-2',
        title: 'Surveillance des Activités',
        description: 'Gestion et investigation des incidents',
        icon: IconActivity,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50/70 border-blue-200/60',
        items: ['Incidents Management', 'Investigations', 'Action Plans'],
        url: '/incidents'
    },
    {
        id: 'actions-managers',
        title: 'Actions Correctives',
        description: "Suivi et pilotage des plans d'actions",
        icon: IconTarget,
        color: 'text-orange-700',
        bgColor: 'bg-orange-50/70 border-orange-200/60',
        items: ['Pending Actions', 'Action Plan', 'Recommendations', 'Improvement Ideas'],
        url: '/corrective'
    },
    {
        id: 'pending-actions-hub',
        requiredModuleId: 'pending-actions',
        title: 'Hub de Suivi',
        description: 'Validations et approbations en attente',
        icon: IconCircleCheck,
        color: 'text-teal-700',
        bgColor: 'bg-teal-50/70 border-teal-200/60',
        items: [
            { label: 'Pending Actions', url: '/pending-actions', moduleId: 'pending-actions' },
            { label: 'PPE Requests', url: '/ppe-request', moduleId: 'ppe-request' },
            { label: 'Document Validation', url: '/document-validation', moduleId: 'document-validation' },
            { label: 'Document Management', url: '/document-management', moduleId: 'documents' },
        ],
        url: '/pending-actions'
    },
    {
        id: 'risk-management',
        title: 'Gestion des Risques',
        description: 'Évaluation et maîtrise des risques HSE',
        icon: IconAlertTriangle,
        color: 'text-red-700',
        bgColor: 'bg-red-50/70 border-red-200/60',
        items: ['Risk Overview', 'Risk Register', 'Risk Assessment', 'Chemical Register'],
        url: '/risks-overview'
    },
    {
        id: 'ppe-management',
        title: 'Gestion des EPI',
        description: 'Équipements de protection individuelle',
        icon: IconHelmet,
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50/70 border-yellow-200/60',
        items: ['PPE Overview', 'PPE Monitoring', 'PPE Request'],
        url: '/ppe-management'
    },
    {
        id: 'audits-management',
        title: 'Audits Internes',
        description: "Programme d'audits ISO 19011",
        icon: IconClipboardCheck,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50/70 border-indigo-200/60',
        items: ['Annual audit plan', 'Audits', 'Recommendations'],
        url: '/audit-management'
    },
    {
        id: 'compliance-management',
        title: 'Conformité Réglementaire',
        description: 'Veille et conformité normative',
        icon: IconSquareCheck,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50/70 border-emerald-200/60',
        items: ['Requirements', 'Positions Assignments', 'Employee Assignments'],
        url: '/compliance-dashboard'
    },
    {
        id: 'planning',
        title: 'Planification Annuelle',
        description: 'Calendrier des activités HSE',
        icon: IconCalendar,
        color: 'text-amber-700',
        bgColor: 'bg-amber-50/70 border-amber-200/60',
        items: ['HS Activities Planning', 'Month Theme Subjects', 'Annual Audit Plan'],
        url: '/hs-activities-planning'
    },
    {
        id: 'knowledge-management',
        title: 'Centre de Connaissances',
        description: 'Capitalisation et partage REX',
        icon: IconBook,
        color: 'text-cyan-700',
        bgColor: 'bg-cyan-50/70 border-cyan-200/60',
        items: ['Lesson Learned', 'Document Manager'],
        url: '/lesson-learn'
    },
    {
        id: 'communication-management',
        title: 'Communication Sécurité',
        description: 'Causeries, notifications, sensibilisation',
        icon: IconMessage,
        color: 'text-pink-700',
        bgColor: 'bg-pink-50/70 border-pink-200/60',
        items: ['Dashboard', 'HSE Communications', 'Notification Managers'],
        url: '/communication-dashboard'
    },
    {
        id: 'reports',
        title: 'Rapports & Analytics',
        description: 'Reporting avancé et tableaux de bord',
        icon: IconChartBar,
        color: 'text-teal-700',
        bgColor: 'bg-teal-50/70 border-teal-200/60',
        items: ['Monthly Report', 'KPI Review', 'Performance Report', 'Corporate Report'],
        url: '/monthly-reports'
    },
    {
        id: 'help',
        title: "Centre d'Aide",
        description: 'Guides, documentation et support utilisateur',
        icon: IconLifebuoy,
        color: 'text-violet-700',
        bgColor: 'bg-violet-50/70 border-violet-200/60',
        items: ['Guides Pratiques', 'Aperçu Fonctionnalités', 'Documentation Technique'],
        url: '/how-to'
    },
    {
        id: 'iso-documents',
        title: 'Documentation ISO',
        description: 'Standards internationaux applicables',
        icon: IconFileText,
        color: 'text-slate-700',
        bgColor: 'bg-slate-50/70 border-slate-200/60',
        items: ['ISO 45001', 'ISO 19011', 'ISO 9001'],
        url: '/iso-documents'
    },
    {
        id: 'settings',
        title: 'Administration',
        description: 'Configuration système et préférences',
        icon: IconSettings,
        color: 'text-slate-700',
        bgColor: 'bg-slate-50/70 border-slate-200/60',
        items: ['Incident Management', 'Places & Environment', 'Resources & Staff', 'Tools & Measurements'],
        url: '/settings'
    }
];

interface HSEKPIs {
    openIncidents: number | null;
    closedIncidents: number | null;
    nearMisses: number | null;
    capaCompletionRate: number | null;
}

const NewHomePage = () => {
    const [showModal, setShowModal] = React.useState(false);
    const [selectedModuleName, setSelectedModuleName] = React.useState('');
    const [kpis, setKpis] = React.useState<HSEKPIs>({
        openIncidents: null,
        closedIncidents: null,
        nearMisses: null,
        capaCompletionRate: null,
    });
    const navigate = useNavigate();
    const alwaysAccessibleModuleIds = React.useMemo(() => new Set(['users-management', 'settings', 'iso-documents', 'help']), []);

    React.useEffect(() => {
        const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:9000';
        const opts = { withCredentials: true };
        Promise.allSettled([
            axios.get(`${apiBase}/hns/incidents/getAll`, opts),
            axios.get(`${apiBase}/hns/corrective-action/getAll`, opts),
        ]).then(([incidentsRes, capasRes]) => {
            const incidents = incidentsRes.status === 'fulfilled' ? (incidentsRes.value.data || []) : [];
            const capas = capasRes.status === 'fulfilled' ? (capasRes.value.data || []) : [];

            const isOpen = (i: any) => {
                const s = String(i.status || '').toUpperCase();
                return s !== 'CLOSED' && s !== 'REJECTED';
            };
            const isClosed = (i: any) => String(i.status || '').toUpperCase() === 'CLOSED';

            // Quasi-accidents : heuristique basée sur le titre des incidents seed (les vrais titres seed contiennent ces mots-clés)
            const isNearMissTitle = (t: string) => {
                if (!t) return false;
                const low = t.toLowerCase();
                return low.includes('quasi') || low.includes('near') || low.includes('manquant') || low.includes('non balisée') || low.includes('non porté') || low.includes('instable') || low.includes('mal arrimée');
            };

            const open = Array.isArray(incidents) ? incidents.filter(isOpen).length : 0;
            const closed = Array.isArray(incidents) ? incidents.filter(isClosed).length : 0;
            const nm = Array.isArray(incidents) ? incidents.filter((i: any) => isNearMissTitle(i.title)).length : 0;

            const completedCapa = Array.isArray(capas) ? capas.filter((c: any) => {
                const s = String(c.status || '').toUpperCase();
                return s === 'COMPLETED' || s === '2';
            }).length : 0;
            const totalCapa = Array.isArray(capas) ? capas.length : 0;

            setKpis({
                openIncidents: open,
                closedIncidents: closed,
                nearMisses: nm,
                capaCompletionRate: totalCapa > 0 ? Math.round((completedCapa / totalCapa) * 100) : null,
            });
        }).catch(() => { });
    }, []);

    const isFeatureEnabled = React.useCallback((moduleId?: string) => {
        if (!moduleId) return true;
        if (alwaysAccessibleModuleIds.has(moduleId)) return true;
        return isModuleEnabled(moduleId);
    }, [alwaysAccessibleModuleIds]);

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
            <div className="flex flex-col gap-5">
                {/* KPI : 4 cartes opérationnelles, design distinct des modules (gradient subtil, gros chiffre, accent gauche) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* 1. Incidents en cours */}
                    <div className="relative bg-gradient-to-br from-orange-50 via-white to-white rounded-xl border border-orange-200/60 p-4 overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 rounded-lg bg-orange-100/80">
                                <IconAlertOctagon className="text-orange-700" size={18} stroke={2} />
                            </div>
                            <Tooltip label="Incidents dont le statut n'est ni clôturé ni rejeté" position="top" withArrow>
                                <span className="text-[10px] uppercase tracking-wider text-orange-700 bg-orange-100/80 px-1.5 py-0.5 rounded">EN COURS</span>
                            </Tooltip>
                        </div>
                        <p className="text-2xl font-semibold text-slate-900 leading-none">{kpis.openIncidents ?? '·'}</p>
                        <p className="text-xs text-slate-600 mt-1.5">Incidents en cours</p>
                    </div>

                    {/* 2. Incidents clôturés */}
                    <div className="relative bg-gradient-to-br from-green-50 via-white to-white rounded-xl border border-green-200/60 p-4 overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 rounded-lg bg-green-100/80">
                                <IconCircleDashedCheck className="text-green-700" size={18} stroke={2} />
                            </div>
                            <Tooltip label="Incidents totalement clôturés avec vérification d'efficacité" position="top" withArrow>
                                <span className="text-[10px] uppercase tracking-wider text-green-700 bg-green-100/80 px-1.5 py-0.5 rounded">CLÔTURÉS</span>
                            </Tooltip>
                        </div>
                        <p className="text-2xl font-semibold text-slate-900 leading-none">{kpis.closedIncidents ?? '·'}</p>
                        <p className="text-xs text-slate-600 mt-1.5">Incidents clôturés</p>
                    </div>

                    {/* 3. Quasi-accidents (Near Miss) */}
                    <div className="relative bg-gradient-to-br from-blue-50 via-white to-white rounded-xl border border-blue-200/60 p-4 overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 rounded-lg bg-blue-100/80">
                                <IconFlame className="text-blue-700" size={18} stroke={2} />
                            </div>
                            <Tooltip label="Quasi-accidents et situations dangereuses signalés sans conséquence corporelle" position="top" withArrow>
                                <span className="text-[10px] uppercase tracking-wider text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">NEAR MISS</span>
                            </Tooltip>
                        </div>
                        <p className="text-2xl font-semibold text-slate-900 leading-none">{kpis.nearMisses ?? '·'}</p>
                        <p className="text-xs text-slate-600 mt-1.5">Quasi-accidents recensés</p>
                    </div>

                    {/* 4. Taux clôture CAPA */}
                    <div className="relative bg-gradient-to-br from-teal-50 via-white to-white rounded-xl border border-teal-200/60 p-4 overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500"></div>
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 rounded-lg bg-teal-100/80">
                                <IconChartPie className="text-teal-700" size={18} stroke={2} />
                            </div>
                            <Tooltip label="CAPA : Corrective and Preventive Actions. Pourcentage des actions correctives et préventives finalisées sur le total ouvert." position="top" withArrow multiline w={240}>
                                <span className="text-[10px] uppercase tracking-wider text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded cursor-help">CAPA <IconHelp size={10} style={{ display: 'inline', marginLeft: 1 }} /></span>
                            </Tooltip>
                        </div>
                        <p className="text-2xl font-semibold text-slate-900 leading-none">{kpis.capaCompletionRate !== null ? `${kpis.capaCompletionRate}%` : '·'}</p>
                        <p className="text-xs text-slate-600 mt-1.5">Taux de clôture CAPA</p>
                    </div>
                </div>

                {/* Section title */}
                <div>
                    <div className="mb-3 flex items-center gap-2">
                        <h2 className="text-base text-slate-800">Accès aux modules HSE</h2>
                        <span className="text-xs text-slate-500">· {moduleGroups.length} modules disponibles</span>
                    </div>

                    {/* Tuiles modules : fond translucide coloré, zoom hover, design distinct des KPI */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {moduleGroups.map((module) => {
                            const moduleEnabled = isFeatureEnabled(module.requiredModuleId ?? module.id);
                            const itemsCount = module.items?.length || 0;
                            return (
                                <button
                                    key={module.id}
                                    type="button"
                                    disabled={!moduleEnabled}
                                    className={`group flex flex-col text-left p-3 rounded-xl border backdrop-blur-sm transition-all duration-200 ${moduleEnabled
                                        ? `${module.bgColor} hover:shadow-lg hover:scale-[1.04] hover:-translate-y-1 cursor-pointer`
                                        : 'bg-slate-50/40 border-slate-100 opacity-50 cursor-not-allowed'
                                        }`}
                                    onClick={() => handleModuleClick(module)}
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 bg-white/60 border border-white/80 shadow-sm group-hover:scale-110 transition-transform`}>
                                        <module.icon className={moduleEnabled ? module.color : 'text-slate-400'} size={18} stroke={2} />
                                    </div>
                                    <h3 className={`text-[13px] leading-tight ${moduleEnabled ? 'text-slate-900' : 'text-slate-500 italic'}`}>
                                        {module.title}
                                    </h3>
                                    <div className="mt-2 pt-2 border-t border-white/60 flex items-center justify-between w-full">
                                        {moduleEnabled ? (
                                            <>
                                                <span className="text-[11px] text-slate-600">
                                                    {itemsCount > 0 ? `${itemsCount} sous-modules` : 'Module'}
                                                </span>
                                                <span className={`text-[11px] ${module.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                    Ouvrir
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Non inclus</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <ModuleSubscriptionModal isOpen={showModal} onClose={() => setShowModal(false)} moduleName={selectedModuleName} />
        </>
    );
};

export default NewHomePage;
