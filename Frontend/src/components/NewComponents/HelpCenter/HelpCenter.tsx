import React, { useState } from 'react';
import {
    IconArrowLeft, // ArrowLeft
    IconBook, // BookOpen
    IconEye, // Eye
    IconFileText, // FileText
    IconSearch, // Search
    IconPlayerPlay, // Play
    IconChevronRight, // ChevronRight
    IconChevronDown, // ChevronDown
    IconExternalLink, // ExternalLink
    IconDownload, // Download
    IconClock, // Clock
    IconShield, // Shield
    IconAlertTriangle, // AlertTriangle
    IconHelmet, // HardHat
    IconClipboardCheck, // ClipboardCheck
    IconSettings, // Settings
    IconVideo, // Video
    IconDeviceDesktop, // Monitor
} from '@tabler/icons-react';
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
    );

    const renderFeaturesOverview = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
                <h2 className="text-3xl font-bold mb-4">Features Overview</h2>
                <p className="text-blue-100 text-lg">
                    Discover the powerful features of our Health & Safety Management System through interactive demos and detailed explanations.
                </p>
            </div>

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
    );

    const renderTechnicalDocs = () => (
        <div className="space-y-6">
            {/* System Architecture */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconDeviceDesktop className="w-8 h-8 text-blue-600 mr-4" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">System Architecture</h2>
                        <p className="text-gray-600">Microservices-based Health & Safety Management Platform</p>
                    </div>
                </div>

                {/* Architecture Diagram */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Microservices Architecture Overview</h3>

                    {/* Frontend Layer */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-blue-700 mb-4">Frontend Layer</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                                <div className="font-medium text-blue-800">React SPA</div>
                                <div className="text-sm text-gray-600">TypeScript + Tailwind CSS</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                                <div className="font-medium text-blue-800">Mobile App</div>
                                <div className="text-sm text-gray-600">React Native</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                                <div className="font-medium text-blue-800">PWA</div>
                                <div className="text-sm text-gray-600">Progressive Web App</div>
                            </div>
                        </div>
                    </div>

                    {/* API Gateway */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-purple-700 mb-4">API Gateway & Load Balancer</h4>
                        <div className="bg-white p-6 rounded-lg border-2 border-purple-200 shadow-sm text-center">
                            <div className="font-medium text-purple-800 mb-2">Kong API Gateway</div>
                            <div className="text-sm text-gray-600">Authentication • Rate Limiting • Load Balancing • SSL Termination</div>
                        </div>
                    </div>

                    {/* Microservices */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-green-700 mb-4">Microservices Layer</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="font-medium text-green-800 text-sm">User Management</div>
                                <div className="text-xs text-gray-600">Authentication, Authorization, RBAC</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="font-medium text-green-800 text-sm">Incident Service</div>
                                <div className="text-xs text-gray-600">Incident reporting, investigations</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="font-medium text-green-800 text-sm">Risk Service</div>
                                <div className="text-xs text-gray-600">Risk assessment, chemical register</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="font-medium text-green-800 text-sm">Action Service</div>
                                <div className="text-xs text-gray-600">Action plans, tracking</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="font-medium text-green-800 text-sm">Audit Service</div>
                                <div className="text-xs text-gray-600">Audit planning, execution</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="font-medium text-green-800 text-sm">PPE Service</div>
                                <div className="text-xs text-gray-600">PPE requests, monitoring</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="font-medium text-green-800 text-sm">Document Service</div>
                                <div className="text-xs text-gray-600">Document management, validation</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="font-medium text-green-800 text-sm">Notification Service</div>
                                <div className="text-xs text-gray-600">Email, SMS, push notifications</div>
                            </div>
                        </div>
                    </div>

                    {/* Data Layer */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-orange-700 mb-4">Data Layer</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                                <div className="font-medium text-orange-800">PostgreSQL</div>
                                <div className="text-sm text-gray-600">Primary database for transactional data</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                                <div className="font-medium text-orange-800">Redis</div>
                                <div className="text-sm text-gray-600">Caching and session storage</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                                <div className="font-medium text-orange-800">Elasticsearch</div>
                                <div className="text-sm text-gray-600">Search and analytics</div>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-4">Infrastructure & DevOps</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                <div className="font-medium text-gray-800 text-sm">Docker</div>
                                <div className="text-xs text-gray-600">Containerization</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                <div className="font-medium text-gray-800 text-sm">Kubernetes</div>
                                <div className="text-xs text-gray-600">Orchestration</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                <div className="font-medium text-gray-800 text-sm">Jenkins</div>
                                <div className="text-xs text-gray-600">CI/CD Pipeline</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                <div className="font-medium text-gray-800 text-sm">Prometheus</div>
                                <div className="text-xs text-gray-600">Monitoring</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Architecture Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-3">Microservices Benefits</h4>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li>• Independent deployment and scaling</li>
                            <li>• Technology diversity per service</li>
                            <li>• Fault isolation and resilience</li>
                            <li>• Team autonomy and faster development</li>
                            <li>• Better resource utilization</li>
                        </ul>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-3">Scalability Features</h4>
                        <ul className="text-sm text-green-800 space-y-2">
                            <li>• Horizontal scaling per service</li>
                            <li>• Load balancing and auto-scaling</li>
                            <li>• Database sharding capabilities</li>
                            <li>• CDN for static content delivery</li>
                            <li>• Caching at multiple layers</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Database Documentation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconFileText className="w-8 h-8 text-green-600 mr-4" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Database Documentation</h2>
                        <p className="text-gray-600">Entity Relationship Diagrams and Data Dictionary</p>
                    </div>
                </div>

                {/* Database Schema Diagram */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Database Schema - Entity Relationship Diagram</h3>

                    {/* Core Entities */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Users & Authentication */}
                        <div className="bg-white p-6 rounded-lg border-2 border-blue-300 shadow-lg">
                            <h4 className="font-bold text-blue-800 mb-4 text-center">User Management</h4>
                            <div className="space-y-3">
                                <div className="bg-blue-50 p-3 rounded border">
                                    <div className="font-semibold text-blue-900">users</div>
                                    <div className="text-xs text-blue-700">id, email, first_name, last_name, role_id, is_active, created_at</div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded border">
                                    <div className="font-semibold text-blue-900">roles</div>
                                    <div className="text-xs text-blue-700">id, name, description, permissions</div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded border">
                                    <div className="font-semibold text-blue-900">user_sessions</div>
                                    <div className="text-xs text-blue-700">id, user_id, login_time, ip_address</div>
                                </div>
                            </div>
                        </div>

                        {/* Incidents & Risks */}
                        <div className="bg-white p-6 rounded-lg border-2 border-red-300 shadow-lg">
                            <h4 className="font-bold text-red-800 mb-4 text-center">Incidents & Risks</h4>
                            <div className="space-y-3">
                                <div className="bg-red-50 p-3 rounded border">
                                    <div className="font-semibold text-red-900">incidents</div>
                                    <div className="text-xs text-red-700">id, title, description, severity, status, reported_by, date_occurred</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded border">
                                    <div className="font-semibold text-red-900">risk_assessments</div>
                                    <div className="text-xs text-red-700">id, title, likelihood, severity, risk_rating, status</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded border">
                                    <div className="font-semibold text-red-900">chemical_risks</div>
                                    <div className="text-xs text-red-700">id, chemical_name, cas_number, classification, hazard_source</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions & Audits */}
                        <div className="bg-white p-6 rounded-lg border-2 border-green-300 shadow-lg">
                            <h4 className="font-bold text-green-800 mb-4 text-center">Actions & Audits</h4>
                            <div className="space-y-3">
                                <div className="bg-green-50 p-3 rounded border">
                                    <div className="font-semibold text-green-900">action_plans</div>
                                    <div className="text-xs text-green-700">id, title, description, assigned_to, due_date, status, progress</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded border">
                                    <div className="font-semibold text-green-900">audits</div>
                                    <div className="text-xs text-green-700">id, title, audit_date, auditor, department, findings</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded border">
                                    <div className="font-semibold text-green-900">ppe_requests</div>
                                    <div className="text-xs text-green-700">id, item_name, quantity, requestor, status, approval_date</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Relationships */}
                    <div className="bg-white p-6 rounded-lg border border-gray-300">
                        <h4 className="font-bold text-gray-800 mb-4 text-center">Key Relationships</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="font-semibold text-gray-700 mb-2">One-to-Many:</div>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• users → incidents (reported_by)</li>
                                    <li>• users → action_plans (assigned_to)</li>
                                    <li>• roles → users (role_id)</li>
                                    <li>• incidents → action_plans (incident_id)</li>
                                </ul>
                            </div>
                            <div>
                                <div className="font-semibold text-gray-700 mb-2">Many-to-Many:</div>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• users ↔ audits (audit_participants)</li>
                                    <li>• action_plans ↔ documents (action_documents)</li>
                                    <li>• risk_assessments ↔ controls (risk_controls)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Dictionary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconBook className="w-8 h-8 text-purple-600 mr-4" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Data Dictionary</h2>
                        <p className="text-gray-600">Detailed field documentation for all database tables</p>
                    </div>
                </div>

                {/* Core Tables Documentation */}
                <div className="space-y-8">
                    {/* Users Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-blue-900">users</h3>
                            <p className="text-sm text-blue-700">System users and authentication information</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Constraints</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">id</td>
                                        <td className="px-4 py-3 text-sm">UUID</td>
                                        <td className="px-4 py-3 text-sm">PRIMARY KEY</td>
                                        <td className="px-4 py-3 text-sm">Unique identifier for user</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">email</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(255)</td>
                                        <td className="px-4 py-3 text-sm">UNIQUE, NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">User email address for authentication</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">first_name</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(100)</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">User's first name</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">last_name</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(100)</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">User's last name</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">role_id</td>
                                        <td className="px-4 py-3 text-sm">UUID</td>
                                        <td className="px-4 py-3 text-sm">FOREIGN KEY</td>
                                        <td className="px-4 py-3 text-sm">Reference to roles table</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">is_active</td>
                                        <td className="px-4 py-3 text-sm">BOOLEAN</td>
                                        <td className="px-4 py-3 text-sm">DEFAULT TRUE</td>
                                        <td className="px-4 py-3 text-sm">User account status</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">created_at</td>
                                        <td className="px-4 py-3 text-sm">TIMESTAMP</td>
                                        <td className="px-4 py-3 text-sm">DEFAULT NOW()</td>
                                        <td className="px-4 py-3 text-sm">Account creation timestamp</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Incidents Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-red-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-red-900">incidents</h3>
                            <p className="text-sm text-red-700">Safety incidents and near-miss reports</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Constraints</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">id</td>
                                        <td className="px-4 py-3 text-sm">UUID</td>
                                        <td className="px-4 py-3 text-sm">PRIMARY KEY</td>
                                        <td className="px-4 py-3 text-sm">Unique incident identifier</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">incident_number</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(50)</td>
                                        <td className="px-4 py-3 text-sm">UNIQUE, NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Human-readable incident number (INC-2024-001)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">title</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(255)</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Brief incident title</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">description</td>
                                        <td className="px-4 py-3 text-sm">TEXT</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Detailed incident description</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">severity</td>
                                        <td className="px-4 py-3 text-sm">ENUM</td>
                                        <td className="px-4 py-3 text-sm">('minor', 'moderate', 'major', 'critical')</td>
                                        <td className="px-4 py-3 text-sm">Incident severity level</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">status</td>
                                        <td className="px-4 py-3 text-sm">ENUM</td>
                                        <td className="px-4 py-3 text-sm">('open', 'investigating', 'closed')</td>
                                        <td className="px-4 py-3 text-sm">Current incident status</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">reported_by</td>
                                        <td className="px-4 py-3 text-sm">UUID</td>
                                        <td className="px-4 py-3 text-sm">FOREIGN KEY</td>
                                        <td className="px-4 py-3 text-sm">Reference to users table</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">date_occurred</td>
                                        <td className="px-4 py-3 text-sm">TIMESTAMP</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">When the incident occurred</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Chemical Risks Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-orange-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-orange-900">chemical_risks</h3>
                            <p className="text-sm text-orange-700">Chemical hazard identification and risk assessment</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Constraints</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">id</td>
                                        <td className="px-4 py-3 text-sm">UUID</td>
                                        <td className="px-4 py-3 text-sm">PRIMARY KEY</td>
                                        <td className="px-4 py-3 text-sm">Unique chemical risk identifier</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">risk_id</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(50)</td>
                                        <td className="px-4 py-3 text-sm">UNIQUE, NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Human-readable risk ID (CHR-2024-001)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">chemical_name</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(255)</td>
                                        <td className="px-4 py-3 text-sm">NOT NULL</td>
                                        <td className="px-4 py-3 text-sm">Official chemical product name</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">cas_number</td>
                                        <td className="px-4 py-3 text-sm">VARCHAR(20)</td>
                                        <td className="px-4 py-3 text-sm">NULL</td>
                                        <td className="px-4 py-3 text-sm">Chemical Abstracts Service number</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">classification</td>
                                        <td className="px-4 py-3 text-sm">ENUM</td>
                                        <td className="px-4 py-3 text-sm">GHS classifications</td>
                                        <td className="px-4 py-3 text-sm">Chemical hazard classification</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">likelihood</td>
                                        <td className="px-4 py-3 text-sm">INTEGER</td>
                                        <td className="px-4 py-3 text-sm">CHECK (1-5)</td>
                                        <td className="px-4 py-3 text-sm">Probability of occurrence (1-5 scale)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">severity</td>
                                        <td className="px-4 py-3 text-sm">INTEGER</td>
                                        <td className="px-4 py-3 text-sm">CHECK (1-5)</td>
                                        <td className="px-4 py-3 text-sm">Impact severity (1-5 scale)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-sm">risk_rating</td>
                                        <td className="px-4 py-3 text-sm">INTEGER</td>
                                        <td className="px-4 py-3 text-sm">GENERATED (likelihood * severity)</td>
                                        <td className="px-4 py-3 text-sm">Calculated risk score</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* API Documentation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconFileText className="w-8 h-8 text-gray-600 mr-4" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">API Documentation</h2>
                        <p className="text-gray-600">RESTful API endpoints and integration guides</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Core APIs</h3>
                        <div className="space-y-3">
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-blue-600 mr-3" />
                                <div className="flex-1">
                                    <div className="font-medium">User Management API</div>
                                    <div className="text-sm text-gray-500">Authentication, authorization, user CRUD</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-red-600 mr-3" />
                                <div className="flex-1">
                                    <div className="font-medium">Incident Management API</div>
                                    <div className="text-sm text-gray-500">Incident reporting, investigation, tracking</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-orange-600 mr-3" />
                                <div className="flex-1">
                                    <div className="font-medium">Risk Assessment API</div>
                                    <div className="text-sm text-gray-500">Risk identification, assessment, controls</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Integration Guides</h3>
                        <div className="space-y-3">
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-purple-600 mr-3" />
                                <div className="flex-1">
                                    <div className="font-medium">HRMS Integration</div>
                                    <div className="text-sm text-gray-500">Employee data synchronization</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-green-600 mr-3" />
                                <div className="flex-1">
                                    <div className="font-medium">ERP Integration</div>
                                    <div className="text-sm text-gray-500">Financial and procurement data</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <IconFileText className="w-5 h-5 text-indigo-600 mr-3" />
                                <div className="flex-1">
                                    <div className="font-medium">Webhook Configuration</div>
                                    <div className="text-sm text-gray-500">Real-time event notifications</div>
                                </div>
                                <IconDownload className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Requirements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Requirements & Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Browser Support</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Chrome 90+</li>
                            <li>• Firefox 88+</li>
                            <li>• Safari 14+</li>
                            <li>• Edge 90+</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Mobile Support</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• iOS 14+</li>
                            <li>• Android 10+</li>
                            <li>• Responsive design</li>
                            <li>• Touch optimized</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Security</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• SSL/TLS encryption</li>
                            <li>• OAuth 2.0</li>
                            <li>• Role-based access</li>
                            <li>• Audit logging</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• &lt; 2s page load</li>
                            <li>• 99.9% uptime SLA</li>
                            <li>• Auto-scaling</li>
                            <li>• CDN delivery</li>
                        </ul>
                        {/* Technical Documentation */}
                        <div
                            className="rounded-xl shadow-sm border-2 bg-purple-50 border-purple-200 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:scale-105"
                            onClick={() => setCurrentView('technical-docs')}
                        >
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <IconFileText className="w-8 h-8 text-purple-600" />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Technical Documentation</h3>
                                    </div>
                                </div>

                                <p className="text-gray-600 mb-4 text-sm">
                                    System architecture and technical specifications
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer p-1 rounded hover:bg-gray-50">
                                        <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                                        System Architecture
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer p-1 rounded hover:bg-gray-50">
                                        <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                                        Database Documentation
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer p-1 rounded hover:bg-gray-50">
                                        <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                                        Data Dictionary
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <span className="text-sm font-medium text-purple-600">
                                        View documentation →
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Fixed Header */}
            <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <button

                                className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors"
                            >
                                <IconArrowLeft className="w-5 h-5 mr-2" />
                                Back to home
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
                                <p className="text-gray-600">Guides, tutorials, and documentation</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-7xl mx-auto px-8 py-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
                    <button
                        onClick={() => setActiveTab('how-to')}
                        className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center ${activeTab === 'how-to'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <IconBook className="w-4 h-4 mr-2" />
                        How To Guides
                    </button>
                    <button
                        onClick={() => setActiveTab('features-overview')}
                        className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center ${activeTab === 'features-overview'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <IconEye className="w-4 h-4 mr-2" />
                        Features Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('technical-docs')}
                        className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center ${activeTab === 'technical-docs'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <IconFileText className="w-4 h-4 mr-2" />
                        Technical Documentation
                    </button>
                </div>

                {/* Content */}
                <div className="max-w-none">
                    {activeTab === 'how-to' && renderHowToGuides()}
                    {activeTab === 'features-overview' && renderFeaturesOverview()}
                    {activeTab === 'technical-docs' && renderTechnicalDocs()}
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;