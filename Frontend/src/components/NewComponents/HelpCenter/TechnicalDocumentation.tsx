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
import PageHeader from '../../UtilityComp/PageHeader';


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
        description: "Comptes utilisateurs et informations d'authentification",
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: "Identifiant unique de chaque utilisateur",
                example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
            },
            {
                name: 'first_name',
                type: 'VARCHAR(100)',
                constraints: ['NOT NULL'],
                description: "Prénom de l'utilisateur",
                example: 'Jean'
            },
            {
                name: 'last_name',
                type: 'VARCHAR(100)',
                constraints: ['NOT NULL'],
                description: "Nom de famille de l'utilisateur",
                example: 'Dupont'
            },
            {
                name: 'email',
                type: 'VARCHAR(255)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: "Adresse email pour la connexion",
                example: 'jean.dupont@entreprise.com'
            },
            {
                name: 'role_id',
                type: 'UUID',
                constraints: ['FOREIGN KEY'],
                description: "Référence vers le rôle utilisateur",
                example: 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22'
            },
            {
                name: 'department',
                type: 'VARCHAR(100)',
                constraints: [],
                description: "Département de l'utilisateur",
                example: 'Santé & Sécurité'
            },
            {
                name: 'position',
                type: 'VARCHAR(100)',
                constraints: [],
                description: "Poste de l'utilisateur",
                example: 'Coordinateur Sécurité'
            },
            {
                name: 'is_active',
                type: 'BOOLEAN',
                constraints: ['DEFAULT true'],
                description: "Statut du compte utilisateur (actif/inactif)",
                example: 'true'
            },
            {
                name: 'created_at',
                type: 'TIMESTAMP',
                constraints: ['DEFAULT CURRENT_TIMESTAMP'],
                description: "Date de création du compte",
                example: '2026-01-15 08:00:00'
            },
            {
                name: 'last_login',
                type: 'TIMESTAMP',
                constraints: [],
                description: "Date de dernière connexion",
                example: '2026-01-20 14:30:00'
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
        description: "Incidents de sécurité et rapports d'accidents",
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: "Identifiant unique de chaque incident",
                example: 'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33'
            },
            {
                name: 'incident_number',
                type: 'VARCHAR(50)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: "Numéro d'incident lisible (humain)",
                example: 'INC-2026-001'
            },
            {
                name: 'title',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: "Titre court de l'incident",
                example: "Glissade et chute dans l'entrepôt"
            },
            {
                name: 'description',
                type: 'TEXT',
                constraints: ['NOT NULL'],
                description: "Description détaillée des faits",
                example: "Employé a glissé sur un sol mouillé près du quai de chargement"
            },
            {
                name: 'incident_date',
                type: 'TIMESTAMP',
                constraints: ['NOT NULL'],
                description: "Date et heure de survenue de l'incident",
                example: '2026-01-15 10:30:00'
            },
            {
                name: 'location',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: "Lieu où l'incident s'est produit",
                example: "Entrepôt A - Quai de chargement 3"
            },
            {
                name: 'severity',
                type: 'ENUM',
                constraints: ['CHECK (severity IN (\'minor\', \'moderate\', \'major\', \'critical\'))'],
                description: "Niveau de gravité de l'incident",
                example: 'moderate'
            },
            {
                name: 'status',
                type: 'ENUM',
                constraints: ['CHECK (status IN (\'open\', \'investigating\', \'closed\'))', 'DEFAULT \'open\''],
                description: "Statut actuel de l'investigation",
                example: 'investigating'
            },
            {
                name: 'created_by',
                type: 'UUID',
                constraints: ['FOREIGN KEY', 'NOT NULL'],
                description: "Utilisateur ayant déclaré l'incident",
                example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
            },
            {
                name: 'assigned_to',
                type: 'UUID',
                constraints: ['FOREIGN KEY'],
                description: "Utilisateur assigné à l'investigation",
                example: 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22'
            },
            {
                name: 'created_at',
                type: 'TIMESTAMP',
                constraints: ['DEFAULT CURRENT_TIMESTAMP'],
                description: "Date de déclaration de l'incident",
                example: '2026-01-15 11:00:00'
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
        description: "Identification et évaluation des risques chimiques",
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: "Identifiant unique du risque chimique",
                example: 'd3ffbc99-9c0b-4ef8-bb6d-6bb9bd380a44'
            },
            {
                name: 'risk_id',
                type: 'VARCHAR(50)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: "Identifiant lisible du risque",
                example: 'CHR-2026-001'
            },
            {
                name: 'risk_title',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: "Titre descriptif court du risque",
                example: "Brûlures à l'acide lors de la manipulation d'acide sulfurique"
            },
            {
                name: 'chemical_name',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: "Nom officiel du produit chimique",
                example: 'Acide sulfurique 98%'
            },
            {
                name: 'cas_number',
                type: 'VARCHAR(20)',
                constraints: [],
                description: "Numéro CAS (Chemical Abstracts Service)",
                example: '7664-93-9'
            },
            {
                name: 'classification',
                type: 'ENUM',
                constraints: ['CHECK (classification IN (\'flammable\', \'toxic\', \'corrosive\', \'oxidizing\', \'explosive\', \'irritant\', \'carcinogenic\'))'],
                description: "Classification SGH du danger",
                example: 'corrosive'
            },
            {
                name: 'department',
                type: 'VARCHAR(100)',
                constraints: ['NOT NULL'],
                description: "Département où le produit est utilisé",
                example: 'Laboratoire'
            },
            {
                name: 'likelihood',
                type: 'INTEGER',
                constraints: ['CHECK (likelihood >= 1 AND likelihood <= 5)'],
                description: "Probabilité d'occurrence (échelle 1-5)",
                example: '3'
            },
            {
                name: 'severity',
                type: 'INTEGER',
                constraints: ['CHECK (severity >= 1 AND severity <= 5)'],
                description: "Gravité de l'impact (échelle 1-5)",
                example: '4'
            },
            {
                name: 'risk_rating',
                type: 'INTEGER',
                constraints: ['GENERATED ALWAYS AS (likelihood * severity) STORED'],
                description: "Score de risque calculé (probabilité × gravité)",
                example: '12'
            },
            {
                name: 'status',
                type: 'ENUM',
                constraints: ['CHECK (status IN (\'open\', \'in_progress\', \'closed\'))', 'DEFAULT \'open\''],
                description: "Statut actuel de la gestion du risque",
                example: 'in_progress'
            },
            {
                name: 'assigned_to',
                type: 'UUID',
                constraints: ['FOREIGN KEY'],
                description: "Utilisateur responsable de la gestion du risque",
                example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
            },
            {
                name: 'date_identified',
                type: 'DATE',
                constraints: ['NOT NULL'],
                description: "Date d'identification du risque",
                example: '2026-01-15'
            },
            {
                name: 'next_review',
                type: 'DATE',
                constraints: [],
                description: "Date prévue pour la prochaine revue",
                example: '2026-04-15'
            }
        ],
        relations: [
            'chemical_risks.assigned_to → users.id',
            'risk_assessments.risk_id → chemical_risks.id'
        ]
    },
    {
        name: 'actions',
        description: "Actions et mesures correctives",
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: "Identifiant unique de chaque action",
                example: 'e4ffbc99-9c0b-4ef8-bb6d-6bb9bd380a55'
            },
            {
                name: 'action_number',
                type: 'VARCHAR(50)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: "Numéro d'action lisible (humain)",
                example: 'ACT-2026-001'
            },
            {
                name: 'title',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: "Titre court de l'action",
                example: "Installer un revêtement antidérapant"
            },
            {
                name: 'description',
                type: 'TEXT',
                constraints: ['NOT NULL'],
                description: "Description détaillée de l'action requise",
                example: "Installer un revêtement antidérapant dans les zones de chargement"
            },
            {
                name: 'priority',
                type: 'ENUM',
                constraints: ['CHECK (priority IN (\'low\', \'medium\', \'high\', \'critical\'))', 'DEFAULT \'medium\''],
                description: "Niveau de priorité de l'action",
                example: 'high'
            },
            {
                name: 'status',
                type: 'ENUM',
                constraints: ['CHECK (status IN (\'not_started\', \'in_progress\', \'completed\', \'cancelled\'))', 'DEFAULT \'not_started\''],
                description: "Statut actuel de mise en œuvre",
                example: 'in_progress'
            },
            {
                name: 'assigned_to',
                type: 'UUID',
                constraints: ['FOREIGN KEY', 'NOT NULL'],
                description: "Utilisateur responsable de la réalisation",
                example: 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22'
            },
            {
                name: 'due_date',
                type: 'DATE',
                constraints: ['NOT NULL'],
                description: "Date cible de fin",
                example: '2026-02-15'
            },
            {
                name: 'completed_date',
                type: 'DATE',
                constraints: [],
                description: "Date réelle de fin",
                example: '2026-02-10'
            },
            {
                name: 'progress',
                type: 'INTEGER',
                constraints: ['CHECK (progress >= 0 AND progress <= 100)', 'DEFAULT 0'],
                description: "Pourcentage d'avancement (0-100)",
                example: '75'
            },
            {
                name: 'created_at',
                type: 'TIMESTAMP',
                constraints: ['DEFAULT CURRENT_TIMESTAMP'],
                description: "Date de création de l'action",
                example: '2026-01-20 09:00:00'
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
        description: "Audits internes et externes",
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: "Identifiant unique de chaque audit",
                example: 'f5ffbc99-9c0b-4ef8-bb6d-6bb9bd380a66'
            },
            {
                name: 'audit_number',
                type: 'VARCHAR(50)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: "Numéro d'audit lisible (humain)",
                example: 'AUD-2026-001'
            },
            {
                name: 'title',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: "Titre de l'audit",
                example: 'Audit interne ISO 45001 - Production'
            },
            {
                name: 'audit_type',
                type: 'ENUM',
                constraints: ['CHECK (audit_type IN (\'internal\', \'external\', \'certification\', \'surveillance\'))', 'NOT NULL'],
                description: "Type d'audit réalisé",
                example: 'internal'
            },
            {
                name: 'scope',
                type: 'TEXT',
                constraints: ['NOT NULL'],
                description: "Périmètre et domaines couverts",
                example: 'Processus de production, procédures de sécurité, conformité EPI'
            },
            {
                name: 'auditor',
                type: 'UUID',
                constraints: ['FOREIGN KEY', 'NOT NULL'],
                description: "Auditeur principal en charge",
                example: 'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33'
            },
            {
                name: 'auditee_department',
                type: 'VARCHAR(100)',
                constraints: ['NOT NULL'],
                description: "Département audité",
                example: 'Production'
            },
            {
                name: 'planned_date',
                type: 'DATE',
                constraints: ['NOT NULL'],
                description: "Date d'audit planifiée",
                example: '2026-02-01'
            },
            {
                name: 'actual_date',
                type: 'DATE',
                constraints: [],
                description: "Date d'audit réelle",
                example: '2026-02-01'
            },
            {
                name: 'status',
                type: 'ENUM',
                constraints: ['CHECK (status IN (\'planned\', \'in_progress\', \'completed\', \'cancelled\'))', 'DEFAULT \'planned\''],
                description: "Statut actuel de l'audit",
                example: 'completed'
            },
            {
                name: 'findings_count',
                type: 'INTEGER',
                constraints: ['DEFAULT 0'],
                description: "Nombre de constats identifiés",
                example: '3'
            },
            {
                name: 'created_at',
                type: 'TIMESTAMP',
                constraints: ['DEFAULT CURRENT_TIMESTAMP'],
                description: "Date de programmation de l'audit",
                example: '2026-01-15 10:00:00'
            }
        ],
        relations: [
            'audits.auditor → users.id',
            'audit_findings.audit_id → audits.id'
        ]
    },
    {
        name: 'ppe_requests',
        description: "Demandes et approbations d'équipements de protection individuelle (EPI)",
        fields: [
            {
                name: 'id',
                type: 'UUID',
                constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
                description: "Identifiant unique de chaque demande EPI",
                example: 'g6ffbc99-9c0b-4ef8-bb6d-6bb9bd380a77'
            },
            {
                name: 'request_number',
                type: 'VARCHAR(50)',
                constraints: ['UNIQUE', 'NOT NULL'],
                description: "Numéro de demande lisible (humain)",
                example: 'PPE-REQ-2026-001'
            },
            {
                name: 'item_name',
                type: 'VARCHAR(255)',
                constraints: ['NOT NULL'],
                description: "Nom de l'EPI demandé",
                example: 'Casques de sécurité - Type II'
            },
            {
                name: 'item_category',
                type: 'ENUM',
                constraints: ['CHECK (item_category IN (\'head_protection\', \'eye_protection\', \'respiratory\', \'hand_protection\', \'foot_protection\', \'body_protection\', \'fall_protection\'))', 'NOT NULL'],
                description: "Catégorie d'EPI",
                example: 'head_protection'
            },
            {
                name: 'quantity',
                type: 'INTEGER',
                constraints: ['CHECK (quantity > 0)', 'NOT NULL'],
                description: "Quantité d'articles demandés",
                example: '25'
            },
            {
                name: 'unit_cost',
                type: 'DECIMAL(10,2)',
                constraints: ['CHECK (unit_cost >= 0)'],
                description: "Coût unitaire en devise locale",
                example: '29.99'
            },
            {
                name: 'total_cost',
                type: 'DECIMAL(10,2)',
                constraints: ['GENERATED ALWAYS AS (quantity * unit_cost) STORED'],
                description: "Coût total (quantité × coût unitaire)",
                example: '749.75'
            },
            {
                name: 'justification',
                type: 'TEXT',
                constraints: ['NOT NULL'],
                description: "Justification métier de la demande",
                example: "Remplacement de casques endommagés et nouvelles embauches sur le chantier"
            },
            {
                name: 'requested_by',
                type: 'UUID',
                constraints: ['FOREIGN KEY', 'NOT NULL'],
                description: "Utilisateur ayant fait la demande",
                example: 'd3ffbc99-9c0b-4ef8-bb6d-6bb9bd380a44'
            },
            {
                name: 'department',
                type: 'VARCHAR(100)',
                constraints: ['NOT NULL'],
                description: "Département à l'origine de la demande",
                example: 'Construction'
            },
            {
                name: 'status',
                type: 'ENUM',
                constraints: ['CHECK (status IN (\'pending\', \'approved\', \'rejected\', \'ordered\', \'delivered\'))', 'DEFAULT \'pending\''],
                description: "Statut actuel de la demande",
                example: 'approved'
            },
            {
                name: 'approved_by',
                type: 'UUID',
                constraints: ['FOREIGN KEY'],
                description: "Utilisateur ayant approuvé la demande",
                example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
            },
            {
                name: 'approved_date',
                type: 'TIMESTAMP',
                constraints: [],
                description: "Date d'approbation",
                example: '2026-01-22 14:30:00'
            },
            {
                name: 'created_at',
                type: 'TIMESTAMP',
                constraints: ['DEFAULT CURRENT_TIMESTAMP'],
                description: "Date de création de la demande",
                example: '2026-01-20 09:15:00'
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
        { id: 'architecture', label: 'Architecture système', icon: IconDeviceDesktop },
        { id: 'database', label: 'Documentation base de données', icon: IconDatabase },
        { id: 'dictionary', label: 'Dictionnaire de données', icon: IconBook }
    ];

    const getConstraintIcon = (constraint: string) => {
        if (constraint.includes('PRIMARY KEY')) return <IconKey className="w-4 h-4 text-yellow-600" />;
        if (constraint.includes('FOREIGN KEY')) return <IconLink className="w-4 h-4 text-blue-600" />;
        if (constraint.includes('UNIQUE')) return <IconHash className="w-4 h-4 text-purple-600" />;
        if (constraint.includes('NOT NULL')) return <IconShield className="w-4 h-4 text-red-600" />;
        if (constraint.includes('DEFAULT')) return <IconSettings className="w-4 h-4 text-green-600" />;
        if (constraint.includes('CHECK')) return <IconCircleCheck className="w-4 h-4 text-orange-600" />;
        return null;
    };

    const renderSystemArchitecture = () => (
        <div className="space-y-8">
            {/* Aperçu de l'architecture */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconDeviceDesktop className="w-8 h-8 text-violet-600 mr-4" />
                    <div>
                        <h2 className="text-base text-gray-900">Vue d'ensemble de l'architecture microservices</h2>
                        <p className="text-sm text-gray-600">Plateforme de management Santé & Sécurité</p>
                    </div>
                </div>

                {/* Schéma d'architecture */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-8 mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Couche Frontend */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-cyan-200">
                            <div className="flex items-center mb-4">
                                <IconGlobe className="w-6 h-6 text-cyan-600 mr-3" />
                                <h3 className="text-base text-gray-900">Couche Frontend</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center p-2 bg-cyan-50 rounded">
                                    <IconDeviceDesktop className="w-4 h-4 text-cyan-600 mr-2" />
                                    <span className="text-sm">React SPA</span>
                                </div>
                                <div className="flex items-center p-2 bg-cyan-50 rounded">
                                    <IconGlobe className="w-4 h-4 text-cyan-600 mr-2" />
                                    <span className="text-sm">Application mobile</span>
                                </div>
                                <div className="flex items-center p-2 bg-cyan-50 rounded">
                                    <IconBolt className="w-4 h-4 text-cyan-600 mr-2" />
                                    <span className="text-sm">PWA</span>
                                </div>
                            </div>
                        </div>

                        {/* Passerelle API */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
                            <div className="flex items-center mb-4">
                                <IconServer className="w-6 h-6 text-green-600 mr-3" />
                                <h3 className="text-base text-gray-900">Passerelle API</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center p-2 bg-green-50 rounded">
                                    <IconLock className="w-4 h-4 text-green-600 mr-2" />
                                    <span className="text-sm">Authentification</span>
                                </div>
                                <div className="flex items-center p-2 bg-green-50 rounded">
                                    <IconShield className="w-4 h-4 text-green-600 mr-2" />
                                    <span className="text-sm">Limitation de débit</span>
                                </div>
                                <div className="flex items-center p-2 bg-green-50 rounded">
                                    <IconChartBar className="w-4 h-4 text-green-600 mr-2" />
                                    <span className="text-sm">Équilibrage de charge</span>
                                </div>
                            </div>
                        </div>

                        {/* Couche données */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-purple-200">
                            <div className="flex items-center mb-4">
                                <IconDatabase className="w-6 h-6 text-purple-600 mr-3" />
                                <h3 className="text-base text-gray-900">Couche données</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center p-2 bg-purple-50 rounded">
                                    <IconDatabase className="w-4 h-4 text-purple-600 mr-2" />
                                    <span className="text-sm">PostgreSQL</span>
                                </div>
                                <div className="flex items-center p-2 bg-purple-50 rounded">
                                    <IconBolt className="w-4 h-4 text-purple-600 mr-2" />
                                    <span className="text-sm">Cache Redis</span>
                                </div>
                                <div className="flex items-center p-2 bg-purple-50 rounded">
                                    <IconFileText className="w-4 h-4 text-purple-600 mr-2" />
                                    <span className="text-sm">Elasticsearch</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grille des microservices */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { name: 'Gestion utilisateurs', icon: IconUsers, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                        { name: 'Service Incidents', icon: IconAlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                        { name: 'Service Risques', icon: IconShield, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { name: 'Service Actions', icon: IconTarget, color: 'text-green-600', bg: 'bg-green-50' },
                        { name: 'Service Audits', icon: IconClipboardCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { name: 'Service EPI', icon: IconHelmet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { name: 'Service Documents', icon: IconFileText, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                        { name: 'Service Notifications', icon: IconMessage, color: 'text-pink-600', bg: 'bg-pink-50' }
                    ].map((service, index) => (
                        <div key={index} className={`${service.bg} rounded-lg p-4 border border-gray-200`}>
                            <div className="flex items-center mb-2">
                                <service.icon className={`w-5 h-5 ${service.color} mr-2`} />
                                <h4 className="text-gray-900 text-sm">{service.name}</h4>
                            </div>
                            <p className="text-xs text-gray-600">Déploiement et mise à l'échelle indépendants</p>
                        </div>
                    ))}
                </div>

                {/* Bénéfices */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-base text-gray-900 mb-4">Avantages des microservices</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                            <IconCircleCheck className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="text-gray-900 text-sm">Déploiement indépendant</h4>
                                <p className="text-sm text-gray-600">Chaque service peut être déployé séparément</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <IconCircleCheck className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="text-gray-900 text-sm">Diversité technologique</h4>
                                <p className="text-sm text-gray-600">Technologies différentes par service</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <IconCircleCheck className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="text-gray-900 text-sm">Isolation des pannes</h4>
                                <p className="text-sm text-gray-600">Les pannes ne se propagent pas entre services</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <IconCircleCheck className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="text-gray-900 text-sm">Autonomie des équipes</h4>
                                <p className="text-sm text-gray-600">Les équipes peuvent travailler de manière indépendante</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDatabaseDocumentation = () => (
        <div className="space-y-8">
            {/* Vue d'ensemble base de données */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <IconDatabase className="w-8 h-8 text-violet-600 mr-4" />
                    <div>
                        <h2 className="text-base text-gray-900">Documentation du schéma de base de données</h2>
                        <p className="text-sm text-gray-600">Diagramme entité-relation et structure de la base</p>
                    </div>
                </div>

                {/* Diagramme ERD */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-8">
                    <h3 className="text-base text-gray-900 mb-6 text-center">Diagramme entité-relation</h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Groupe Gestion utilisateurs */}
                        <div className="bg-cyan-50 rounded-lg p-6 border-2 border-cyan-200">
                            <h4 className="text-base text-cyan-900 mb-4 flex items-center">
                                <IconUsers className="w-5 h-5 mr-2" />
                                Gestion des utilisateurs
                            </h4>

                            <div className="bg-white rounded-lg p-4 mb-4 border border-cyan-200">
                                <h5 className="text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    users
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID)</div>
                                    <div>• email (VARCHAR)</div>
                                    <div>• first_name, last_name</div>
                                    <div>• role_id (UUID)</div>
                                    <div>• department, position</div>
                                    <div>• is_active, created_at</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-cyan-200">
                                <h5 className="text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    roles
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID)</div>
                                    <div>• name (VARCHAR)</div>
                                    <div>• permissions (JSON)</div>
                                </div>
                            </div>
                        </div>

                        {/* Groupe Incidents & Risques */}
                        <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
                            <h4 className="text-base text-red-900 mb-4 flex items-center">
                                <IconAlertTriangle className="w-5 h-5 mr-2" />
                                Incidents et risques
                            </h4>

                            <div className="bg-white rounded-lg p-4 mb-4 border border-red-200">
                                <h5 className="text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    incidents
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID)</div>
                                    <div>• incident_number</div>
                                    <div>• title, description</div>
                                    <div>• severity, status</div>
                                    <div>• created_by (UUID)</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-red-200">
                                <h5 className="text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    chemical_risks
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID)</div>
                                    <div>• risk_id, risk_title</div>
                                    <div>• chemical_name, cas_number</div>
                                    <div>• likelihood, severity</div>
                                    <div>• risk_rating (calculé)</div>
                                </div>
                            </div>
                        </div>

                        {/* Groupe Actions & Audits */}
                        <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                            <h4 className="text-base text-green-900 mb-4 flex items-center">
                                <IconTarget className="w-5 h-5 mr-2" />
                                Actions et audits
                            </h4>

                            <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                                <h5 className="text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    actions
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID)</div>
                                    <div>• action_number</div>
                                    <div>• title, description</div>
                                    <div>• priority, status</div>
                                    <div>• assigned_to (UUID)</div>
                                    <div>• due_date, progress</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                                <h5 className="text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    audits
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID)</div>
                                    <div>• audit_number</div>
                                    <div>• title, audit_type</div>
                                    <div>• auditor (UUID)</div>
                                    <div>• planned_date, status</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <h5 className="text-gray-900 mb-2 flex items-center">
                                    <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                    ppe_requests
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>• id (UUID)</div>
                                    <div>• request_number</div>
                                    <div>• item_name, quantity</div>
                                    <div>• requested_by (UUID)</div>
                                    <div>• status, total_cost</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Relations */}
                    <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
                        <h4 className="text-base text-gray-900 mb-4">Relations principales</h4>
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
                {/* Sélection de la table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <IconBook className="w-8 h-8 text-violet-600 mr-4" />
                            <div>
                                <h2 className="text-base text-gray-900">Dictionnaire de données</h2>
                                <p className="text-sm text-gray-600">Documentation détaillée des champs des tables</p>
                            </div>
                        </div>

                        <div className="relative">
                            <select
                                value={selectedTable}
                                onChange={(e) => setSelectedTable(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-violet-500 focus:border-transparent min-w-48 text-sm"
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

                    {/* Légende des contraintes */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="text-xs uppercase tracking-wider text-gray-900 mb-3">Légende des contraintes</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                            <div className="flex items-center">
                                <IconKey className="w-4 h-4 text-yellow-600 mr-2" />
                                <span>Clé primaire</span>
                            </div>
                            <div className="flex items-center">
                                <IconLink className="w-4 h-4 text-blue-600 mr-2" />
                                <span>Clé étrangère</span>
                            </div>
                            <div className="flex items-center">
                                <IconHash className="w-4 h-4 text-purple-600 mr-2" />
                                <span>Unique</span>
                            </div>
                            <div className="flex items-center">
                                <IconShield className="w-4 h-4 text-red-600 mr-2" />
                                <span>Non null</span>
                            </div>
                            <div className="flex items-center">
                                <IconSettings className="w-4 h-4 text-green-600 mr-2" />
                                <span>Valeur par défaut</span>
                            </div>
                            <div className="flex items-center">
                                <IconCircleCheck className="w-4 h-4 text-orange-600 mr-2" />
                                <span>Contrainte CHECK</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Détails de la table sélectionnée */}
                {selectedTableData && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-violet-50 border-b border-gray-200">
                            <h3 className="text-base text-gray-900 flex items-center">
                                <IconDatabase className="w-6 h-6 text-violet-600 mr-3" />
                                {selectedTableData.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{selectedTableData.description}</p>
                        </div>

                        {/* Tableau des champs */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Nom du champ</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Type de données</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Contraintes</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Exemple</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedTableData.fields.map((field, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900">{field.name}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-violet-600 font-mono bg-violet-50 px-2 py-1 rounded">
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
                                <h4 className="text-xs uppercase tracking-wider text-gray-900 mb-2">Relations de la table</h4>
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
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: "Centre d'aide" },
                    { label: 'Documentation technique' },
                ]}
                icon={<IconFileText size={22} stroke={2} />}
                iconColor="violet"
                title="Documentation technique"
                subtitle="Architecture, base de données et spécifications API"
            />

            {/* Navigation par onglets */}
            <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center px-5 py-2.5 rounded-md text-sm transition-colors ${activeTab === tab.id
                            ? 'bg-white text-violet-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenu */}
            <div className="max-w-none">
                {activeTab === 'architecture' && renderSystemArchitecture()}
                {activeTab === 'database' && renderDatabaseDocumentation()}
                {activeTab === 'dictionary' && renderDataDictionary()}
            </div>
        </div>
    );
};

export default TechnicalDocumentation;
