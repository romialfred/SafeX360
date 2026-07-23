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
    IconTruck, // Équipements
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
    IconFolderOpen, IconTools, // Bell
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
    // Historique des alertes d'urgence
    IconHistory,
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
    'Préférences de notification': 'sidebar.systemSettings',
    'Liste des utilisateurs': 'sidebar.usersList',
    'Rôles et permissions': 'sidebar.rolesAndPermissions',
    // LOT — Dosimetrie & Expositions (ns 'dosimetry')
    'Dosimétrie & Expositions': 'dosimetry:sidebar.dosimetry',
    'Tableau de bord dosimétrie': 'dosimetry:sidebar.dosimetryDashboard',
    'Registre des travailleurs exposés': 'dosimetry:sidebar.dosimetryWorkers',
    'Dosimètres & instruments': 'dosimetry:sidebar.dosimetryDosimeters',
    'Saisie & suivi des doses': 'dosimetry:sidebar.dosimetryDoses',
    'Points de mesure': 'dosimetry:sidebar.dosimetryAmbient',
    'Cartographie d\'ambiance': 'dosimetry:sidebar.dosimetryAmbientMap',
    'Campagnes de surveillance': 'dosimetry:sidebar.dosimetryCampaigns',
    'Profils d\'exposition': 'dosimetry:sidebar.dosimetryExposureProfiles',
    'Planning des visites médicales': 'dosimetry:sidebar.dosimetryMedical',
    'Mon dossier médical': 'dosimetry:sidebar.dosimetryMyMedical',
    'Seuils & alertes': 'dosimetry:sidebar.dosimetryAlerts',
    'Dossiers de dépassement': 'dosimetry:sidebar.dosimetryOverexposure',
    'Rapports & attestations': 'dosimetry:sidebar.dosimetryReports',
    'Exports réglementaires': 'dosimetry:sidebar.dosimetryRegulatoryExports',
    'Paramètres dosimétrie': 'dosimetry:sidebar.dosimetrySettings',
    // LOT — Gestion des Dynamitages (ns 'blast')
    'Gestion des Dynamitages': 'blast:sidebar.blast',
    'Tableau de bord dynamitage': 'blast:sidebar.blastDashboard',
    'Registre des tirs': 'blast:sidebar.blastRegistry',
    'Enregistrer un tir': 'blast:sidebar.blastNew',
    // LOT 58 — sous-items précédemment non traduits (ns 'navigation')
    'Tableau de Bord': 'sidebar.dashboard',
    'Gestion des Incidents': 'sidebar.incidentsManagement',
    'Investigations': 'sidebar.investigations',
    "Plans d'Actions": 'sidebar.actionPlans',
    "Plan d'Actions": 'sidebar.actionPlan',
    "Vue d'Ensemble": 'sidebar.overview',
    'Registre des Risques': 'sidebar.riskRegister',
    'Évaluation des Risques': 'sidebar.riskAssessment',
    'Registre Chimique': 'sidebar.chemicalRegister',
    "Demande d'EPI": 'sidebar.ppeRequest',
    'Suivi des EPI': 'sidebar.ppeTracking',
    'Actions en Attente': 'sidebar.pendingActions',
    'Recommandations': 'sidebar.recommendations',
    "Suggestions d'Amélioration": 'sidebar.improvementSuggestions',
    'Audits ISO 19011': 'sidebar.auditsIso19011',
    "Programme d'audit": 'sidebar.auditProgram',
    "Plan Annuel d'Audits": 'sidebar.annualAuditPlan',
    'Plan Annuel Audits': 'sidebar.annualAuditPlan',
    'Suivi SOS': 'sidebar.sosTracking',
    'Suivi des alertes': 'sidebar.alertsTracking',
    'Exigences légales': 'sidebar.legalRequirements',
    'Affectations employés': 'sidebar.employeeAssignments',
    'Affectations par poste': 'sidebar.positionAssignments',
    'Documents': 'sidebar.documents',
    'Activités HSE': 'sidebar.hseActivities',
    'Thèmes Mensuels': 'sidebar.monthlyThemes',
    'Communications HSE': 'sidebar.hseCommunications',
    'Centre de Notifications': 'sidebar.notificationCenter',
    "Retours d'Expérience": 'sidebar.lessonsLearned',
    'Gestionnaire de Documents': 'sidebar.documentManager',
    'Guides Pratiques': 'sidebar.practicalGuides',
    'Aperçu des Fonctionnalités': 'sidebar.featuresOverview',
    'Documentation Technique': 'sidebar.technicalDocs',
    'Standards ISO': 'sidebar.isoStandards',
    'Processus de Travail': 'sidebar.workProcesses',
    'Validation des documents': 'sidebar.documentValidation',
};
import ModuleSubscriptionModal from '../Home/ModuleSubscriptionModal';
import { useAppSelector } from '../../../slices/hooks';
import { useDispatch } from 'react-redux';
import { collapse, expand } from '../../../slices/CollapseSlice';
import { closeMobileSidebar } from '../../../slices/MobileSidebarSlice';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import SafeXLogoColor from '../../UtilityComp/SafeXLogoColor';
import { usePermissions } from '../../../hooks/usePermissions';

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
            { id: 'equipment-registry', label: 'Registre des équipements', icon: IconTruck },
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
            { id: 'chemical-register', label: 'Registre Chimique', icon: IconFlask2 },
            { id: 'risk-opportunities', label: 'Opportunités SST', icon: IconBulb }
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
            { id: 'audit-program', label: 'Programme d\'audit', icon: IconTarget },
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
            { id: 'compliance-dashboard', label: 'Tableau de bord', icon: IconChartBar },
            { id: 'requirements', label: 'Exigences légales', icon: IconFileCheck },
            { id: 'position-assignments', label: 'Affectations par poste', icon: IconUserCheck },
            { id: 'employee-assignments', label: 'Affectations employés', icon: IconUsers },
            { id: 'documents', label: 'Documents', icon: IconFolderOpen },
            { id: 'document-validation', label: 'Validation des documents', icon: IconSquareCheck }
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
            { id: 'emergency-alerts', label: 'Suivi des alertes', icon: IconHistory },
            { id: 'emergency-assembly-points', label: 'Points de rassemblement', icon: IconMapPin },
            { id: 'emergency-personnel', label: 'Personnel & Évacuation', icon: IconUsers },
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
    // Module Gestion des Erreurs — couche fédératrice « culture de l'erreur ».
    {
        id: 'error-management',
        label: 'Gestion des Erreurs',
        icon: IconAlertTriangle,
        color: 'text-[#1E3A5F]',
        subItems: [
            { id: 'error-dashboard', label: 'Tableau de bord', icon: IconLayoutDashboard },
            { id: 'error-events', label: 'Registre des événements', icon: IconAlertTriangle },
        ]
    },
    // Centre d'Aide : retiré de la sidebar — désormais accessible via le menu
    // déroulant de l'utilisateur connecté (ProfileMenu → « Centre d'aide »).
    // LOT — Module Dosimetrie & Expositions
    {
        id: 'dosimetry',
        label: 'Dosimétrie & Expositions',
        icon: IconAtom2,
        color: 'text-violet-700',
        subItems: [
            // ── 1. Vue d'ensemble ──
            { id: 'dosimetry-dashboard', label: 'Tableau de bord dosimétrie', icon: IconLayoutDashboard },
            // ── 2. Référentiels ──
            { id: 'dosimetry-workers', label: 'Registre des travailleurs exposés', icon: IconUsers },
            { id: 'dosimetry-dosimeters', label: 'Dosimètres & instruments', icon: IconDeviceWatch },
            { id: 'dosimetry-doses', label: 'Saisie & suivi des doses', icon: IconChartLine },
            // ── 3. Surveillance d'ambiance ──
            { id: 'dosimetry-ambient', label: 'Points de mesure', icon: IconBroadcast },
            { id: 'dosimetry-ambient-map', label: 'Cartographie d\'ambiance', icon: IconRadar },
            { id: 'dosimetry-campaigns', label: 'Campagnes de surveillance', icon: IconClipboardCheck },
            { id: 'dosimetry-exposure-profiles', label: 'Profils d\'exposition', icon: IconAtom2 },
            // ── 4. Surveillance médicale ──
            { id: 'dosimetry-medical', label: 'Planning des visites médicales', icon: IconStethoscope },
            { id: 'dosimetry-my-medical', label: 'Mon dossier médical', icon: IconUserHeart },
            // ── 5. Seuils & dépassements ──
            { id: 'dosimetry-alerts', label: 'Seuils & alertes', icon: IconAlertOctagon },
            { id: 'dosimetry-overexposure', label: 'Dossiers de dépassement', icon: IconFolderOpen },
            // ── 6. Rapports & conformité ──
            { id: 'dosimetry-reports', label: 'Rapports & attestations', icon: IconFileText },
            { id: 'dosimetry-regulatory-exports', label: 'Exports réglementaires', icon: IconFileText },
            // ── 7. Paramètres ──
            { id: 'dosimetry-settings', label: 'Paramètres dosimétrie', icon: IconSettings },
        ],
    },
    // LOT — Module Gestion des Dynamitages / Blast Management
    {
        id: 'blast',
        label: 'Gestion des Dynamitages',
        icon: IconBolt,
        color: 'text-amber-700',
        subItems: [
            // P7 — Tableau de bord en tete du sous-menu : landing par defaut /blast
            { id: 'blast-dashboard', label: 'Tableau de bord dynamitage', icon: IconChartBar },
            { id: 'blast-registry', label: 'Registre des tirs', icon: IconClipboardCheck },
            // "Enregistrer un tir" retire du sous-menu : accessible via le bouton
            // "Nouveau tir" sur la page Registre (action contextuelle plutot que
            // un item de navigation duplique).
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
            // LOT 62 — Une entrée par section : chaque page regroupe ses référentiels
            // en onglets, au lieu de renvoyer vers des écrans isolés.
            { id: 'param-sites-environment', label: 'Sites & Environnement', icon: IconMapPin },
            { id: 'param-incidents', label: 'Paramètres Incidents', icon: IconAlertTriangle },
            { id: 'param-tools-templates', label: 'Outils & Templates', icon: IconTools },
            { id: 'operational-references', label: 'Vue d\'ensemble', icon: IconFolderOpen },
            { id: 'system-settings', label: 'Préférences de notification', icon: IconBell },
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
    inspections: "/inspections",
    "equipment-registry": "/inspections/equipment",
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
    "risk-opportunities": "/risk-management/opportunities",

    // PPE Management
    "ppe-overview": "/ppe-management",
    "ppe-monitoring": "/ppe-monitoring",
    "ppe-request": "/ppe-request",

    // Audits Management
    "audit-program": "/audit-program",
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
    "emergency-alerts": "/emergency/alerts",
    "emergency-sos": "/emergency/sos",
    "emergency-settings": "/emergency/settings",
    "emergency-assembly-points": "/emergency/assembly-points",
    "emergency-personnel": "/emergency/personnel-evacuation",

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


    // Module Gestion des Erreurs
    "error-dashboard": "/error-management/dashboard",
    "error-events": "/error-management",

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
    parameters: "/parameters/sites-environment", // parent → 1re section de parametres
    "operational-references": "/operational-references",
    // LOT 62 — Sections de parametres (une page a onglets par section)
    "param-sites-environment": "/parameters/sites-environment",
    "param-incidents": "/parameters/incidents",
    "param-tools-templates": "/parameters/tools-templates",
    "system-settings": "/advanced-configuration",
    // LOT 49 — Nouvelle page admin Gestion utilisateurs (creation + permissions modules)
    "users-management-hub": "/users-admin",
    "users-list": "/users-admin",
    "roles-permissions": "/users-admin",
    "modules-management": "/modules-management",

    // LOT — Module Dosimetrie & Expositions
    // 2026-06-07 : toutes les entrees pointent vers une page reelle.
    // Le placeholder /coming-soon n'est plus reference par aucune entree de
    // sidebar : le module est complet (Phase 9-B terminee).
    "dosimetry": "/dosimetry",
    "dosimetry-settings": "/dosimetry/settings",
    "dosimetry-workers": "/dosimetry/workers",
    "dosimetry-dashboard": "/dosimetry",
    "dosimetry-dosimeters": "/dosimetry/dosimeters",
    // "Saisie & suivi des doses" : entree wizard d'import en masse,
    // d'ou l'utilisateur peut aussi naviguer vers la saisie individuelle.
    "dosimetry-doses": "/dosimetry/doses/import",
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

    // LOT — Module Gestion des Dynamitages / Blast Management
    "blast": "/blast",
    "blast-dashboard": "/blast/dashboard",
    "blast-registry": "/blast/registry",
    // "blast-new" retire de la sidebar : la route /blast/new reste valide
    // mais on y accede via le bouton "Nouveau tir" du Registre des tirs.
};



/**
 * LOT 52 A3 — vocabulaire des modules du profil de permissions (CSV
 * allowedModules). Un item de menu dont la clé résolue appartient à ce
 * vocabulaire N'EST AFFICHÉ que si l'utilisateur possède le module.
 * Les items hors vocabulaire (urgences, dosimétrie, dynamitage, aide…)
 * restent régis par l'activation de module globale uniquement.
 */
const PERMISSION_VOCABULARY = new Set([
    'home', 'nonConformity', 'inspections', 'meetings', 'managementTour',
    'ppeOverview', 'ppeMonitoring', 'ppeRequest',
    'incidentManagement', 'investigations', 'actionPlansInc',
    'pendingActions', 'actionPlan', 'recommendations', 'adhocActions',
    'auditPlan', 'audits', 'auditRecommendations',
    'complianceDashboard', 'requirements', 'positionAssignments',
    'employeeAssignments', 'documents', 'documentValidation',
    'riskOverview', 'riskRegister', 'riskAssessment', 'chemicalRegister',
    'lessonsLearned', 'documentManager',
    'commDashboard', 'employeeComm', 'notifications',
    'usersManagement', 'settings',
    'errorManagement',
    // Modules livrés depuis, désormais attribuables (catalogue serveur
    // ModuleCatalog). Ils étaient visibles de tous faute de contrôle : la
    // migration les accorde à tous les profils existants, personne ne perd
    // donc un accès en place — un administrateur peut les révoquer ensuite.
    'equipmentRegistry', 'riskOpportunities', 'auditProgram',
    'isoDocuments', 'processDocs', 'targetForecast', 'modulesManagement',
]);

/** Surcharges explicites menu-id → module de permission. */
const MENU_PERMISSION_OVERRIDES: Record<string, string> = {
    'dashboard': 'home',
    'error-dashboard': 'errorManagement',
    'error-events': 'errorManagement',
    'users-management-hub': 'usersManagement',
    'users-list': 'usersManagement',
    'roles-permissions': 'usersManagement',
    'modules-management': 'modulesManagement',
    'parameters': 'settings',
    'system-settings': 'settings',
    'operational-references': 'settings',
    'param-sites-environment': 'settings',
    'param-incidents': 'settings',
    'param-tools-templates': 'settings',
    'annual-audit-plan': 'auditPlan',
    // Ces trois-là avaient été rabattus sur un module voisin faute d'exister
    // dans la matrice de droits ; ils sont désormais attribuables pour eux-mêmes.
    'audit-program': 'auditProgram',
    'risk-opportunities': 'riskOpportunities',
    'iso-documents': 'isoDocuments',
    'process-docs': 'processDocs',
    'target-forecast': 'targetForecast',
};

/** Convertit un id de menu kebab-case en clé de module camelCase. */
const kebabToCamel = (id: string): string =>
    id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Clé de permission d'un item de menu, ou null si aucune permission requise. */
const permissionKeyFor = (menuId: string): string | null => {
    const explicit = MENU_PERMISSION_OVERRIDES[menuId];
    if (explicit) return explicit;
    const camel = kebabToCamel(menuId);
    return PERMISSION_VOCABULARY.has(camel) ? camel : null;
};

const Sidebar = () => {
    const [activeItem, setActiveItem] = useState<string>('home');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [showModal, setShowModal] = useState(false);
    const [selectedModuleName, setSelectedModuleName] = useState('');
    // LOT 52 A3 — permissions de l'utilisateur connecté : un module sans droit
    // de lecture DISPARAÎT du menu (rigueur stricte, pas de simple grisage).
    const perms = usePermissions();
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
        'param-sites-environment', 'param-incidents', 'param-tools-templates',
        'users-list', 'roles-permissions',
        // LOT — Dosimetrie : parent + page de parametres toujours accessibles
        // (les autres sous-modules s'activeront via Module Management)
        'dosimetry', 'dosimetry-settings',
        // LOT — Blast Management : parent + sous-items toujours accessibles
        // P7 : ajout du tableau de bord dans la liste autorisee
        'blast', 'blast-dashboard', 'blast-registry',
    ]);

    /**
     * LOT 52 A3 — visibilité d'un item selon les permissions utilisateur.
     * Pendant le chargement du profil on n'affiche que le strict minimum
     * pour éviter le flash d'items interdits.
     */
    const isItemVisible = (menuId: string): boolean => {
        if (perms.isAdmin) return true;
        const key = permissionKeyFor(menuId);
        if (key === null) return true; // hors vocabulaire : régi par l'activation module
        if (perms.loading) return key === 'home';
        return perms.canSee(key);
    };

    /** Items de menu filtrés : un parent sans aucun sous-item visible disparaît. */
    const visibleMenuItems = menuItems
        .map((item) => {
            if (!item.subItems) {
                return isItemVisible(item.id) ? item : null;
            }
            const subItems = item.subItems.filter((sub) => isItemVisible(sub.id));
            if (subItems.length === 0) return null;
            // Le parent reste visible dès qu'au moins un enfant l'est
            return { ...item, subItems };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

    const handleItemClick = (itemId: string) => {
        // LOT 52 A3 — défense en profondeur : même via un état périmé, aucun
        // accès à un module non autorisé.
        if (!isItemVisible(itemId)) {
            setSelectedModuleName(getModuleName(itemId));
            setShowModal(true);
            return;
        }
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
        if (!isItemVisible(subItemId)) {
            setSelectedModuleName(getModuleName(subItemId));
            setShowModal(true);
            return;
        }
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
                    onKeyDown={(e) => { if (e.key === 'Escape') closeMobile(); }}
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
      bg-slate-800 text-white h-screen scrollbar-hide fixed top-0 left-0 shadow-2xl
      transition-transform duration-300 ease-in-out
      z-[100] w-72 flex flex-col
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

                {/* Navigation : flex-1 + overflow-y-auto -> scroll interne sans chevaucher le footer
                    scrollbar-hide pour cacher la scrollbar visuelle, padding-bottom pour aération */}
                <nav className="flex-1 overflow-y-auto py-2 pb-4 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" id="safex-sidebar-nav" aria-label="Navigation principale">
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
                        {visibleMenuItems.map(item => {
                            const isActive = activeItem === item.id;
                            const isExpanded = expandedItems.has(item.id);
                            const hasSubItems = item.subItems && item.subItems.length > 0;
                            const isEnabled = isModuleEnabled(item.id) || item.id === 'home' || item.id === 'users' || item.id === 'settings';

                            return (
                                <div key={item.id}>
                                    {/* Item principal : padding aéré, contraste renforcé */}
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={hasSubItems ? isExpanded : undefined}
                                        className={`
                                            mx-2 flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors duration-150
                                            ${isActive ? 'bg-slate-700 text-white shadow-sm' : isEnabled ? 'text-slate-200 hover:bg-slate-800/60 hover:text-white' : 'text-slate-500 opacity-60'}
                                            ${hasSubItems && isExpanded && !isActive ? 'bg-slate-800/40' : ''}
                                            group
                                            ${!isEnabled ? 'cursor-not-allowed' : ''}
                                        `}
                                        onClick={(e) => {
                                            if (item.id === 'reports') {
                                                const url = (import.meta as any).env?.VITE_SAFEX_ANALYTICS_URL || '/safex-analytics';
                                                window.open(url, '_blank', 'noopener,noreferrer');
                                                return;
                                            }
                                            if (hasSubItems) {
                                                toggleExpanded(item.id, e);
                                            } else {
                                                handleItemClick(item.id);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                if (item.id === 'reports') {
                                                    const url = (import.meta as any).env?.VITE_SAFEX_ANALYTICS_URL || '/safex-analytics';
                                                    window.open(url, '_blank', 'noopener,noreferrer');
                                                    return;
                                                }
                                                if (hasSubItems) {
                                                    toggleExpanded(item.id, e as unknown as React.MouseEvent);
                                                } else {
                                                    handleItemClick(item.id);
                                                }
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
                                                        role="button"
                                                        tabIndex={0}
                                                        className={`
                                                            mx-1 flex items-center gap-2.5 px-2.5 py-1.5 rounded cursor-pointer transition-colors duration-150
                                                            ${isSubActive ? 'bg-slate-700 text-white' :
                                                                isSubEnabled ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white' :
                                                                    'text-slate-500 opacity-50 cursor-not-allowed'}
                                                            group
                                                        `}
                                                        onClick={() => handleSubItemClick(subItem.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                handleSubItemClick(subItem.id);
                                                            }
                                                        }}
                                                    >
                                                        <subItem.icon className="w-3.5 h-3.5 flex-shrink-0" stroke={1.75} />
                                                        <span className={`text-[12px] leading-snug ${!isSubEnabled ? 'italic' : ''}`}>
                                                            {tLabel(subItem.label)}
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

                {/* LOT 45 — Pied de sidebar : statut système.
                    En flex flow normal (flex-shrink-0) — la nav prend flex-1 + scroll,
                    le footer reste figé en bas sans chevauchement. Fond opaque (slate-950) avec backdrop-blur. */}
                <div
                    className={`flex-shrink-0 border-t border-slate-700/60 bg-slate-950 backdrop-blur-sm ${collapsed ? 'px-2 py-2 flex justify-center' : 'px-4 py-2.5'}`}
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
