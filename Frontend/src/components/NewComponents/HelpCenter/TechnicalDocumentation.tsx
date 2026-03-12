import { useState } from 'react';
import {
    IconDeviceDesktop,
    IconDatabase,
    IconBook,
    IconChevronDown,
    IconKey,
    IconLink,
    IconHash,
    IconShield,
    IconSettings,
    IconCircleCheck,
    IconServer,
    IconGlobe,
    IconLock,
    IconBolt,
    IconChartBar,
    IconUsers,
    IconFileText,
    IconAlertTriangle,
    IconHelmet,
    IconTarget,
    IconClipboardCheck,
    IconMessage,
} from '@tabler/icons-react';


interface TableField {
    name: string;
    type: string;
    constraints: string[];
    description: string;
    example: string;
}

interface DatabaseTable {
    name: string;
    description: string;
    fields: TableField[];
    relations: string[];
}

const databaseTables: DatabaseTable[] = [
    {
        name: 'users',
        description: 'User accounts and authentication information',
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: 'Unique identifier for each user',
                example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
            },
            {
                name: 'first_name',
                type: 'VARCHAR(100)',
                constraints: ['NOT NULL'],
                description: 'User\'s first name',
                example: 'John'
            },
            {
                name: 'last_name',
                type: 'VARCHAR(100)',
                constraints: ['NOT NULL'],
                description: 'User\'s last name',
                example: 'Smith'
            },
            {
                name: 'email',
                type: 'VARCHAR(255)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: 'User\'s email address for login',
                example: 'john.smith@company.com'
            },
            {
                name: 'role_id',
                type: 'UUID',
                constraints: ['FOREIGN KEY'],
                description: 'Reference to user role',
                example: 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22'
            },
            {
                name: 'department',
                type: 'VARCHAR(100)',
                constraints: [],
                description: 'User\'s department',
                example: 'Health & Safety'
            },
            {
                name: 'position',
                type: 'VARCHAR(100)',
                constraints: [],
                description: 'User\'s job position',
                example: 'Safety Coordinator'
            },
            {
                name: 'is_active',
                type: 'BOOLEAN',
                constraints: ['DEFAULT true'],
                description: 'Whether the user account is active',
                example: 'true'
            },
            {
                name: 'created_at',
                type: 'TIMESTAMP',
                constraints: ['DEFAULT CURRENT_TIMESTAMP'],
                description: 'Account creation timestamp',
                example: '2024-01-15 08:00:00'
            },
            {
                name: 'last_login',
                type: 'TIMESTAMP',
                constraints: [],
                description: 'Last login timestamp',
                example: '2024-01-20 14:30:00'
            }
        ],
        relations: [
            'users.role_id → roles.id',
            'incidents.created_by → users.id',
            'chemical_risks.assigned_to → users.id'
        ]
    },
    {
        name: 'incidents',
        description: 'Safety incidents and accident reports',
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: 'Unique identifier for each incident',
                example: 'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33'
            },
            {
                name: 'incident_number',
                type: 'VARCHAR(50)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: 'Human-readable incident number',
                example: 'INC-2024-001'
            },
            {
                name: 'title',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: 'Brief title of the incident',
                example: 'Slip and fall in warehouse'
            },
            {
                name: 'description',
                type: 'TEXT',
                constraints: ['NOT NULL'],
                description: 'Detailed description of what happened',
                example: 'Employee slipped on wet floor near loading dock'
            },
            {
                name: 'incident_date',
                type: 'TIMESTAMP',
                constraints: ['NOT NULL'],
                description: 'When the incident occurred',
                example: '2024-01-15 10:30:00'
            },
            {
                name: 'location',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: 'Where the incident occurred',
                example: 'Warehouse A - Loading Dock 3'
            },
            {
                name: 'severity',
                type: 'ENUM',
                constraints: ['CHECK (severity IN (\'minor\', \'moderate\', \'major\', \'critical\'))'],
                description: 'Severity level of the incident',
                example: 'moderate'
            },
            {
                name: 'status',
                type: 'ENUM',
                constraints: ['CHECK (status IN (\'open\', \'investigating\', \'closed\'))', 'DEFAULT \'open\''],
                description: 'Current status of incident investigation',
                example: 'investigating'
            },
            {
                name: 'created_by',
                type: 'UUID',
                constraints: ['FOREIGN KEY', 'NOT NULL'],
                description: 'User who reported the incident',
                example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
            },
            {
                name: 'assigned_to',
                type: 'UUID',
                constraints: ['FOREIGN KEY'],
                description: 'User assigned to investigate',
                example: 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22'
            },
            {
                name: 'created_at',
                type: 'TIMESTAMP',
                constraints: ['DEFAULT CURRENT_TIMESTAMP'],
                description: 'When the incident was reported',
                example: '2024-01-15 11:00:00'
            }
        ],
        relations: [
            'incidents.created_by → users.id',
            'incidents.assigned_to → users.id',
            'incident_actions.incident_id → incidents.id'
        ]
    },
    {
        name: 'chemical_risks',
        description: 'Chemical risk identification and assessment records',
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: 'Unique identifier for each chemical risk',
                example: 'd3ffbc99-9c0b-4ef8-bb6d-6bb9bd380a44'
            },
            {
                name: 'risk_id',
                type: 'VARCHAR(50)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: 'Human-readable risk identifier',
                example: 'CHR-2024-001'
            },
            {
                name: 'risk_title',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: 'Short descriptive title of the risk',
                example: 'Acid Burns from Sulfuric Acid Handling'
            },
            {
                name: 'chemical_name',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: 'Official name of the chemical',
                example: 'Sulfuric Acid 98%'
            },
            {
                name: 'cas_number',
                type: 'VARCHAR(20)',
                constraints: [],
                description: 'Chemical Abstracts Service number',
                example: '7664-93-9'
            },
            {
                name: 'classification',
                type: 'ENUM',
                constraints: ['CHECK (classification IN (\'flammable\', \'toxic\', \'corrosive\', \'oxidizing\', \'explosive\', \'irritant\', \'carcinogenic\'))'],
                description: 'GHS hazard classification',
                example: 'corrosive'
            },
            {
                name: 'department',
                type: 'VARCHAR(100)',
                constraints: ['NOT NULL'],
                description: 'Department where chemical is used',
                example: 'Laboratory'
            },
            {
                name: 'likelihood',
                type: 'INTEGER',
                constraints: ['CHECK (likelihood >= 1 AND likelihood <= 5)'],
                description: 'Probability of occurrence (1-5 scale)',
                example: '3'
            },
            {
                name: 'severity',
                type: 'INTEGER',
                constraints: ['CHECK (severity >= 1 AND severity <= 5)'],
                description: 'Impact severity (1-5 scale)',
                example: '4'
            },
            {
                name: 'risk_rating',
                type: 'INTEGER',
                constraints: ['GENERATED ALWAYS AS (likelihood * severity) STORED'],
                description: 'Calculated risk rating (likelihood × severity)',
                example: '12'
            },
            {
                name: 'status',
                type: 'ENUM',
                constraints: ['CHECK (status IN (\'open\', \'in_progress\', \'closed\'))', 'DEFAULT \'open\''],
                description: 'Current status of risk management',
                example: 'in_progress'
            },
            {
                name: 'assigned_to',
                type: 'UUID',
                constraints: ['FOREIGN KEY'],
                description: 'User responsible for risk management',
                example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
            },
            {
                name: 'date_identified',
                type: 'DATE',
                constraints: ['NOT NULL'],
                description: 'Date when risk was identified',
                example: '2024-01-15'
            },
            {
                name: 'next_review',
                type: 'DATE',
                constraints: [],
                description: 'Scheduled date for next review',
                example: '2024-04-15'
            }
        ],
        relations: [
            'chemical_risks.assigned_to → users.id',
            'risk_assessments.risk_id → chemical_risks.id'
        ]
    },
    {
        name: 'actions',
        description: 'Action items and corrective measures',
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: 'Unique identifier for each action',
                example: 'e4ffbc99-9c0b-4ef8-bb6d-6bb9bd380a55'
            },
            {
                name: 'action_number',
                type: 'VARCHAR(50)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: 'Human-readable action number',
                example: 'ACT-2024-001'
            },
            {
                name: 'title',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: 'Brief title of the action',
                example: 'Install non-slip flooring'
            },
            {
                name: 'description',
                type: 'TEXT',
                constraints: ['NOT NULL'],
                description: 'Detailed description of required action',
                example: 'Install anti-slip flooring material in warehouse loading areas'
            },
            {
                name: 'priority',
                type: 'ENUM',
                constraints: ['CHECK (priority IN (\'low\', \'medium\', \'high\', \'critical\'))', 'DEFAULT \'medium\''],
                description: 'Priority level of the action',
                example: 'high'
            },
            {
                name: 'status',
                type: 'ENUM',
                constraints: ['CHECK (status IN (\'not_started\', \'in_progress\', \'completed\', \'cancelled\'))', 'DEFAULT \'not_started\''],
                description: 'Current status of action implementation',
                example: 'in_progress'
            },
            {
                name: 'assigned_to',
                type: 'UUID',
                constraints: ['FOREIGN KEY', 'NOT NULL'],
                description: 'User responsible for completing action',
                example: 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22'
            },
            {
                name: 'due_date',
                type: 'DATE',
                constraints: ['NOT NULL'],
                description: 'Target completion date',
                example: '2024-02-15'
            },
            {
                name: 'completed_date',
                type: 'DATE',
                constraints: [],
                description: 'Actual completion date',
                example: '2024-02-10'
            },
            {
                name: 'progress',
                type: 'INTEGER',
                constraints: ['CHECK (progress >= 0 AND progress <= 100)', 'DEFAULT 0'],
                description: 'Completion percentage (0-100)',
                example: '75'
            },
            {
                name: 'created_at',
                type: 'TIMESTAMP',
                constraints: ['DEFAULT CURRENT_TIMESTAMP'],
                description: 'When the action was created',
                example: '2024-01-20 09:00:00'
            }
        ],
        relations: [
            'actions.assigned_to → users.id',
            'incident_actions.action_id → actions.id',
            'risk_actions.action_id → actions.id'
        ]
    },
    {
        name: 'audits',
        description: 'Internal and external audit records',
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: 'Unique identifier for each audit',
                example: 'f5ffbc99-9c0b-4ef8-bb6d-6bb9bd380a66'
            },
            {
                name: 'audit_number',
                type: 'VARCHAR(50)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: 'Human-readable audit number',
                example: 'AUD-2024-001'
            },
            {
                name: 'title',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: 'Title of the audit',
                example: 'ISO 45001 Internal Audit - Production'
            },
            {
                name: 'audit_type',
                type: 'ENUM',
                constraints: ['CHECK (audit_type IN (\'internal\', \'external\', \'certification\', \'surveillance\'))', 'NOT NULL'],
                description: 'Type of audit being conducted',
                example: 'internal'
            },
            {
                name: 'scope',
                type: 'TEXT',
                constraints: ['NOT NULL'],
                description: 'Scope and areas covered by audit',
                example: 'Production processes, safety procedures, PPE compliance'
            },
            {
                name: 'auditor',
                type: 'UUID',
                constraints: ['FOREIGN KEY', 'NOT NULL'],
                description: 'Lead auditor conducting the audit',
                example: 'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33'
            },
            {
                name: 'auditee_department',
                type: 'VARCHAR(100)',
                constraints: ['NOT NULL'],
                description: 'Department being audited',
                example: 'Production'
            },
            {
                name: 'planned_date',
                type: 'DATE',
                constraints: ['NOT NULL'],
                description: 'Planned audit date',
                example: '2024-02-01'
            },
            {
                name: 'actual_date',
                type: 'DATE',
                constraints: [],
                description: 'Actual audit date',
                example: '2024-02-01'
            },
            {
                name: 'status',
                type: 'ENUM',
                constraints: ['CHECK (status IN (\'planned\', \'in_progress\', \'completed\', \'cancelled\'))', 'DEFAULT \'planned\''],
                description: 'Current status of the audit',
                example: 'completed'
            },
            {
                name: 'findings_count',
                type: 'INTEGER',
                constraints: ['DEFAULT 0'],
                description: 'Number of findings identified',
                example: '3'
            },
            {
                name: 'created_at',
                type: 'TIMESTAMP',
                constraints: ['DEFAULT CURRENT_TIMESTAMP'],
                description: 'When the audit was scheduled',
                example: '2024-01-15 10:00:00'
            }
        ],
        relations: [
            'audits.auditor → users.id',
            'audit_findings.audit_id → audits.id'
        ]
    },
    {
        name: 'ppe_requests',
        description: 'Personal Protective Equipment requests and approvals',
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: 'Unique identifier for each PPE request',
                example: 'g6ffbc99-9c0b-4ef8-bb6d-6bb9bd380a77'
            },
            {
                name: 'request_number',
                type: 'VARCHAR(50)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: 'Human-readable request number',
                example: 'PPE-REQ-2024-001'
            },
            {
                name: 'item_name',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: 'Name of PPE item requested',
                example: 'Safety Helmets - Hard Hat Type II'
            },
            {
                name: 'item_category',
                type: 'ENUM',
                constraints: ['CHECK (item_category IN (\'head_protection\', \'eye_protection\', \'respiratory\', \'hand_protection\', \'foot_protection\', \'body_protection\', \'fall_protection\'))', 'NOT NULL'],
                description: 'Category of PPE item',
                example: 'head_protection'
            },
            {
                name: 'quantity',
                type: 'INTEGER',
                constraints: ['CHECK (quantity > 0)', 'NOT NULL'],
                description: 'Number of items requested',
                example: '25'
            },
            {
                name: 'unit_cost',
                type: 'DECIMAL(10,2)',
                constraints: ['CHECK (unit_cost >= 0)'],
                description: 'Cost per unit in local currency',
                example: '29.99'
            },
            {
                name: 'total_cost',
                type: 'DECIMAL(10,2)',
                constraints: ['GENERATED ALWAYS AS (quantity * unit_cost) STORED'],
                description: 'Total cost (quantity × unit_cost)',
                example: '749.75'
            },
            {
                name: 'justification',
                type: 'TEXT',
                constraints: ['NOT NULL'],
                description: 'Business justification for the request',
                example: 'Replacement of damaged helmets and new hires in construction team'
            },
            {
                name: 'requested_by',
                type: 'UUID',
                constraints: ['FOREIGN KEY', 'NOT NULL'],
                description: 'User who made the request',
                example: 'd3ffbc99-9c0b-4ef8-bb6d-6bb9bd380a44'
            },
            {
                name: 'department',
                type: 'VARCHAR(100)',
                constraints: ['NOT NULL'],
                description: 'Department making the request',
                example: 'Construction'
            },
            {
                name: 'status',
                type: 'ENUM',
                constraints: ['CHECK (status IN (\'pending\', \'approved\', \'rejected\', \'ordered\', \'delivered\'))', 'DEFAULT \'pending\''],
                description: 'Current status of the request',
                example: 'approved'
            },
            {
                name: 'approved_by',
                type: 'UUID',
                constraints: ['FOREIGN KEY'],
                description: 'User who approved the request',
                example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
            },
            {
                name: 'approved_date',
                type: 'TIMESTAMP',
                constraints: [],
                description: 'When the request was approved',
                example: '2024-01-22 14:30:00'
            },
            {
                name: 'created_at',
                type: 'TIMESTAMP',
                constraints: ['DEFAULT CURRENT_TIMESTAMP'],
                description: 'When the request was created',
                example: '2024-01-20 09:15:00'
            }
        ],
        relations: [
            'ppe_requests.requested_by → users.id',
            'ppe_requests.approved_by → users.id'
        ]
    }
];

const TechnicalDocumentation = () => {
    const [activeTab, setActiveTab] = useState<'architecture' | 'database' | 'dictionary' | 'api'>('architecture');
    const [selectedTable, setSelectedTable] = useState<string>('users');

    const tabs = [
        { id: 'architecture', label: 'System Architecture', icon: IconDeviceDesktop },
        { id: 'database', label: 'Database Documentation', icon: IconDatabase },
        { id: 'dictionary', label: 'Data Dictionary', icon: IconBook }
    ];

    const getConstraintIcon = (constraint: string) => {
        if (constraint.includes('PRIMARY KEY')) return <IconKey className="w-4 h-4 text-yellow-600" title="Primary Key" />;
        if (constraint.includes('FOREIGN KEY')) return <IconLink className="w-4 h-4 text-blue-600" title="Foreign Key" />;
        if (constraint.includes('UNIQUE')) return <IconHash className="w-4 h-4 text-purple-600" title="Unique" />;
        if (constraint.includes('NOT NULL')) return <IconShield className="w-4 h-4 text-red-600" title="Not Null" />;
        if (constraint.includes('DEFAULT')) return <IconSettings className="w-4 h-4 text-green-600" title="Default Value" />;
        if (constraint.includes('CHECK')) return <IconCircleCheck className="w-4 h-4 text-orange-600" title="Check Constraint" />;
        return null;
    };

    const renderSystemArchitecture = () => (
        <div className="space-y-8">
            {/* Architecture Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconDeviceDesktop className="w-8 h-8 text-blue-600 mr-4" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Microservices Architecture Overview</h2>
                        <p className="text-gray-600 italic">Health & Safety Management Platform</p>
                    </div>
                </div>

                {/* Architecture Diagram */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Frontend Layer */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-200">
                            <div className="flex items-center mb-4">
                                <IconGlobe className="w-6 h-6 text-blue-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Frontend Layer</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center p-2 bg-blue-50 rounded">
                                    <IconDeviceDesktop className="w-4 h-4 text-blue-600 mr-2" />
                                    <span className="text-sm">React SPA</span>
                                </div>
                                <div className="flex items-center p-2 bg-blue-50 rounded">
                                    <IconGlobe className="w-4 h-4 text-blue-600 mr-2" />
                                    <span className="text-sm">Mobile App</span>
                                </div>
                                <div className="flex items-center p-2 bg-blue-50 rounded">
                                    <IconBolt className="w-4 h-4 text-blue-600 mr-2" />
                                    <span className="text-sm">PWA</span>
                                </div>
                            </div>
                        </div>

                        {/* API Gateway */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
                            <div className="flex items-center mb-4">
                                <IconServer className="w-6 h-6 text-green-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">API Gateway</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center p-2 bg-green-50 rounded">
                                    <IconLock className="w-4 h-4 text-green-600 mr-2" />
                                    <span className="text-sm">Authentication</span>
                                </div>
                                <div className="flex items-center p-2 bg-green-50 rounded">
                                    <IconShield className="w-4 h-4 text-green-600 mr-2" />
                                    <span className="text-sm">Rate Limiting</span>
                                </div>
                                <div className="flex items-center p-2 bg-green-50 rounded">
                                    <IconChartBar className="w-4 h-4 text-green-600 mr-2" />
                                    <span className="text-sm">Load Balancing</span>
                                </div>
                            </div>
                        </div>

                        {/* Data Layer */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-purple-200">
                            <div className="flex items-center mb-4">
                                <IconDatabase className="w-6 h-6 text-purple-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Data Layer</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center p-2 bg-purple-50 rounded">
                                    <IconDatabase className="w-4 h-4 text-purple-600 mr-2" />
                                    <span className="text-sm">PostgreSQL</span>
                                </div>
                                <div className="flex items-center p-2 bg-purple-50 rounded">
                                    <IconBolt className="w-4 h-4 text-purple-600 mr-2" />
                                    <span className="text-sm">Redis Cache</span>
                                </div>
                                <div className="flex items-center p-2 bg-purple-50 rounded">
                                    <IconFileText className="w-4 h-4 text-purple-600 mr-2" />
                                    <span className="text-sm">Elasticsearch</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Microservices Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { name: 'User Management', icon: IconUsers, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { name: 'Incident Service', icon: IconAlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                        { name: 'Risk Service', icon: IconShield, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { name: 'Action Service', icon: IconTarget, color: 'text-green-600', bg: 'bg-green-50' },
                        { name: 'Audit Service', icon: IconClipboardCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { name: 'PPE Service', icon: IconHelmet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { name: 'Document Service', icon: IconFileText, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                        { name: 'Notification Service', icon: IconMessage, color: 'text-pink-600', bg: 'bg-pink-50' }
                    ].map((service, index) => (
                        <div key={index} className={`${service.bg} rounded-lg p-4 border border-gray-200`}>
                            <div className="flex items-center mb-2">
                                <service.icon className={`w-5 h-5 ${service.color} mr-2`} />
                                <h4 className="font-medium text-gray-900 text-sm">{service.name}</h4>
                            </div>
                            <p className="text-xs text-gray-600">Independent deployment & scaling</p>
                        </div>
                    ))}
                </div>

                {/* Benefits */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Microservices Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                            <IconCircleCheck className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-gray-900">Independent Deployment</h4>
                                <p className="text-sm text-gray-600">Each service can be deployed independently</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <IconCircleCheck className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-gray-900">Technology Diversity</h4>
                                <p className="text-sm text-gray-600">Different technologies per service</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <IconCircleCheck className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-gray-900">Fault Isolation</h4>
                                <p className="text-sm text-gray-600">Failures don't cascade across services</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <IconCircleCheck className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-gray-900">Team Autonomy</h4>
                                <p className="text-sm text-gray-600">Teams can work independently</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDatabaseDocumentation = () => (
        <div className="space-y-8">
            {/* Database Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconDatabase className="w-8 h-8 text-blue-600 mr-4" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Database Schema Documentation</h2>
                        <p className="text-gray-600 italic">Entity Relationship Diagram and Database Structure</p>
                    </div>
                </div>

                {/* ERD Diagram */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Entity Relationship Diagram</h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* User Management Group */}
                        <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                            <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                                <IconUsers className="w-5 h-5 mr-2" />
                                User Management
                            </h4>

                            <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    users
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID) 🔑</div>
                                    <div>• email (VARCHAR)</div>
                                    <div>• first_name, last_name</div>
                                    <div>• role_id (UUID) 🔗</div>
                                    <div>• department, position</div>
                                    <div>• is_active, created_at</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-blue-200">
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    roles
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID) 🔑</div>
                                    <div>• name (VARCHAR)</div>
                                    <div>• permissions (JSON)</div>
                                </div>
                            </div>
                        </div>

                        {/* Incidents & Risks Group */}
                        <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
                            <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                                <IconAlertTriangle className="w-5 h-5 mr-2" />
                                Incidents & Risks
                            </h4>

                            <div className="bg-white rounded-lg p-4 mb-4 border border-red-200">
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    incidents
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID) 🔑</div>
                                    <div>• incident_number</div>
                                    <div>• title, description</div>
                                    <div>• severity, status</div>
                                    <div>• created_by (UUID) 🔗</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-red-200">
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    chemical_risks
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID) 🔑</div>
                                    <div>• risk_id, risk_title</div>
                                    <div>• chemical_name, cas_number</div>
                                    <div>• likelihood, severity</div>
                                    <div>• risk_rating (calculated)</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions & Audits Group */}
                        <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                            <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                                <IconTarget className="w-5 h-5 mr-2" />
                                Actions & Audits
                            </h4>

                            <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    actions
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID) 🔑</div>
                                    <div>• action_number</div>
                                    <div>• title, description</div>
                                    <div>• priority, status</div>
                                    <div>• assigned_to (UUID) 🔗</div>
                                    <div>• due_date, progress</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    audits
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID) 🔑</div>
                                    <div>• audit_number</div>
                                    <div>• title, audit_type</div>
                                    <div>• auditor (UUID) 🔗</div>
                                    <div>• planned_date, status</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    ppe_requests
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID) 🔑</div>
                                    <div>• request_number</div>
                                    <div>• item_name, quantity</div>
                                    <div>• requested_by (UUID) 🔗</div>
                                    <div>• status, total_cost</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Relationships */}
                    <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Relationships</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center">
                                <IconLink className="w-4 h-4 text-blue-600 mr-2" />
                                <span>users.id ← incidents.created_by</span>
                            </div>
                            <div className="flex items-center">
                                <IconLink className="w-4 h-4 text-blue-600 mr-2" />
                                <span>users.id ← actions.assigned_to</span>
                            </div>
                            <div className="flex items-center">
                                <IconLink className="w-4 h-4 text-blue-600 mr-2" />
                                <span>users.id ← chemical_risks.assigned_to</span>
                            </div>
                            <div className="flex items-center">
                                <IconLink className="w-4 h-4 text-blue-600 mr-2" />
                                <span>users.id ← audits.auditor</span>
                            </div>
                            <div className="flex items-center">
                                <IconLink className="w-4 h-4 text-blue-600 mr-2" />
                                <span>users.id ← ppe_requests.requested_by</span>
                            </div>
                            <div className="flex items-center">
                                <IconLink className="w-4 h-4 text-blue-600 mr-2" />
                                <span>users.role_id → roles.id</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDataDictionary = () => {
        const selectedTableData = databaseTables.find(table => table.name === selectedTable);

        return (
            <div className="space-y-8">
                {/* Table Selection */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <IconBook className="w-8 h-8 text-blue-600 mr-4" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Data Dictionary</h2>
                                <p className="text-gray-600 italic">Detailed field documentation for database tables</p>
                            </div>
                        </div>

                        <div className="relative">
                            <select
                                value={selectedTable}
                                onChange={(e) => setSelectedTable(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
                            >
                                {databaseTables.map(table => (
                                    <option key={table.name} value={table.name}>
                                        {table.name}
                                    </option>
                                ))}
                            </select>
                            <IconChevronDown className="w-5 h-5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
                        </div>
                    </div>

                    {/* Constraints Legend */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Constraint Legend</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                            <div className="flex items-center">
                                <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                <span>Primary Key</span>
                            </div>
                            <div className="flex items-center">
                                <IconLink className="w-4 h-4 text-blue-600 mr-2" />
                                <span>Foreign Key</span>
                            </div>
                            <div className="flex items-center">
                                <IconHash className="w-4 h-4 text-purple-600 mr-2" />
                                <span>Unique</span>
                            </div>
                            <div className="flex items-center">
                                <IconShield className="w-4 h-4 text-red-600 mr-2" />
                                <span>Not Null</span>
                            </div>
                            <div className="flex items-center">
                                <IconSettings className="w-4 h-4 text-green-600 mr-2" />
                                <span>Default Value</span>
                            </div>
                            <div className="flex items-center">
                                <IconCircleCheck className="w-4 h-4 text-orange-600 mr-2" />
                                <span>Check Constraint</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected Table Details */}
                {selectedTableData && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                <IconDatabase className="w-6 h-6 text-blue-600 mr-3" />
                                {selectedTableData.name}
                            </h3>
                            <p className="text-gray-600 mt-1">{selectedTableData.description}</p>
                        </div>

                        {/* Fields Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Constraints</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Example</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedTableData.fields.map((field, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">{field.name}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">
                                                    {field.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {field.constraints.map((constraint, idx) => (
                                                        <div key={idx} className="flex items-center bg-gray-100 px-2 py-1 rounded text-xs">
                                                            {getConstraintIcon(constraint)}
                                                            <span className="ml-1">{constraint}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">{field.description}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                                                    {field.example}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Relations */}
                        {selectedTableData.relations.length > 0 && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Table Relations</h4>
                                <div className="space-y-1">
                                    {selectedTableData.relations.map((relation, index) => (
                                        <div key={index} className="flex items-center text-sm text-gray-600">
                                            <IconLink className="w-4 h-4 text-blue-600 mr-2" />
                                            <span className="font-mono">{relation}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };


    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Fixed Header */}
            <div className=" rounded-xl px-8 pt-8 pb-5 ">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r text-white from-purple-500 to-blue-500 rounded-lg p-2">
                        <IconDeviceDesktop size={40} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold ">Technical Documentation</h2>
                        <p className="text-gray-600 italic ">
                            Microservices-based Health & Safety Management Platform.
                        </p>
                    </div>

                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="max-w-7xl mx-auto px-8 ">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-5 w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <tab.icon className="w-5 h-5 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="max-w-none">
                    {activeTab === 'architecture' && renderSystemArchitecture()}
                    {activeTab === 'database' && renderDatabaseDocumentation()}
                    {activeTab === 'dictionary' && renderDataDictionary()}
                </div>
            </div>
        </div>
    );
};

export default TechnicalDocumentation;

