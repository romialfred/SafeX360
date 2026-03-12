export interface DocumentVersion {
    id: string;
    versionNumber: string;
    fileName: string;
    fileSize: number;
    uploadDate: string;
    uploadedBy: string;
    changes: string;
    filePath: string;
}



export const documentCategories = [
    { value: 'Policy', label: 'Policy' },
    { value: 'Report', label: 'Report' },
    { value: 'Communication', label: 'Communication' },
    { value: 'Regulatory', label: 'Regulatory' },
    { value: 'Procedure', label: 'Procedure' },
    { value: 'Form', label: 'Form' },
    { value: 'Training', label: 'Training' },
    { value: 'Other', label: 'Other' }
];

export const fileTypes = [
    { value: 'PDF', label: 'PDF', icon: '📄', color: 'red' },
    { value: 'Word', label: 'Word', icon: '📝', color: 'blue' },
    { value: 'Excel', label: 'Excel', icon: '📊', color: 'green' },
    { value: 'PowerPoint', label: 'PowerPoint', icon: '📈', color: 'orange' },
    { value: 'Image', label: 'Image', icon: '🖼️', color: 'purple' },
    { value: 'Other', label: 'Other', icon: '📎', color: 'gray' }
];

export const accessLevels = [
    { value: 'PUBLIC', label: 'Public', color: 'green' },
    { value: 'INTERNAL', label: 'Internal', color: 'blue' },
    { value: 'CONFIDENTIAL', label: 'Confidential', color: 'orange' },
    { value: 'RESTRICTED', label: 'Restricted', color: 'red' }
];


export const documentStatuses = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'ARCHIVED', label: 'Archived' }
]

export const documentStatusesMap: Record<string, string> = {
    'DRAFT': 'Draft',
    'UNDER_REVIEW': 'Under Review',
    'APPROVED': 'Approved',
    'ARCHIVED': 'Archived'
}

export const accessLevelsMap: Record<string, string> = {
    'PUBLIC': 'Public',
    'INTERNAL': 'Internal',
    'CONFIDENTIAL': 'Confidential',
    'RESTRICTED': 'Restricted'
};

export const documentOwners = [
    'Sarah Johnson',
    'Mike Wilson',
    'David Chen',
    'Lisa Rodriguez',
    'James Thompson',
    'Maria Garcia',
    'Robert Kim',
    'Mark Stevens',
    'Angela White',
    'Thomas Petit',
    'Catherine Vert'
];

export const departments = [
    'Manufacturing',
    'Maintenance',
    'Quality Control',
    'Logistics',
    'Administration',
    'Engineering',
    'Safety & Security',
    'Human Resources',
    'IT',
    'Finance',
    'Legal'
];

// Sample document data
export const documentsData: any[] = [
    {
        id: 'DOC-001',
        name: 'Workplace Safety Policy',
        description: 'Document defining workplace safety policies and procedures in accordance with ISO 45001',
        category: 'Policy',
        fileType: 'PDF',
        owner: 'Sarah Johnson',
        department: 'Safety & Security',
        tags: ['safety', 'policy', 'ISO 45001', 'procedures'],
        createdDate: '2024-01-15',
        lastModified: '2024-12-20',
        status: 'Approved',
        currentVersion: '2.1',
        accessLevel: 'Internal',
        reviewDate: '2025-01-15',
        approvedBy: 'Mike Wilson',
        approvalDate: '2024-12-20',
        expiryDate: '2026-01-15',
        relatedDocuments: ['DOC-002', 'DOC-005'],
        downloadCount: 156,
        viewCount: 423,
        versions: [
            {
                id: 'VER-001-1',
                versionNumber: '1.0',
                fileName: 'workplace-safety-policy-v1.0.pdf',
                fileSize: 2456789,
                uploadDate: '2024-01-15',
                uploadedBy: 'Sarah Johnson',
                changes: 'Initial document version',
                filePath: '/documents/DOC-001/v1.0/workplace-safety-policy-v1.0.pdf'
            },
            {
                id: 'VER-001-2',
                versionNumber: '2.0',
                fileName: 'workplace-safety-policy-v2.0.pdf',
                fileSize: 2678901,
                uploadDate: '2024-06-10',
                uploadedBy: 'Sarah Johnson',
                changes: 'Update following ISO 45001 audit, added new emergency procedures',
                filePath: '/documents/DOC-001/v2.0/workplace-safety-policy-v2.0.pdf'
            },
            {
                id: 'VER-001-3',
                versionNumber: '2.1',
                fileName: 'workplace-safety-policy-v2.1.pdf',
                fileSize: 2701234,
                uploadDate: '2024-12-20',
                uploadedBy: 'Mike Wilson',
                changes: 'Minor corrections and updated regulatory references',
                filePath: '/documents/DOC-001/v2.1/workplace-safety-policy-v2.1.pdf'
            }
        ]
    },
    {
        id: 'DOC-002',
        name: 'Safety Audit Report Q4 2024',
        description: 'Detailed safety audit report for the fourth quarter of 2024',
        category: 'Report',
        fileType: 'PDF',
        owner: 'Mike Wilson',
        department: 'Safety & Security',
        tags: ['audit', 'safety', 'Q4', '2024', 'compliance'],
        createdDate: '2024-12-15',
        lastModified: '2024-12-18',
        status: 'Approved',
        currentVersion: '1.1',
        accessLevel: 'Confidential',
        approvedBy: 'Sarah Johnson',
        approvalDate: '2024-12-18',
        relatedDocuments: ['DOC-001', 'DOC-003'],
        downloadCount: 45,
        viewCount: 89,
        versions: [
            {
                id: 'VER-002-1',
                versionNumber: '1.0',
                fileName: 'safety-audit-report-q4-2024-v1.0.pdf',
                fileSize: 5234567,
                uploadDate: '2024-12-15',
                uploadedBy: 'Mike Wilson',
                changes: 'Initial audit report version',
                filePath: '/documents/DOC-002/v1.0/safety-audit-report-q4-2024-v1.0.pdf'
            },
            {
                id: 'VER-002-2',
                versionNumber: '1.1',
                fileName: 'safety-audit-report-q4-2024-v1.1.pdf',
                fileSize: 5456789,
                uploadDate: '2024-12-18',
                uploadedBy: 'Mike Wilson',
                changes: 'Added recommendations and corrective action plan',
                filePath: '/documents/DOC-002/v1.1/safety-audit-report-q4-2024-v1.1.pdf'
            }
        ]
    },
    {
        id: 'DOC-003',
        name: 'New PPE Regulation Communication',
        description: 'Internal communication regarding new regulations on personal protective equipment',
        category: 'Communication',
        fileType: 'Word',
        owner: 'Lisa Rodriguez',
        department: 'Human Resources',
        tags: ['PPE', 'regulation', 'communication', 'protection'],
        createdDate: '2024-11-20',
        lastModified: '2024-11-22',
        status: 'Approved',
        currentVersion: '1.0',
        accessLevel: 'Internal',
        approvedBy: 'Sarah Johnson',
        approvalDate: '2024-11-22',
        relatedDocuments: ['DOC-001', 'DOC-004'],
        downloadCount: 78,
        viewCount: 156,
        versions: [
            {
                id: 'VER-003-1',
                versionNumber: '1.0',
                fileName: 'ppe-regulation-communication.docx',
                fileSize: 1234567,
                uploadDate: '2024-11-20',
                uploadedBy: 'Lisa Rodriguez',
                changes: 'Initial communication version',
                filePath: '/documents/DOC-003/v1.0/ppe-regulation-communication.docx'
            }
        ]
    },
    {
        id: 'DOC-004',
        name: 'PPE Management Procedure',
        description: 'Detailed procedure for management, assignment and maintenance of personal protective equipment',
        category: 'Procedure',
        fileType: 'PDF',
        owner: 'David Chen',
        department: 'Safety & Security',
        tags: ['PPE', 'procedure', 'management', 'maintenance'],
        createdDate: '2024-10-05',
        lastModified: '2024-12-10',
        status: 'Under Review',
        currentVersion: '3.0',
        accessLevel: 'Internal',
        reviewDate: '2025-01-10',
        relatedDocuments: ['DOC-001', 'DOC-003'],
        downloadCount: 234,
        viewCount: 567,
        versions: [
            {
                id: 'VER-004-1',
                versionNumber: '1.0',
                fileName: 'ppe-management-procedure-v1.0.pdf',
                fileSize: 3456789,
                uploadDate: '2024-10-05',
                uploadedBy: 'David Chen',
                changes: 'Initial procedure version',
                filePath: '/documents/DOC-004/v1.0/ppe-management-procedure-v1.0.pdf'
            },
            {
                id: 'VER-004-2',
                versionNumber: '2.0',
                fileName: 'ppe-management-procedure-v2.0.pdf',
                fileSize: 3678901,
                uploadDate: '2024-11-15',
                uploadedBy: 'David Chen',
                changes: 'Added new PPE categories and updated assignment processes',
                filePath: '/documents/DOC-004/v2.0/ppe-management-procedure-v2.0.pdf'
            },
            {
                id: 'VER-004-3',
                versionNumber: '3.0',
                fileName: 'ppe-management-procedure-v3.0.pdf',
                fileSize: 3890123,
                uploadDate: '2024-12-10',
                uploadedBy: 'David Chen',
                changes: 'Integration of new regulations and improved maintenance process',
                filePath: '/documents/DOC-004/v3.0/ppe-management-procedure-v3.0.pdf'
            }
        ]
    },
    {
        id: 'DOC-005',
        name: 'Incident Report Form',
        description: 'Standardized form for reporting safety incidents',
        category: 'Form',
        fileType: 'Excel',
        owner: 'James Thompson',
        department: 'Safety & Security',
        tags: ['form', 'incident', 'report', 'safety'],
        createdDate: '2024-09-12',
        lastModified: '2024-11-08',
        status: 'Approved',
        currentVersion: '2.2',
        accessLevel: 'Internal',
        approvedBy: 'Sarah Johnson',
        approvalDate: '2024-11-08',
        relatedDocuments: ['DOC-001', 'DOC-006'],
        downloadCount: 189,
        viewCount: 345,
        versions: [
            {
                id: 'VER-005-1',
                versionNumber: '1.0',
                fileName: 'incident-report-form-v1.0.xlsx',
                fileSize: 987654,
                uploadDate: '2024-09-12',
                uploadedBy: 'James Thompson',
                changes: 'Initial form version',
                filePath: '/documents/DOC-005/v1.0/incident-report-form-v1.0.xlsx'
            },
            {
                id: 'VER-005-2',
                versionNumber: '2.0',
                fileName: 'incident-report-form-v2.0.xlsx',
                fileSize: 1098765,
                uploadDate: '2024-10-20',
                uploadedBy: 'James Thompson',
                changes: 'Added fields for incident classification and corrective measures',
                filePath: '/documents/DOC-005/v2.0/incident-report-form-v2.0.xlsx'
            },
            {
                id: 'VER-005-3',
                versionNumber: '2.1',
                fileName: 'incident-report-form-v2.1.xlsx',
                fileSize: 1123456,
                uploadDate: '2024-11-05',
                uploadedBy: 'James Thompson',
                changes: 'Fixed calculation formulas and improved formatting',
                filePath: '/documents/DOC-005/v2.1/incident-report-form-v2.1.xlsx'
            },
            {
                id: 'VER-005-4',
                versionNumber: '2.2',
                fileName: 'incident-report-form-v2.2.xlsx',
                fileSize: 1145678,
                uploadDate: '2024-11-08',
                uploadedBy: 'James Thompson',
                changes: 'Added data validation and dropdown list for departments',
                filePath: '/documents/DOC-005/v2.2/incident-report-form-v2.2.xlsx'
            }
        ]
    },
    {
        id: 'DOC-006',
        name: 'Safety Training Presentation',
        description: 'Presentation material for mandatory workplace safety training',
        category: 'Training',
        fileType: 'PowerPoint',
        owner: 'Maria Garcia',
        department: 'Human Resources',
        tags: ['training', 'safety', 'presentation', 'mandatory'],
        createdDate: '2024-08-15',
        lastModified: '2024-12-05',
        status: 'Approved',
        currentVersion: '1.3',
        accessLevel: 'Internal',
        approvedBy: 'Sarah Johnson',
        approvalDate: '2024-12-05',
        relatedDocuments: ['DOC-001', 'DOC-007'],
        downloadCount: 312,
        viewCount: 678,
        versions: [
            {
                id: 'VER-006-1',
                versionNumber: '1.0',
                fileName: 'safety-training-presentation-v1.0.pptx',
                fileSize: 15678901,
                uploadDate: '2024-08-15',
                uploadedBy: 'Maria Garcia',
                changes: 'Initial presentation version',
                filePath: '/documents/DOC-006/v1.0/safety-training-presentation-v1.0.pptx'
            },
            {
                id: 'VER-006-2',
                versionNumber: '1.1',
                fileName: 'safety-training-presentation-v1.1.pptx',
                fileSize: 16234567,
                uploadDate: '2024-09-20',
                uploadedBy: 'Maria Garcia',
                changes: 'Added new slides on PPE and updated statistics',
                filePath: '/documents/DOC-006/v1.1/safety-training-presentation-v1.1.pptx'
            },
            {
                id: 'VER-006-3',
                versionNumber: '1.2',
                fileName: 'safety-training-presentation-v1.2.pptx',
                fileSize: 16789012,
                uploadDate: '2024-11-10',
                uploadedBy: 'Maria Garcia',
                changes: 'Integrated practical cases and improved visuals',
                filePath: '/documents/DOC-006/v1.2/safety-training-presentation-v1.2.pptx'
            },
            {
                id: 'VER-006-4',
                versionNumber: '1.3',
                fileName: 'safety-training-presentation-v1.3.pptx',
                fileSize: 17123456,
                uploadDate: '2024-12-05',
                uploadedBy: 'Maria Garcia',
                changes: 'Updated 2025 regulations and added interactive quizzes',
                filePath: '/documents/DOC-006/v1.3/safety-training-presentation-v1.3.pptx'
            }
        ]
    },
    {
        id: 'DOC-007',
        name: 'OSHA Regulations 2024',
        description: 'Official document of new OSHA regulations applicable in 2024',
        category: 'Regulatory',
        fileType: 'PDF',
        owner: 'Robert Kim',
        department: 'Legal',
        tags: ['OSHA', 'regulation', '2024', 'compliance', 'legal'],
        createdDate: '2024-01-02',
        lastModified: '2024-01-02',
        status: 'Approved',
        currentVersion: '1.0',
        accessLevel: 'Internal',
        approvedBy: 'Thomas Petit',
        approvalDate: '2024-01-02',
        relatedDocuments: ['DOC-001', 'DOC-008'],
        downloadCount: 89,
        viewCount: 234,
        versions: [
            {
                id: 'VER-007-1',
                versionNumber: '1.0',
                fileName: 'osha-regulations-2024.pdf',
                fileSize: 8901234,
                uploadDate: '2024-01-02',
                uploadedBy: 'Robert Kim',
                changes: 'Official OSHA 2024 document',
                filePath: '/documents/DOC-007/v1.0/osha-regulations-2024.pdf'
            }
        ]
    },
    {
        id: 'DOC-008',
        name: 'Emergency Evacuation Plan',
        description: 'Detailed emergency evacuation plans for all site buildings',
        category: 'Policy',
        fileType: 'Image',
        owner: 'Mark Stevens',
        department: 'Safety & Security',
        tags: ['evacuation', 'emergency', 'plan', 'safety', 'building'],
        createdDate: '2024-03-10',
        lastModified: '2024-07-22',
        status: 'Approved',
        currentVersion: '2.0',
        accessLevel: 'Public',
        approvedBy: 'Sarah Johnson',
        approvalDate: '2024-07-22',
        relatedDocuments: ['DOC-001', 'DOC-009'],
        downloadCount: 445,
        viewCount: 1234,
        versions: [
            {
                id: 'VER-008-1',
                versionNumber: '1.0',
                fileName: 'emergency-evacuation-plan-v1.0.png',
                fileSize: 4567890,
                uploadDate: '2024-03-10',
                uploadedBy: 'Mark Stevens',
                changes: 'Initial evacuation plans version',
                filePath: '/documents/DOC-008/v1.0/emergency-evacuation-plan-v1.0.png'
            },
            {
                id: 'VER-008-2',
                versionNumber: '2.0',
                fileName: 'emergency-evacuation-plan-v2.0.png',
                fileSize: 5123456,
                uploadDate: '2024-07-22',
                uploadedBy: 'Mark Stevens',
                changes: 'Updated following office renovation and added new emergency exits',
                filePath: '/documents/DOC-008/v2.0/emergency-evacuation-plan-v2.0.png'
            }
        ]
    }
];