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
        title: 'Gestion des utilisateurs',
        description: "Création des comptes utilisateurs, attribution des rôles et permissions",
        icon: IconUserCheck,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
        items: [
            { id: 'new-user', name: 'Nouveaux comptes', description: "Création et gestion des comptes utilisateurs", type: 'category', url: 'users-management' },
            { id: 'user-roles', name: 'Rôles utilisateurs', description: "Définition des rôles et permissions", type: 'category', url: 'users-management' },
            { id: 'user-permissions', name: 'Permissions', description: "Gestion fine des autorisations d'accès", type: 'category', url: 'users-management' },
        ],
    },
    {
        id: 'module-manager',
        title: 'Modules applicatifs',
        description: "Activation/désactivation des modules et fonctionnalités",
        icon: IconLayersOff,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 border-indigo-200',
        items: [
            { id: 'module-activation', name: 'Activation des modules', description: "Activer ou désactiver les modules HSE", type: 'category', url: null },
            { id: 'subscription-management', name: 'Abonnement', description: "Gestion de l'abonnement et des licences", type: 'category', url: null },
        ],
    },
    {
        id: 'performance',
        title: 'Performance & objectifs',
        description: "Indicateurs cibles, prévisions et seuils de performance HSE",
        icon: IconTarget,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50 border-teal-200',
        items: [
            { id: 'target-forecast-set', name: 'Cibles & prévisions', description: "Définition des cibles HSE et planification", type: 'category', url: 'performance' },
            { id: 'global-variable', name: 'Paramètres globaux', description: "Variables globales et paramètres système", type: 'category', url: null },
        ],
    },
    {
        id: 'incident-management',
        title: 'Gestion des incidents',
        description: "Types d'incidents, catégories et niveaux de gravité",
        icon: IconAlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        items: [
            { id: 'incident-category', name: "Catégories d'incidents", description: "Classification fonctionnelle", type: 'category', url: 'incidentCategory' },
            { id: 'incident-type', name: "Types d'incidents", description: "LTI, MTI, FAI, Near Miss, dangereux...", type: 'category', url: 'incidentType' },
            { id: 'severity-level', name: 'Niveaux de gravité', description: "Matrice de criticité ISO 31000", type: 'category', url: 'severityLevel' },
        ],
    },
    {
        id: 'places-environment',
        title: 'Lieux & environnement',
        description: "Sites, zones, conditions environnementales et processus",
        icon: IconMapPin,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        items: [
            { id: 'locations', name: 'Sites & emplacements', description: "Configuration des sites de la mine", type: 'category', url: 'location' },
            { id: 'environmental-conditions', name: 'Conditions environnementales', description: "Paramètres de surveillance météo", type: 'category', url: 'weatherCondition' },
            { id: 'audit-area', name: "Zones d'audit", description: "Définition des périmètres auditables", type: 'category', url: 'audit-area' },
            { id: 'work-area', name: 'Zones de travail', description: "Configuration des zones et niveaux de risque", type: 'category', url: 'work-area' },
            { id: 'work-process', name: 'Processus de travail', description: "Cartographie des processus opérationnels", type: 'category', url: 'work-process' },
        ],
    },
    {
        id: 'resources-staff',
        title: 'Ressources humaines',
        description: "Équipes, départements, postes et compétences",
        icon: IconUsers,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        items: [
            { id: 'teams', name: 'Équipes', description: "Constitution et gestion des équipes", type: 'category', url: 'team-setup' },
            { id: 'departments', name: 'Départements', description: "Structure organisationnelle", type: 'category', url: null },
            { id: 'positions', name: 'Postes', description: "Définition des fonctions et rôles", type: 'category', url: null },
            { id: 'competencies', name: 'Compétences', description: "Référentiel des compétences HSE", type: 'category', url: null },
        ],
    },
    {
        id: 'tools-measurements',
        title: 'Outils & mesures',
        description: "Équipements de mesure et calibration",
        icon: IconTools,
        color: 'text-violet-600',
        bgColor: 'bg-violet-50 border-violet-200',
        items: [
            { id: 'measurement-tools', name: 'Outils de mesure', description: "Configuration des appareils de mesure", type: 'category', url: null },
            { id: 'calibration-schedule', name: 'Planning de calibration', description: "Échéances de vérification métrologique", type: 'category', url: null },
            { id: 'monitoring-parameters', name: 'Paramètres de surveillance', description: "Seuils et alarmes des capteurs", type: 'category', url: null },
        ],
    },
    {
        id: 'advanced-configuration',
        title: 'Configuration avancée',
        description: "Paramètres système et configurations avancées",
        icon: IconSettingsCog,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50 border-slate-200',
        items: [
            { id: 'advanced-configuration', name: 'Paramètres système', description: "Configuration globale de la plateforme", type: 'category', url: 'advanced-configuration' },
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
                            <h1 className="text-2xl font-semibold text-blue-500 mb-2 tracking-tight">
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
                                            <h3 className="text-lg text-primary mb-1">
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
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            {/* Page header sobre */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-3 border-b border-slate-200">
                <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider">SafeX360 · Configuration</div>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0">
                            <IconSettingsCog size={22} className="text-slate-700" stroke={2} />
                        </div>
                        <div>
                            <h1 className="text-2xl text-slate-900 tracking-tight leading-tight">Administration</h1>
                            <p className="text-sm text-slate-500 mt-0.5">Configuration système, modules, référentiels et paramètres avancés</p>
                        </div>
                    </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Modules</span>
                    <span className="text-xs text-slate-700">{settingsCategories.length}</span>
                </div>
            </div>

            {/* Grille de tuiles raffinées */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {settingsCategories.map((category) => {
                    const dotColor = category.color.replace('text-', 'bg-');
                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => handleCategoryClick(category.id)}
                            className="group text-left bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden"
                        >
                            <div className={`px-4 py-2.5 ${category.bgColor.split(' ')[0]}/60 border-b ${category.bgColor.split(' ')[1]}/70 flex items-center gap-2`}>
                                <div className={`p-1 rounded ${category.bgColor.split(' ')[0]}`}>
                                    <category.icon size={14} className={category.color} />
                                </div>
                                <h3 className="text-xs text-slate-800 uppercase tracking-wider flex-1 truncate">
                                    {category.title}
                                </h3>
                                <IconChevronRight size={13} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <div className="p-3">
                                <p className="text-xs text-slate-600 leading-snug mb-3 line-clamp-2 min-h-[2.6em]">
                                    {category.description}
                                </p>
                                <div className="space-y-1">
                                    {category.items.slice(0, 3).map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 text-[11px] text-slate-600">
                                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`}></span>
                                            <span className="truncate">{item.name}</span>
                                        </div>
                                    ))}
                                    {category.items.length > 3 && (
                                        <div className="text-[10px] text-slate-400 italic pl-3.5">
                                            +{category.items.length - 3} autres
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <span className={`text-[11px] ${category.color}`}>Configurer</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{category.items.length} {category.items.length > 1 ? 'options' : 'option'}</span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SettingsPage;