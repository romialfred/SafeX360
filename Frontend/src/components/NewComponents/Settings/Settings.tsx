import React, { useState } from 'react';
import {
    IconArrowLeft,
    IconAlertTriangle,
    IconMapPin,
    IconUsers,
    IconTools,
    IconSettingsCog,
    IconChevronRight,
    IconLayersOff,
    IconTarget,
    IconUserCheck,
} from '@tabler/icons-react';
import ModuleManager from './ModuleManager';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mantine/core';



interface SettingCategory {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    items: SettingItem[];
    url?: string | null;
}

interface SettingItem {
    id: string;
    name: string;
    description: string;
    type: 'category' | 'toggle' | 'select' | 'input';
    value?: any;
    options?: string[];
    url?: string | null;
}

const settingsCategories: SettingCategory[] = [
    {
        id: 'users-management',
        title: 'Users Management',
        description: 'Create user accounts and manage roles in compliance with SOX requirements.',
        icon: IconUserCheck,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
        items: [
            {
                id: 'new-user',
                name: 'New User',
                description: 'Create and manage user accounts',
                type: 'category',
                url: 'users-management',
            },
            {
                id: 'user-roles',
                name: 'User Roles',
                description: 'Manage user roles and permissions',
                type: 'category',
                url: 'users-management',
            },
            {
                id: 'user-permissions',
                name: 'User Permissions',
                description: 'Manage user permissions and access levels',
                type: 'category',
                url: 'users-management',
            },

        ],
    },
    {
        id: 'module-manager',
        title: 'Module Manager',
        description: 'Enable or disable application modules and features',
        icon: IconLayersOff,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 border-indigo-200',
        items: [
            {
                id: 'module-activation',
                name: 'Module Activation',
                description: 'Enable or disable specific modules',
                type: 'category',
                url: null,
            },
            {
                id: 'subscription-management',
                name: 'Subscription Management',
                description: 'Manage your subscription and available features',
                type: 'category',
                url: null,
            },
        ],
    },
    {
        id: 'performance',
        title: 'Performance',
        description: 'Performance management, targets, and forecasting settings',
        icon: IconTarget,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50 border-teal-200',
        items: [
            {
                id: 'target-forecast-set',
                name: 'Target and Forecast Set',
                description: 'Gestion des indicateurs de performance et planification',
                type: 'category',
                url: 'performance',
            },
            {
                id: 'global-variable',
                name: 'Subscription Management',
                description: 'Manage global variables and system parameters',
                type: 'category',
                url: null,
            },
        ],
    },
    {
        id: 'incident-management',
        title: 'Incident Management',
        description: 'Configure incident types, categories, and severity levels',
        icon: IconAlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        items: [
            {
                id: 'incident-category',
                name: 'Incident Category',
                description: 'Define incident categories for classification',
                type: 'category',
                url: 'incidentCategory',
            },
            {
                id: 'incident-type',
                name: 'Incident Type',
                description: 'Configure different types of incidents',
                type: 'category',
                url: 'incidentType',
            },
            {
                id: 'severity-level',
                name: 'Severity Level',
                description: 'Set up severity levels for incidents',
                type: 'category',
                url: 'severityLevel',
            },
        ],
    },
    {
        id: 'places-environment',
        title: 'Places & Environment',
        description: 'Manage locations, environmental conditions, and work areas',
        icon: IconMapPin,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        items: [
            {
                id: 'locations',
                name: 'Locations',
                description: 'Configure company locations and sites',
                type: 'category',
                url: 'location',
            },
            {
                id: 'environmental-conditions',
                name: 'Environmental Conditions',
                description: 'Set up environmental monitoring parameters',
                type: 'category',
                url: 'weatherCondition',
            },
            {
                id: 'audit-area',
                name: 'Audit Area',
                description: 'Define areas for audit activities',
                type: 'category',
                url: 'audit-area',
            },
            {
                id: 'work-area',
                name: 'Work Area',
                description: 'Configure work areas and zones',
                type: 'category',
                url: 'work-area',
            },
            {
                id: 'work-process',
                name: 'Work Process',
                description: 'Define and manage work processes',
                type: 'category',
                url: 'work-process',
            }
        ],
    },
    {
        id: 'resources-staff',
        title: 'Resources & Staff',
        description: 'Manage human resources and staffing configurations',
        icon: IconUsers,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        items: [
            {
                id: 'teams',
                name: 'Teams',
                description: 'Manage teams and their configurations',
                type: 'category',
                url: 'team-setup',
            },
            {
                id: 'departments',
                name: 'Departments',
                description: 'Configure organizational departments',
                type: 'category',
                url: null,
            },
            {
                id: 'positions',
                name: 'Positions',
                description: 'Define job positions and roles',
                type: 'category',
                url: null,
            },
            {
                id: 'competencies',
                name: 'Competencies',
                description: 'Set up required competencies and skills',
                type: 'category',
                url: null,
            },
        ],
    },
    {
        id: 'tools-measurements',
        title: 'Tools & Measurements',
        description: 'Configure measurement tools and monitoring equipment',
        icon: IconTools,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200',
        items: [
            {
                id: 'measurement-tools',
                name: 'Measurement Tools',
                description: 'Configure measurement and monitoring tools',
                type: 'category',
                url: null,
            },
            {
                id: 'calibration-schedule',
                name: 'Calibration Schedule',
                description: 'Set up equipment calibration schedules',
                type: 'category',
                url: null,
            },
            {
                id: 'monitoring-parameters',
                name: 'Monitoring Parameters',
                description: 'Define parameters for monitoring activities',
                type: 'category',
                url: null,
            },
        ],
    },
    {
        id: 'advanced-configuration',
        title: 'Advanced Configuration',
        description: 'System-wide settings and advanced configurations',
        icon: IconSettingsCog,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200',
        items: [
            {
                id: 'advanced-configuration',
                name: 'Advanced Configuration',
                description: 'System-wide settings and advanced configurations',
                type: 'category',
                url: 'advanced-configuration',
            },

        ],
    },
];
const SettingsPage = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId);
    };

    const handleItemClick = (item: SettingItem) => {
        if (item.url) {
            navigate("/" + (item.url));
        }
    };

    if (selectedCategory === 'module-manager') {
        return <ModuleManager onBackToSettings={() => setSelectedCategory(null)} />;
    }

    if (selectedCategory) {
        const category = settingsCategories.find((cat) => cat.id === selectedCategory);
        if (!category) return null;

        return (
            <div className="p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen ">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-10">
                        {/* Back Button */}
                        <Button
                            variant="light"
                            radius="xl"
                            size="md"
                            className="transition-transform duration-300 hover:scale-0.5 hover:!border hover:border-primary "
                            onClick={() => setSelectedCategory(null)}
                            leftSection={<IconArrowLeft size={20} />}
                        >
                            Back
                        </Button>

                        {/* Title + Description */}
                        <div className="flex-1 text-center">
                            <h1 className="text-3xl font-medium text-blue-500 mb-2 tracking-tight">
                                {category.title}
                            </h1>
                            <p className="text-gray-600 text-sm max-w-2xl mx-auto">
                                {category.description}
                            </p>
                        </div>

                        {/* Placeholder div to balance spacing */}

                    </div>

                    {/* Items List */}
                    <div className="bg-white rounded-2xl shadow-md border border-primary overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {category.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-6 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer transition-all duration-200"
                                    onClick={() => handleItemClick(item)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-primary mb-1">
                                                {item.name}
                                            </h3>
                                            <p className="text-gray-600 text-sm">{item.description}</p>
                                        </div>
                                        <IconChevronRight className="w-5 h-5 text-primary group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 flex flex-col gap-5">

            <div className=" ">
                <h1 className="text-3xl font-medium mb-2">Administration</h1>
                <p className="text-gray-600 italic">System administration, configuration and preferences</p>
            </div>
            <div className="">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {settingsCategories.map((category) => (
                        <div
                            key={category.id}
                            className={`
                bg-white rounded-xl shadow-sm border-2 ${category.bgColor} 
                hover:shadow-xl transition-all duration-300 cursor-pointer
                transform hover:-translate-y-0.5 hover:scale-0.5
              `}
                            onClick={() => handleCategoryClick(category.id)}
                        >
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <div className={`p-3 rounded-lg ${category.bgColor} transition-transform duration-300`}>
                                        <category.icon className={`w-8 h-8 ${category.color} transition-transform duration-300`} />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                                    </div>
                                </div>

                                <p className="text-gray-600 mb-4 text-sm">{category.description}</p>

                                <div className="space-y-2">
                                    {category.items.slice(0, 3).map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer p-1 rounded hover:bg-gray-50"
                                        >
                                            <div className={`w-2 h-2 rounded-full ${category.color.replace('text-', 'bg-')} mr-3`}></div>
                                            {item.name}
                                        </div>
                                    ))}
                                    {category.items.length > 3 && (
                                        <div className="text-sm text-gray-400 italic">+{category.items.length - 3} more settings</div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <span className={`text-sm font-medium ${category.color}`}>Configure settings →</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;