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
    IconFileTextSpark
} from '@tabler/icons-react';
import { isModuleEnabled } from '../data/ModuleConfig';
import ModuleSubscriptionModal from '../Home/ModuleSubscriptionModal';
import { useAppSelector } from '../../../slices/hooks';
import { useDispatch } from 'react-redux';
import { collapse, expand } from '../../../slices/CollapseSlice';
import { useLocation, useNavigate } from 'react-router-dom';

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

const menuItems: MenuItem[] = [
    {
        id: 'home',
        label: 'Home',
        icon: IconHome,
        color: 'text-orange-500',
    },
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: IconChartBar,
        color: 'text-blue-500',
    },
    {
        id: 'prevention',
        label: 'Prevention Activities',
        icon: IconShield,
        color: 'text-red-500',
        subItems: [
            { id: 'non-conformity', label: 'Central Findings', icon: IconAlertTriangle },
            { id: 'inspections', label: 'Inspections Managers', icon: IconSearch },
            { id: 'meetings', label: 'Meeting Managers', icon: IconUsers },
            { id: 'management-tour', label: 'Leadership Walk', icon: IconEye }
        ]
    },
    {
        id: 'monitoring',
        label: 'Monitoring Activities',
        icon: IconActivity,
        color: 'text-purple-500',
        subItems: [
            { id: 'incident-management', label: 'Incidents Management', icon: IconAlertTriangle },
            { id: 'investigations', label: 'Investigations', icon: IconSearch },
            { id: 'action-plans-inc', label: 'Action Plans', icon: IconFileText }
        ]
    },
    {
        id: 'actions',
        label: 'Actions Managers',
        icon: IconTarget,
        color: 'text-gray-600',
        subItems: [
            { id: 'pending-actions', label: 'Pending Actions', icon: IconClock },
            { id: 'action-plan', label: 'Action Plan', icon: IconFileText },
            { id: 'recommendations', label: 'Recommendations', icon: IconBulb },
            { id: 'adhoc-actions', label: 'Improvement Ideas', icon: IconBolt }
        ]
    },
    {
        id: 'risk',
        label: 'Risk Management',
        icon: IconAlertTriangle,
        color: 'text-orange-600',
        subItems: [
            { id: 'risk-overview', label: 'Risk Overview', icon: IconChartBar },
            { id: 'risk-register', label: 'Risk Register', icon: IconFileText },
            { id: 'risk-assessment', label: 'Risk Assessment', icon: IconClipboardCheck },
            { id: 'chemical-register', label: 'Chemical Register', icon: IconFlask2 }
        ]
    },
    {
        id: 'ppe',
        label: 'PPE Management',
        icon: IconHelmet,
        color: 'text-blue-600',
        subItems: [
            { id: 'ppe-overview', label: 'PPE Overview', icon: IconChartBar },
            { id: 'ppe-monitoring', label: 'PPE Monitoring', icon: IconActivity },
            { id: 'ppe-request', label: 'PPE Request', icon: IconPlus }
        ]
    },
    {
        id: 'audits',
        label: 'Audits Management',
        icon: IconClipboardCheck,
        color: 'text-orange-600',
        subItems: [
            { id: 'audit-plan', label: 'Annual audit plan', icon: IconCalendar },
            { id: 'audits', label: 'Audits', icon: IconClipboardCheck },
            { id: 'audit-recommendations', label: 'Recommendations', icon: IconBulb }
        ]
    },
    {
        id: 'compliance',
        label: 'Compliance Management',
        icon: IconSquareCheck,
        color: 'text-green-500',
        subItems: [
            { id: 'compliance-dashboard', label: 'Dashboard', icon: IconChartBar },
            { id: 'requirements', label: 'Requirements', icon: IconFileCheck },
            { id: 'position-assignments', label: 'Positions Assignments', icon: IconUserCheck },
            { id: 'employee-assignments', label: 'Employee Assignments', icon: IconUsers },
            { id: 'documents', label: 'Documents', icon: IconFolderOpen },
            { id: 'document-validation', label: 'Document Validation', icon: IconSquareCheck }
        ]
    },
    {
        id: 'planning',
        label: 'Annual Planning',
        icon: IconCalendar,
        color: 'text-yellow-500',
        subItems: [
            { id: 'hs-activities-planning', label: 'HS activities Planning', icon: IconCalendar },
            { id: 'month-theme-subjects', label: 'Month Theme / Subjects', icon: IconBook },
            { id: 'annual-audit-plan', label: 'Annual Audit Plan', icon: IconClipboardCheck }
        ]
    },

    {
        id: 'communication',
        label: 'Safety Communication',
        icon: IconMessageCircle,
        color: 'text-pink-600',
        subItems: [
            { id: 'comm-dashboard', label: 'Dashboard', icon: IconChartBar },
            { id: 'employee-comm', label: 'HSE Communications', icon: IconMessageCircle },
            { id: 'notifications', label: 'Notification Center', icon: IconBell }
        ]
    },
    {
        id: 'reports',
        label: 'Reports & Analytics Center',
        icon: IconReport,
        color: 'text-green-600',
        subItems: [
            { id: 'monthly-reports', label: 'Monthly Report', icon: IconCalendar },
            { id: 'KPI-reports', label: 'KPI Review', icon: IconChartBar },
            { id: 'performance-reports', label: 'Performance Report', icon: IconTrendingUp },
            { id: 'corporate-reports', label: 'Corporate Report', icon: IconCalculator },
            { id: 'executive-reports', label: 'Executive Summary', icon: IconFileText },
            { id: 'trend-analysis', label: 'Trend Analysis', icon: IconActivity }
        ]
    },
    {
        id: 'knowledge',
        label: 'Knowledge Center',
        icon: IconBook,
        color: 'text-cyan-500',
        subItems: [
            { id: 'lessons-learned', label: 'Lesson Learned', icon: IconBook },
            { id: 'document-manager', label: 'Document Manager', icon: IconFolderOpen },
            { id: 'iso-documents', label: 'ISO Standards', icon: IconFileText },
            { id: 'process-docs', label: 'Work Process', icon: IconFileTextSpark }
        ]
    },
    // {
    //     id: 'ai-assistant',
    //     label: 'AI Assistant',
    //     icon: IconSparkles,
    //     color: 'text-purple-500',
    // },
    {
        id: 'help',
        label: 'Help Center',
        icon: IconMessageCircle,
        color: 'text-emerald-600',
        subItems: [
            { id: 'how-to', label: 'How To Guides', icon: IconBook },
            { id: 'features-overview', label: 'Features Overview', icon: IconEye },
            { id: 'technical-documentation', label: 'Technical Documentation', icon: IconFileText }
        ]
    },
    // {
    //     id: 'users',
    //     label: 'Users Management',
    //     icon: IconUsers,
    //     color: 'text-indigo-600',
    // },
    {
        id: 'settings',
        label: 'Administration',
        icon: IconSettings,
        color: 'text-blue-500',
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
                {/* Header */}
                <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        {!collapsed && (
                            <h1 className="text-lg font-bold ">My Applications</h1>
                        )}
                        <button
                            onClick={() => dispatch(collapsed ? expand() : collapse())}
                            className="p-2 cursor-pointer hover:bg-gray-700 rounded-xl transition-all duration-300 hover:scale-110"
                        >
                            {collapsed ? (
                                <IconChevronRight className="w-5 h-5" />
                            ) : (
                                <IconChevronLeft className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    {!collapsed && (
                        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="py-4">
                    <div className="space-y-0">
                        {menuItems.map(item => {
                            const isActive = activeItem === item.id;
                            const isExpanded = expandedItems.has(item.id);
                            const hasSubItems = item.subItems && item.subItems.length > 0;
                            const isEnabled = isModuleEnabled(item.id) || item.id === 'home' || item.id === 'users' || item.id === 'settings';

                            return (
                                <div key={item.id}>
                                    {/* Main Menu Item */}
                                    <div
                                        className={`
                    mx-2 flex items-center px-4 py-2 rounded-xl cursor-pointer transition-all duration-300
                    ${isActive ? 'bg-gradient-to-r from-gray-600 to-gray-500 shadow-lg' : isEnabled ? 'hover:bg-gray-700 hover:shadow-lg hover:scale-[1.02]' : 'opacity-50'}
                    ${hasSubItems && isExpanded ? 'bg-gray-700' : ''}
                    group
                    ${!isEnabled ? 'cursor-not-allowed' : ''}
                  `}
                                        onClick={(e) => {
                                            if (hasSubItems) {
                                                toggleExpanded(item.id, e);
                                            } else {
                                                handleItemClick(item.id);
                                            }
                                        }}
                                    >
                                        <div className="p-2 transition-all duration-300 group-hover:scale-110">
                                            <item.icon className={`w-5 h-5 ${isEnabled ? item.color : 'text-gray-500'} transition-transform duration-300`} />
                                        </div>
                                        {!collapsed && (
                                            <>
                                                <span className={`ml-3 font-medium flex-1 text-sm whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-300 ${isEnabled
                                                    ? 'text-gray-200 group-hover:text-white'
                                                    : 'text-gray-500 italic'
                                                    }`}>
                                                    {item.label}
                                                </span>
                                                {hasSubItems && (
                                                    <div className="flex-shrink-0 ml-2">
                                                        {isExpanded ? (
                                                            <div className="p-1 bg-gray-600 rounded-full transition-all duration-300 group-hover:bg-gray-500">
                                                                <IconMinus className="w-3 h-3 text-gray-300" />
                                                            </div>
                                                        ) : (
                                                            <div className="p-1 bg-gray-600 rounded-full transition-all duration-300 group-hover:bg-gray-500">
                                                                <IconPlus className="w-3 h-3 text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Sub Menu Items */}
                                    {!collapsed && hasSubItems && isExpanded && (
                                        <div className={`ml-8 mt-2 space-y-1 pl-4 border-l-4 ${item.color.replace('text-', 'border-')}`}>
                                            {item.subItems!.map(subItem => {
                                                const isSubActive = activeItem === subItem.id;
                                                const isSubEnabled = isModuleEnabled(subItem.id);
                                                return (
                                                    <div
                                                        key={subItem.id}
                                                        className={`
                            mx-2 flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-300
                            ${isSubActive ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md' :
                                                                isSubEnabled ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200 hover:translate-x-1' :
                                                                    'text-gray-500 opacity-50 cursor-not-allowed'}
                            group
                          `}
                                                        onClick={() => handleSubItemClick(subItem.id)}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full mr-3 transition-all duration-300 ${isSubEnabled ? 'bg-gray-500 group-hover:bg-gray-300' : 'bg-gray-600'
                                                            }`}></div>
                                                        <subItem.icon className={`w-4 h-4 mr-3 transition-transform duration-300 ${isSubEnabled ? `${item.color} group-hover:scale-110` : 'text-gray-500'
                                                            }`} />
                                                        <span className={`text-sm font-medium transition-colors duration-300 ${!isSubEnabled ? 'italic' : ''
                                                            }`}>
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
