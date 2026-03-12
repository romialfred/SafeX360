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
} from '@tabler/icons-react';
import ModuleSubscriptionModal from './ModuleSubscriptionModal';
import { isModuleEnabled } from '../data/ModuleConfig';
import { useNavigate } from 'react-router-dom';

type ModuleItem = string | { label: string; url: string; moduleId?: string };

interface ModuleCard {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    items: ModuleItem[];
    url: string;
    requiredModuleId?: string;
}


const moduleGroups: ModuleCard[] = [
    {
        id: 'preventives-activities',
        title: 'Preventives Activities',
        description: 'Proactive risk management and prevention',
        icon: IconShield,
        color: 'text-red-600',
        bgColor: 'bg-red-50/70 border-red-200/50 hover:bg-red-100/80 hover:border-red-300/70',
        items: ['Central Findings', 'Inspections Managers', 'Meeting Managers', 'Leadership Walk'],
        url: '/non-conformity'
    },
    {
        id: 'preventives-activities-2',
        title: 'Monitoring Activities',
        description: 'Incident management and investigations',
        icon: IconActivity,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50/70 border-purple-200/50 hover:bg-purple-100/80 hover:border-purple-300/70',
        items: ['Incidents Management', 'Investigations', 'Action Plans'],
        url: '/incidents'
    },
    {
        id: 'actions-managers',
        title: 'Actions Managers',
        description: 'Action plans tracking and management',
        icon: IconTarget,
        color: 'text-gray-700',
        bgColor: 'bg-gray-50/70 border-gray-200/50 hover:bg-gray-100/80 hover:border-gray-300/70',
        items: ['Pending Actions', 'Action Plan', 'Recommendations', 'Improvement Ideas'],
        url: '/corrective'
    },
    {
        id: 'pending-actions-hub',
        requiredModuleId: 'pending-actions',
        title: 'Action Follow-up Hub',
        description: 'Stay on top of open reviews and approvals',
        icon: IconCircleCheck,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50/70 border-indigo-200/50 hover:bg-indigo-100/80 hover:border-indigo-300/70',
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
        title: 'Risk Management',
        description: 'Risk assessment and control',
        icon: IconAlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50/70 border-orange-200/50 hover:bg-orange-100/80 hover:border-orange-300/70',
        items: ['Risk Overview', 'Risk Register', 'Risk Assessment', 'Chemical Register'],
        url: '/risks-overview'
    },
    {
        id: 'ppe-management',
        title: 'PPE Management',
        description: 'Personal protective equipment management',
        icon: IconHelmet,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50/70 border-blue-200/50 hover:bg-blue-100/80 hover:border-blue-300/70',
        items: ['PPE Overview', 'PPE Monitoring', 'PPE Request'],
        url: '/ppe-management'
    },

    {
        id: 'audits-management',
        title: 'Audits Management',
        description: 'Audit planning and tracking',
        icon: IconClipboardCheck,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50/70 border-orange-200/50 hover:bg-orange-100/80 hover:border-orange-300/70',
        items: ['Annual audit plan', 'Audits', 'Recommendations'],
        url: '/audit-management'
    },
    {
        id: 'compliance-management',
        title: 'Compliance Management',
        description: 'Regulatory and normative compliance',
        icon: IconSquareCheck,
        color: 'text-green-600',
        bgColor: 'bg-green-50/70 border-green-200/50 hover:bg-green-100/80 hover:border-green-300/70',
        items: [
            'Requirements',
            'Positions Assignments',
            'Employee Assignments',

        ],
        url: '/compliance-dashboard'
    },
    {
        id: 'knowledge-management',
        title: 'Knowledge Center',
        description: 'Knowledge capitalization and sharing',
        icon: IconBook,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50/70 border-cyan-200/50 hover:bg-cyan-100/80 hover:border-cyan-300/70',
        items: ['Lesson Learned', 'Document Manager'],
        url: '/lesson-learn'
    },
    {
        id: 'communication-management',
        title: 'Safety Communication',
        description: 'Communication and awareness',
        icon: IconMessage,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50/70 border-pink-200/50 hover:bg-pink-100/80 hover:border-pink-300/70',
        items: ['Dashboard', 'HSE Communications', 'Notification Managers'],
        url: '/communication-dashboard'
    },
    {
        id: 'reports',
        title: 'Report & Analytics Center',
        description: 'Advanced reporting and business analytics',
        icon: IconChartBar,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50/70 border-emerald-200/50 hover:bg-emerald-100/80 hover:border-emerald-300/70',
        items: [
            'Monthly Report',
            'KPI Review',
            'Performance Report',
            'Corporate Report',

        ],
        url: '/monthly-reports'
    },
    // {
    //     id: 'users-management',
    //     title: 'Users Management',
    //     description: 'User access control and permissions',
    //     icon: IconUsers,
    //     color: 'text-indigo-600',
    //     bgColor: 'bg-indigo-50/70 border-indigo-200/50 hover:bg-indigo-100/80 hover:border-indigo-300/70',
    //     items: ['User Accounts', 'Role Management', 'Permission Control', 'Access Monitoring'],
    //     url: '/users-management'
    // },

    {
        id: 'iso-documents',
        title: 'ISO Documents Review',
        description: 'International standards documentation',
        icon: IconFileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50/70 border-blue-200/50 hover:bg-blue-100/80 hover:border-blue-300/70',
        items: [
            'ISO 45001 - Occupational Health & Safety',
            'ISO 19011 - Guidelines for Auditing',
            'ISO 9001 - Quality Management Systems'
        ],
        url: '/iso-documents'
    }, {
        id: 'settings',
        title: 'Administration',
        description: 'System configuration and preferences',
        icon: IconSettings,
        color: 'text-red-600',
        bgColor: 'bg-red-50/70 border-red-200/50 hover:bg-red-100/80 hover:border-red-300/70',
        items: [
            'Incident Management',
            'Places & Environment',
            'Resources & Staff',
            'Tools & Measurements',
        ],
        url: '/settings'
    }
];

const NewHomePage = () => {
    const [showModal, setShowModal] = React.useState(false);
    const [selectedModuleName, setSelectedModuleName] = React.useState('');
    const navigate = useNavigate();
    const alwaysAccessibleModuleIds = React.useMemo(() => new Set(['users-management', 'settings', 'iso-documents']), []);

    const isFeatureEnabled = React.useCallback((moduleId?: string) => {
        if (!moduleId) {
            return true;
        }
        if (alwaysAccessibleModuleIds.has(moduleId)) {
            return true;
        }
        return isModuleEnabled(moduleId);
    }, [alwaysAccessibleModuleIds]);

    const handleModuleClick = (module: ModuleCard) => {
        const moduleKey = module.requiredModuleId ?? module.id;
        if (!isFeatureEnabled(moduleKey)) {
            setSelectedModuleName(module.title || 'Unknown Module');
            setShowModal(true);
            return;
        }
        navigate(module.url);
    };

    const handleItemClick = (module: ModuleCard, item: ModuleItem) => {
        if (typeof item === 'string') {
            return;
        }
        const targetModuleId = item.moduleId ?? module.requiredModuleId ?? module.id;
        if (!isFeatureEnabled(targetModuleId)) {
            setSelectedModuleName(item.label || module.title || 'Selected Module');
            setShowModal(true);
            return;
        }
        navigate(item.url);
    };

    return (
        <>
            <div className="flex flex-col gap-5">
                {/* Fixed Header */}
                <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg">
                    <div className="bg-gray-100 rounded-2xl p-3">
                        <div className="flex flex-col items-center justify-center">
                            {/* Gradient Text */}
                            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Health & Safety Management System
                            </h1>
                            <p className=" text-gray-700">
                                Quick access to all your management modules
                            </p>
                        </div>
                    </div>
                </div>


                {/* Content */}
                < div className="" >
                    {/* Quick Stats */}
                    {/* < div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" >
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <IconUsers className="text-blue-600" size={24} stroke={1.75} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Active Employees</p>
                                    <p className="text-2xl font-bold text-gray-900">2,847</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <IconSquareCheck className="text-green-600" size={24} stroke={1.75} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Completed Actions</p>
                                    <p className="text-2xl font-bold text-gray-900">156</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <IconAlertTriangle className="text-orange-600" size={24} stroke={1.75} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Open Incidents</p>
                                    <p className="text-2xl font-bold text-gray-900">23</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <IconChartBar className="text-purple-600" size={24} stroke={1.75} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Compliance Rate</p>
                                    <p className="text-2xl font-bold text-gray-900">94.2%</p>
                                </div>
                            </div>
                        </div>
                    </ div> */}

                    {/* Module Cards Grid */}
                    < div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" >
                        {
                            moduleGroups.map((module) => {
                                const moduleEnabled = isFeatureEnabled(module.requiredModuleId ?? module.id);

                                return (
                                    <div
                                        key={module.id}
                                        className={`
                    bg-white rounded-xl shadow-sm border-2 ${module.bgColor} transition-all duration-300 cursor-pointer
                    ${moduleEnabled ? 'hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-[1.01]' : 'opacity-60 cursor-not-allowed'}
                  `}
                                        onClick={() => handleModuleClick(module)}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center mb-4">
                                                <div className={`p-2 rounded-lg ${module.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                                                    <module.icon
                                                        className={`${moduleEnabled ? module.color : 'text-gray-400'} transition-transform duration-300`}
                                                        size={25}
                                                        stroke={1.75}
                                                    />
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className={`text-base font-semibold ${moduleEnabled ? 'text-gray-900' : 'text-gray-500 italic'}`}>{module.title}</h3>
                                                    {!moduleEnabled && (
                                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full mt-1 inline-block">Not included</span>
                                                    )}
                                                </div>
                                            </div>

                                            <p className={`mb-4 text-sm ${moduleEnabled ? 'text-gray-600' : 'text-gray-400'}`}>{module.description}</p>

                                            <div className="space-y-2">
                                                {module.items.map((item, index) => {
                                                    const itemEnabled = typeof item === 'string'
                                                        ? moduleEnabled
                                                        : isFeatureEnabled(item.moduleId ?? module.requiredModuleId ?? module.id);
                                                    const itemLabel = typeof item === 'string' ? item : item.label;
                                                    const itemClasses = (() => {
                                                        if (typeof item === 'string') {
                                                            return itemEnabled ? 'text-gray-500' : 'text-gray-400';
                                                        }
                                                        return itemEnabled ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer' : 'text-gray-400 cursor-not-allowed';
                                                    })();

                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`flex items-center text-sm transition-colors duration-200 p-1 rounded ${itemClasses}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (typeof item !== 'string') {
                                                                    handleItemClick(module, item);
                                                                }
                                                            }}
                                                        >
                                                            <div
                                                                className={`w-2 h-2 rounded-full mr-3 ${itemEnabled ? module.color.replace('text-', 'bg-') : 'bg-gray-400'}`}
                                                            ></div>
                                                            {itemLabel}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <span className={`text-sm font-medium ${moduleEnabled ? module.color : 'text-gray-400'}`}>
                                                    {moduleEnabled ? 'Access module →' : 'Module disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </ div>
                </div >
            </div >

            {/* Modal */}
            < ModuleSubscriptionModal isOpen={showModal} onClose={() => setShowModal(false)} moduleName={selectedModuleName} />
        </>
    );
};

export default NewHomePage;
