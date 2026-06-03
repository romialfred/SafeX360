import React, { useState } from 'react';
import {
    IconBook,
    IconEye,
    IconFileText,
    IconSearch,
    IconPlayerPlay,
    IconChevronRight,
    IconChevronDown,
    IconExternalLink,
    IconDownload,
    IconClock,
    IconShield,
    IconAlertTriangle,
    IconHelmet,
    IconClipboardCheck,
    IconSettings,
    IconVideo,
    IconDeviceDesktop,
    IconHelpCircle,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import TechnicalDocumentation from './TechnicalDocumentation';

interface HelpItem {
    id: string;
    title: string;
    description: string;
    category: string;
    type: 'guide' | 'video' | 'documentation';
    duration?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    content?: string;
    videoUrl?: string;
    lastUpdated: string;
}

interface FeatureCategory {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    description: string;
    items: HelpItem[];
}

const helpContent: FeatureCategory[] = [
    {
        id: 'getting-started',
        name: 'Démarrage',
        icon: IconPlayerPlay,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        description: 'Guides essentiels pour démarrer avec la plateforme',
        items: [
            {
                id: 'platform-overview',
                title: 'Présentation de la plateforme',
                description: 'Introduction complète au système de management Santé & Sécurité',
                category: 'Démarrage',
                type: 'video',
                duration: '8 min',
                difficulty: 'beginner',
                tags: ['présentation', 'introduction', 'bases'],
                videoUrl: 'https://example.com/platform-overview',
                lastUpdated: '2026-01-20',
                content: "Apprenez les fondamentaux de notre plateforme complète de management de la santé et sécurité au travail..."
            },
            {
                id: 'first-login',
                title: 'Votre première connexion',
                description: 'Guide pas à pas pour les nouveaux utilisateurs',
                category: 'Démarrage',
                type: 'guide',
                duration: '5 min',
                difficulty: 'beginner',
                tags: ['connexion', 'configuration', 'compte'],
                lastUpdated: '2026-01-18',
                content: 'Bienvenue sur la plateforme ! Ce guide vous accompagne lors de votre première connexion et configuration initiale...'
            },
            {
                id: 'navigation-basics',
                title: 'Bases de la navigation',
                description: "Comprendre la structure du menu et la navigation",
                category: 'Démarrage',
                type: 'guide',
                duration: '3 min',
                difficulty: 'beginner',
                tags: ['navigation', 'menu', 'interface'],
                lastUpdated: '2026-01-15',
                content: "Apprenez à naviguer efficacement dans l'application via le menu latéral..."
            }
        ]
    },
    {
        id: 'incident-management',
        name: 'Gestion des incidents',
        icon: IconAlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        description: 'Gérer les incidents, investigations et actions correctives',
        items: [
            {
                id: 'report-incident',
                title: 'Comment déclarer un incident',
                description: "Guide complet du processus de déclaration d'incident",
                category: 'Gestion des incidents',
                type: 'video',
                duration: '12 min',
                difficulty: 'beginner',
                tags: ['incident', 'déclaration', 'sécurité'],
                videoUrl: 'https://example.com/report-incident',
                lastUpdated: '2026-01-22',
                content: 'Apprenez la procédure étape par étape pour déclarer les incidents survenus sur site...'
            },
            {
                id: 'investigation-process',
                title: "Processus d'investigation d'incident",
                description: "Mener des investigations rigoureuses d'incidents",
                category: 'Gestion des incidents',
                type: 'guide',
                duration: '15 min',
                difficulty: 'intermediate',
                tags: ['investigation', 'analyse', 'cause-racine'],
                lastUpdated: '2026-01-20',
                content: "Maîtrisez l'art de l'investigation d'incidents avec notre méthodologie complète (5 Pourquoi, Ishikawa)..."
            },
            {
                id: 'corrective-actions',
                title: 'Gestion des actions correctives',
                description: 'Suivre et mettre en œuvre les actions correctives',
                category: 'Gestion des incidents',
                type: 'guide',
                duration: '10 min',
                difficulty: 'intermediate',
                tags: ['actions', 'suivi', 'mise en œuvre'],
                lastUpdated: '2026-01-19',
                content: "Gestion efficace des actions correctives, de l'identification jusqu'à la clôture..."
            }
        ]
    },
    {
        id: 'risk-management',
        name: 'Gestion des risques',
        icon: IconShield,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
        description: 'Évaluation des risques, gestion des produits chimiques et mesures de maîtrise',
        items: [
            {
                id: 'risk-assessment-basics',
                title: "Fondamentaux de l'évaluation des risques",
                description: "Comprendre la méthodologie d'évaluation des risques",
                category: 'Gestion des risques',
                type: 'video',
                duration: '18 min',
                difficulty: 'intermediate',
                tags: ['risque', 'évaluation', 'méthodologie'],
                videoUrl: 'https://example.com/risk-assessment',
                lastUpdated: '2026-01-21',
                content: "Aperçu complet des principes et pratiques d'évaluation des risques selon ISO 31000..."
            },
            {
                id: 'chemical-risk-forms',
                title: "Fiches d'évaluation des risques chimiques",
                description: "Utiliser les outils d'évaluation des risques chimiques (REACH/CLP)",
                category: 'Gestion des risques',
                type: 'guide',
                duration: '20 min',
                difficulty: 'advanced',
                tags: ['chimique', 'fiches', 'évaluation'],
                lastUpdated: '2026-01-23',
                content: "Guide détaillé pour compléter les fiches d'identification et d'évaluation des risques chimiques..."
            },
            {
                id: 'control-measures',
                title: 'Mise en œuvre des mesures de maîtrise',
                description: "Hiérarchie des contrôles et stratégies de mise en œuvre",
                category: 'Gestion des risques',
                type: 'guide',
                duration: '12 min',
                difficulty: 'intermediate',
                tags: ['contrôles', 'hiérarchie', 'mise en œuvre'],
                lastUpdated: '2026-01-17',
                content: 'Apprenez à mettre en œuvre et surveiller efficacement les mesures de maîtrise (STOP)...'
            }
        ]
    },
    {
        id: 'ppe-management',
        name: 'Gestion des EPI',
        icon: IconHelmet,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        description: "Demandes d'équipements de protection individuelle, suivi et conformité",
        items: [
            {
                id: 'ppe-request-process',
                title: "Processus de demande d'EPI",
                description: 'Comment demander des équipements de protection individuelle',
                category: 'Gestion des EPI',
                type: 'video',
                duration: '6 min',
                difficulty: 'beginner',
                tags: ['epi', 'demande', 'équipement'],
                videoUrl: 'https://example.com/ppe-request',
                lastUpdated: '2026-01-19',
                content: 'Guide étape par étape pour demander des EPI via le système...'
            },
            {
                id: 'ppe-monitoring',
                title: 'Suivi et conformité des EPI',
                description: "Suivre l'utilisation des EPI et la conformité",
                category: 'Gestion des EPI',
                type: 'guide',
                duration: '8 min',
                difficulty: 'intermediate',
                tags: ['suivi', 'conformité', 'traçabilité'],
                lastUpdated: '2026-01-16',
                content: "Stratégies efficaces pour surveiller l'utilisation des EPI et garantir la conformité..."
            }
        ]
    },
    {
        id: 'audits-compliance',
        name: 'Audits & Conformité',
        icon: IconClipboardCheck,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200',
        description: "Planification, exécution des audits et gestion de la conformité réglementaire",
        items: [
            {
                id: 'audit-planning',
                title: "Planification annuelle des audits",
                description: "Créer et gérer le planning d'audits selon ISO 19011",
                category: 'Audits & Conformité',
                type: 'guide',
                duration: '14 min',
                difficulty: 'intermediate',
                tags: ['audit', 'planification', 'calendrier'],
                lastUpdated: '2026-01-18',
                content: "Guide complet pour la planification et la programmation des audits annuels..."
            },
            {
                id: 'conducting-audits',
                title: "Mener des audits efficaces",
                description: "Bonnes pratiques pour l'exécution des audits",
                category: 'Audits & Conformité',
                type: 'video',
                duration: '22 min',
                difficulty: 'advanced',
                tags: ['audit', 'exécution', 'bonnes-pratiques'],
                videoUrl: 'https://example.com/conducting-audits',
                lastUpdated: '2026-01-20',
                content: 'Maîtrisez les compétences nécessaires pour mener des audits approfondis et efficaces...'
            }
        ]
    },
    {
        id: 'system-administration',
        name: 'Administration système',
        icon: IconSettings,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200',
        description: 'Gestion des utilisateurs, paramètres et configuration du système',
        items: [
            {
                id: 'user-management',
                title: 'Gestion des utilisateurs',
                description: 'Gérer les utilisateurs, rôles et permissions',
                category: 'Administration système',
                type: 'guide',
                duration: '16 min',
                difficulty: 'advanced',
                tags: ['utilisateurs', 'rôles', 'permissions'],
                lastUpdated: '2026-01-21',
                content: "Guide complet pour la gestion des utilisateurs et de leurs droits d'accès..."
            },
            {
                id: 'module-configuration',
                title: 'Configuration des modules',
                description: 'Activer et configurer les modules du système',
                category: 'Administration système',
                type: 'guide',
                duration: '10 min',
                difficulty: 'intermediate',
                tags: ['modules', 'configuration', 'paramètres'],
                lastUpdated: '2026-01-17',
                content: 'Apprenez à configurer et personnaliser les modules du système...'
            }
        ]
    }
];

const difficultyLabels: Record<string, string> = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
};

const HelpCenter = () => {
    const [activeTab, setActiveTab] = useState<'how-to' | 'features-overview' | 'technical-docs'>('how-to');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['getting-started']));
    const [currentView, setCurrentView] = useState<'main' | 'technical-docs'>('main');

    if (currentView === 'technical-docs') {
        return <TechnicalDocumentation />;
    }

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const filteredContent = helpContent.filter(category => {
        if (selectedCategory !== 'all' && category.id !== selectedCategory) return false;

        if (searchTerm) {
            return category.items.some(item =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        return true;
    });

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <IconVideo className="w-4 h-4" />;
            case 'guide': return <IconBook className="w-4 h-4" />;
            case 'documentation': return <IconFileText className="w-4 h-4" />;
            default: return <IconFileText className="w-4 h-4" />;
        }
    };

    const renderHowToGuides = () => (
        <div className="space-y-6">
            {/* Recherche et filtres */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
                        <IconSearch className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher dans les guides, vidéos et documentation…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    >
                        <option value="all">Toutes les catégories</option>
                        {helpContent.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Catégories de contenu */}
            <div className="space-y-4">
                {filteredContent.map(category => {
                    const isExpanded = expandedCategories.has(category.id);
                    const filteredItems = category.items.filter(item => {
                        if (!searchTerm) return true;
                        return item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
                    });

                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={category.id} className={`rounded-xl shadow-sm border-2 ${category.bgColor} overflow-hidden`}>
                            <div
                                className="p-6 cursor-pointer hover:bg-opacity-80 transition-colors"
                                onClick={() => toggleCategory(category.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`p-3 rounded-lg ${category.bgColor} mr-4`}>
                                            <category.icon className={`w-6 h-6 ${category.color}`} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg text-gray-900">{category.name}</h2>
                                            <p className="text-gray-600 mt-1 text-sm">{category.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                                            {filteredItems.length} {filteredItems.length > 1 ? 'éléments' : 'élément'}
                                        </span>
                                        {isExpanded ? (
                                            <IconChevronDown className="w-5 h-5 text-gray-600" />
                                        ) : (
                                            <IconChevronRight className="w-5 h-5 text-gray-600" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="bg-white bg-opacity-60 divide-y divide-gray-100">
                                    {filteredItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="p-6 hover:bg-white hover:bg-opacity-80 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <div className={`p-2 rounded-lg ${category.bgColor} mr-3`}>
                                                            {getTypeIcon(item.type)}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg text-gray-900">{item.title}</h3>
                                                            <p className="text-gray-600 text-sm">{item.description}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-4 mt-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(item.difficulty)}`}>
                                                            {difficultyLabels[item.difficulty] || item.difficulty}
                                                        </span>
                                                        {item.duration && (
                                                            <span className="flex items-center text-xs text-gray-500">
                                                                <IconClock className="w-4 h-4 mr-1" />
                                                                {item.duration}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-500">
                                                            Mis à jour le {item.lastUpdated}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {item.tags.map(tag => (
                                                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderFeaturesOverview = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-8 text-white">
                <h2 className="text-2xl mb-3">Aperçu des fonctionnalités</h2>
                <p className="text-cyan-50 text-sm">
                    Découvrez les fonctionnalités puissantes de notre système de management Santé & Sécurité via des démonstrations interactives et des explications détaillées.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {helpContent.map(category => (
                    <div key={category.id} className={`bg-white rounded-xl shadow-sm border-2 ${category.bgColor} p-6 hover:shadow-lg transition-shadow`}>
                        <div className="flex items-center mb-4">
                            <div className={`p-3 rounded-lg ${category.bgColor}`}>
                                <category.icon className={`w-8 h-8 ${category.color}`} />
                            </div>
                            <h3 className="text-lg text-gray-900 ml-4">{category.name}</h3>
                        </div>

                        <p className="text-gray-600 mb-4 text-sm">{category.description}</p>

                        <div className="space-y-3">
                            {category.items.filter(item => item.type === 'video').slice(0, 2).map(item => (
                                <div key={item.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                    <IconPlayerPlay className="w-5 h-5 text-cyan-600 mr-3" />
                                    <div className="flex-1">
                                        <div className="text-gray-900 text-sm">{item.title}</div>
                                        <div className="text-xs text-gray-500">{item.duration}</div>
                                    </div>
                                    <IconExternalLink className="w-4 h-4 text-gray-400" />
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm">
                            Voir toutes les fonctionnalités
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderTechnicalDocs = () => (
        <div className="space-y-6">
            {/* Architecture système */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconDeviceDesktop className="w-8 h-8 text-cyan-600 mr-4" />
                    <div>
                        <h2 className="text-lg text-gray-900">Architecture système</h2>
                        <p className="text-gray-600 text-sm">Plateforme de management Santé & Sécurité basée sur microservices</p>
                    </div>
                </div>

                {/* Schéma d'architecture */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-8 mb-8">
                    <h3 className="text-lg text-gray-900 mb-6 text-center">Vue d'ensemble de l'architecture microservices</h3>

                    {/* Couche Frontend */}
                    <div className="mb-8">
                        <h4 className="text-sm text-cyan-700 mb-4 uppercase tracking-wider">Couche Frontend</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-cyan-200 shadow-sm">
                                <div className="text-cyan-800">React SPA</div>
                                <div className="text-xs text-gray-600">TypeScript + Tailwind CSS</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-cyan-200 shadow-sm">
                                <div className="text-cyan-800">Application mobile</div>
                                <div className="text-xs text-gray-600">React Native</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-cyan-200 shadow-sm">
                                <div className="text-cyan-800">PWA</div>
                                <div className="text-xs text-gray-600">Progressive Web App</div>
                            </div>
                        </div>
                    </div>

                    {/* API Gateway */}
                    <div className="mb-8">
                        <h4 className="text-sm text-purple-700 mb-4 uppercase tracking-wider">API Gateway et équilibrage de charge</h4>
                        <div className="bg-white p-6 rounded-lg border-2 border-purple-200 shadow-sm text-center">
                            <div className="text-purple-800 mb-2">Spring Cloud Gateway</div>
                            <div className="text-xs text-gray-600">Authentification • Limitation de débit • Équilibrage de charge • Terminaison SSL</div>
                        </div>
                    </div>

                    {/* Microservices */}
                    <div className="mb-8">
                        <h4 className="text-sm text-green-700 mb-4 uppercase tracking-wider">Couche microservices</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="text-green-800 text-sm">Gestion utilisateurs</div>
                                <div className="text-xs text-gray-600">Authentification, autorisation, RBAC</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="text-green-800 text-sm">Service Incidents</div>
                                <div className="text-xs text-gray-600">Déclaration, investigations</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="text-green-800 text-sm">Service Risques</div>
                                <div className="text-xs text-gray-600">Évaluation, registre chimique</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="text-green-800 text-sm">Service Actions</div>
                                <div className="text-xs text-gray-600">Plans d'action, suivi</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="text-green-800 text-sm">Service Audits</div>
                                <div className="text-xs text-gray-600">Planification, exécution</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="text-green-800 text-sm">Service EPI</div>
                                <div className="text-xs text-gray-600">Demandes, suivi</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="text-green-800 text-sm">Service Documents</div>
                                <div className="text-xs text-gray-600">Gestion documentaire, validation</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="text-green-800 text-sm">Service Notifications</div>
                                <div className="text-xs text-gray-600">Email, SMS, notifications push</div>
                            </div>
                        </div>
                    </div>

                    {/* Couche données */}
                    <div className="mb-8">
                        <h4 className="text-sm text-orange-700 mb-4 uppercase tracking-wider">Couche données</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                                <div className="text-orange-800">MySQL 8</div>
                                <div className="text-xs text-gray-600">Base principale pour les données transactionnelles</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                                <div className="text-orange-800">Redis</div>
                                <div className="text-xs text-gray-600">Cache et stockage de session</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                                <div className="text-orange-800">Elasticsearch</div>
                                <div className="text-xs text-gray-600">Recherche et analytique</div>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure */}
                    <div>
                        <h4 className="text-sm text-gray-700 mb-4 uppercase tracking-wider">Infrastructure et DevOps</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                <div className="text-gray-800 text-sm">Docker</div>
                                <div className="text-xs text-gray-600">Conteneurisation</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                <div className="text-gray-800 text-sm">Kubernetes</div>
                                <div className="text-xs text-gray-600">Orchestration</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                <div className="text-gray-800 text-sm">Jenkins</div>
                                <div className="text-xs text-gray-600">Pipeline CI/CD</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                <div className="text-gray-800 text-sm">Prometheus</div>
                                <div className="text-xs text-gray-600">Supervision</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bénéfices de l'architecture */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-cyan-50 p-6 rounded-lg">
                        <h4 className="text-cyan-900 mb-3 text-sm uppercase tracking-wider">Avantages des microservices</h4>
                        <ul className="text-sm text-cyan-800 space-y-2">
                            <li>• Déploiement et mise à l'échelle indépendants</li>
                            <li>• Diversité technologique par service</li>
                            <li>• Isolation des pannes et résilience</li>
                            <li>• Autonomie des équipes et développement accéléré</li>
                            <li>• Meilleure utilisation des ressources</li>
                        </ul>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                        <h4 className="text-green-900 mb-3 text-sm uppercase tracking-wider">Capacités de mise à l'échelle</h4>
                        <ul className="text-sm text-green-800 space-y-2">
                            <li>• Mise à l'échelle horizontale par service</li>
                            <li>• Équilibrage de charge et auto-scaling</li>
                            <li>• Sharding de base de données</li>
                            <li>• CDN pour les contenus statiques</li>
                            <li>• Mise en cache multi-couches</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Documentation base de données */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconFileText className="w-8 h-8 text-green-600 mr-4" />
                    <div>
                        <h2 className="text-lg text-gray-900">Documentation base de données</h2>
                        <p className="text-gray-600 text-sm">Schéma entité-relation et dictionnaire de données</p>
                    </div>
                </div>

                {/* Schéma BDD */}
                <div className="bg-gradient-to-br from-green-50 to-cyan-50 rounded-xl p-8 mb-8">
                    <h3 className="text-lg text-gray-900 mb-6 text-center">Schéma de base de données — Diagramme entité-relation</h3>

                    {/* Entités principales */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Utilisateurs */}
                        <div className="bg-white p-6 rounded-lg border-2 border-cyan-300 shadow-lg">
                            <h4 className="text-cyan-800 mb-4 text-center">Gestion des utilisateurs</h4>
                            <div className="space-y-3">
                                <div className="bg-cyan-50 p-3 rounded border">
                                    <div className="text-cyan-900">users</div>
                                    <div className="text-xs text-cyan-700">id, email, first_name, last_name, role_id, is_active, created_at</div>
                                </div>
                                <div className="bg-cyan-50 p-3 rounded border">
                                    <div className="text-cyan-900">roles</div>
                                    <div className="text-xs text-cyan-700">id, name, description, permissions</div>
                                </div>
                                <div className="bg-cyan-50 p-3 rounded border">
                                    <div className="text-cyan-900">user_sessions</div>
                                    <div className="text-xs text-cyan-700">id, user_id, login_time, ip_address</div>
                                </div>
                            </div>
                        </div>

                        {/* Incidents & Risques */}
                        <div className="bg-white p-6 rounded-lg border-2 border-red-300 shadow-lg">
                            <h4 className="text-red-800 mb-4 text-center">Incidents et risques</h4>
                            <div className="space-y-3">
                                <div className="bg-red-50 p-3 rounded border">
                                    <div className="text-red-900">incidents</div>
                                    <div className="text-xs text-red-700">id, title, description, severity, status, reported_by, date_occurred</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded border">
                                    <div className="text-red-900">risk_assessments</div>
                                    <div className="text-xs text-red-700">id, title, likelihood, severity, risk_rating, status</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded border">
                                    <div className="text-red-900">chemical_risks</div>
                                    <div className="text-xs text-red-700">id, chemical_name, cas_number, classification, hazard_source</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions & Audits */}
                        <div className="bg-white p-6 rounded-lg border-2 border-green-300 shadow-lg">
                            <h4 className="text-green-800 mb-4 text-center">Actions et audits</h4>
                            <div className="space-y-3">
                                <div className="bg-green-50 p-3 rounded border">
                                    <div className="text-green-900">action_plans</div>
                                    <div className="text-xs text-green-700">id, title, description, assigned_to, due_date, status, progress</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded border">
                                    <div className="text-green-900">audits</div>
                                    <div className="text-xs text-green-700">id, title, audit_date, auditor, department, findings</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded border">
                                    <div className="text-green-900">ppe_requests</div>
                                    <div className="text-xs text-green-700">id, item_name, quantity, requestor, status, approval_date</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Relations */}
                    <div className="bg-white p-6 rounded-lg border border-gray-300">
                        <h4 className="text-gray-800 mb-4 text-center">Relations principales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-gray-700 mb-2">Un-à-plusieurs :</div>
                                <ul className="text-gray-600 space-y-1 text-xs">
                                    <li>• users → incidents (reported_by)</li>
                                    <li>• users → action_plans (assigned_to)</li>
                                    <li>• roles → users (role_id)</li>
                                    <li>• incidents → action_plans (incident_id)</li>
                                </ul>
                            </div>
                            <div>
                                <div className="text-gray-700 mb-2">Plusieurs-à-plusieurs :</div>
                                <ul className="text-gray-600 space-y-1 text-xs">
                                    <li>• users ↔ audits (audit_participants)</li>
                                    <li>• action_plans ↔ documents (action_documents)</li>
                                    <li>• risk_assessments ↔ controls (risk_controls)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dictionnaire de données */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconBook className="w-8 h-8 text-purple-600 mr-4" />
                    <div>
                        <h2 className="text-lg text-gray-900">Dictionnaire de données</h2>
                        <p className="text-gray-600 text-sm">Documentation détaillée des champs pour toutes les tables</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Table users */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-cyan-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-base text-cyan-900">users</h3>
                            <p className="text-xs text-cyan-700">Utilisateurs du système et informations d'authentification</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Champ</th>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Contraintes</th>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">id</td>
                                        <td className="px-4 py-3 text-sm">BIGINT</td>
                                        <td className="px-4 py-3 text-sm">PRIMARY KEY</td>
                                        <td className="px-4 py-3 text-sm">Identifiant unique de l'utilisateur</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">email</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(255)</td>
                                        <td className="px-4 py-3 text-sm">UNIQUE, NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Adresse email pour authentification</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">first_name</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(100)</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Prénom de l'utilisateur</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">last_name</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(100)</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Nom de famille de l'utilisateur</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">role_id</td>
                                        <td className="px-4 py-3 text-sm">BIGINT</td>
                                        <td className="px-4 py-3 text-sm">FOREIGN KEY</td>
                                        <td className="px-4 py-3 text-sm">Référence à la table roles</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">is_active</td>
                                        <td className="px-4 py-3 text-sm">BOOLEAN</td>
                                        <td className="px-4 py-3 text-sm">DEFAULT TRUE</td>
                                        <td className="px-4 py-3 text-sm">Statut du compte utilisateur</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">created_at</td>
                                        <td className="px-4 py-3 text-sm">TIMESTAMP</td>
                                        <td className="px-4 py-3 text-sm">DEFAULT NOW()</td>
                                        <td className="px-4 py-3 text-sm">Date de création du compte</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table incidents */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-red-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-base text-red-900">incidents</h3>
                            <p className="text-xs text-red-700">Incidents de sécurité et rapports de quasi-accident</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Champ</th>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Contraintes</th>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">id</td>
                                        <td className="px-4 py-3 text-sm">BIGINT</td>
                                        <td className="px-4 py-3 text-sm">PRIMARY KEY</td>
                                        <td className="px-4 py-3 text-sm">Identifiant unique de l'incident</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">incident_number</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(50)</td>
                                        <td className="px-4 py-3 text-sm">UNIQUE, NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Numéro lisible (INC-2026-001)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">title</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(255)</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Titre court de l'incident</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">description</td>
                                        <td className="px-4 py-3 text-sm">TEXT</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Description détaillée de l'incident</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">severity</td>
                                        <td className="px-4 py-3 text-sm">ENUM</td>
                                        <td className="px-4 py-3 text-sm">('mineur', 'modéré', 'majeur', 'critique')</td>
                                        <td className="px-4 py-3 text-sm">Niveau de gravité</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">status</td>
                                        <td className="px-4 py-3 text-sm">ENUM</td>
                                        <td className="px-4 py-3 text-sm">('ouvert', 'enquête', 'clos')</td>
                                        <td className="px-4 py-3 text-sm">Statut actuel</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">reported_by</td>
                                        <td className="px-4 py-3 text-sm">BIGINT</td>
                                        <td className="px-4 py-3 text-sm">FOREIGN KEY</td>
                                        <td className="px-4 py-3 text-sm">Référence à la table users</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">date_occurred</td>
                                        <td className="px-4 py-3 text-sm">TIMESTAMP</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Date et heure de survenue</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table chemical_risks */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-orange-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-base text-orange-900">chemical_risks</h3>
                            <p className="text-xs text-orange-700">Identification et évaluation des risques chimiques (REACH/CLP)</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Champ</th>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Contraintes</th>
                                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">id</td>
                                        <td className="px-4 py-3 text-sm">BIGINT</td>
                                        <td className="px-4 py-3 text-sm">PRIMARY KEY</td>
                                        <td className="px-4 py-3 text-sm">Identifiant unique du risque chimique</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">risk_id</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(50)</td>
                                        <td className="px-4 py-3 text-sm">UNIQUE, NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Identifiant lisible (CHR-2026-001)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">chemical_name</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(255)</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Nom officiel du produit chimique</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">cas_number</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(20)</td>
                                        <td className="px-4 py-3 text-sm">NULL</td>
                                        <td className="px-4 py-3 text-sm">Numéro CAS (Chemical Abstracts Service)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">classification</td>
                                        <td className="px-4 py-3 text-sm">ENUM</td>
                                        <td className="px-4 py-3 text-sm">Classifications SGH</td>
                                        <td className="px-4 py-3 text-sm">Classification du danger chimique</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">likelihood</td>
                                        <td className="px-4 py-3 text-sm">INTEGER</td>
                                        <td className="px-4 py-3 text-sm">CHECK (1-5)</td>
                                        <td className="px-4 py-3 text-sm">Probabilité d'occurrence (échelle 1-5)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">severity</td>
                                        <td className="px-4 py-3 text-sm">INTEGER</td>
                                        <td className="px-4 py-3 text-sm">CHECK (1-5)</td>
                                        <td className="px-4 py-3 text-sm">Gravité de l'impact (échelle 1-5)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">risk_rating</td>
                                        <td className="px-4 py-3 text-sm">INTEGER</td>
                                        <td className="px-4 py-3 text-sm">GENERATED (likelihood * severity)</td>
                                        <td className="px-4 py-3 text-sm">Score de risque calculé</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Documentation API */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconFileText className="w-8 h-8 text-gray-600 mr-4" />
                    <div>
                        <h2 className="text-lg text-gray-900">Documentation API</h2>
                        <p className="text-gray-600 text-sm">Points d'accès REST et guides d'intégration</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-sm text-gray-900 uppercase tracking-wider">API principales</h3>
                        <div className="space-y-3">
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-cyan-600 mr-3" />
                                <div className="flex-1">
                                    <div className="text-sm">API Gestion utilisateurs</div>
                                    <div className="text-xs text-gray-500">Authentification, autorisation, CRUD utilisateurs</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-red-600 mr-3" />
                                <div className="flex-1">
                                    <div className="text-sm">API Gestion des incidents</div>
                                    <div className="text-xs text-gray-500">Déclaration, investigation, suivi</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-orange-600 mr-3" />
                                <div className="flex-1">
                                    <div className="text-sm">API Évaluation des risques</div>
                                    <div className="text-xs text-gray-500">Identification, évaluation, maîtrise</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm text-gray-900 uppercase tracking-wider">Guides d'intégration</h3>
                        <div className="space-y-3">
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-purple-600 mr-3" />
                                <div className="flex-1">
                                    <div className="text-sm">Intégration SIRH</div>
                                    <div className="text-xs text-gray-500">Synchronisation des données employés</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-green-600 mr-3" />
                                <div className="flex-1">
                                    <div className="text-sm">Intégration ERP</div>
                                    <div className="text-xs text-gray-500">Données financières et achats</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-indigo-600 mr-3" />
                                <div className="flex-1">
                                    <div className="text-sm">Configuration webhooks</div>
                                    <div className="text-xs text-gray-500">Notifications d'événements en temps réel</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exigences système */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base text-gray-900 mb-4">Exigences système et spécifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <h4 className="text-gray-900 mb-2 text-sm">Navigateurs pris en charge</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>• Chrome 90+</li>
                            <li>• Firefox 88+</li>
                            <li>• Safari 14+</li>
                            <li>• Edge 90+</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-gray-900 mb-2 text-sm">Support mobile</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>• iOS 14+</li>
                            <li>• Android 10+</li>
                            <li>• Design responsive</li>
                            <li>• Optimisé tactile</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-gray-900 mb-2 text-sm">Sécurité</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>• Chiffrement SSL/TLS</li>
                            <li>• OAuth 2.0</li>
                            <li>• Accès basé sur les rôles</li>
                            <li>• Journalisation des audits</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-gray-900 mb-2 text-sm">Performance</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>• Chargement &lt; 2 s</li>
                            <li>• SLA 99,9% de disponibilité</li>
                            <li>• Auto-scaling</li>
                            <li>• Livraison via CDN</li>
                        </ul>
                    </div>
                </div>

                {/* Carte vers documentation technique détaillée */}
                <div
                    className="mt-6 rounded-xl shadow-sm border-2 bg-purple-50 border-purple-200 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                    onClick={() => setCurrentView('technical-docs')}
                >
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <IconFileText className="w-8 h-8 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg text-gray-900">Documentation technique complète</h3>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-4 text-sm">
                            Architecture système et spécifications techniques détaillées
                        </p>

                        <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer p-1 rounded hover:bg-gray-50">
                                <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                                Architecture système
                            </div>
                            <div className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer p-1 rounded hover:bg-gray-50">
                                <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                                Documentation base de données
                            </div>
                            <div className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer p-1 rounded hover:bg-gray-50">
                                <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                                Dictionnaire de données
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <span className="text-sm text-purple-600">
                                Consulter la documentation →
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: "Centre d'aide" },
                ]}
                icon={<IconHelpCircle size={22} stroke={2} />}
                iconColor="cyan"
                title="Centre d'aide"
                subtitle="Guides, tutoriels et documentation de la plateforme SafeX360"
            />

            {/* Navigation par onglets */}
            <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('how-to')}
                    className={`px-5 py-2.5 rounded-md text-sm transition-colors flex items-center ${activeTab === 'how-to'
                        ? 'bg-white text-cyan-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <IconBook className="w-4 h-4 mr-2" />
                    Guides pratiques
                </button>
                <button
                    onClick={() => setActiveTab('features-overview')}
                    className={`px-5 py-2.5 rounded-md text-sm transition-colors flex items-center ${activeTab === 'features-overview'
                        ? 'bg-white text-cyan-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <IconEye className="w-4 h-4 mr-2" />
                    Aperçu des fonctionnalités
                </button>
                <button
                    onClick={() => setActiveTab('technical-docs')}
                    className={`px-5 py-2.5 rounded-md text-sm transition-colors flex items-center ${activeTab === 'technical-docs'
                        ? 'bg-white text-cyan-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <IconFileText className="w-4 h-4 mr-2" />
                    Documentation technique
                </button>
            </div>

            {/* Contenu */}
            <div className="max-w-none">
                {activeTab === 'how-to' && renderHowToGuides()}
                {activeTab === 'features-overview' && renderFeaturesOverview()}
                {activeTab === 'technical-docs' && renderTechnicalDocs()}
            </div>
        </div>
    );
};

export default HelpCenter;
