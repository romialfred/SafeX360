import {
    IconAlertTriangle,
    IconClipboardCheck,
    IconExternalLink,
    IconEye,
    IconHelmet,
    IconPlayerPlay,
    IconSettings,
    IconShield,
} from "@tabler/icons-react";
import PageHeader from '../../UtilityComp/PageHeader';

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
                content: "Bienvenue sur la plateforme ! Ce guide vous accompagne lors de votre première connexion et configuration initiale..."
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
                content: "Maîtrisez l'art de l'investigation d'incidents avec notre méthodologie complète..."
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
                content: "Aperçu complet des principes et pratiques d'évaluation des risques..."
            },
            {
                id: 'chemical-risk-forms',
                title: "Fiches d'évaluation des risques chimiques",
                description: "Utiliser les outils d'évaluation des risques chimiques",
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
                content: 'Apprenez à mettre en œuvre et surveiller efficacement les mesures de maîtrise...'
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
                description: "Créer et gérer le planning d'audits",
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

const FeatureOverview = () => {
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: "Centre d'aide" },
                    { label: 'Aperçu des fonctionnalités' },
                ]}
                icon={<IconEye size={22} stroke={2} />}
                iconColor="cyan"
                title="Aperçu des fonctionnalités"
                subtitle="Découvrez les capacités de la plateforme SafeX360"
            />

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {helpContent.map(category => (
                        <div key={category.id} className={`bg-white rounded-xl shadow-sm border-2 ${category.bgColor} p-6 hover:shadow-lg transition-shadow`}>
                            <div className="flex items-center mb-4">
                                <div className={`p-3 rounded-lg ${category.bgColor}`}>
                                    <category.icon className={`w-8 h-8 ${category.color}`} />
                                </div>
                                <h3 className="text-base text-gray-900 ml-4">{category.name}</h3>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">{category.description}</p>

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
        </div>
    );
};

export default FeatureOverview;
