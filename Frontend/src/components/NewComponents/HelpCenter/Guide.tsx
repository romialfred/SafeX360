import { IconAlertTriangle, IconBook, IconChevronDown, IconChevronRight, IconClipboardCheck, IconClock, IconFileText, IconHelmet, IconInfoSquareRounded, IconPlayerPlay, IconSearch, IconSettings, IconShield, IconVideo } from "@tabler/icons-react";
import { useState } from "react";

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
        <div className="flex flex-col gap-5 p-5">


            <div className="flex items-center gap-4">
                <div className="bg-green-500 rounded-lg p-2">
                    <IconInfoSquareRounded color="white" size={40} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold  ">How To Guide</h2>
                    <p className="text-gray-600 italic ">
                        Guides, tutorials, and documentation
                    </p>
                </div>

            </div>



            <div className="space-y-6">
                <div className="flex flex-col gap-2">

                    {/* Search and Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative md:col-span-2">
                                <IconSearch className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search guides, videos, and documentation..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Categories</option>
                                {helpContent.map(category => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>


                {/* Content Categories */}
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
                                                <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                                                <p className="text-gray-600 mt-1">{category.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                                                {filteredItems.length} items
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
                                                                <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                                                                <p className="text-gray-600 text-sm">{item.description}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-4 mt-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                                                                {item.difficulty}
                                                            </span>
                                                            {item.duration && (
                                                                <span className="flex items-center text-sm text-gray-500">
                                                                    <IconClock className="w-4 h-4 mr-1" />
                                                                    {item.duration}
                                                                </span>
                                                            )}
                                                            <span className="text-sm text-gray-500">
                                                                Updated {item.lastUpdated}
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
    )
}

export default Guide