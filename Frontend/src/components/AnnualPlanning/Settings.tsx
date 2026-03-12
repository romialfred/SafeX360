import React from 'react';
import {
    IconAlertTriangle,
    IconMapPin,
    IconUsers,
    IconSettings as IconSettingsGear,
    IconClipboardList,
    IconRuler,
    IconClock,
    IconTarget,
    IconFileText,
    IconShield,
    IconLeaf,
    IconUser,
    IconBuilding,
    IconTool,
    IconChevronRight
} from '@tabler/icons-react';

interface SettingGroup {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
    items: {
        id: string;
        label: string;
        description: string;
        icon: React.ComponentType<any>;
    }[];
}

export default function Settings() {
    const settingGroups: SettingGroup[] = [
        {
            id: 'incident-management',
            title: 'Incident Management',
            description: 'Configure incident categories, types, and severity levels',
            icon: IconAlertTriangle,
            color: 'from-red-500 to-red-600',
            items: [
                {
                    id: 'incident-category',
                    label: 'Incident Category',
                    description: 'Define and manage incident categories',
                    icon: IconClipboardList
                },
                {
                    id: 'incident-type',
                    label: 'Incident Type',
                    description: 'Configure different types of incidents',
                    icon: IconAlertTriangle
                },
                {
                    id: 'severity-level',
                    label: 'Severity Level',
                    description: 'Set up incident severity classifications',
                    icon: IconShield
                }
            ]
        },
        {
            id: 'places-environment',
            title: 'Places & Environment',
            description: 'Manage locations, environmental conditions, and work areas',
            icon: IconMapPin,
            color: 'from-green-500 to-green-600',
            items: [
                {
                    id: 'locations',
                    label: 'Locations',
                    description: 'Configure facility locations and zones',
                    icon: IconMapPin
                },
                {
                    id: 'environmental-conditions',
                    label: 'Environmental Conditions',
                    description: 'Set environmental parameters and conditions',
                    icon: IconLeaf
                },
                {
                    id: 'audit-area',
                    label: 'Audit Area',
                    description: 'Define areas for auditing purposes',
                    icon: IconClipboardList
                },
                {
                    id: 'work-area',
                    label: 'Work Area',
                    description: 'Manage work zones and operational areas',
                    icon: IconBuilding
                }
            ]
        },
        {
            id: 'resources-staff',
            title: 'Resources & Staff',
            description: 'Configure staff roles, committees, and organizational structure',
            icon: IconUsers,
            color: 'from-blue-500 to-blue-600',
            items: [
                {
                    id: 'hse-committee',
                    label: 'H&S Committee',
                    description: 'Manage health and safety committee members',
                    icon: IconUsers
                },
                {
                    id: 'body-parts',
                    label: 'Body Parts',
                    description: 'Configure body parts for injury tracking',
                    icon: IconUser
                },
                {
                    id: 'work-process',
                    label: 'Work Process',
                    description: 'Define work processes and procedures',
                    icon: IconTool
                },
                {
                    id: 'auditor',
                    label: 'Auditor',
                    description: 'Manage auditor profiles and qualifications',
                    icon: IconShield
                }
            ]
        },
        {
            id: 'tools-measurements',
            title: 'Tools & Measurements',
            description: 'Configure measurement tools, checklists, and technical parameters',
            icon: IconRuler,
            color: 'from-purple-500 to-purple-600',
            items: [
                {
                    id: 'checklist',
                    label: 'Checklist',
                    description: 'Create and manage inspection checklists',
                    icon: IconClipboardList
                },
                {
                    id: 'technical-measurements',
                    label: 'Technical Measurements',
                    description: 'Configure technical measurement parameters',
                    icon: IconRuler
                }
            ]
        },
        {
            id: 'advanced-configuration',
            title: 'Advanced Configuration',
            description: 'Advanced system settings and configurations',
            icon: IconSettingsGear,
            color: 'from-indigo-500 to-indigo-600',
            items: [
                {
                    id: 'duration',
                    label: 'Duration',
                    description: 'Configure time duration settings',
                    icon: IconClock
                },
                {
                    id: 'investigation-setting',
                    label: 'Investigation Setting',
                    description: 'Set up investigation parameters and workflows',
                    icon: IconFileText
                },
                {
                    id: 'target-kpis',
                    label: 'Target KPIs',
                    description: 'Define key performance indicators and targets',
                    icon: IconTarget
                }
            ]
        }
    ];

    const handleSettingClick = (groupId: string, itemId: string) => {
        console.log(`Navigate to: ${groupId} -> ${itemId}`);
        // Here you would implement navigation to specific setting pages
    };

    return (
        <div className="flex-1 bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                        <nav className="text-sm text-slate-600 mt-1">
                            <span>Home</span>
                            <span className="mx-2">/</span>
                            <span className="text-teal-600">Settings</span>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Settings Overview */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 text-white mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">System Configuration</h2>
                                <p className="text-teal-100">
                                    Configure and customize your HSE management system settings
                                </p>
                            </div>
                            <IconSettingsGear className="w-16 h-16 text-teal-200" />
                        </div>
                    </div>
                </div>

                {/* Settings Groups */}
                <div className="space-y-8">
                    {settingGroups.map((group) => {
                        const GroupIcon = group.icon;
                        return (
                            <div key={group.id} className="bg-white rounded-2xl shadow-lg border border-slate-100">
                                {/* Group Header */}
                                <div className="p-6 border-b border-slate-100">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-12 h-12 bg-gradient-to-r ${group.color} rounded-xl flex items-center justify-center shadow-lg`}>
                                            <GroupIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">{group.title}</h3>
                                            <p className="text-slate-600 mt-1">{group.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Group Items */}
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {group.items.map((item) => {
                                            const ItemIcon = item.icon;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleSettingClick(group.id, item.id)}
                                                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 text-left group"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="w-10 h-10 bg-slate-100 group-hover:bg-teal-100 rounded-lg flex items-center justify-center transition-colors">
                                                            <ItemIcon className="w-5 h-5 text-slate-600 group-hover:text-teal-600" />
                                                        </div>
                                                        <IconChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                                                    </div>
                                                    <h4 className="font-semibold text-slate-800 mb-2">{item.label}</h4>
                                                    <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors text-left">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <IconFileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800">Export Settings</h4>
                                    <p className="text-sm text-slate-600">Download configuration backup</p>
                                </div>
                            </div>
                        </button>

                        <button className="p-4 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 transition-colors text-left">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                    <IconClipboardList className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800">Import Settings</h4>
                                    <p className="text-sm text-slate-600">Restore from backup file</p>
                                </div>
                            </div>
                        </button>

                        <button className="p-4 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors text-left">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                    <IconSettingsGear className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800">Reset to Default</h4>
                                    <p className="text-sm text-slate-600">Restore default settings</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}