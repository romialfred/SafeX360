import React, { useEffect, useState } from 'react';
import {
    // Home
    IconHome, // Shield
    IconShield, // Activity
    IconActivity, // Target
    IconTarget, // AlertTriangle
    IconAlertTriangle, // HardHat
    IconHelmet, // ClipboardCheck
    IconClipboardCheck, // CheckSquare
    IconSquareCheck, // Calendar
    IconCalendar, // BookOpen
    IconBook, // MessageSquare
    IconMessageCircle, // Settings
    IconSettings, // ChevronLeft
    IconChevronLeft, // ChevronRight
    IconChevronRight, // Plus
    IconPlus, // Minus
    IconMinus, // Search
    IconSearch, // Users
    IconUsers, // Eye
    IconEye, // FileText
    IconFileText, // Clock
    IconClock, // Lightbulb
    IconBulb, // Zap
    IconBolt, // BarChart3
    IconChartBar, // Beaker
    IconFlask2, // FileCheck
    IconFileCheck, // UserCheck
    IconUserCheck, // FolderOpen
    IconFolderOpen, // Bell
    IconBell, IconReport, IconCalculator, IconTrendingUp, // Sparkles
    IconFileTextSpark, IconExternalLink
} from '@tabler/icons-react';
import { isModuleEnabled } from '../data/ModuleConfig';
import ModuleSubscriptionModal from '../Home/ModuleSubscriptionModal';
import { useAppSelector } from '../../../slices/hooks';
import { useDispatch } from 'react-redux';
import { collapse, expand } from '../../../slices/CollapseSlice';
import { useLocation, useNavigate, Link } from 'react-router-dom';

/**
 * Logo SafeX360 — wordmark texte premium (4K-sharp, sans bitmap).
 * "SafeX" en blanc avec drop-shadow subtil + "360" placé dessous,
 * chaque chiffre dans la couleur de marque historique :
 *   3 → vert émeraude   (sécurité / conformité)
 *   6 → bleu            (surveillance HSE)
 *   0 → rouge           (alerte / criticité)
 * Variantes : full (sidebar étendue) + compact (sidebar repliée).
 */
const LOGO_FONT_STACK = "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";

const SafeXLogo = ({ compact = false }: { compact?: boolean }) => {
    if (compact) {
        return (
            <div className="flex flex-col items-center leading-[0.85] select-none py-0.5">
                <span
                    className="text-[22px] text-white antialiased"
                    style={{
                        fontFamily: LOGO_FONT_STACK,
                        fontWeight: 900,
                        textShadow: '0 1px 6px rgba(255,255,255,0.08)',
                        letterSpacing: '-0.05em',
                    }}
                >
                    S
                </span>
                <div className="flex items-baseline" style={{ gap: '0px', marginTop: '-1px' }}>
                    <span className="text-[11px] leading-none text-emerald-400" style={{ fontFamily: LOGO_FONT_STACK, fontWeight: 900, letterSpacing: '-0.04em' }}>3</span>
                    <span className="text-[11px] leading-none text-blue-400" style={{ fontFamily: LOGO_FONT_STACK, fontWeight: 900, letterSpacing: '-0.04em' }}>6</span>
                    <span className="text-[11px] leading-none text-red-400" style={{ fontFamily: LOGO_FONT_STACK, fontWeight: 900, letterSpacing: '-0.04em' }}>0</span>
                </div>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-start leading-[0.82] select-none">
            <span
                className="text-[36px] text-white antialiased"
                style={{
                    fontFamily: LOGO_FONT_STACK,
                    fontWeight: 900,
                    textShadow: '0 2px 10px rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.5)',
                    letterSpacing: '-0.045em',
                    WebkitFontSmoothing: 'antialiased',
                }}
            >
                SafeX
            </span>
            <div className="flex items-baseline" style={{ gap: '0px', marginTop: '-2px', marginLeft: '1px' }}>
                <span
                    className="text-[28px] leading-none text-emerald-400"
                    style={{ fontFamily: LOGO_FONT_STACK, fontWeight: 900, letterSpacing: '-0.04em', textShadow: '0 0 12px rgba(52,211,153,0.32)' }}
                >3</span>
                <span
                    className="text-[28px] leading-none text-blue-400"
                    style={{ fontFamily: LOGO_FONT_STACK, fontWeight: 900, letterSpacing: '-0.04em', textShadow: '0 0 12px rgba(96,165,250,0.32)' }}
                >6</span>
                <span
                    className="text-[28px] leading-none text-red-400"
                    style={{ fontFamily: LOGO_FONT_STACK, fontWeight: 900, letterSpacing: '-0.04em', textShadow: '0 0 12px rgba(248,113,113,0.32)' }}
                >0</span>
            </div>
        </div>
    );
};

interface SubMenuItem {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    color: string;
    subItems?: SubMenuItem[];
}

// Sidebar v2 Phase 2.a — Refonte traduite FR + palette HSE sémantique cohérente
// Mapping couleurs (cohérent avec Home.tsx) :
//   prévention (proactif)     → vert
//   surveillance (incidents)  → bleu
//   actions correctives       → orange
//   risques (danger HSE)      → rouge
//   EPI (vigilance)           → jaune/ambre
//   audits ISO 19011          → indigo
//   conformité                → vert (compliant)
//   planification             → ambre
//   communication             → rose (engagement)
//   reports & analytics       → teal (brand)
//   knowledge center          → cyan (savoir)
//   administration            → ardoise (neutre, surtout PAS rouge "danger")
const menuItems: MenuItem[] = [
    {
        id: 'home',
        label: 'Accueil',
        icon: IconHome,
        color: 'text-teal-600',
    },
    {
        id: 'dashboard',
        label: 'Tableau de bord',
        icon: IconChartBar,
        color: 'text-teal-600',
    },
    {
        id: 'prevention',
        label: 'Activités Préventives',
        icon: IconShield,
        color: 'text-green-600',
        subItems: [
            { id: 'non-conformity', label: 'Non-conformités', icon: IconAlertTriangle },
            { id: 'inspections', label: 'Inspections HSE', icon: IconSearch },
            { id: 'meetings', label: 'Réunions Sécurité', icon: IconUsers },
            { id: 'management-tour', label: 'Tournées Leadership', icon: IconEye }
        ]
    },
    {
        id: 'monitoring',
        label: 'Surveillance des Activités',
        icon: IconActivity,
        color: 'text-blue-600',
        subItems: [
            { id: 'incident-management', label: 'Gestion des Incidents', icon: IconAlertTriangle },
            { id: 'investigations', label: 'Investigations', icon: IconSearch },
            { id: 'action-plans-inc', label: 'Plans d\'Actions', icon: IconFileText }
        ]
    },
    {
        id: 'actions',
        label: 'Actions Correctives',
        icon: IconTarget,
        color: 'text-orange-600',
        subItems: [
            { id: 'pending-actions', label: 'Actions en Attente', icon: IconClock },
            { id: 'action-plan', label: 'Plan d\'Actions', icon: IconFileText },
            { id: 'recommendations', label: 'Recommandations', icon: IconBulb },
            { id: 'adhoc-actions', label: 'Suggestions d\'Amélioration', icon: IconBolt }
        ]
    },
    {
        id: 'risk',
        label: 'Gestion des Risques',
        icon: IconAlertTriangle,
        color: 'text-red-600',
        subItems: [
            { id: 'risk-overview', label: 'Vue d\'Ensemble', icon: IconChartBar },
            { id: 'risk-register', label: 'Registre des Risques', icon: IconFileText },
            { id: 'risk-assessment', label: 'Évaluation des Risques', icon: IconClipboardCheck },
            { id: 'chemical-register', label: 'Registre Chimique', icon: IconFlask2 }
        ]
    },
    {
        id: 'ppe',
        label: 'Gestion des EPI',
        icon: IconHelmet,
        color: 'text-yellow-600',
        subItems: [
            { id: 'ppe-overview', label: 'Vue d\'Ensemble EPI', icon: IconChartBar },
            { id: 'ppe-monitoring', label: 'Suivi des EPI', icon: IconActivity },
            { id: 'ppe-request', label: 'Demande d\'EPI', icon: IconPlus }
        ]
    },
    {
        id: 'audits',
        label: 'Gestion des Audits',
        icon: IconClipboardCheck,
        color: 'text-indigo-600',
        subItems: [
            { id: 'audit-plan', label: 'Plan Annuel d\'Audits', icon: IconCalendar },
            { id: 'audits', label: 'Audits ISO 19011', icon: IconClipboardCheck },
            { id: 'audit-recommendations', label: 'Recommandations', icon: IconBulb }
        ]
    },
    {
        id: 'compliance',
        label: 'Conformité Réglementaire',
        icon: IconSquareCheck,
        color: 'text-green-600',
        subItems: [
            { id: 'compliance-dashboard', label: 'Tableau de Bord', icon: IconChartBar },
            { id: 'requirements', label: 'Exigences Légales', icon: IconFileCheck },
            { id: 'position-assignments', label: 'Affectations par Poste', icon: IconUserCheck },
            { id: 'employee-assignments', label: 'Affectations Employés', icon: IconUsers },
            { id: 'documents', label: 'Documents', icon: IconFolderOpen },
            { id: 'document-validation', label: 'Validation Documents', icon: IconSquareCheck }
        ]
    },
    {
        id: 'planning',
        label: 'Planification Annuelle',
        icon: IconCalendar,
        color: 'text-amber-600',
        subItems: [
            { id: 'hs-activities-planning', label: 'Activités HSE', icon: IconCalendar },
            { id: 'month-theme-subjects', label: 'Thèmes Mensuels', icon: IconBook },
            { id: 'annual-audit-plan', label: 'Plan Annuel Audits', icon: IconClipboardCheck }
        ]
    },
    {
        id: 'communication',
        label: 'Communication Sécurité',
        icon: IconMessageCircle,
        color: 'text-pink-600',
        subItems: [
            { id: 'comm-dashboard', label: 'Tableau de Bord', icon: IconChartBar },
            { id: 'employee-comm', label: 'Communications HSE', icon: IconMessageCircle },
            { id: 'notifications', label: 'Centre de Notifications', icon: IconBell }
        ]
    },
    {
        // Ouvre le SafeX Analytics Center dans un nouvel onglet
        // (intercepté dans le onClick de l'item principal — voir plus bas)
        id: 'reports',
        label: 'Rapports & Analytics',
        icon: IconReport,
        color: 'text-teal-600',
    },
    {
        id: 'knowledge',
        label: 'Centre de Connaissances',
        icon: IconBook,
        color: 'text-cyan-600',
        subItems: [
            { id: 'lessons-learned', label: 'Retours d\'Expérience', icon: IconBook },
            { id: 'document-manager', label: 'Gestionnaire de Documents', icon: IconFolderOpen },
            { id: 'iso-documents', label: 'Standards ISO', icon: IconFileText },
            { id: 'process-docs', label: 'Processus de Travail', icon: IconFileTextSpark }
        ]
    },
    {
        id: 'help',
        label: 'Centre d\'Aide',
        icon: IconMessageCircle,
        color: 'text-emerald-600',
        subItems: [
            { id: 'how-to', label: 'Guides Pratiques', icon: IconBook },
            { id: 'features-overview', label: 'Aperçu des Fonctionnalités', icon: IconEye },
            { id: 'technical-documentation', label: 'Documentation Technique', icon: IconFileText }
        ]
    },
    {
        id: 'settings',
        label: 'Administration',
        icon: IconSettings,
        color: 'text-slate-600',
    },
];

export const menuIdToUrl: Record<string, string> = {
    // Home
    home: "/",
    dashboard: "/dashboard",

    // Prevention Activities
    "non-conformity": "/non-conformity",
    inspections: "/PGI",
    meetings: "/hs-Meetings",
    "management-tour": "/steering-tours",

    // Monitoring Activities
    "incident-management": "/incidents",
    investigations: "/investigation",
    "action-plans-inc": "/corrective",

    // Actions Managers
    "pending-actions": "/pending-actions",
    "action-plan": "/corrective",
    recommendations: "/audit-recommendations",
    "adhoc-actions": "/adhoc-actions",

    // Risk Management
    "risk-overview": "/risks-overview",
    "risk-register": "/risks-register",
    "risk-assessment": "/risks-assessment",
    "chemical-register": "/chemical-register",

    // PPE Management
    "ppe-overview": "/ppe-management",
    "ppe-monitoring": "/ppe-monitoring",
    "ppe-request": "/ppe-request",

    // Audits Management
    "audit-plan": "/annual-audit-plan",
    audits: "/audit-management",
    "audit-recommendations": "/audit-recommendations",

    // Compliance Management
    "compliance-dashboard": "/compliance-dashboard",
    requirements: "/compliance-requirements",
    "position-assignments": "/compliance-assignment",
    "employee-assignments": "/employee-assignment",
    documents: "/compliance-documents",
    "document-validation": "/document-validation",

    // Planning
    "hs-activities-planning": "/hs-activities-planning",
    "month-theme-subjects": "/month-theme-subjects",
    "annual-audit-plan": "/annual-audit-plan",

    // Knowledge Center
    "lessons-learned": "/lesson-learn",
    "document-manager": "/document-management",
    "iso-documents": "/iso-documents",
    "process-docs": "/process-docs",

    // Safety Communication
    "comm-dashboard": "/communication-dashboard",
    "employee-comm": "/communications",
    notifications: "/notifications",


    // Reports
    "monthly-reports": "/monthly-reports",
    "KPI-reports": "/KPI-reports",
    "performance-reports": "/performance-reports",
    "corporate-reports": "/corporate-reports",
    "executive-reports": "/executive-reports",
    "trend-analysis": "/trend-analysis",


    // Help Center
    "how-to": "/how-to",
    "features-overview": "/features-overview",
    "technical-documentation": "/technical-docs",

    // Users & Settings (direct)
    users: "/users-management",
    settings: "/settings",
    "ai-assistant": "/ai-assistant"
};



const Sidebar = () => {
    const [activeItem, setActiveItem] = useState<string>('home');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [showModal, setShowModal] = useState(false);
    const [selectedModuleName, setSelectedModuleName] = useState('');
    const collapsed = useAppSelector((state) => state.collapse);
    const navigate = useNavigate();
    const location = useLocation();
    // const menu = useAppSelector((state) => state.menu);
    const dispatch = useDispatch();
    const onMenuItemClick = (itemId: string) => {
        setActiveItem(itemId);
        onMenuItemClick?.(itemId);
    };
    const getModuleName = (itemId: string): string => {
        // Find in main menu items
        const mainItem = menuItems.find(item => item.id === itemId);
        if (mainItem) return mainItem.label;

        // Find in sub items
        for (const item of menuItems) {
            if (item.subItems) {
                const subItem = item.subItems.find(sub => sub.id === itemId);
                if (subItem) return subItem.label;
            }
        }
        return 'Unknown Module';
    };
    const handleItemClick = (itemId: string) => {
        // Check if module is enabled
        if (!isModuleEnabled(itemId) && itemId !== 'home' && itemId !== 'users' && itemId !== 'settings') {
            setSelectedModuleName(getModuleName(itemId));
            setShowModal(true);
            return;
        }

        setActiveItem(itemId);
        navigate(menuIdToUrl[itemId]);
    };

    const handleSubItemClick = (subItemId: string) => {
        // Check if module is enabled
        if (!isModuleEnabled(subItemId)) {
            setSelectedModuleName(getModuleName(subItemId));
            setShowModal(true);
            return;
        }

        setActiveItem(subItemId);
        navigate(menuIdToUrl[subItemId]);
    };

    const toggleExpanded = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set<string>();
        if (expandedItems.has(itemId)) {
            // If clicking on already expanded item, collapse it
            // newExpanded remains empty (all collapsed)
        } else {
            // If clicking on collapsed item, expand only this one
            newExpanded.add(itemId);
        }
        setExpandedItems(newExpanded);
    };

    // Sync active menu with current route
    useEffect(() => {
        const normalize = (p: string) => {
            if (!p) return '/';
            // remove trailing slash except for root
            return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
        };

        const pathname = normalize(location.pathname);

        // Sort mappings by path length (desc) to match the most specific route first
        const entries = Object.entries(menuIdToUrl).sort((a, b) => b[1].length - a[1].length);

        let matchedId: string | null = null;
        for (const [id, url] of entries) {
            const base = normalize(url);
            if (base === '/') {
                if (pathname === '/') {
                    matchedId = id;
                    break;
                }
            } else if (pathname === base || pathname.startsWith(base + '/')) {
                matchedId = id;
                break;
            }
        }

        if (!matchedId) {
            // default to home
            setActiveItem('home');
            setExpandedItems(new Set());
            return;
        }

        setActiveItem(matchedId);

        // Auto-expand the parent section if a sub-item matches
        let parentId: string | undefined;
        for (const item of menuItems) {
            if (item.subItems?.some((s) => s.id === matchedId)) {
                parentId = item.id;
                break;
            }
        }
        if (parentId) {
            setExpandedItems(new Set([parentId]));
        } else {
            setExpandedItems(new Set());
        }
    }, [location.pathname]);

    return (
        <div className="flex z-[100] relative">
            <div className={`${collapsed ? "w-20" : "w-72"}    p-3  relative h-screen overflow-y-auto  flex-col flex   transition-[width] duration-500 `}>

            </div>
            <div className={`
      ${collapsed ? 'w-20' : 'w-72'} 
      bg-blackbg text-white h-screen scrollbar-hide fixed overflow-y-auto shadow-xl transition-all duration-300 ease-in-out [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
    `}>
                {/* Refonte sidebar header — Logo SafeX360 top-left + "Navigation HSE" sous-titre */}
                <div className="p-4 border-b border-gray-700/60 bg-gradient-to-b from-gray-900/40 to-transparent">
                    <div className="flex items-start justify-between gap-2">
                        <Link to="/" className="flex flex-col items-start gap-1 hover:opacity-95 transition flex-1 min-w-0" title="SafeX360 — Plateforme HSE">
                            {collapsed ? (
                                <SafeXLogo compact />
                            ) : (
                                <>
                                    <SafeXLogo />
                                    <div className="flex items-center gap-1.5 mt-2.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        <h1 className="text-[10px] uppercase tracking-[0.18em] text-gray-300">Navigation HSE</h1>
                                    </div>
                                </>
                            )}
                        </Link>
                        <button
                            onClick={() => dispatch(collapsed ? expand() : collapse())}
                            className="p-1.5 cursor-pointer hover:bg-gray-700/70 rounded-lg transition-all duration-300 flex-shrink-0"
                            title={collapsed ? "Étendre" : "Réduire"}
                        >
                            {collapsed ? (
                                <IconChevronRight className="w-4 h-4 text-gray-300" />
                            ) : (
                                <IconChevronLeft className="w-4 h-4 text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Navigation : padding équilibré, interlignes confortables, contrastes améliorés */}
                <nav className="py-3 px-1">
                    <div className="space-y-1">
                        {menuItems.map(item => {
                            const isActive = activeItem === item.id;
                            const isExpanded = expandedItems.has(item.id);
                            const hasSubItems = item.subItems && item.subItems.length > 0;
                            const isEnabled = isModuleEnabled(item.id) || item.id === 'home' || item.id === 'users' || item.id === 'settings';

                            return (
                                <div key={item.id}>
                                    {/* Item principal : padding aéré, contraste renforcé */}
                                    <div
                                        className={`
                                            mx-2 flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors duration-150
                                            ${isActive ? 'bg-slate-700 text-white shadow-sm' : isEnabled ? 'text-slate-200 hover:bg-slate-800/60 hover:text-white' : 'text-slate-500 opacity-60'}
                                            ${hasSubItems && isExpanded && !isActive ? 'bg-slate-800/40' : ''}
                                            group
                                            ${!isEnabled ? 'cursor-not-allowed' : ''}
                                        `}
                                        onClick={(e) => {
                                            // Rapports & Analytics : ouvre le SafeX Analytics Center dans un nouvel onglet
                                            if (item.id === 'reports') {
                                                const url = (import.meta as any).env?.VITE_SAFEX_ANALYTICS_URL || '/safex-analytics/';
                                                window.open(url, '_blank', 'noopener,noreferrer');
                                                return;
                                            }
                                            if (hasSubItems) {
                                                toggleExpanded(item.id, e);
                                            } else {
                                                handleItemClick(item.id);
                                            }
                                        }}
                                    >
                                        <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isEnabled ? item.color : 'text-slate-500'}`} stroke={1.75} />
                                        {!collapsed && (
                                            <>
                                                <span className={`flex-1 text-[13px] leading-snug whitespace-nowrap overflow-hidden text-ellipsis ${isActive ? 'font-medium' : 'font-medium'}`}>
                                                    {item.label}
                                                </span>
                                                {item.id === 'reports' && (
                                                    <span className="flex-shrink-0 text-teal-400 group-hover:text-teal-200 transition-colors" title="Ouvre dans un nouvel onglet">
                                                        <IconExternalLink className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                                {hasSubItems && (
                                                    <span className="flex-shrink-0 text-slate-400 group-hover:text-slate-100 transition-colors">
                                                        {isExpanded ? <IconMinus className="w-3.5 h-3.5" /> : <IconPlus className="w-3.5 h-3.5" />}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Sous-items : indentation visible, bordure verticale colorée */}
                                    {!collapsed && hasSubItems && isExpanded && (
                                        <div className={`ml-6 my-1 pl-3 border-l-2 ${item.color.replace('text-', 'border-').replace('-600', '-500/40').replace('-700', '-500/40')}`}>
                                            {item.subItems!.map(subItem => {
                                                const isSubActive = activeItem === subItem.id;
                                                const isSubEnabled = isModuleEnabled(subItem.id);
                                                return (
                                                    <div
                                                        key={subItem.id}
                                                        className={`
                                                            mx-1 flex items-center gap-2.5 px-2.5 py-1.5 rounded cursor-pointer transition-colors duration-150
                                                            ${isSubActive ? 'bg-slate-700 text-white' :
                                                                isSubEnabled ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white' :
                                                                    'text-slate-500 opacity-50 cursor-not-allowed'}
                                                            group
                                                        `}
                                                        onClick={() => handleSubItemClick(subItem.id)}
                                                    >
                                                        <subItem.icon className="w-3.5 h-3.5 flex-shrink-0" stroke={1.75} />
                                                        <span className={`text-[12px] leading-snug ${!isSubEnabled ? 'italic' : ''}`}>
                                                            {subItem.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>
            </div>
            {/* Modal */}
            <ModuleSubscriptionModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                moduleName={selectedModuleName}
            />
        </div>
    );
};

export default Sidebar;
