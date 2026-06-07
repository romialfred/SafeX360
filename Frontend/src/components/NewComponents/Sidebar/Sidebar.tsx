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
    IconMapPin, // pour points de rassemblement
    IconUrgent, // pour suivi SOS
    IconLayoutDashboard, // pour dashboard emergency
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
    IconFileTextSpark, IconExternalLink,
    // LOT — Module Dosimetrie & Expositions
    IconAtom2,
    IconDeviceWatch,
    IconChartLine,
    IconStethoscope,
    IconAlertOctagon,
    // Phase 6 — Ambient monitoring
    IconBroadcast,
    IconRadar,
    // Phase 7 Frontend-B — Espace personnel travailleur
    IconUserHeart,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { isModuleEnabled } from '../data/ModuleConfig';

// LOT 44 — Mapping label FR → clé i18n pour traduction au rendu
// (les menuItems restent statiques en FR, traduits dynamiquement via t() au render)
const SIDEBAR_LABEL_TO_KEY: Record<string, string> = {
    'Accueil': 'sidebar.home',
    'Tableau de bord': 'sidebar.dashboard',
    'Activités Préventives': 'sidebar.preventiveActivities',
    'Non-conformités': 'sidebar.nonConformity',
    'Inspections HSE': 'sidebar.ohsInspections',
    'Réunions Sécurité': 'sidebar.safetyMeetings',
    'Tournées Leadership': 'sidebar.leadershipTours',
    'Surveillance des Activités': 'sidebar.activityMonitoring',
    'Actions Correctives': 'sidebar.correctiveActions',
    'Gestion des Risques': 'sidebar.riskManagement',
    'Gestion des EPI': 'sidebar.ppeManagement',
    'Gestion des Audits': 'sidebar.auditManagement',
    'Conformité Réglementaire': 'sidebar.regulatoryCompliance',
    'Planification Annuelle': 'sidebar.annualPlanning',
    'Communication Sécurité': 'sidebar.safetyComms',
    'Rapports & Analytics': 'sidebar.reportsAnalytics',
    'Centre de Connaissances': 'sidebar.knowledgeCenter',
    "Centre d'Aide": 'sidebar.helpCenter',
    'Administration': 'sidebar.administration',
    'Gestion des Urgences': 'sidebar.emergencyManagement',
    'Paramètres Urgences': 'sidebar.emergencySettings',
    'Points de rassemblement': 'sidebar.emergencyAssemblyPoints',
    // LOT 48 P6.f — Eclatement Administration en 4 modules
    'Paramètres': 'sidebar.parameters',
    'Gestion des utilisateurs': 'sidebar.usersManagement',
    'Gestion des Modules': 'sidebar.modulesManagement',
    'Cibles et prévisions': 'sidebar.targetsAndForecasts',
    'Données de Références': 'sidebar.operationalReferences',
    'Paramètres système': 'sidebar.systemSettings',
    'Liste des utilisateurs': 'sidebar.usersList',
    'Rôles et permissions': 'sidebar.rolesAndPermissions',
    // LOT — Dosimetrie & Expositions (ns 'dosimetry')
    'Dosimétrie & Expositions': 'dosimetry:sidebar.dosimetry',
    'Tableau de bord Dosimétrie': 'dosimetry:sidebar.dosimetryDashboard',
    'Registre travailleurs exposés': 'dosimetry:sidebar.dosimetryWorkers',
    'Dosimètres & Instruments': 'dosimetry:sidebar.dosimetryDosimeters',
    'Saisie & suivi des doses': 'dosimetry:sidebar.dosimetryDoses',
    'Surveillance d\'ambiance': 'dosimetry:sidebar.dosimetryAmbient',
    'Cartographie d\'ambiance': 'dosimetry:sidebar.dosimetryAmbientMap',
    'Campagnes de surveillance': 'dosimetry:sidebar.dosimetryCampaigns',
    'Profils d\'exposition': 'dosimetry:sidebar.dosimetryExposureProfiles',
    'Surveillance médicale': 'dosimetry:sidebar.dosimetryMedical',
    'Mon dossier': 'dosimetry:sidebar.dosimetryMyMedical',
    'Seuils & dépassements': 'dosimetry:sidebar.dosimetryAlerts',
    'Dossiers de dépassement': 'dosimetry:sidebar.dosimetryOverexposure',
    'Rapports & conformité': 'dosimetry:sidebar.dosimetryReports',
    'Exports réglementaires': 'dosimetry:sidebar.dosimetryRegulatoryExports',
    'Paramètres Dosimétrie': 'dosimetry:sidebar.dosimetrySettings',
};
import ModuleSubscriptionModal from '../Home/ModuleSubscriptionModal';
import { useAppSelector } from '../../../slices/hooks';
import { useDispatch } from 'react-redux';
import { collapse, expand } from '../../../slices/CollapseSlice';
import { closeMobileSidebar } from '../../../slices/MobileSidebarSlice';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import SafeXLogoColor from '../../UtilityComp/SafeXLogoColor';

/**
 * Logo SafeX360 — utilise le composant unifié SafeXLogoColor (LOT 41).
 *
 * Cohérence visuelle garantie entre sidebar / login / 404 : même bouclier
 * gradient teal→rouge, même wordmark "Safe[X]360" avec X teal et 360 rouge.
 *
 * Variantes :
 *  - compact : bouclier seul (sidebar repliée)
 *  - full    : bouclier + wordmark coloré (sidebar dépliée)
 */
const SafeXLogo = ({ compact = false }: { compact?: boolean }) => {
    if (compact) {
        return (
            <div className="flex justify-center w-full">
                <SafeXLogoColor variant="icon" tone="light" size={36} />
            </div>
        );
    }
    return <SafeXLogoColor variant="full" tone="light" size={34} />;
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
    // LOT 48 Phase 1-3 — Module Gestion des Urgences
    {
        id: 'emergency',
        label: 'Gestion des Urgences',
        icon: IconAlertTriangle,
        color: 'text-red-600',
        subItems: [
            { id: 'emergency-dashboard', label: 'Tableau de bord', icon: IconLayoutDashboard },
            { id: 'emergency-sos', label: 'Suivi SOS', icon: IconUrgent },
            { id: 'emergency-assembly-points', label: 'Points de rassemblement', icon: IconMapPin },
            { id: 'emergency-settings', label: 'Paramètres Urgences', icon: IconSettings }
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
    // LOT — Module Dosimetrie & Expositions
    {
        id: 'dosimetry',
        label: 'Dosimétrie & Expositions',
        icon: IconAtom2,
        color: 'text-violet-700',
        subItems: [
            { id: 'dosimetry-dashboard', label: 'Tableau de bord Dosimétrie', icon: IconLayoutDashboard },
            { id: 'dosimetry-workers', label: 'Registre travailleurs exposés', icon: IconUsers },
            { id: 'dosimetry-dosimeters', label: 'Dosimètres & Instruments', icon: IconDeviceWatch },
            { id: 'dosimetry-doses', label: 'Saisie & suivi des doses', icon: IconChartLine },
            { id: 'dosimetry-ambient', label: 'Surveillance d\'ambiance', icon: IconBroadcast },
            { id: 'dosimetry-ambient-map', label: 'Cartographie d\'ambiance', icon: IconRadar },
            { id: 'dosimetry-campaigns', label: 'Campagnes de surveillance', icon: IconClipboardCheck },
            { id: 'dosimetry-exposure-profiles', label: 'Profils d\'exposition', icon: IconAtom2 },
            { id: 'dosimetry-medical', label: 'Surveillance médicale', icon: IconStethoscope },
            { id: 'dosimetry-my-medical', label: 'Mon dossier', icon: IconUserHeart },
            { id: 'dosimetry-alerts', label: 'Seuils & dépassements', icon: IconAlertOctagon },
            { id: 'dosimetry-overexposure', label: 'Dossiers de dépassement', icon: IconFolderOpen },
            { id: 'dosimetry-reports', label: 'Rapports & conformité', icon: IconFileText },
            { id: 'dosimetry-regulatory-exports', label: 'Exports réglementaires', icon: IconFileText },
            { id: 'dosimetry-settings', label: 'Paramètres Dosimétrie', icon: IconSettings },
        ],
    },
    // LOT 48 P6.f — Eclatement Administration en 4 modules de premier niveau
    {
        id: 'admin',
        label: 'Administration',
        icon: IconTarget,
        color: 'text-teal-700',
        subItems: [
            { id: 'target-forecast', label: 'Cibles et prévisions', icon: IconChartBar },
        ],
    },
    {
        id: 'parameters',
        label: 'Paramètres',
        icon: IconSettings,
        color: 'text-slate-600',
        subItems: [
            { id: 'operational-references', label: 'Données de Références', icon: IconFolderOpen },
            { id: 'system-settings', label: 'Paramètres système', icon: IconSettings },
        ],
    },
    {
        id: 'users-management-hub',
        label: 'Gestion des utilisateurs',
        icon: IconUsers,
        color: 'text-orange-700',
        subItems: [
            { id: 'users-list', label: 'Liste des utilisateurs', icon: IconUserCheck },
            { id: 'roles-permissions', label: 'Rôles et permissions', icon: IconShield },
        ],
    },
    {
        id: 'modules-management',
        label: 'Gestion des Modules',
        icon: IconLayoutDashboard,
        color: 'text-indigo-700',
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

    // LOT 48 Phase 1-3 — Emergency Management
    emergency: "/emergency/dashboard",
    "emergency-dashboard": "/emergency/dashboard",
    "emergency-sos": "/emergency/sos",
    "emergency-settings": "/emergency/settings",
    "emergency-assembly-points": "/emergency/assembly-points",

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
    "ai-assistant": "/ai-assistant",

    // LOT 48 P6.f — Eclatement Administration en 4 modules
    admin: "/performance",                       // parent → page Cibles (sous-module pivot)
    "target-forecast": "/performance",
    parameters: "/operational-references",       // parent → renvoie sur la page Donnees de References par defaut
    "operational-references": "/operational-references",
    "system-settings": "/advanced-configuration",
    "users-management-hub": "/users-management",
    "users-list": "/users-management",
    "roles-permissions": "/users-management",    // pour l'instant même URL — onglet futur
    "modules-management": "/modules-management",

    // LOT — Module Dosimetrie & Expositions
    // Phase 2 Frontend-A : ajout du registre des travailleurs exposes.
    // Les autres sous-modules pointent vers /coming-soon (placeholder) pour
    // eviter les 404 tout en laissant la sidebar navigable.
    "dosimetry": "/dosimetry",
    "dosimetry-settings": "/dosimetry/settings",
    "dosimetry-workers": "/dosimetry/workers",
    "dosimetry-dashboard": "/dosimetry",
    "dosimetry-dosimeters": "/dosimetry/dosimeters",
    "dosimetry-doses": "/coming-soon",
    "dosimetry-ambient": "/dosimetry/measurement-points",
    "dosimetry-ambient-map": "/dosimetry/ambient-map",
    "dosimetry-campaigns": "/dosimetry/campaigns",
    "dosimetry-exposure-profiles": "/dosimetry/exposure-profiles",
    "dosimetry-medical": "/dosimetry/medical/planning",
    "dosimetry-my-medical": "/dosimetry/my-medical",
    "dosimetry-alerts": "/dosimetry/alerts",
    "dosimetry-overexposure": "/dosimetry/overexposure",
    // Phase 9-B Frontend : rapports PDF + exports reglementaires
    "dosimetry-reports": "/dosimetry/reports",
    "dosimetry-regulatory-exports": "/dosimetry/regulatory-exports",
};



const Sidebar = () => {
    const [activeItem, setActiveItem] = useState<string>('home');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [showModal, setShowModal] = useState(false);
    const [selectedModuleName, setSelectedModuleName] = useState('');
    const collapsed = useAppSelector((state) => state.collapse);
    const navigate = useNavigate();
    const location = useLocation();
    // LOT 44 — i18n : helper pour traduire les labels via le mapping FR → clé
    const { t } = useTranslation('navigation');
    const tLabel = (label: string): string => {
        const key = SIDEBAR_LABEL_TO_KEY[label];
        return key ? t(key) : label;
    };
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
    // LOT 48 P6.f — Modules administration toujours accessibles (ne necessitent pas
    // de souscription module — ils gerent la configuration meme de la plateforme).
    const ALWAYS_ACCESSIBLE = new Set([
        'home', 'users', 'settings',
        'admin', 'parameters', 'users-management-hub', 'modules-management',
        'target-forecast', 'operational-references', 'system-settings',
        'users-list', 'roles-permissions',
        // LOT — Dosimetrie : parent + page de parametres toujours accessibles
        // (les autres sous-modules s'activeront via Module Management)
        'dosimetry', 'dosimetry-settings',
    ]);

    const handleItemClick = (itemId: string) => {
        // Check if module is enabled
        if (!isModuleEnabled(itemId) && !ALWAYS_ACCESSIBLE.has(itemId)) {
            setSelectedModuleName(getModuleName(itemId));
            setShowModal(true);
            return;
        }

        setActiveItem(itemId);
        navigate(menuIdToUrl[itemId]);
    };

    const handleSubItemClick = (subItemId: string) => {
        // Check if module is enabled
        if (!isModuleEnabled(subItemId) && !ALWAYS_ACCESSIBLE.has(subItemId)) {
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
            // default to home — NE PAS auto-collapse les modules déjà ouverts par l'utilisateur
            setActiveItem('home');
            return;
        }

        setActiveItem(matchedId);

        // Auto-expand the parent section if a sub-item matches.
        // LOT 48 P6.c — Ne plus auto-replier : on AJOUTE le parent à expandedItems
        // au lieu de remplacer le Set. Un module reste ouvert jusqu'à clic explicite
        // sur le "-" du header, ou jusqu'à l'ouverture d'un autre module (via toggleExpanded).
        let parentId: string | undefined;
        for (const item of menuItems) {
            if (item.subItems?.some((s) => s.id === matchedId)) {
                parentId = item.id;
                break;
            }
        }
        if (parentId) {
            setExpandedItems((prev) => {
                if (prev.has(parentId!)) return prev;
                const next = new Set(prev);
                next.add(parentId!);
                return next;
            });
        }
        // Si le route matche un item sans submenu (Home, Dashboard, Reports, Admin…),
        // on NE TOUCHE PAS à expandedItems — le module précédemment ouvert reste ouvert.
    }, [location.pathname]);

    // LOT 48 P6.j — Responsive : sidebar = off-canvas drawer sur mobile (< md)
    const mobileSidebar = useAppSelector((state) => state.mobileSidebar);
    const closeMobile = () => dispatch(closeMobileSidebar());
    // Auto-fermer le drawer mobile a chaque navigation
    useEffect(() => {
        if (mobileSidebar.open) {
            dispatch(closeMobileSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    return (
        <div className="flex z-[100] relative">
            {/* Backdrop mobile : visible UNIQUEMENT < md ET drawer ouvert */}
            {mobileSidebar.open && (
                <div
                    onClick={closeMobile}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] md:hidden"
                    aria-hidden="true"
                />
            )}
            {/* Spacer : prend la place de la sidebar en flex flow DESKTOP uniquement.
                Sur mobile, le main occupe toute la largeur (sidebar est en position fixed overlay). */}
            <div className={`hidden md:block ${collapsed ? "w-20" : "w-72"} p-3 relative h-screen overflow-y-auto flex-col flex transition-[width] duration-500`}>
            </div>
            {/* Sidebar proprement dite :
                - Desktop (md+) : fixed left-0 toujours visible, largeur 20 (collapsed) ou 72 (etendue)
                - Mobile (< md) : fixed off-canvas, slide-in via translate-x ; largeur fixe 72 */}
            <div className={`
      bg-blackbg text-white h-screen scrollbar-hide fixed top-0 left-0 overflow-y-auto shadow-2xl
      transition-transform duration-300 ease-in-out [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
      z-[100] w-72
      ${collapsed ? 'md:w-20' : 'md:w-72'}
      ${mobileSidebar.open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
                {/* LOT 41 — Sidebar header : logo coloré (sans point lumineux), pas de marge inutile */}
                <div className="px-4 pt-3 pb-2 border-b border-gray-700/60 bg-gradient-to-b from-gray-900/40 to-transparent">
                    <div className="flex items-center justify-between gap-2">
                        <Link to="/" className="flex items-center gap-2 hover:opacity-95 transition flex-1 min-w-0" title="SafeX360 — Plateforme HSE">
                            {collapsed ? <SafeXLogo compact /> : <SafeXLogo />}
                        </Link>
                        {/* LOT 40 a11y fix : aria-label + aria-expanded + aria-controls
                            pour permettre aux lecteurs d'écran de comprendre l'état de la sidebar. */}
                        <button
                            type="button"
                            onClick={() => dispatch(collapsed ? expand() : collapse())}
                            className="p-1.5 cursor-pointer hover:bg-gray-700/70 rounded-lg transition-all duration-300 flex-shrink-0"
                            title={collapsed ? t('sidebar.expandMenu') : t('sidebar.collapseMenu')}
                            aria-label={collapsed ? t('sidebar.expandMenu') : t('sidebar.collapseMenu')}
                            aria-expanded={!collapsed}
                            aria-controls="safex-sidebar-nav"
                        >
                            {collapsed ? (
                                <IconChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
                            ) : (
                                <IconChevronLeft className="w-4 h-4 text-gray-300" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Navigation : padding équilibré, pb-14 pour réserver l'espace du statut système absolu en bas */}
                <nav className="py-2 pb-14 px-1" id="safex-sidebar-nav" aria-label="Navigation principale">
                    {/* LOT 41 — Titre de section "Vos applications" en jaune lumineux pour bonne visibilité */}
                    {!collapsed && (
                        <div className="px-5 pt-3 pb-2.5 flex items-center gap-2">
                            <span className="h-[2px] w-4 rounded-full" style={{ background: '#FEF08A' }} aria-hidden="true" />
                            <h2
                                className="uppercase font-semibold"
                                style={{
                                    fontSize: '11.5px',
                                    letterSpacing: '0.22em',
                                    color: '#FEF08A',
                                }}
                            >
                                {t('sidebar.yourApplications')}
                            </h2>
                            <span className="h-[2px] flex-1 rounded-full bg-slate-700/70" aria-hidden="true" />
                        </div>
                    )}
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
                                            // LOT 41 fix : URL explicite avec index.html pour éviter la collision
                                            // avec le SPA fallback de Vite (provoquait boucle infinie).
                                            if (item.id === 'reports') {
                                                const url = (import.meta as any).env?.VITE_SAFEX_ANALYTICS_URL || '/safex-analytics/index.html';
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
                                                    {tLabel(item.label)}
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

                {/* LOT 45 — Pied de sidebar : statut système (déplacé du footer)
                    Position fixed-bottom dans la sidebar, légère bordure top, fond légèrement plus foncé */}
                <div
                    className={`absolute bottom-0 left-0 right-0 border-t border-slate-700/60 bg-slate-950/40 ${collapsed ? 'px-2 py-2 flex justify-center' : 'px-4 py-2.5'}`}
                >
                    {collapsed ? (
                        <span
                            className="relative inline-flex w-2 h-2"
                            title={`${t('footer.systemOperational')} · v2.4.1`}
                            aria-label={`${t('footer.systemOperational')} · v2.4.1`}
                        >
                            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" aria-hidden="true" />
                            <span className="relative w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                        </span>
                    ) : (
                        <div className="flex items-center justify-between gap-2 text-[10.5px]">
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                                <span className="relative inline-flex w-1.5 h-1.5 flex-shrink-0">
                                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" aria-hidden="true" />
                                    <span className="relative inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                                </span>
                                <span className="text-emerald-300/90 font-medium uppercase tracking-[0.06em] truncate">
                                    {t('footer.systemOperational')}
                                </span>
                            </span>
                            <span className="font-mono text-slate-500 flex-shrink-0">v2.4.1</span>
                        </div>
                    )}
                </div>
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
