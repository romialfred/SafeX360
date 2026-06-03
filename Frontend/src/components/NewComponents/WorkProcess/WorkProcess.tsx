import React, { useState, useMemo, JSX } from 'react';
import {
    IconArrowLeft, // ArrowLeft
    IconFileText, // FileText
    IconSearch, // Search
    IconDownload, // Download
    IconChevronRight, // ChevronRight
    IconChevronDown, // ChevronDown
    IconMaximize, // Maximize2
    IconUsers, // Users
    IconAlertTriangle, // AlertTriangle
    IconShield, // Shield
    IconHelmet, // HardHat
    IconUserPlus, // UserPlus
    IconBolt, // Zap
    IconActivity, // Activity
    IconClock, // Clock
    IconCheck, // CheckCircle
    IconMessageCircle, // MessageSquare
    IconCalendar, // Calendar
} from '@tabler/icons-react';
import { Breadcrumbs, Text } from '@mantine/core';
import { Link } from 'react-router-dom';



interface ProcessStep {
    id: string;
    title: string;
    description: string;
    responsible: string;
    duration: string;
    requirements: string[];
}

interface WorkProcess {
    id: string;
    title: string;
    category: string;
    description: string;
    version: string;
    lastUpdated: string;
    author: string;
    status: 'active' | 'draft' | 'archived';
    priority: 'low' | 'medium' | 'high' | 'critical';
    color: string;
    bgColor: string;
    icon: React.ComponentType<any>;
    bpmnDiagram: string;
    pdfDocument: string;
    estimatedTime: string;
    complexity: 'simple' | 'medium' | 'complex';
    requiredTraining: string[];
    steps: ProcessStep[];
    keywords: string[];
    relatedProcesses: string[];
}

const workProcesses: WorkProcess[] = [
    {
        id: 'WP-001',
        title: "New Employee Onboarding",
        category: 'Human Resources',
        description: "Complete onboarding procedure for a new employee in the organization",
        version: '2.1',
        lastUpdated: '2024-01-15',
        author: 'HR Department',
        status: 'active',
        priority: 'high',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        icon: IconUserPlus,
        bpmnDiagram: '/diagrams/onboarding-bpmn.svg',
        pdfDocument: '/procedures/accueil-nouvel-employe.pdf',
        estimatedTime: '2-3 days',
        complexity: 'medium',
        requiredTraining: ['Basic safety training', 'Company orientation'],
        keywords: ['onboarding', 'integration', 'new employee', 'training', 'welcome'],
        relatedProcesses: ['WP-005', 'WP-008'],
        steps: [
            {
                id: 'step-1',
                title: 'Arrival preparation',
                description: 'Prepare the workstation and required documents',
                responsible: 'HR + Manager',
                duration: '1 day',
                requirements: ['Signed contract', 'Workstation available']
            },
            {
                id: 'step-2',
                title: 'Welcome and introduction',
                description: 'Welcome the new employee and introduce the team',
                responsible: 'Direct manager',
                duration: '2 hours',
                requirements: ['Welcome plan', 'Team available']
            },
            {
                id: 'step-3',
                title: 'Safety training',
                description: 'Mandatory training on safety rules',
                responsible: 'Safety Manager',
                duration: '4 hours',
                requirements: ['Training materials', 'PPE available']
            }
        ]
    },
    {
        id: 'WP-002',
        title: 'Work at height',
        category: 'Safety',
        description: 'Safety procedure for work at height and use of PPE',
        version: '3.0',
        lastUpdated: '2024-01-20',
        author: 'Safety Department',
        status: 'active',
        priority: 'critical',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
        icon: IconHelmet,
        bpmnDiagram: '/diagrams/travail-hauteur-bpmn.svg',
        pdfDocument: '/procedures/travail-en-hauteur.pdf',
        estimatedTime: '30 minutes',
        complexity: 'complex',
        requiredTraining: ['Work-at-height authorization', 'Harness use'],
        keywords: ['height', 'harness', 'scaffold', 'safety', 'fall'],
        relatedProcesses: ['WP-003', 'WP-004'],
        steps: [
            {
                id: 'step-1',
                title: 'Risk assessment',
                description: 'Analyze risks related to work at height',
                responsible: 'Safety Manager',
                duration: '15 minutes',
                requirements: ['Assessment sheet', 'Site inspection']
            },
            {
                id: 'step-2',
                title: 'PPE preparation',
                description: 'Check and prepare protective equipment',
                responsible: 'Worker + Supervisor',
                duration: '10 minutes',
                requirements: ['Certified harness', 'Anchorage points checked']
            }
        ]
    },
    {
        id: 'WP-003',
        title: 'Evacuation in case of accident',
        category: 'Emergency',
        description: 'Emergency evacuation procedure in case of an on-site accident',
        version: '1.8',
        lastUpdated: '2024-01-10',
        author: 'Safety Department',
        status: 'active',
        priority: 'critical',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        icon: IconAlertTriangle,
        bpmnDiagram: '/diagrams/evacuation-accident-bpmn.svg',
        pdfDocument: '/procedures/evacuation-accident.pdf',
        estimatedTime: '5-10 minutes',
        complexity: 'simple',
        requiredTraining: ['First aid training', 'Emergency procedures'],
        keywords: ['evacuation', 'accident', 'emergency', 'first aid', 'alarm'],
        relatedProcesses: ['WP-004', 'WP-002'],
        steps: [
            {
                id: 'step-1',
                title: 'Alert and secure',
                description: 'Trigger the alarm and secure the area',
                responsible: 'First witness',
                duration: '1 minute',
                requirements: ['Alarm button accessible', 'Area secured']
            }
        ]
    },
    {
        id: 'WP-004',
        title: 'Evacuation in case of contamination',
        category: 'Emergency',
        description: 'Specific evacuation procedure in case of chemical contamination',
        version: '2.3',
        lastUpdated: '2024-01-18',
        author: 'Safety Department',
        status: 'active',
        priority: 'critical',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200',
        icon: IconShield,
        bpmnDiagram: '/diagrams/evacuation-contamination-bpmn.svg',
        pdfDocument: '/procedures/evacuation-contamination.pdf',
        estimatedTime: '3-5 minutes',
        complexity: 'medium',
        requiredTraining: ['Handling chemicals', 'Decontamination'],
        keywords: ['contamination', 'chemical', 'decontamination', 'evacuation', 'PPE'],
        relatedProcesses: ['WP-003', 'WP-005'],
        steps: []
    },
    {
        id: 'WP-005',
        title: 'Lime addition procedure',
        category: 'Production',
        description: 'Detailed procedure for safely adding lime into the process',
        version: '1.5',
        lastUpdated: '2024-01-22',
        author: 'Production Department',
        status: 'active',
        priority: 'medium',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        icon: IconBolt,
        bpmnDiagram: '/diagrams/ajout-chaux-bpmn.svg',
        pdfDocument: '/procedures/ajout-chaux.pdf',
        estimatedTime: '45 minutes',
        complexity: 'medium',
        requiredTraining: ['Lime handling', 'Chemical safety'],
        keywords: ['lime', 'production', 'dosing', 'safety', 'chemical'],
        relatedProcesses: ['WP-006', 'WP-004'],
        steps: []
    },
    {
        id: 'WP-006',
        title: 'Dynalitage procedure',
        category: 'Production',
        description: 'Dynalitage procedure for material processing',
        version: '2.0',
        lastUpdated: '2024-01-25',
        author: 'Production Department',
        status: 'active',
        priority: 'medium',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 border-indigo-200',
        icon: IconActivity,
        bpmnDiagram: '/diagrams/dynalitage-bpmn.svg',
        pdfDocument: '/procedures/dynalitage.pdf',
        estimatedTime: '1-2 hours',
        complexity: 'complex',
        requiredTraining: ['Dynalitage training', 'Equipment safety'],
        keywords: ['dynalitage', 'processing', 'materials', 'production'],
        relatedProcesses: ['WP-005'],
        steps: []
    }
];

const WorkProcess = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedProcess, setSelectedProcess] = useState<WorkProcess | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'bpmn' | 'document'>('list');
    const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set());

    const categories = ['all', ...Array.from(new Set(workProcesses.map(process => process.category)))];

    const filteredProcesses = useMemo(() => {
        return workProcesses.filter(process => {
            const matchesSearch = process.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                process.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                process.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || process.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory]);

    const toggleProcessExpansion = (processId: string) => {
        const newExpanded = new Set(expandedProcesses);
        if (newExpanded.has(processId)) {
            newExpanded.delete(processId);
        } else {
            newExpanded.add(processId);
        }
        setExpandedProcesses(newExpanded);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getComplexityColor = (complexity: string) => {
        switch (complexity) {
            case 'simple': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'complex': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleViewBPMN = (process: WorkProcess) => {
        setSelectedProcess(process);
        setViewMode('bpmn');
    };

    const handleViewDocument = (process: WorkProcess) => {
        setSelectedProcess(process);
        setViewMode('document');
    };

    const handleBackToList = () => {
        setSelectedProcess(null);
        setViewMode('list');
    };

    // BPMN Viewer Component
    const BPMNViewer = ({ process }: { process: WorkProcess }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors"
                        >
                            <IconArrowLeft className="w-5 h-5 mr-2" />
                            Back to list
                        </button>
                        <div>
                            <h2 className="text-2xl text-gray-900">{process.title}</h2>
                            <p className="text-gray-600">BPMN Diagram - Version {process.version}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setViewMode('document')}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <IconFileText className="w-4 h-4 mr-2" />
                            View document
                        </button>
                        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <IconDownload className="w-4 h-4 mr-2" />
                            Download
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm text-gray-700">BPMN Diagram - {process.title}</h3>
                            <div className="flex items-center space-x-2">
                                <button className="p-1 hover:bg-gray-200 rounded">
                                    <IconMaximize className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-white min-h-96 overflow-auto">
                        {renderBPMNDiagram(process)}
                    </div>
                </div>

                {/* Process Information */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-blue-900 mb-3">Process information</h4>
                        <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Estimated time:</span> {process.estimatedTime}</div>
                            <div><span className="font-medium">Complexity:</span> {process.complexity}</div>
                            <div><span className="font-medium">Category:</span> {process.category}</div>
                            <div><span className="font-medium">Last updated:</span> {process.lastUpdated}</div>
                        </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-green-900 mb-3">Required training</h4>
                        <div className="space-y-1">
                            {process.requiredTraining.map((training, index) => (
                                <div key={index} className="flex items-center text-sm">
                                    <IconCheck className="w-4 h-4 text-green-600 mr-2" />
                                    {training}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Document Viewer Component
    const DocumentViewer = ({ process }: { process: WorkProcess }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors"
                        >
                            <IconArrowLeft className="w-5 h-5 mr-2" />
                            Back to list
                        </button>
                        <div>
                            <h2 className="text-2xl text-gray-900">{process.title}</h2>
                            <p className="text-gray-600">Procedure document - Version {process.version}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setViewMode('bpmn')}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <IconActivity className="w-4 h-4 mr-2" />
                            View BPMN
                        </button>
                        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <IconDownload className="w-4 h-4 mr-2" />
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm text-gray-700">Document - {process.title}</h3>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Version {process.version}</span>
                                <button className="p-1 hover:bg-gray-200 rounded">
                                    <IconMaximize className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-white min-h-96">
                        {renderProcessDocument(process)}
                    </div>
                </div>
            </div>
        </div>
    );

    // Function to render BPMN diagrams
    const renderBPMNDiagram = (process: WorkProcess) => {
        const bpmnDiagrams: Record<string, JSX.Element> = {
            'WP-001': (
                <svg viewBox="0 0 800 400" className="w-full h-auto">
                    {/* Accueil nouvel employé BPMN */}
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                        </marker>
                    </defs>

                    {/* Start Event */}
                    <circle cx="50" cy="200" r="20" fill="#90EE90" stroke="#4CAF50" strokeWidth="2" />
                    <text x="50" y="235" textAnchor="middle" fontSize="12" fill="#333">Start</text>

                    {/* Task 1: Préparation */}
                    <rect x="120" y="170" width="120" height="60" rx="10" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
                    <text x="180" y="195" textAnchor="middle" fontSize="11" fill="#333">Arrival</text>
                    <text x="180" y="210" textAnchor="middle" fontSize="11" fill="#333">preparation</text>

                    {/* Task 2: Accueil */}
                    <rect x="290" y="170" width="120" height="60" rx="10" fill="#E8F5E8" stroke="#4CAF50" strokeWidth="2" />
                    <text x="350" y="195" textAnchor="middle" fontSize="11" fill="#333">Welcome and</text>
                    <text x="350" y="210" textAnchor="middle" fontSize="11" fill="#333">introduction</text>

                    {/* Task 3: Formation */}
                    <rect x="460" y="170" width="120" height="60" rx="10" fill="#FFF3E0" stroke="#FF9800" strokeWidth="2" />
                    <text x="520" y="195" textAnchor="middle" fontSize="11" fill="#333">Safety</text>
                    <text x="520" y="210" textAnchor="middle" fontSize="11" fill="#333">training</text>

                    {/* Task 4: Suivi */}
                    <rect x="630" y="170" width="120" height="60" rx="10" fill="#F3E5F5" stroke="#9C27B0" strokeWidth="2" />
                    <text x="690" y="195" textAnchor="middle" fontSize="11" fill="#333">Integration</text>
                    <text x="690" y="210" textAnchor="middle" fontSize="11" fill="#333">follow-up</text>

                    {/* End Event */}
                    <circle cx="780" cy="200" r="20" fill="#FFB6C1" stroke="#F44336" strokeWidth="3" />
                    <text x="780" y="235" textAnchor="middle" fontSize="12" fill="#333">End</text>

                    {/* Arrows */}
                    <line x1="70" y1="200" x2="120" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <line x1="240" y1="200" x2="290" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <line x1="410" y1="200" x2="460" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <line x1="580" y1="200" x2="630" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <line x1="750" y1="200" x2="760" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />

                    {/* Actors */}
                    <text x="180" y="150" textAnchor="middle" fontSize="10" fill="#666">HR + Manager</text>
                    <text x="350" y="150" textAnchor="middle" fontSize="10" fill="#666">Manager</text>
                    <text x="520" y="150" textAnchor="middle" fontSize="10" fill="#666">Safety Manager</text>
                    <text x="690" y="150" textAnchor="middle" fontSize="10" fill="#666">HR</text>
                </svg>
            ),

            'WP-002': (
                <svg viewBox="0 0 800 500" className="w-full h-auto">
                    {/* Travail en hauteur BPMN */}
                    <defs>
                        <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                        </marker>
                    </defs>

                    {/* Start Event */}
                    <circle cx="50" cy="250" r="20" fill="#90EE90" stroke="#4CAF50" strokeWidth="2" />
                    <text x="50" y="285" textAnchor="middle" fontSize="12" fill="#333">Start</text>

                    {/* Decision Diamond */}
                    <polygon points="150,220 200,250 150,280 100,250" fill="#FFF9C4" stroke="#FFC107" strokeWidth="2" />
                    <text x="150" y="250" textAnchor="middle" fontSize="10" fill="#333">Height</text>
                    <text x="150" y="265" textAnchor="middle" fontSize="10" fill="#333">&gt; 2m?</text>

                    {/* Risk Assessment */}
                    <rect x="250" y="220" width="120" height="60" rx="10" fill="#FFEBEE" stroke="#F44336" strokeWidth="2" />
                    <text x="310" y="245" textAnchor="middle" fontSize="11" fill="#333">Risk</text>
                    <text x="310" y="260" textAnchor="middle" fontSize="11" fill="#333">assessment</text>

                    {/* PPE Check */}
                    <rect x="420" y="220" width="120" height="60" rx="10" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
                    <text x="480" y="245" textAnchor="middle" fontSize="11" fill="#333">PPE</text>
                    <text x="480" y="260" textAnchor="middle" fontSize="11" fill="#333">check</text>

                    {/* Work Execution */}
                    <rect x="590" y="220" width="120" height="60" rx="10" fill="#E8F5E8" stroke="#4CAF50" strokeWidth="2" />
                    <text x="650" y="245" textAnchor="middle" fontSize="11" fill="#333">Work</text>
                    <text x="650" y="260" textAnchor="middle" fontSize="11" fill="#333">execution</text>

                    {/* Alternative path for < 2m */}
                    <rect x="120" y="350" width="120" height="60" rx="10" fill="#F3E5F5" stroke="#9C27B0" strokeWidth="2" />
                    <text x="180" y="375" textAnchor="middle" fontSize="11" fill="#333">Standard</text>
                    <text x="180" y="390" textAnchor="middle" fontSize="11" fill="#333">work</text>

                    {/* End Event */}
                    <circle cx="750" cy="250" r="20" fill="#FFB6C1" stroke="#F44336" strokeWidth="3" />
                    <text x="750" y="285" textAnchor="middle" fontSize="12" fill="#333">End</text>

                    {/* Arrows */}
                    <line x1="70" y1="250" x2="100" y2="250" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead2)" />
                    <line x1="200" y1="250" x2="250" y2="250" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead2)" />
                    <line x1="370" y1="250" x2="420" y2="250" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead2)" />
                    <line x1="540" y1="250" x2="590" y2="250" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead2)" />
                    <line x1="710" y1="250" x2="730" y2="250" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead2)" />

                    {/* Alternative path */}
                    <line x1="150" y1="280" x2="150" y2="320" stroke="#666" strokeWidth="2" />
                    <line x1="150" y1="320" x2="180" y2="350" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead2)" />
                    <line x1="240" y1="380" x2="650" y2="380" stroke="#666" strokeWidth="2" />
                    <line x1="650" y1="380" x2="650" y2="280" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead2)" />

                    {/* Labels */}
                    <text x="225" y="240" fontSize="10" fill="#4CAF50">Yes</text>
                    <text x="130" y="310" fontSize="10" fill="#F44336">No</text>
                </svg>
            ),

            'WP-003': (
                <svg viewBox="0 0 700 400" className="w-full h-auto">
                    {/* Accident evacuation BPMN */}
                    <defs>
                        <marker id="arrowhead3" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                        </marker>
                    </defs>

                    {/* Start Event - Accident */}
                    <circle cx="50" cy="200" r="20" fill="#FFCDD2" stroke="#F44336" strokeWidth="3" />
                    <text x="50" y="235" textAnchor="middle" fontSize="12" fill="#333">Accident</text>

                    {/* Immediate Alert */}
                    <rect x="120" y="170" width="100" height="60" rx="10" fill="#FFEBEE" stroke="#F44336" strokeWidth="2" />
                    <text x="170" y="195" textAnchor="middle" fontSize="11" fill="#333">Immediate</text>
                    <text x="170" y="210" textAnchor="middle" fontSize="11" fill="#333">alert</text>

                    {/* Secure Area */}
                    <rect x="270" y="170" width="100" height="60" rx="10" fill="#FFF3E0" stroke="#FF9800" strokeWidth="2" />
                    <text x="320" y="195" textAnchor="middle" fontSize="11" fill="#333">Secure</text>
                    <text x="320" y="210" textAnchor="middle" fontSize="11" fill="#333">area</text>

                    {/* First Aid */}
                    <rect x="420" y="170" width="100" height="60" rx="10" fill="#E8F5E8" stroke="#4CAF50" strokeWidth="2" />
                    <text x="470" y="195" textAnchor="middle" fontSize="11" fill="#333">First</text>
                    <text x="470" y="210" textAnchor="middle" fontSize="11" fill="#333">aid</text>

                    {/* Evacuation */}
                    <rect x="570" y="170" width="100" height="60" rx="10" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
                    <text x="620" y="195" textAnchor="middle" fontSize="11" fill="#333">Evacuation</text>
                    <text x="620" y="210" textAnchor="middle" fontSize="11" fill="#333">if necessary</text>

                    {/* Arrows */}
                    <line x1="70" y1="200" x2="120" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead3)" />
                    <line x1="220" y1="200" x2="270" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead3)" />
                    <line x1="370" y1="200" x2="420" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead3)" />
                    <line x1="520" y1="200" x2="570" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead3)" />

                    {/* Time indicators */}
                    <text x="170" y="150" textAnchor="middle" fontSize="10" fill="#F44336">&lt; 1 min</text>
                    <text x="320" y="150" textAnchor="middle" fontSize="10" fill="#FF9800">&lt; 2 min</text>
                    <text x="470" y="150" textAnchor="middle" fontSize="10" fill="#4CAF50">Immediate</text>
                    <text x="620" y="150" textAnchor="middle" fontSize="10" fill="#2196F3">If required</text>
                </svg>
            )
        };

        return bpmnDiagrams[process.id] || (
            <div className="text-center py-12">
                <IconActivity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg text-gray-900 mb-2">BPMN Diagram</h3>
                <p className="text-gray-600">Diagram in development for "{process.title}"</p>
            </div>
        );
    };

    // Function to render process documents
    const renderProcessDocument = (process: WorkProcess) => {
        const processDocuments: Record<string, JSX.Element> = {
            'WP-001': (
                <div className="prose max-w-none">
                    <h1 className="text-2xl text-gray-900 mb-6">New Employee Onboarding Procedure</h1>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    <strong>Goal:</strong> Ensure a successful and safe integration of every new employee into the organization.
                                </p>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">1. Arrival preparation (Day -1)</h2>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h3 className="text-gray-700 mb-2">Responsible: HR + Direct Manager</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            <li>Prepare the workstation and required equipment</li>
                            <li>Create IT access and badges</li>
                            <li>Prepare the welcome pack with mandatory documents</li>
                            <li>Plan the onboarding schedule</li>
                            <li>Inform the team of the new hire's arrival</li>
                        </ul>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">2. Welcome and introduction (Day 1 - Morning)</h2>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h3 className="text-gray-700 mb-2">Responsible: Direct Manager</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            <li>Personally welcome the new employee</li>
                            <li>Introduce the team and direct colleagues</li>
                            <li>Tour the facilities and explain the organization</li>
                            <li>Provide equipment and access</li>
                            <li>Explain basic rules and company culture</li>
                        </ul>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">3. Mandatory safety training (Day 1 - Afternoon)</h2>
                    <div className="bg-orange-50 p-4 rounded-lg mb-4">
                        <h3 className="text-orange-700 mb-2">Responsible: Safety Manager</h3>
                        <ul className="list-disc list-inside space-y-2 text-orange-700">
                            <li>Training on general safety instructions</li>
                            <li>Presentation of personal protective equipment</li>
                            <li>Explanation of emergency procedures</li>
                            <li>Tour emergency exits and assembly points</li>
                            <li>Provide and sign safety documents</li>
                        </ul>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">4. Onboarding follow-up</h2>
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                        <h3 className="text-green-700 mb-2">Responsible: HR</h3>
                        <ul className="list-disc list-inside space-y-2 text-green-700">
                            <li>Check-in at 1 week: adaptation and first impressions</li>
                            <li>Check-in at 1 month: integration assessment</li>
                            <li>Check-in at 3 months: end of probation review</li>
                            <li>Collect feedback and adjust if needed</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-6">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    <strong>Important:</strong> Safety training is mandatory before starting any activity.
                                    No employee may begin work without having completed this training.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ),

            'WP-002': (
                <div className="prose max-w-none">
                    <h1 className="text-2xl text-gray-900 mb-6">Work at Height Procedure</h1>

                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    <strong>DANGER:</strong> Working at height presents a risk of serious falls.
                                    This procedure must be strictly followed.
                                </p>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">Definition</h2>
                    <p className="text-gray-700 mb-4">
                        Any work performed at a height greater than 2 meters above the ground or a stable surface.
                    </p>

                    <h2 className="text-lg text-gray-800 mb-4">1. Preliminary risk assessment</h2>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h3 className="text-gray-700 mb-2">Before any work at height:</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            <li>Assess the necessity of working at height</li>
                            <li>Evaluate weather conditions</li>
                            <li>Check the condition of equipment and structures</li>
                            <li>Identify secure anchor points</li>
                            <li>Plan access routes and rescue paths</li>
                        </ul>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">2. Personal Protective Equipment</h2>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h3 className="text-blue-700 mb-2">Mandatory PPE:</h3>
                        <ul className="list-disc list-inside space-y-2 text-blue-700">
                            <li><strong>Safety harness</strong> - Checked and certified</li>
                            <li><strong>Safety helmet</strong> - With chin strap</li>
                            <li><strong>Safety shoes</strong> - Anti-slip</li>
                            <li><strong>Safety lanyard</strong> - With energy absorber</li>
                            <li><strong>Protective gloves</strong> - Suitable for the task</li>
                        </ul>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">3. Checks before use</h2>
                    <div className="bg-orange-50 p-4 rounded-lg mb-4">
                        <h3 className="text-orange-700 mb-2">Mandatory checks:</h3>
                        <ul className="list-disc list-inside space-y-2 text-orange-700">
                            <li>Harness condition (straps, buckles, stitching)</li>
                            <li>Carabiner operation</li>
                            <li>Lanyard and absorber integrity</li>
                            <li>Strength of anchor points</li>
                            <li>Equipment validity/inspection date</li>
                        </ul>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">4. Execution procedure</h2>
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                        <h3 className="text-green-700 mb-2">Steps to follow:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-green-700">
                            <li>Fully gear up before accessing height</li>
                            <li>Connect to the anchor point immediately upon access</li>
                            <li>Maintain at least one anchor point at all times</li>
                            <li>Avoid sudden movements and overloading</li>
                            <li>Communicate regularly with the ground team</li>
                        </ol>
                    </div>

                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-6">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    <strong>PROHIBITIONS:</strong> Working in strong winds (&gt; 40 km/h), during storms,
                                    or with faulty equipment. If in doubt, stop work immediately.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ),

            'WP-003': (
                <div className="prose max-w-none">
                    <h1 className="text-2xl text-gray-900 mb-6">Evacuation Procedure in Case of Accident</h1>

                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    <strong>EMERGENCY:</strong> In case of an accident, every second counts.
                                    Follow this procedure quickly and calmly.
                                </p>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">1. Immediate alert (&lt; 1 minute)</h2>
                    <div className="bg-red-50 p-4 rounded-lg mb-4">
                        <h3 className="text-red-700 mb-2">Immediate actions:</h3>
                        <ul className="list-disc list-inside space-y-2 text-red-700">
                            <li><strong>Trigger the alarm</strong> - Nearest emergency button</li>
                            <li><strong>Call emergency services</strong> - 15 (EMS) or 18 (Fire)</li>
                            <li><strong>Alert management</strong> - Safety Manager and leadership</li>
                            <li><strong>Inform reception</strong> - To direct emergency responders</li>
                        </ul>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">2. Securing the area (&lt; 2 minutes)</h2>
                    <div className="bg-orange-50 p-4 rounded-lg mb-4">
                        <h3 className="text-orange-700 mb-2">Safety measures:</h3>
                        <ul className="list-disc list-inside space-y-2 text-orange-700">
                            <li>Keep unauthorized persons away</li>
                            <li>Mark and secure the perimeter</li>
                            <li>Shut down hazardous equipment if possible</li>
                            <li>Cut electrical power if needed</li>
                            <li>Avoid any risk of secondary accidents</li>
                        </ul>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">3. First aid</h2>
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                        <h3 className="text-green-700 mb-2">First aid actions:</h3>
                        <ul className="list-disc list-inside space-y-2 text-green-700">
                            <li><strong>Assess the victim's condition</strong> - Consciousness, breathing</li>
                            <li><strong>Do not move</strong> - Unless there is imminent danger</li>
                            <li><strong>Keep warm</strong> - Cover the victim</li>
                            <li><strong>Reassure</strong> - Speak calmly to the victim</li>
                            <li><strong>Monitor</strong> - Until responders arrive</li>
                        </ul>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">4. Evacuation if necessary</h2>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h3 className="text-blue-700 mb-2">Evacuation procedure:</h3>
                        <ul className="list-disc list-inside space-y-2 text-blue-700">
                            <li>Follow the evacuation leader's instructions</li>
                            <li>Use marked emergency exits</li>
                            <li>Go to the assembly point</li>
                            <li>Conduct a headcount</li>
                            <li>Wait for clearance before returning</li>
                        </ul>
                    </div>

                    <h2 className="text-lg text-gray-800 mb-4">Emergency numbers</h2>
                    <div className="bg-gray-100 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-medium">EMS: <span className="text-red-600">15</span></p>
                                <p className="font-medium">Fire Department: <span className="text-red-600">18</span></p>
                                <p className="font-medium">Police: <span className="text-red-600">17</span></p>
                            </div>
                            <div>
                                <p className="font-medium">European emergency: <span className="text-red-600">112</span></p>
                                <p className="font-medium">Poison control center: <span className="text-red-600">01 40 05 48 48</span></p>
                                <p className="font-medium">Safety Manager: <span className="text-blue-600">Ext 2345</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        };

        return processDocuments[process.id] || (
            <div className="text-center py-12">
                <IconFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg text-gray-900 mb-2">Document in preparation</h3>
                <p className="text-gray-600">The detailed document for "{process.title}" will be available soon.</p>
            </div>
        );
    };
    if (viewMode === 'bpmn' && selectedProcess) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto p-8">
                    <BPMNViewer process={selectedProcess} />
                </div>
            </div>
        );
    }

    if (viewMode === 'document' && selectedProcess) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto p-8">
                    <DocumentViewer process={selectedProcess} />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen p-5">
            {/* Fixed Header */}
            <div className="flex justify-between items-center  mb-2">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Work Procedures</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Work Procedures</Text>
                    </Breadcrumbs>
                </div>
                <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <IconMessageCircle className="w-4 h-4 mr-2" />
                    Ask AI
                </button>
            </div>
            <p className='italic text-gray-600'> Help center for all documented procedures</p>



            {/* Content */}
            <div className="max-w-7xl mx-auto mt-5 ">

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <IconFileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Total Procedures</p>
                                <p className="text-2xl text-gray-900">{workProcesses.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <IconCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl text-green-600">
                                    {workProcesses.filter(p => p.status === 'active').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <IconAlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Critical</p>
                                <p className="text-2xl text-red-600">
                                    {workProcesses.filter(p => p.priority === 'critical').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <IconUsers className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Categories</p>
                                <p className="text-2xl text-purple-600">{categories.length - 1}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-2">
                            <IconSearch className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search procedures..."
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
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category === 'all' ? 'All categories' : category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Process List */}
                <div className="space-y-6">
                    {filteredProcesses.map((process) => {
                        const isExpanded = expandedProcesses.has(process.id);

                        return (
                            <div key={process.id} className={`bg-white rounded-xl shadow-sm border-2 ${process.bgColor} overflow-hidden`}>
                                {/* Process Header */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-4">
                                                <div className={`p-3 rounded-lg ${process.bgColor} mr-4`}>
                                                    <process.icon className={`w-8 h-8 ${process.color}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <h3 className="text-lg text-gray-900 mr-4">{process.title}</h3>
                                                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {process.id}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 mb-3">{process.description}</p>

                                                    <div className="flex items-center space-x-4 text-sm">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getPriorityColor(process.priority)}`}>
                                                            {process.priority === 'critical' ? 'Critical' :
                                                                process.priority === 'high' ? 'High' :
                                                                    process.priority === 'medium' ? 'Medium' : 'Low'}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(process.status)}`}>
                                                            {process.status === 'active' ? 'Active' :
                                                                process.status === 'draft' ? 'Draft' : 'Archived'}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getComplexityColor(process.complexity)}`}>
                                                            {process.complexity === 'simple' ? 'Simple' :
                                                                process.complexity === 'medium' ? 'Medium' : 'Complex'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                                <div className="flex items-center">
                                                    <IconUsers className="w-4 h-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-600">Author:</span>
                                                    <span className="ml-1">{process.author}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <IconClock className="w-4 h-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-600">Duration:</span>
                                                    <span className="ml-1">{process.estimatedTime}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <IconFileText className="w-4 h-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-600">Version:</span>
                                                    <span className="ml-1">{process.version}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <IconCalendar className="w-4 h-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-600">Updated:</span>
                                                    <span className="ml-1">{process.lastUpdated}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end space-y-3 ml-6">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewBPMN(process)}
                                                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    <IconActivity className="w-4 h-4 mr-2" />
                                                    BPMN
                                                </button>
                                                <button
                                                    onClick={() => handleViewDocument(process)}
                                                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    <IconFileText className="w-4 h-4 mr-2" />
                                                    Document
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => toggleProcessExpansion(process.id)}
                                                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <>
                                                        <IconChevronDown className="w-4 h-4 mr-2" />
                                                        Réduire
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconChevronRight className="w-4 h-4 mr-2" />
                                                        Détails
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-6 pb-6 border-t border-gray-100">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                            {/* Steps */}
                                            {process.steps.length > 0 && (
                                                <div>
                                                    <h4 className="text-lg text-gray-900 mb-4">Étapes principales</h4>
                                                    <div className="space-y-3">
                                                        {process.steps.map((step, index) => (
                                                            <div key={step.id} className="bg-gray-50 rounded-lg p-4">
                                                                <div className="flex items-start">
                                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm mr-3">
                                                                        {index + 1}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h5 className="text-gray-900 mb-1">{step.title}</h5>
                                                                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                                                                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                                                                            <span>👤 {step.responsible}</span>
                                                                            <span>⏱️ {step.duration}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Additional Info */}
                                            <div>
                                                <h4 className="text-lg text-gray-900 mb-4">Additional information</h4>

                                                {process.requiredTraining.length > 0 && (
                                                    <div className="mb-4">
                                                        <h5 className="text-gray-700 mb-2">Required training</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {process.requiredTraining.map((training, index) => (
                                                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                    {training}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {process.keywords.length > 0 && (
                                                    <div className="mb-4">
                                                        <h5 className="text-gray-700 mb-2">Keywords</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {process.keywords.map((keyword, index) => (
                                                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                                                    #{keyword}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {process.relatedProcesses.length > 0 && (
                                                    <div>
                                                        <h5 className="text-gray-700 mb-2">Related procedures</h5>
                                                        <div className="space-y-1">
                                                            {process.relatedProcesses.map((relatedId, index) => {
                                                                const relatedProcess = workProcesses.find(p => p.id === relatedId);
                                                                return relatedProcess ? (
                                                                    <div key={index} className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                                                                        → {relatedProcess.title}
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filteredProcesses.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <IconFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg text-gray-900 mb-2">No procedures found</h3>
                        <p className="text-gray-600">
                            {searchTerm || selectedCategory !== 'all'
                                ? 'Try adjusting your search filters.'
                                : 'No work procedures available at the moment.'
                            }
                        </p>
                    </div>
                )}

                {/* AI Assistant Integration */}
                <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center">
                        <IconMessageCircle className="w-8 h-8 text-purple-600 mr-4" />
                        <div className="flex-1">
                            <h3 className="text-lg text-purple-900 mb-2">AI Assistant for Procedures</h3>
                            <p className="text-purple-700 text-sm mb-4">
                                Ask your questions about work procedures. AI can help you find the right procedure,
                                explain steps, or clarify safety requirements.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    "How to onboard a new employee?"
                                </span>
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    "Which PPE for work at height?"
                                </span>
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    "Evacuation procedure in case of accident"
                                </span>
                            </div>
                        </div>
                        <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <IconMessageCircle className="w-4 h-4 mr-2" />
                            Ask AI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkProcess;
