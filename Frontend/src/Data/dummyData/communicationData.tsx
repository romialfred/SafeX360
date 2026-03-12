export interface Notification {
    id: string;
    type: 'Incident' | 'IGP' | 'Safety Alert' | 'Equipment' | 'Training' | 'Emergency' | 'Maintenance' | 'Environmental';
    title: string;
    content: string;
    date: string;
    status: 'Sent' | 'Pending' | 'Draft';
    recipients: string[];
    recipientCount: number;
    sender: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    attachments: Array<{
        name: string;
        type: string;
        size: number;
        url: string;
    }>;
    readCount: number;
    deliveryStatus: 'Delivered' | 'Partially Delivered' | 'Failed' | 'Pending';
    createdDate: string;
    sentDate?: string;
    department: string;
    zone?: string;
}

export interface EmployeeCommunication {
    id: string;
    type: 'Blasting Notification' | 'New Procedure' | 'HSE Update' | 'Safety Briefing' | 'Training Announcement' | 'Policy Update' | 'Emergency Drill' | 'Equipment Update';
    title: string;
    content: string;
    date: string;
    recipients: string[];
    recipientCount: number;
    sender: string;
    department: string;
    zone?: string;
    attachments: Array<{
        name: string;
        type: string;
        size: number;
        url: string;
    }>;
    readCount: number;
    acknowledgedCount: number;
    status: 'Active' | 'Archived' | 'Draft';
    expiryDate?: string;
    isUrgent: boolean;
    createdDate: string;
    category: 'Safety' | 'Operations' | 'Training' | 'Administrative' | 'Emergency';
}

export interface CommunicationRecipient {
    id: string;
    name: string;
    email: string;
    department: string;
    position: string;
    zone?: string;
    isActive: boolean;
}

// Sample notifications data
export const notificationsData: Notification[] = [
    {
        id: 'NOT-001',
        type: 'Incident',
        title: 'Incident Report - Slip and Fall in Production Area',
        content: 'An incident occurred in Production Zone A involving a slip and fall. Immediate investigation required. All personnel in the area must review safety protocols.',
        date: '2025-01-28',
        status: 'Sent',
        recipients: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005'],
        recipientCount: 5,
        sender: 'Sarah Johnson',
        priority: 'High',
        attachments: [
            {
                name: 'incident-report-001.pdf',
                type: 'PDF',
                size: 245678,
                url: '/attachments/incident-report-001.pdf'
            }
        ],
        readCount: 4,
        deliveryStatus: 'Delivered',
        createdDate: '2025-01-28',
        sentDate: '2025-01-28',
        department: 'Safety & Security',
        zone: 'Zone A - Production'
    },
    {
        id: 'NOT-002',
        type: 'IGP',
        title: 'IGP Monthly Review - December 2024',
        content: 'Monthly IGP (Individual Growth Plan) review meeting scheduled for all department heads. Please prepare your team assessments and development plans.',
        date: '2025-01-27',
        status: 'Sent',
        recipients: ['EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010'],
        recipientCount: 5,
        sender: 'Lisa Rodriguez',
        priority: 'Medium',
        attachments: [
            {
                name: 'igp-review-template.xlsx',
                type: 'Excel',
                size: 156789,
                url: '/attachments/igp-review-template.xlsx'
            }
        ],
        readCount: 5,
        deliveryStatus: 'Delivered',
        createdDate: '2025-01-26',
        sentDate: '2025-01-27',
        department: 'Human Resources'
    },
    {
        id: 'NOT-003',
        type: 'Safety Alert',
        title: 'New PPE Requirements - Effective February 1st',
        content: 'New personal protective equipment requirements will be effective from February 1st, 2025. All employees must attend mandatory training sessions.',
        date: '2025-01-29',
        status: 'Pending',
        recipients: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006', 'EMP-007', 'EMP-008'],
        recipientCount: 8,
        sender: 'Mike Wilson',
        priority: 'Critical',
        attachments: [
            {
                name: 'new-ppe-requirements.pdf',
                type: 'PDF',
                size: 567890,
                url: '/attachments/new-ppe-requirements.pdf'
            },
            {
                name: 'training-schedule.pdf',
                type: 'PDF',
                size: 123456,
                url: '/attachments/training-schedule.pdf'
            }
        ],
        readCount: 0,
        deliveryStatus: 'Pending',
        createdDate: '2025-01-29',
        department: 'Safety & Security'
    },
    {
        id: 'NOT-004',
        type: 'Equipment',
        title: 'Maintenance Shutdown - Conveyor Belt System',
        content: 'Scheduled maintenance shutdown of the main conveyor belt system from January 30th to February 2nd. Alternative transport arrangements have been made.',
        date: '2025-01-26',
        status: 'Sent',
        recipients: ['EMP-001', 'EMP-003', 'EMP-005', 'EMP-007', 'EMP-009'],
        recipientCount: 5,
        sender: 'David Chen',
        priority: 'High',
        attachments: [
            {
                name: 'maintenance-schedule.pdf',
                type: 'PDF',
                size: 234567,
                url: '/attachments/maintenance-schedule.pdf'
            }
        ],
        readCount: 5,
        deliveryStatus: 'Delivered',
        createdDate: '2025-01-25',
        sentDate: '2025-01-26',
        department: 'Maintenance',
        zone: 'Zone B - Processing'
    },
    {
        id: 'NOT-005',
        type: 'Training',
        title: 'Mandatory Safety Training - February 2025',
        content: 'All employees must complete mandatory safety training by February 15th, 2025. Training sessions are available online and in-person.',
        date: '2025-01-25',
        status: 'Sent',
        recipients: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010'],
        recipientCount: 10,
        sender: 'Maria Garcia',
        priority: 'Medium',
        attachments: [
            {
                name: 'training-materials.zip',
                type: 'ZIP',
                size: 1234567,
                url: '/attachments/training-materials.zip'
            }
        ],
        readCount: 8,
        deliveryStatus: 'Partially Delivered',
        createdDate: '2025-01-24',
        sentDate: '2025-01-25',
        department: 'Human Resources'
    },
    {
        id: 'NOT-006',
        type: 'Emergency',
        title: 'Emergency Drill - Fire Evacuation',
        content: 'Emergency fire evacuation drill scheduled for January 30th at 2:00 PM. All personnel must participate. Assembly point: Main parking area.',
        date: '2025-01-28',
        status: 'Sent',
        recipients: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010'],
        recipientCount: 10,
        sender: 'James Thompson',
        priority: 'Critical',
        attachments: [
            {
                name: 'evacuation-procedures.pdf',
                type: 'PDF',
                size: 345678,
                url: '/attachments/evacuation-procedures.pdf'
            }
        ],
        readCount: 10,
        deliveryStatus: 'Delivered',
        createdDate: '2025-01-27',
        sentDate: '2025-01-28',
        department: 'Safety & Security'
    }
];

// Sample employee communications data
export const employeeCommunicationsData: EmployeeCommunication[] = [
    {
        id: 'COMM-001',
        type: 'Blasting Notification',
        title: 'Scheduled Blasting Operations - Zone C',
        content: 'Blasting operations are scheduled for Zone C on January 30th from 10:00 AM to 12:00 PM. All personnel must evacuate the area by 9:45 AM. Safety perimeter established at 500 meters.',
        date: '2025-01-29',
        recipients: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'],
        recipientCount: 6,
        sender: 'Robert Kim',
        department: 'Mining Operations',
        zone: 'Zone C - Extraction',
        attachments: [
            {
                name: 'blasting-safety-map.pdf',
                type: 'PDF',
                size: 456789,
                url: '/attachments/blasting-safety-map.pdf'
            }
        ],
        readCount: 5,
        acknowledgedCount: 4,
        status: 'Active',
        expiryDate: '2025-01-30',
        isUrgent: true,
        createdDate: '2025-01-29',
        category: 'Safety'
    },
    {
        id: 'COMM-002',
        type: 'New Procedure',
        title: 'Updated Lockout/Tagout Procedure',
        content: 'New lockout/tagout procedure is now in effect. All maintenance personnel must review and acknowledge the updated safety protocols before performing any equipment maintenance.',
        date: '2025-01-27',
        recipients: ['EMP-002', 'EMP-004', 'EMP-006', 'EMP-008'],
        recipientCount: 4,
        sender: 'Mark Stevens',
        department: 'Maintenance',
        attachments: [
            {
                name: 'loto-procedure-v2.1.pdf',
                type: 'PDF',
                size: 678901,
                url: '/attachments/loto-procedure-v2.1.pdf'
            },
            {
                name: 'loto-checklist.xlsx',
                type: 'Excel',
                size: 123456,
                url: '/attachments/loto-checklist.xlsx'
            }
        ],
        readCount: 4,
        acknowledgedCount: 3,
        status: 'Active',
        isUrgent: false,
        createdDate: '2025-01-26',
        category: 'Safety'
    },
    {
        id: 'COMM-003',
        type: 'HSE Update',
        title: 'Monthly HSE Performance Report - December 2024',
        content: 'December 2024 HSE performance summary: Zero lost-time incidents, 95% training compliance, 3 near-miss reports processed. Congratulations to all teams for excellent safety performance.',
        date: '2025-01-25',
        recipients: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010'],
        recipientCount: 10,
        sender: 'Sarah Johnson',
        department: 'Safety & Security',
        attachments: [
            {
                name: 'hse-report-dec-2024.pdf',
                type: 'PDF',
                size: 789012,
                url: '/attachments/hse-report-dec-2024.pdf'
            }
        ],
        readCount: 9,
        acknowledgedCount: 8,
        status: 'Active',
        isUrgent: false,
        createdDate: '2025-01-24',
        category: 'Safety'
    },
    {
        id: 'COMM-004',
        type: 'Safety Briefing',
        title: 'Weekly Safety Briefing - Week 4, January 2025',
        content: 'Weekly safety briefing covering: weather conditions, equipment status, ongoing maintenance activities, and safety reminders. All shift supervisors must conduct team briefings.',
        date: '2025-01-26',
        recipients: ['EMP-001', 'EMP-003', 'EMP-005', 'EMP-007', 'EMP-009'],
        recipientCount: 5,
        sender: 'Mike Wilson',
        department: 'Safety & Security',
        attachments: [
            {
                name: 'weekly-briefing-w4-jan.pptx',
                type: 'PowerPoint',
                size: 1234567,
                url: '/attachments/weekly-briefing-w4-jan.pptx'
            }
        ],
        readCount: 5,
        acknowledgedCount: 5,
        status: 'Active',
        isUrgent: false,
        createdDate: '2025-01-25',
        category: 'Safety'
    },
    {
        id: 'COMM-005',
        type: 'Training Announcement',
        title: 'Advanced Equipment Operation Training',
        content: 'Advanced training sessions for new excavator operators. Training includes theoretical and practical components. Certification required for equipment operation.',
        date: '2025-01-24',
        recipients: ['EMP-002', 'EMP-004', 'EMP-006'],
        recipientCount: 3,
        sender: 'Angela White',
        department: 'Training',
        attachments: [
            {
                name: 'training-schedule-excavator.pdf',
                type: 'PDF',
                size: 345678,
                url: '/attachments/training-schedule-excavator.pdf'
            }
        ],
        readCount: 3,
        acknowledgedCount: 2,
        status: 'Active',
        expiryDate: '2025-02-15',
        isUrgent: false,
        createdDate: '2025-01-23',
        category: 'Training'
    },
    {
        id: 'COMM-006',
        type: 'Policy Update',
        title: 'Updated Environmental Protection Policy',
        content: 'Environmental protection policy has been updated to include new regulations. All employees must review and acknowledge the updated policy within 30 days.',
        date: '2025-01-23',
        recipients: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010'],
        recipientCount: 10,
        sender: 'Thomas Petit',
        department: 'Environmental',
        attachments: [
            {
                name: 'environmental-policy-v3.0.pdf',
                type: 'PDF',
                size: 567890,
                url: '/attachments/environmental-policy-v3.0.pdf'
            }
        ],
        readCount: 7,
        acknowledgedCount: 5,
        status: 'Active',
        expiryDate: '2025-02-22',
        isUrgent: false,
        createdDate: '2025-01-22',
        category: 'Administrative'
    }
];

// Sample recipients data
export const communicationRecipients: CommunicationRecipient[] = [
    {
        id: 'EMP-001',
        name: 'Jean Dupont',
        email: 'jean.dupont@company.com',
        department: 'Mining Operations',
        position: 'Production Operator',
        zone: 'Zone A - Production',
        isActive: true
    },
    {
        id: 'EMP-002',
        name: 'Marie Martin',
        email: 'marie.martin@company.com',
        department: 'Maintenance',
        position: 'Maintenance Technician',
        zone: 'Zone B - Processing',
        isActive: true
    },
    {
        id: 'EMP-003',
        name: 'Pierre Bernard',
        email: 'pierre.bernard@company.com',
        department: 'Quality Control',
        position: 'Quality Controller',
        zone: 'Zone A - Production',
        isActive: true
    },
    {
        id: 'EMP-004',
        name: 'Sophie Dubois',
        email: 'sophie.dubois@company.com',
        department: 'Logistics',
        position: 'Logistics Manager',
        zone: 'Zone D - Logistics',
        isActive: true
    },
    {
        id: 'EMP-005',
        name: 'Michel Leroy',
        email: 'michel.leroy@company.com',
        department: 'Engineering',
        position: 'Process Engineer',
        zone: 'Zone B - Processing',
        isActive: true
    },
    {
        id: 'EMP-006',
        name: 'Anne Moreau',
        email: 'anne.moreau@company.com',
        department: 'Safety & Security',
        position: 'Safety Officer',
        isActive: true
    },
    {
        id: 'EMP-007',
        name: 'Thomas Petit',
        email: 'thomas.petit@company.com',
        department: 'Environmental',
        position: 'Environmental Manager',
        isActive: true
    },
    {
        id: 'EMP-008',
        name: 'Isabelle Roux',
        email: 'isabelle.roux@company.com',
        department: 'Human Resources',
        position: 'HR Assistant',
        isActive: true
    },
    {
        id: 'EMP-009',
        name: 'François Blanc',
        email: 'francois.blanc@company.com',
        department: 'Mining Operations',
        position: 'Shift Supervisor',
        zone: 'Zone C - Extraction',
        isActive: true
    },
    {
        id: 'EMP-010',
        name: 'Catherine Vert',
        email: 'catherine.vert@company.com',
        department: 'Administration',
        position: 'Administrative Manager',
        isActive: true
    }
];

export const notificationTypes = [
    'Incident',
    'IGP',
    'Safety Alert',
    'Equipment',
    'Training',
    'Emergency',
    'Maintenance',
    'Environmental'
];

export const communicationTypes = [
    'Blasting Notification',
    'New Procedure',
    'HSE Update',
    'Safety Briefing',
    'Training Announcement',
    'Policy Update',
    'Emergency Drill',
    'Equipment Update'
];

export const communicationCategories = [
    'Safety',
    'Operations',
    'Training',
    'Administrative',
    'Emergency'
];

export const departments = [
    'Mining Operations',
    'Maintenance',
    'Quality Control',
    'Logistics',
    'Engineering',
    'Safety & Security',
    'Environmental',
    'Human Resources',
    'Administration',
    'Training'
];

export const zones = [
    'Zone A - Production',
    'Zone B - Processing',
    'Zone C - Extraction',
    'Zone D - Logistics'
];