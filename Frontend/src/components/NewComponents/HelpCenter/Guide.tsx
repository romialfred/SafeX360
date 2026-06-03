import { IconAlertTriangle, IconBook, IconChevronDown, IconChevronRight, IconClipboardCheck, IconClock, IconFileText, IconHelmet, IconPlayerPlay, IconSearch, IconSettings, IconShield, IconVideo } from "@tabler/icons-react";
import { useState } from "react";
import PageHeader from "../../UtilityComp/PageHeader";

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
                content: 'Apprenez les fondamentaux de notre plateforme de management Santé & Sécurité au travail.'
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
                content: 'Bienvenue sur la plateforme. Ce guide vous accompagne lors de votre première connexion.'
            },
            {
                id: 'navigation-basics',
                title: 'Bases de la navigation',
                description: 'Comprendre la structure du menu et la navigation',
                category: 'Démarrage',
                type: 'guide',
                duration: '3 min',
                difficulty: 'beginner',
                tags: ['navigation', 'menu', 'interface'],
                lastUpdated: '2026-01-15',
                content: "Apprenez à naviguer efficacement dans l'application via le menu latéral."
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
                content: "Apprenez la procédure étape par étape pour déclarer les incidents."
            },
            {
                id: 'investigation-process',
                title: "Processus d'investigation",
                description: "Mener des investigations rigoureuses",
                category: 'Gestion des incidents',
                type: 'guide',
                duration: '15 min',
                difficulty: 'intermediate',
                tags: ['investigation', 'analyse', 'cause-racine'],
                lastUpdated: '2026-01-20',
                content: "Maîtrisez l'investigation d'incidents avec notre méthodologie (5 Pourquoi, Ishikawa)."
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
                content: "Gestion efficace des actions correctives, de l'identification à la clôture."
            }
        ]
    },
    {
        id: 'risk-management',
        name: 'Gestion des risques',
        icon: IconShield,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
        description: 'Évaluation des risques, produits chimiques et mesures de maîtrise',
        items: [
            {
                id: 'risk-assessment-basics',
                title: "Fondamentaux de l'évaluation des risques",
                description: "Comprendre la méthodologie selon ISO 31000",
                category: 'Gestion des risques',
                type: 'video',
                duration: '18 min',
                difficulty: 'intermediate',
                tags: ['risque', 'évaluation', 'méthodologie'],
                videoUrl: 'https://example.com/risk-assessment',
                lastUpdated: '2026-01-21',
                content: "Aperçu complet des principes d'évaluation des risques."
            },
            {
                id: 'chemical-risk-forms',
                title: "Fiches d'évaluation des risques chimiques",
                description: "Outils d'évaluation REACH/CLP",
                category: 'Gestion des risques',
                type: 'guide',
                duration: '20 min',
                difficulty: 'advanced',
                tags: ['chimique', 'fiches', 'évaluation'],
                lastUpdated: '2026-01-23',
                content: "Guide détaillé pour compléter les fiches d'identification des risques chimiques."
            },
            {
                id: 'control-measures',
                title: 'Mise en œuvre des mesures de maîtrise',
                description: "Hiérarchie des contrôles (STOP)",
                category: 'Gestion des risques',
                type: 'guide',
                duration: '12 min',
                difficulty: 'intermediate',
                tags: ['contrôles', 'hiérarchie', 'mise en œuvre'],
                lastUpdated: '2026-01-17',
                content: 'Apprenez à mettre en œuvre les mesures de maîtrise.'
            }
        ]
    },
    {
        id: 'ppe-management',
        name: 'Gestion des EPI',
        icon: IconHelmet,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        description: "Demandes d'EPI, suivi et conformité",
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
                content: 'Guide étape par étape pour demander des EPI.'
            },
            {
                id: 'ppe-monitoring',
                title: 'Suivi et conformité des EPI',
                description: "Suivre l'utilisation des EPI",
                category: 'Gestion des EPI',
                type: 'guide',
                duration: '8 min',
                difficulty: 'intermediate',
                tags: ['suivi', 'conformité', 'traçabilité'],
                lastUpdated: '2026-01-16',
                content: "Stratégies efficaces pour surveiller l'utilisation des EPI."
            }
        ]
    },
    {
        id: 'audits-compliance',
        name: 'Audits & Conformité',
        icon: IconClipboardCheck,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200',
        description: "Planification, exécution des audits et conformité",
        items: [
            {
                id: 'audit-planning',
                title: "Planification annuelle des audits",
                description: "Créer le planning d'audits selon ISO 19011",
                category: 'Audits & Conformité',
                type: 'guide',
                duration: '14 min',
                difficulty: 'intermediate',
                tags: ['audit', 'planification', 'calendrier'],
                lastUpdated: '2026-01-18',
                content: "Guide complet pour la planification des audits annuels."
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
                content: "Compétences pour mener des audits approfondis et efficaces."
            }
        ]
    },
    {
        id: 'system-administration',
        name: 'Administration système',
        icon: IconSettings,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200',
        description: 'Gestion des utilisateurs, paramètres et configuration',
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
                content: "Guide complet pour la gestion des utilisateurs et des droits d'accès."
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
                content: 'Apprenez à configurer les modules du système.'
            }
        ]
    }
];

const difficultyLabels: Record<string, string> = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
};

const Guide = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['getting-started']));

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
    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <IconVideo className="w-4 h-4" />;
            case 'guide': return <IconBook className="w-4 h-4" />;
            case 'documentation': return <IconFileText className="w-4 h-4" />;
            default: return <IconFileText className="w-4 h-4" />;
        }
    };
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: "Centre d'aide" },
                    { label: 'Guides pratiques' },
                ]}
                icon={<IconBook size={22} stroke={2} />}
                iconColor="cyan"
                title="Guides pratiques"
                subtitle="Tutoriels, vidéos et documentation pas à pas pour maîtriser la plateforme"
            />

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
                                                                <h3 className="text-base text-gray-900">{item.title}</h3>
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
        </div>
    );
};

export default Guide;
