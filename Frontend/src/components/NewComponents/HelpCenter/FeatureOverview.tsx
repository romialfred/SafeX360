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
        name: 'Getting Started',
        icon: IconPlayerPlay,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        description: 'Essential guides to get you started with the platform',
        items: [
            {
                id: 'platform-overview',
                title: 'Platform Overview',
                description: 'Complete introduction to the Health & Safety Management System',
                category: 'Getting Started',
                type: 'video',
                duration: '8 min',
                difficulty: 'beginner',
                tags: ['overview', 'introduction', 'basics'],
                videoUrl: 'https://example.com/platform-overview',
                lastUpdated: '2024-01-20',
                content: 'Learn the fundamentals of our comprehensive health and safety management platform...'
            },
            {
                id: 'first-login',
                title: 'Your First Login',
                description: 'Step-by-step guide for new users',
                category: 'Getting Started',
                type: 'guide',
                duration: '5 min',
                difficulty: 'beginner',
                tags: ['login', 'setup', 'account'],
                lastUpdated: '2024-01-18',
                content: 'Welcome to the platform! This guide will walk you through your first login and initial setup...'
            },
            {
                id: 'navigation-basics',
                title: 'Navigation Basics',
                description: 'Understanding the menu structure and navigation',
                category: 'Getting Started',
                type: 'guide',
                duration: '3 min',
                difficulty: 'beginner',
                tags: ['navigation', 'menu', 'interface'],
                lastUpdated: '2024-01-15',
                content: 'Learn how to navigate efficiently through the application using the sidebar menu...'
            }
        ]
    },
    {
        id: 'incident-management',
        name: 'Incident Management',
        icon: IconAlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        description: 'Managing incidents, investigations, and corrective actions',
        items: [
            {
                id: 'report-incident',
                title: 'How to Report an Incident',
                description: 'Complete guide to incident reporting process',
                category: 'Incident Management',
                type: 'video',
                duration: '12 min',
                difficulty: 'beginner',
                tags: ['incident', 'reporting', 'safety'],
                videoUrl: 'https://example.com/report-incident',
                lastUpdated: '2024-01-22',
                content: 'Learn the step-by-step process for reporting workplace incidents...'
            },
            {
                id: 'investigation-process',
                title: 'Incident Investigation Process',
                description: 'Conducting thorough incident investigations',
                category: 'Incident Management',
                type: 'guide',
                duration: '15 min',
                difficulty: 'intermediate',
                tags: ['investigation', 'analysis', 'root-cause'],
                lastUpdated: '2024-01-20',
                content: 'Master the art of incident investigation with our comprehensive methodology...'
            },
            {
                id: 'corrective-actions',
                title: 'Managing Corrective Actions',
                description: 'Tracking and implementing corrective measures',
                category: 'Incident Management',
                type: 'guide',
                duration: '10 min',
                difficulty: 'intermediate',
                tags: ['actions', 'tracking', 'implementation'],
                lastUpdated: '2024-01-19',
                content: 'Effective management of corrective actions from identification to closure...'
            }
        ]
    },
    {
        id: 'risk-management',
        name: 'Risk Management',
        icon: IconShield,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
        description: 'Risk assessment, chemical management, and control measures',
        items: [
            {
                id: 'risk-assessment-basics',
                title: 'Risk Assessment Fundamentals',
                description: 'Understanding risk assessment methodology',
                category: 'Risk Management',
                type: 'video',
                duration: '18 min',
                difficulty: 'intermediate',
                tags: ['risk', 'assessment', 'methodology'],
                videoUrl: 'https://example.com/risk-assessment',
                lastUpdated: '2024-01-21',
                content: 'Comprehensive overview of risk assessment principles and practices...'
            },
            {
                id: 'chemical-risk-forms',
                title: 'Chemical Risk Assessment Forms',
                description: 'Using the chemical risk assessment tools',
                category: 'Risk Management',
                type: 'guide',
                duration: '20 min',
                difficulty: 'advanced',
                tags: ['chemical', 'forms', 'assessment'],
                lastUpdated: '2024-01-23',
                content: 'Detailed guide on completing chemical risk identification and assessment forms...'
            },
            {
                id: 'control-measures',
                title: 'Implementing Control Measures',
                description: 'Hierarchy of controls and implementation strategies',
                category: 'Risk Management',
                type: 'guide',
                duration: '12 min',
                difficulty: 'intermediate',
                tags: ['controls', 'hierarchy', 'implementation'],
                lastUpdated: '2024-01-17',
                content: 'Learn how to effectively implement and monitor control measures...'
            }
        ]
    },
    {
        id: 'ppe-management',
        name: 'PPE Management',
        icon: IconHelmet,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        description: 'Personal protective equipment requests, monitoring, and compliance',
        items: [
            {
                id: 'ppe-request-process',
                title: 'PPE Request Process',
                description: 'How to request personal protective equipment',
                category: 'PPE Management',
                type: 'video',
                duration: '6 min',
                difficulty: 'beginner',
                tags: ['ppe', 'request', 'equipment'],
                videoUrl: 'https://example.com/ppe-request',
                lastUpdated: '2024-01-19',
                content: 'Step-by-step guide to requesting PPE through the system...'
            },
            {
                id: 'ppe-monitoring',
                title: 'PPE Monitoring and Compliance',
                description: 'Tracking PPE usage and compliance',
                category: 'PPE Management',
                type: 'guide',
                duration: '8 min',
                difficulty: 'intermediate',
                tags: ['monitoring', 'compliance', 'tracking'],
                lastUpdated: '2024-01-16',
                content: 'Effective strategies for monitoring PPE usage and ensuring compliance...'
            }
        ]
    },
    {
        id: 'audits-compliance',
        name: 'Audits & Compliance',
        icon: IconClipboardCheck,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200',
        description: 'Audit planning, execution, and compliance management',
        items: [
            {
                id: 'audit-planning',
                title: 'Annual Audit Planning',
                description: 'Creating and managing audit schedules',
                category: 'Audits & Compliance',
                type: 'guide',
                duration: '14 min',
                difficulty: 'intermediate',
                tags: ['audit', 'planning', 'schedule'],
                lastUpdated: '2024-01-18',
                content: 'Comprehensive guide to planning and scheduling annual audits...'
            },
            {
                id: 'conducting-audits',
                title: 'Conducting Effective Audits',
                description: 'Best practices for audit execution',
                category: 'Audits & Compliance',
                type: 'video',
                duration: '22 min',
                difficulty: 'advanced',
                tags: ['audit', 'execution', 'best-practices'],
                videoUrl: 'https://example.com/conducting-audits',
                lastUpdated: '2024-01-20',
                content: 'Master the skills needed to conduct thorough and effective audits...'
            }
        ]
    },
    {
        id: 'system-administration',
        name: 'System Administration',
        icon: IconSettings,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200',
        description: 'User management, settings, and system configuration',
        items: [
            {
                id: 'user-management',
                title: 'User Management',
                description: 'Managing users, roles, and permissions',
                category: 'System Administration',
                type: 'guide',
                duration: '16 min',
                difficulty: 'advanced',
                tags: ['users', 'roles', 'permissions'],
                lastUpdated: '2024-01-21',
                content: 'Complete guide to managing users and their access permissions...'
            },
            {
                id: 'module-configuration',
                title: 'Module Configuration',
                description: 'Enabling and configuring system modules',
                category: 'System Administration',
                type: 'guide',
                duration: '10 min',
                difficulty: 'intermediate',
                tags: ['modules', 'configuration', 'settings'],
                lastUpdated: '2024-01-17',
                content: 'Learn how to configure and customize system modules...'
            }
        ]
    }
];
const FeatureOverview = () => {
    return (
        <div className="flex flex-col gap-5 p-5">

            <div className="flex items-center gap-4">
                <div className="bg-purple-400 rounded-lg p-2">
                    <IconEye size={40} color="white" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold ">Features Overview</h2>
                    <p className="text-gray-600 italic">
                        Discover the powerful features of our Health & Safety Management System through interactive demos and detailed explanations.
                    </p>
                </div>

            </div>



            <div className="space-y-6">


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {helpContent.map(category => (
                        <div key={category.id} className={`bg-white rounded-xl shadow-sm border-2 ${category.bgColor} p-6 hover:shadow-lg transition-shadow`}>
                            <div className="flex items-center mb-4">
                                <div className={`p-3 rounded-lg ${category.bgColor}`}>
                                    <category.icon className={`w-8 h-8 ${category.color}`} />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 ml-4">{category.name}</h3>
                            </div>

                            <p className="text-gray-600 mb-4">{category.description}</p>

                            <div className="space-y-3">
                                {category.items.filter(item => item.type === 'video').slice(0, 2).map(item => (
                                    <div key={item.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                        <IconPlayerPlay className="w-5 h-5 text-blue-600 mr-3" />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{item.title}</div>
                                            <div className="text-sm text-gray-500">{item.duration}</div>
                                        </div>
                                        <IconExternalLink className="w-4 h-4 text-gray-400" />
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                View All Features
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default FeatureOverview