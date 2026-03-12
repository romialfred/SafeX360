import React, { useEffect, useState } from 'react';
import {
    IconArrowLeft,
    IconSettings,
    IconToggleLeft,
    IconToggleRight,
    IconSearch,
    IconFilter,
    IconChevronDown,
    IconChevronRight,
    IconCircleCheck,
    IconCircleX,
    IconLayersOff,
} from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { moduleConfigurations, updateModuleStatus as updateModuleStatusLocal } from '../data/ModuleConfig';
import {
    createModuleFeature,
    getAllModuleFeatures,
    getModuleFeatureByKey,
    updateModuleFeatureStatus,
    type ModuleFeatureDto,
} from '../../../services/ModuleManagementService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';

interface ModuleManagerProps {
    onBackToSettings: () => void;
}

const ModuleManager: React.FC<ModuleManagerProps> = ({ onBackToSettings }) => {
    const [modules, setModules] = useState<any[]>(moduleConfigurations);
    const [remoteMap, setRemoteMap] = useState<Record<string, ModuleFeatureDto>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    // Helpers to convert local ids (kebab-case) to API keys (snake_case)
    const idToKey = (id: string) => id.replace(/-/g, '_');

    useEffect(() => {
        // Fetch remote flags and merge into local module list
        const load = async () => {
            try {
                const all = await getAllModuleFeatures();
                console.log(all);
                const map: Record<string, ModuleFeatureDto> = {};
                all.forEach((m) => {
                    map[m.module] = m;
                });
                setRemoteMap(map);

                // Apply remote status to local config where available
                setModules((prev) =>
                    prev.map((m) => {
                        const apiKey = idToKey(m.id);
                        const remote = map[apiKey];
                        if (remote) {
                            const enabled = remote.status === 'ACTIVE';
                            // Keep global ModuleConfig in sync for feature gating elsewhere
                            updateModuleStatusLocal(m.id, enabled);
                            return { ...m, isEnabled: enabled };
                        }
                        return m;
                    })
                );
            } catch (e) {
                // Keep local defaults, just notify error
                errorNotification('Failed to load module flags');
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const categories = ['all', ...Array.from(new Set(modules.map((module) => module.category)))];

    const filteredModules = modules.filter((module) => {
        const matchesSearch =
            module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            module.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const groupedModules: Record<string, any[]> = filteredModules.reduce((acc: Record<string, any[]>, module) => {
        if (!acc[module.category]) {
            acc[module.category] = [];
        }
        acc[module.category].push(module);
        return acc;
    }, {});

    const handleToggleModule = async (moduleId: string) => {
        const target = modules.find((m) => m.id === moduleId);
        if (!target) return;

        const nextEnabled = !target.isEnabled;
        const apiKey = idToKey(moduleId);
        const existing = remoteMap[apiKey];

        // Optimistic UI update
        setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, isEnabled: nextEnabled } : m)));

        try {
            let updated: ModuleFeatureDto;
            const nextStatus = nextEnabled ? 'ACTIVE' : 'INACTIVE' as const;

            if (existing) {
                updated = await updateModuleFeatureStatus(existing.id, nextStatus);
            } else {
                // Try create; if it already exists, recover with getByModule and update
                try {
                    updated = await createModuleFeature({ module: apiKey, status: nextStatus });
                } catch (err: any) {
                    if (err?.response?.status === 409) {
                        const found = await getModuleFeatureByKey(apiKey);
                        updated = await updateModuleFeatureStatus(found.id, nextStatus);
                    } else {
                        throw err;
                    }
                }
            }

            setRemoteMap((prev) => ({ ...prev, [updated.module]: updated }));
            // Update global ModuleConfig mirror for other components
            updateModuleStatusLocal(moduleId, nextEnabled);
            successNotification(`${target.name} ${nextEnabled ? 'enabled' : 'disabled'}`);
        } catch (e: any) {
            // Rollback optimistic update
            setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, isEnabled: !nextEnabled } : m)));
            const msg = e?.response?.data?.message || 'Failed to update module status';
            errorNotification(msg);
        }
    };

    const enabledCount = modules.filter((m) => m.isEnabled).length;
    const totalCount = modules.length;
    const disabledCount = totalCount - enabledCount;

    const toggleCategoryCollapse = (category: string) => {
        const newCollapsed = new Set(collapsedCategories);
        if (newCollapsed.has(category)) {
            newCollapsed.delete(category);
        } else {
            newCollapsed.add(category);
        }
        setCollapsedCategories(newCollapsed);
    };

    const getCategoryColor = (category: string) => {
        const colors = {
            'Prevention Activities': 'bg-red-50 border-red-200',
            'Monitoring Activities': 'bg-purple-50 border-purple-200',
            'Actions Managers': 'bg-gray-50 border-gray-200',
            'Risk Management': 'bg-orange-50 border-orange-200',
            'PPE Management': 'bg-blue-50 border-blue-200',
            'Audits Management': 'bg-yellow-50 border-yellow-200',
            'Compliance Management': 'bg-green-50 border-green-200',
            'Knowledge Center': 'bg-cyan-50 border-cyan-200',
            'Safety Communication': 'bg-pink-50 border-pink-200',
        };
        return colors[category as keyof typeof colors] || 'bg-gray-50 border-gray-200';
    };

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen flex flex-col gap-10">
            {/* Header Section */}
            <div className="flex items-center justify-between ">
                {/* Back Button */}
                <Button
                    variant="light"
                    radius="xl"
                    size="md"
                    className="transition-transform duration-300 hover:scale-0.5 hover:!border hover:border-primary "
                    onClick={onBackToSettings}
                    leftSection={<IconArrowLeft size={20} />}
                >
                    Back
                </Button>

                {/* Title + Description */}
                <div className="flex-1 text-center">
                    <h1 className="text-3xl font-medium text-blue-500 mb-2 tracking-tight">Module Manager</h1>
                    <p className="text-gray-600 text-sm">Enable or disable application modules</p>
                </div>

                {/* Spacer for balance */}
                <div className="w-10"></div>
            </div>

            {/* Content */}
            <div className="p-10 shadow-sm border border-gray-300 rounded-xl ">
                {/* Summary Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <IconLayersOff className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Total Modules</p>
                                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <IconCircleCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Active Modules</p>
                                <p className="text-2xl font-bold text-green-600">{enabledCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <IconCircleX className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Deactivated Modules</p>
                                <p className="text-2xl font-bold text-red-600">{disabledCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <IconSearch className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search modules..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="md:w-64">
                            <div className="relative">
                                <IconFilter className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.slice(1).map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module Groups */}
                <div className="space-y-4">
                    {Object.entries(groupedModules).map(([category, categoryModules]) => {
                        const isCollapsed = collapsedCategories.has(category);
                        const categoryBgColor = getCategoryColor(category);

                        return (
                            <div key={category} className={`rounded-xl shadow-sm border-2 ${categoryBgColor} overflow-hidden`}>
                                <div
                                    className="p-6 cursor-pointer hover:bg-opacity-80 transition-colors"
                                    onClick={() => toggleCategoryCollapse(category)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="mr-3">
                                                {isCollapsed ? (
                                                    <IconChevronRight className="w-5 h-5 text-gray-600" />
                                                ) : (
                                                    <IconChevronDown className="w-5 h-5 text-gray-600" />
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {categoryModules.filter((m: any) => m.isEnabled).length} of {categoryModules.length} modules enabled
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500">Active</div>
                                                <div className="text-lg font-bold text-green-600">
                                                    {categoryModules.filter((m) => m.isEnabled).length}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500">Inactive</div>
                                                <div className="text-lg font-bold text-red-600">
                                                    {categoryModules.filter((m) => !m.isEnabled).length}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!isCollapsed && (
                                    <div className="bg-white bg-opacity-60 divide-y divide-gray-100">
                                        {categoryModules.map((module) => (
                                            <div
                                                key={module.id}
                                                className={`p-6 transition-colors ${module.isEnabled ? 'hover:bg-white hover:bg-opacity-80' : 'bg-gray-50 bg-opacity-50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center">
                                                            <h3
                                                                className={`text-lg font-medium ${module.isEnabled ? 'text-gray-900' : 'text-gray-400 italic'
                                                                    }`}
                                                            >
                                                                {module.name}
                                                            </h3>
                                                            {!module.isEnabled && (
                                                                <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                                                                    Disabled
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p
                                                            className={`text-sm mt-1 ${module.isEnabled ? 'text-gray-600' : 'text-gray-400'
                                                                }`}
                                                        >
                                                            {module.description}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() => handleToggleModule(module.id)}
                                                        className={`ml-6 p-1 rounded-full transition-colors ${module.isEnabled
                                                            ? 'text-green-600 hover:text-green-700'
                                                            : 'text-gray-400 hover:text-gray-500'
                                                            }`}
                                                    >
                                                        {module.isEnabled ? (
                                                            <IconToggleRight className="w-8 h-8" />
                                                        ) : (
                                                            <IconToggleLeft className="w-8 h-8" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Summary */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center">
                        <IconSettings className="w-6 h-6 text-blue-600 mr-3" />
                        <div>
                            <h3 className="text-lg font-semibold text-blue-900">Module Configuration</h3>
                            <p className="text-blue-700 text-sm">
                                Changes are saved automatically. Disabled modules will appear grayed out in the navigation menu.
                                Click on category headers to expand/collapse sections.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModuleManager;
