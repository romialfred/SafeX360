import React, { useMemo, useState } from 'react';
import {
    IconAlertTriangle,
    IconMapPin,
    IconUsers,
    IconTools,
    IconSettingsCog,
    IconChevronRight,
    IconTarget,
    IconUserCheck,
    IconShieldLock,
    IconLayersIntersect,
    IconDatabase,
    IconSearch,
    IconCheck,
    IconClock,
    IconBuildingFactory2,
    IconBriefcase,
    IconArrowRight,
    IconBolt,
    IconChartBar,
} from '@tabler/icons-react';
import ModuleManager from './ModuleManager';
import { useNavigate } from 'react-router-dom';
import { TextInput, Badge } from '@mantine/core';

/**
 * Administration SafeX 360 — Refonte LOT 36.
 *
 * Architecture :
 *  - Une colonne de gauche : navigation par zones logiques
 *  - Une colonne de droite : sections, sous-sections, statuts, actions
 *
 * Les 3 zones :
 *   1. IDENTITÉ & ACCÈS      → utilisateurs, rôles, permissions, sécurité
 *   2. DONNÉES OPÉRATIONNELLES → sites, RH, référentiels HSE, mesures
 *   3. SYSTÈME               → modules, performance, configuration avancée
 *
 * Chaque sous-section a :
 *   - un statut (configured / partial / coming) pour ne plus mentir
 *     à l'utilisateur sur ce qui est réellement implémenté
 *   - une URL si la cible existe, sinon désactivée + tooltip "Bientôt"
 */

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────
type ItemStatus = 'configured' | 'partial' | 'coming';

interface AdminItem {
    id: string;
    name: string;
    description: string;
    url: string | null;
    status: ItemStatus;
}

interface AdminCategory {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    accentClass: string;     // ex 'text-teal-700'
    bgAccentClass: string;   // ex 'bg-teal-50 border-teal-100'
    items: AdminItem[];
}

interface AdminZone {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<any>;
    categories: AdminCategory[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const ZONES: AdminZone[] = [
    {
        id: 'identity',
        label: 'Identité & accès',
        description: 'Comptes, rôles, permissions, sécurité',
        icon: IconShieldLock,
        categories: [
            {
                id: 'users-management',
                title: 'Comptes utilisateurs',
                description: 'Création, modification, désactivation des comptes utilisateurs SafeX 360.',
                icon: IconUserCheck,
                accentClass: 'text-orange-700',
                bgAccentClass: 'bg-orange-50 border-orange-100',
                items: [
                    {
                        id: 'users-list',
                        name: 'Liste des utilisateurs',
                        description: 'Consulter, créer, modifier et désactiver les comptes',
                        url: 'users-management',
                        status: 'configured',
                    },
                    {
                        id: 'users-roles',
                        name: 'Rôles & profils',
                        description: 'Définition des rôles métiers HSE (Auditeur, Responsable, Direction)',
                        url: 'users-management',
                        status: 'partial',
                    },
                    {
                        id: 'users-permissions',
                        name: 'Permissions granulaires',
                        description: "Autorisations par module et par action",
                        url: 'users-management',
                        status: 'partial',
                    },
                ],
            },
        ],
    },
    {
        id: 'operations',
        label: 'Données opérationnelles',
        description: 'Sites, équipes, référentiels HSE',
        icon: IconDatabase,
        categories: [
            {
                id: 'places-environment',
                title: 'Sites & environnement',
                description: 'Cartographie des sites miniers, zones, processus et conditions de surveillance.',
                icon: IconMapPin,
                accentClass: 'text-emerald-700',
                bgAccentClass: 'bg-emerald-50 border-emerald-100',
                items: [
                    {
                        id: 'locations',
                        name: 'Sites & emplacements',
                        description: 'Géolocalisation des mines, sites secondaires et bureaux',
                        url: 'location',
                        status: 'configured',
                    },
                    {
                        id: 'env-conditions',
                        name: 'Conditions environnementales',
                        description: 'Météo, qualité air, paramètres de surveillance ambiants',
                        url: 'weatherCondition',
                        status: 'configured',
                    },
                    {
                        id: 'audit-area',
                        name: "Zones d'audit",
                        description: 'Définition des périmètres auditables ISO 19011',
                        url: 'audit-area',
                        status: 'configured',
                    },
                    {
                        id: 'work-area',
                        name: 'Zones de travail',
                        description: 'Découpage opérationnel avec niveau de risque associé',
                        url: 'work-area',
                        status: 'configured',
                    },
                    {
                        id: 'work-process',
                        name: 'Processus de travail',
                        description: 'Cartographie des processus opérationnels HSE',
                        url: 'work-process',
                        status: 'configured',
                    },
                ],
            },
            {
                id: 'resources-staff',
                title: 'Ressources humaines',
                description: 'Équipes, départements, postes et compétences.',
                icon: IconUsers,
                accentClass: 'text-blue-700',
                bgAccentClass: 'bg-blue-50 border-blue-100',
                items: [
                    {
                        id: 'teams',
                        name: 'Équipes',
                        description: 'Constitution des équipes opérationnelles et HSE',
                        url: 'team-setup',
                        status: 'configured',
                    },
                    {
                        id: 'departments',
                        name: 'Départements',
                        description: 'Structure organisationnelle de l\'entreprise',
                        url: null,
                        status: 'coming',
                    },
                    {
                        id: 'positions',
                        name: 'Postes & fonctions',
                        description: 'Référentiel des fonctions et hiérarchie',
                        url: null,
                        status: 'coming',
                    },
                    {
                        id: 'competencies',
                        name: 'Compétences HSE',
                        description: 'Habilitations, formations et certifications',
                        url: null,
                        status: 'coming',
                    },
                ],
            },
            {
                id: 'incident-management',
                title: 'Référentiels incidents',
                description: "Catégories, types et niveaux de gravité des événements HSE.",
                icon: IconAlertTriangle,
                accentClass: 'text-red-700',
                bgAccentClass: 'bg-red-50 border-red-100',
                items: [
                    {
                        id: 'incident-category',
                        name: "Catégories d'incidents",
                        description: 'Classification fonctionnelle des événements',
                        url: 'incidentCategory',
                        status: 'configured',
                    },
                    {
                        id: 'incident-type',
                        name: "Types d'incidents",
                        description: 'LTI, MTI, FAI, Near Miss, Conditions dangereuses',
                        url: 'incidentType',
                        status: 'configured',
                    },
                    {
                        id: 'severity-level',
                        name: 'Niveaux de gravité',
                        description: 'Matrice de criticité conforme ISO 31000',
                        url: 'severityLevel',
                        status: 'configured',
                    },
                ],
            },
            {
                id: 'tools-measurements',
                title: 'Outils & métrologie',
                description: 'Équipements de mesure, calibration et surveillance des paramètres.',
                icon: IconTools,
                accentClass: 'text-violet-700',
                bgAccentClass: 'bg-violet-50 border-violet-100',
                items: [
                    {
                        id: 'measurement-tools',
                        name: 'Appareils de mesure',
                        description: 'Inventaire des instruments métrologiques',
                        url: null,
                        status: 'coming',
                    },
                    {
                        id: 'calibration',
                        name: 'Plan de calibration',
                        description: 'Échéances de vérification métrologique',
                        url: null,
                        status: 'coming',
                    },
                    {
                        id: 'monitoring',
                        name: 'Seuils de surveillance',
                        description: 'Paramètres et alarmes des capteurs HSE',
                        url: null,
                        status: 'coming',
                    },
                ],
            },
        ],
    },
    {
        id: 'system',
        label: 'Système',
        description: 'Modules, performance, configuration',
        icon: IconSettingsCog,
        categories: [
            {
                id: 'module-manager',
                title: 'Modules applicatifs',
                description: "Activation/désactivation des modules HSE selon votre abonnement.",
                icon: IconLayersIntersect,
                accentClass: 'text-indigo-700',
                bgAccentClass: 'bg-indigo-50 border-indigo-100',
                items: [
                    {
                        id: 'module-activation',
                        name: 'Activation des modules',
                        description: 'Activer ou désactiver les modules métier',
                        url: null, // ouvre le ModuleManager interne
                        status: 'configured',
                    },
                    {
                        id: 'subscription',
                        name: 'Abonnement & licences',
                        description: "Plan d'abonnement, capacités et facturation",
                        url: null,
                        status: 'coming',
                    },
                ],
            },
            {
                id: 'performance',
                title: 'Performance & objectifs',
                description: "Cibles HSE, prévisions et seuils d'alerte.",
                icon: IconTarget,
                accentClass: 'text-teal-700',
                bgAccentClass: 'bg-teal-50 border-teal-100',
                items: [
                    {
                        id: 'target-forecast',
                        name: 'Cibles & prévisions',
                        description: 'Objectifs annuels HSE par indicateur',
                        url: 'performance',
                        status: 'configured',
                    },
                    {
                        id: 'global-vars',
                        name: 'Paramètres globaux',
                        description: 'Constantes système et seuils transverses',
                        url: null,
                        status: 'coming',
                    },
                ],
            },
            {
                id: 'advanced',
                title: 'Configuration avancée',
                description: 'Paramètres système, audit trail, export de données.',
                icon: IconSettingsCog,
                accentClass: 'text-slate-700',
                bgAccentClass: 'bg-slate-50 border-slate-100',
                items: [
                    {
                        id: 'system-params',
                        name: 'Paramètres système',
                        description: 'Configuration globale de la plateforme',
                        url: 'advanced-configuration',
                        status: 'configured',
                    },
                ],
            },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS UI
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ItemStatus }) {
    if (status === 'configured') {
        return (
            <Badge size="xs" color="teal" variant="light" radius="sm" leftSection={<IconCheck size={10} />}>
                Configuré
            </Badge>
        );
    }
    if (status === 'partial') {
        // LOT 39 audit P1 fix : Mantine n'a pas "amber" par défaut, on bascule sur "yellow".
        return (
            <Badge size="xs" color="yellow" variant="light" radius="sm" leftSection={<IconBolt size={10} />}>
                Partiel
            </Badge>
        );
    }
    return (
        <Badge size="xs" color="gray" variant="light" radius="sm" leftSection={<IconClock size={10} />}>
            Bientôt
        </Badge>
    );
}

function StatPill({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
    return (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-slate-200">
            <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Icon size={13} className="text-slate-600" />
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 leading-none">{label}</p>
                <p className="text-[14px] text-slate-900 mt-0.5 leading-none">{value}</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const SettingsPage = () => {
    const navigate = useNavigate();
    const [activeZoneId, setActiveZoneId] = useState<string>(ZONES[0].id);
    const [searchTerm, setSearchTerm] = useState('');
    const [moduleManagerOpen, setModuleManagerOpen] = useState(false);

    const activeZone = ZONES.find((z) => z.id === activeZoneId)!;

    // Filtrage live
    const filteredCategories = useMemo(() => {
        if (!searchTerm.trim()) return activeZone.categories;
        const needle = searchTerm.toLowerCase();
        return activeZone.categories
            .map((cat) => ({
                ...cat,
                items: cat.items.filter(
                    (it) =>
                        it.name.toLowerCase().includes(needle) ||
                        it.description.toLowerCase().includes(needle) ||
                        cat.title.toLowerCase().includes(needle),
                ),
            }))
            .filter((cat) => cat.items.length > 0);
    }, [activeZone, searchTerm]);

    // Stats globales (calculées à partir de la config)
    const stats = useMemo(() => {
        let total = 0;
        let configured = 0;
        let coming = 0;
        ZONES.forEach((z) =>
            z.categories.forEach((c) =>
                c.items.forEach((i) => {
                    total++;
                    if (i.status === 'configured') configured++;
                    if (i.status === 'coming') coming++;
                }),
            ),
        );
        return { total, configured, coming };
    }, []);

    const handleItemClick = (item: AdminItem) => {
        if (item.status === 'coming') return;
        // Cas spécial : Module Manager s'ouvre en place (composant existant)
        if (item.id === 'module-activation') {
            setModuleManagerOpen(true);
            return;
        }
        if (item.url) navigate('/' + item.url);
    };

    if (moduleManagerOpen) {
        return <ModuleManager onBackToSettings={() => setModuleManagerOpen(false)} />;
    }

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1500px] mx-auto">

                {/* ═══ En-tête + stats ═══ */}
                <div className="mb-6 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            SafeX 360 · Administration
                        </p>
                        <h1
                            className="text-slate-900 mt-1.5"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 500,
                                fontSize: '30px',
                                letterSpacing: '-0.018em',
                            }}
                        >
                            Configuration de la plateforme
                        </h1>
                        <p className="text-[13.5px] text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                            Pilotez les comptes, référentiels, modules et paramètres système.
                            Les sections affichent leur statut d'implémentation actuel.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <StatPill icon={IconLayersIntersect} label="Sections" value={stats.total} />
                        <StatPill icon={IconCheck} label="Configurées" value={stats.configured} />
                        <StatPill icon={IconClock} label="À venir" value={stats.coming} />
                    </div>
                </div>

                {/* ═══ Conteneur principal split ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">

                    {/* ─── Colonne gauche : zones ─── */}
                    <aside className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden h-fit lg:sticky lg:top-4">
                        <div className="px-4 py-3 border-b border-slate-100">
                            <p className="text-[10.5px] uppercase tracking-[0.16em] text-slate-500">
                                Zones d'administration
                            </p>
                        </div>
                        <nav className="p-2 space-y-1">
                            {ZONES.map((zone) => {
                                const isActive = zone.id === activeZoneId;
                                return (
                                    <button
                                        key={zone.id}
                                        type="button"
                                        onClick={() => setActiveZoneId(zone.id)}
                                        className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                            isActive
                                                ? 'bg-teal-50 border border-teal-200'
                                                : 'border border-transparent hover:bg-slate-50'
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                                                isActive
                                                    ? 'bg-teal-100 text-teal-700'
                                                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                                            }`}
                                        >
                                            <zone.icon size={14} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-[13.5px] tracking-tight ${
                                                isActive ? 'text-teal-900' : 'text-slate-800'
                                            }`}>
                                                {zone.label}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                                {zone.description}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <IconChevronRight size={14} className="text-teal-700 flex-shrink-0 mt-1" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Section "Raccourcis utilisateurs" */}
                        <div className="p-3 border-t border-slate-100">
                            <p className="text-[10.5px] uppercase tracking-[0.16em] text-slate-500 mb-2 px-1">
                                Raccourcis
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/users-management')}
                                className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-slate-50 text-[12.5px] text-slate-700 transition-colors"
                            >
                                <IconBuildingFactory2 size={13} className="text-slate-500" />
                                <span className="flex-1 text-left truncate">Gestion des utilisateurs</span>
                                <IconArrowRight size={12} className="text-slate-400" />
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/performance')}
                                className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-slate-50 text-[12.5px] text-slate-700 transition-colors"
                            >
                                <IconChartBar size={13} className="text-slate-500" />
                                <span className="flex-1 text-left truncate">Cibles &amp; prévisions</span>
                                <IconArrowRight size={12} className="text-slate-400" />
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/advanced-configuration')}
                                className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-slate-50 text-[12.5px] text-slate-700 transition-colors"
                            >
                                <IconBriefcase size={13} className="text-slate-500" />
                                <span className="flex-1 text-left truncate">Paramètres système</span>
                                <IconArrowRight size={12} className="text-slate-400" />
                            </button>
                        </div>
                    </aside>

                    {/* ─── Colonne droite : contenu ─── */}
                    <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">

                        {/* En-tête zone + recherche */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50/40">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                                <div>
                                    <h2
                                        className="text-slate-900"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 500,
                                            fontSize: '20px',
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        {activeZone.label}
                                    </h2>
                                    <p className="text-[12.5px] text-slate-500 mt-0.5">
                                        {activeZone.description}
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] text-slate-600 self-start sm:self-auto">
                                    {activeZone.categories.length} catégorie{activeZone.categories.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            <TextInput
                                placeholder="Rechercher une section, un référentiel…"
                                leftSection={<IconSearch size={14} className="text-slate-400" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                                radius="md"
                                size="sm"
                                styles={{
                                    input: { fontSize: '13px' },
                                }}
                            />
                        </div>

                        {/* Contenu */}
                        <div className="p-5 space-y-6">
                            {filteredCategories.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-[13.5px] text-slate-500">
                                        Aucun résultat pour « {searchTerm} ».
                                    </p>
                                </div>
                            )}

                            {filteredCategories.map((cat) => (
                                <div key={cat.id}>
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-9 h-9 rounded-md border ${cat.bgAccentClass} flex items-center justify-center flex-shrink-0`}>
                                            <cat.icon size={16} className={cat.accentClass} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3
                                                className="text-slate-900"
                                                style={{
                                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                                    fontWeight: 500,
                                                    fontSize: '16px',
                                                    letterSpacing: '-0.008em',
                                                }}
                                            >
                                                {cat.title}
                                            </h3>
                                            <p className="text-[12.5px] text-slate-500 mt-0.5 leading-snug">
                                                {cat.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        {cat.items.map((item, idx) => {
                                            const isLast = idx === cat.items.length - 1;
                                            const disabled = item.status === 'coming';
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    disabled={disabled}
                                                    onClick={() => handleItemClick(item)}
                                                    className={`w-full text-left flex items-center gap-4 p-3.5 transition-colors ${
                                                        !isLast ? 'border-b border-slate-100' : ''
                                                    } ${
                                                        disabled
                                                            ? 'cursor-not-allowed bg-slate-50/30'
                                                            : 'hover:bg-slate-50/60 cursor-pointer'
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[13.5px] truncate ${
                                                                disabled ? 'text-slate-500' : 'text-slate-800'
                                                            }`}>
                                                                {item.name}
                                                            </span>
                                                            <StatusBadge status={item.status} />
                                                        </div>
                                                        <p className="text-[12px] text-slate-500 mt-0.5 truncate">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                    {!disabled && (
                                                        <IconChevronRight size={15} className="text-slate-400 flex-shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
