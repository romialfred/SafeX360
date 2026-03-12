export interface EPP {
    id: string;
    name: string;
    category: string;
    brand: string;
    model: string;
    size: string;
    certificationStandard: string;
    expiryDate: string;
    status: 'Available' | 'Assigned' | 'Maintenance' | 'Expired';
    quantity: number;
    minStockLevel: number;
    unitPrice: number;
    supplier: string;
    dateAdded: string;
    lastInspection: string;
    nextInspection: string;
    description: string;
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: string;
    position: string;
    hireDate: string;
    email: string;
    phone: string;
    status: 'Active' | 'Inactive';
}

export interface EPPAssignment {
    id: string;
    employeeId: string;
    eppId: string;
    assignedDate: string;
    returnDate?: string;
    status: 'Active' | 'Returned' | 'Lost' | 'Damaged';
    assignedBy: string;
    notes: string;
    condition: 'New' | 'Good' | 'Fair' | 'Poor';
    serialNumber?: string;
}

export interface EPPHistory {
    id: string;
    employeeId: string;
    eppId: string;
    action: 'Assigned' | 'Returned' | 'Replaced' | 'Lost' | 'Damaged' | 'Expired';
    date: string;
    performedBy: string;
    notes: string;
    previousCondition?: string;
    newCondition?: string;
}

export interface EPPRequest {
    id: string;
    employeeId?: string;
    employeeIds?: string[];
    eppIds: string[];
    requestDate: string;
    requestedDate?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    reason: string;
    priority: 'Low' | 'Medium' | 'High';
    approvedBy?: string;
    approvalDate?: string;
    comments?: string;
    rejectionReason?: string;
}

// Sample EPP data
export const eppData: EPP[] = [
    {
        id: 'EPP-001',
        name: 'Casque de sécurité blanc',
        category: 'Protection de la tête',
        brand: 'SafeGuard',
        model: 'SG-100',
        size: 'Ajustable',
        certificationStandard: 'EN 397',
        expiryDate: '2026-12-31',
        status: 'Available',
        quantity: 25,
        minStockLevel: 10,
        unitPrice: 15.50,
        supplier: 'Safety Equipment Ltd',
        dateAdded: '2024-01-15',
        lastInspection: '2024-12-01',
        nextInspection: '2025-06-01',
        description: 'Casque de sécurité en polyéthylène haute densité'
    },
    {
        id: 'EPP-002',
        name: 'Lunettes de protection',
        category: 'Protection des yeux',
        brand: 'VisionSafe',
        model: 'VS-200',
        size: 'Unique',
        certificationStandard: 'EN 166',
        expiryDate: '2025-08-15',
        status: 'Available',
        quantity: 40,
        minStockLevel: 15,
        unitPrice: 8.75,
        supplier: 'OptiProtect',
        dateAdded: '2024-02-10',
        lastInspection: '2024-11-15',
        nextInspection: '2025-05-15',
        description: 'Lunettes anti-impact avec protection UV'
    },
    {
        id: 'EPP-003',
        name: 'Gants de protection chimique',
        category: 'Protection des mains',
        brand: 'ChemGuard',
        model: 'CG-300',
        size: 'L',
        certificationStandard: 'EN 374',
        expiryDate: '2025-03-20',
        status: 'Assigned',
        quantity: 15,
        minStockLevel: 20,
        unitPrice: 12.30,
        supplier: 'Chemical Safety Co',
        dateAdded: '2024-01-20',
        lastInspection: '2024-10-30',
        nextInspection: '2025-04-30',
        description: 'Gants résistants aux produits chimiques'
    },
    {
        id: 'EPP-004',
        name: 'Chaussures de sécurité S3',
        category: 'Protection des pieds',
        brand: 'SafeStep',
        model: 'SS-400',
        size: '42',
        certificationStandard: 'EN ISO 20345',
        expiryDate: '2027-01-10',
        status: 'Available',
        quantity: 8,
        minStockLevel: 12,
        unitPrice: 85.00,
        supplier: 'Industrial Footwear',
        dateAdded: '2024-03-05',
        lastInspection: '2024-12-10',
        nextInspection: '2025-06-10',
        description: 'Chaussures avec coque de protection et semelle anti-perforation'
    },
    {
        id: 'EPP-005',
        name: 'Masque respiratoire FFP2',
        category: 'Protection respiratoire',
        brand: 'BreatheSafe',
        model: 'BS-500',
        size: 'M',
        certificationStandard: 'EN 149',
        expiryDate: '2025-06-30',
        status: 'Available',
        quantity: 100,
        minStockLevel: 50,
        unitPrice: 2.50,
        supplier: 'Respiratory Protection Inc',
        dateAdded: '2024-01-08',
        lastInspection: '2024-11-20',
        nextInspection: '2025-05-20',
        description: 'Masque filtrant contre les particules'
    },
    {
        id: 'EPP-006',
        name: 'Gilet haute visibilité',
        category: 'Vêtements de protection',
        brand: 'VisibleSafe',
        model: 'VIS-600',
        size: 'XL',
        certificationStandard: 'EN ISO 20471',
        expiryDate: '2026-09-15',
        status: 'Assigned',
        quantity: 30,
        minStockLevel: 15,
        unitPrice: 18.90,
        supplier: 'High Visibility Clothing',
        dateAdded: '2024-02-20',
        lastInspection: '2024-12-05',
        nextInspection: '2025-06-05',
        description: 'Gilet réfléchissant classe 2'
    },
    {
        id: 'EPP-007',
        name: 'Bouchons d\'oreilles',
        category: 'Protection auditive',
        brand: 'SoundBlock',
        model: 'SB-700',
        size: 'Unique',
        certificationStandard: 'EN 352-2',
        expiryDate: '2025-12-31',
        status: 'Available',
        quantity: 200,
        minStockLevel: 100,
        unitPrice: 0.85,
        supplier: 'Hearing Protection Ltd',
        dateAdded: '2024-01-12',
        lastInspection: '2024-11-25',
        nextInspection: '2025-05-25',
        description: 'Bouchons d\'oreilles en mousse'
    },
    {
        id: 'EPP-008',
        name: 'Harnais de sécurité',
        category: 'Protection contre les chutes',
        brand: 'FallSafe',
        model: 'FS-800',
        size: 'L',
        certificationStandard: 'EN 361',
        expiryDate: '2028-04-20',
        status: 'Maintenance',
        quantity: 5,
        minStockLevel: 8,
        unitPrice: 125.00,
        supplier: 'Fall Protection Systems',
        dateAdded: '2024-03-15',
        lastInspection: '2024-12-15',
        nextInspection: '2025-06-15',
        description: 'Harnais complet avec points d\'ancrage'
    }
];

// Sample employees data
export const employeesData: Employee[] = [
    {
        id: 'EMP-001',
        firstName: 'Jean',
        lastName: 'Dupont',
        employeeNumber: '12345',
        department: 'Mine',
        position: 'Opérateur de production',
        hireDate: '2022-03-15',
        email: 'jean.dupont@company.com',
        phone: '+33 1 23 45 67 89',
        status: 'Active'
    },
    {
        id: 'EMP-002',
        firstName: 'Marie',
        lastName: 'Martin',
        employeeNumber: '12346',
        department: 'Geologie',
        position: 'Technicien de maintenance',
        hireDate: '2021-09-10',
        email: 'marie.martin@company.com',
        phone: '+33 1 23 45 67 90',
        status: 'Active'
    },
    {
        id: 'EMP-003',
        firstName: 'Pierre',
        lastName: 'Bernard',
        employeeNumber: '12347',
        department: 'Usine maintenance',
        position: 'Contrôleur qualité',
        hireDate: '2023-01-20',
        email: 'pierre.bernard@company.com',
        phone: '+33 1 23 45 67 91',
        status: 'Active'
    },
    {
        id: 'EMP-004',
        firstName: 'Sophie',
        lastName: 'Dubois',
        employeeNumber: '12348',
        department: 'Usine Production',
        position: 'Responsable logistique',
        hireDate: '2020-11-05',
        email: 'sophie.dubois@company.com',
        phone: '+33 1 23 45 67 92',
        status: 'Active'
    },
    {
        id: 'EMP-005',
        firstName: 'Michel',
        lastName: 'Leroy',
        employeeNumber: '12349',
        department: 'RH',
        position: 'Ingénieur process',
        hireDate: '2022-07-12',
        email: 'michel.leroy@company.com',
        phone: '+33 1 23 45 67 93',
        status: 'Active'
    },
    {
        id: 'EMP-006',
        firstName: 'Anne',
        lastName: 'Moreau',
        employeeNumber: '12350',
        department: 'IT',
        position: 'Chef d\'équipe',
        hireDate: '2019-04-08',
        email: 'anne.moreau@company.com',
        phone: '+33 1 23 45 67 94',
        status: 'Active'
    },
    {
        id: 'EMP-007',
        firstName: 'Thomas',
        lastName: 'Petit',
        employeeNumber: '12351',
        department: 'SCM',
        position: 'Responsable sécurité',
        hireDate: '2021-02-15',
        email: 'thomas.petit@company.com',
        phone: '+33 1 23 45 67 95',
        status: 'Active'
    },
    {
        id: 'EMP-008',
        firstName: 'Isabelle',
        lastName: 'Roux',
        employeeNumber: '12352',
        department: 'Mine',
        position: 'Assistante RH',
        hireDate: '2020-09-20',
        email: 'isabelle.roux@company.com',
        phone: '+33 1 23 45 67 96',
        status: 'Active'
    },
    {
        id: 'EMP-009',
        firstName: 'François',
        lastName: 'Blanc',
        employeeNumber: '12353',
        department: 'Geologie',
        position: 'Ingénieur R&D',
        hireDate: '2022-11-10',
        email: 'francois.blanc@company.com',
        phone: '+33 1 23 45 67 97',
        status: 'Active'
    },
    {
        id: 'EMP-010',
        firstName: 'Catherine',
        lastName: 'Vert',
        employeeNumber: '12354',
        department: 'Usine maintenance',
        position: 'Responsable achats',
        hireDate: '2019-06-25',
        email: 'catherine.vert@company.com',
        phone: '+33 1 23 45 67 98',
        status: 'Active'
    }
];

// Sample assignments data
export const eppAssignments: EPPAssignment[] = [
    {
        id: 'ASSIGN-001',
        employeeId: 'EMP-001',
        eppId: 'EPP-001',
        assignedDate: '2024-11-15',
        status: 'Active',
        assignedBy: 'Sarah Johnson',
        notes: 'Attribution initiale',
        condition: 'New',
        serialNumber: 'SG100-001'
    },
    {
        id: 'ASSIGN-002',
        employeeId: 'EMP-001',
        eppId: 'EPP-003',
        assignedDate: '2024-11-20',
        status: 'Active',
        assignedBy: 'Mike Wilson',
        notes: 'Gants pour manipulation produits chimiques',
        condition: 'New',
        serialNumber: 'CG300-015'
    },
    {
        id: 'ASSIGN-003',
        employeeId: 'EMP-002',
        eppId: 'EPP-006',
        assignedDate: '2024-10-30',
        status: 'Active',
        assignedBy: 'Sarah Johnson',
        notes: 'Gilet pour travaux extérieurs',
        condition: 'Good',
        serialNumber: 'VIS600-022'
    },
    {
        id: 'ASSIGN-004',
        employeeId: 'EMP-003',
        eppId: 'EPP-002',
        assignedDate: '2024-12-01',
        returnDate: '2024-12-20',
        status: 'Returned',
        assignedBy: 'David Chen',
        notes: 'Lunettes pour contrôle qualité - retournées après mission',
        condition: 'Good',
        serialNumber: 'VS200-008'
    },
    {
        id: 'ASSIGN-005',
        employeeId: 'EMP-004',
        eppId: 'EPP-004',
        assignedDate: '2024-11-10',
        status: 'Active',
        assignedBy: 'Lisa Rodriguez',
        notes: 'Chaussures de sécurité pour entrepôt',
        condition: 'New',
        serialNumber: 'SS400-042'
    },
    {
        id: 'ASSIGN-006',
        employeeId: 'EMP-005',
        eppId: 'EPP-001',
        assignedDate: '2024-12-10',
        status: 'Active',
        assignedBy: 'Sarah Johnson',
        notes: 'Casque pour responsable sécurité',
        condition: 'New',
        serialNumber: 'SG100-025'
    },
    {
        id: 'ASSIGN-007',
        employeeId: 'EMP-006',
        eppId: 'EPP-006',
        assignedDate: '2024-12-05',
        status: 'Active',
        assignedBy: 'Laurent Noir',
        notes: 'Gilet haute visibilité pour patrouilles',
        condition: 'New',
        serialNumber: 'VIS600-030'
    },
    {
        id: 'ASSIGN-008',
        employeeId: 'EMP-007',
        eppId: 'EPP-002',
        assignedDate: '2024-12-01',
        status: 'Active',
        assignedBy: 'Safety Team',
        notes: 'Lunettes de protection pour inspections',
        condition: 'Good',
        serialNumber: 'VS200-012'
    },
    {
        id: 'ASSIGN-009',
        employeeId: 'EMP-008',
        eppId: 'EPP-005',
        assignedDate: '2024-11-25',
        status: 'Active',
        assignedBy: 'HR Team',
        notes: 'Masque respiratoire pour zone poussiéreuse',
        condition: 'New',
        serialNumber: 'BS500-045'
    },
    {
        id: 'ASSIGN-010',
        employeeId: 'EMP-009',
        eppId: 'EPP-003',
        assignedDate: '2024-12-08',
        status: 'Active',
        assignedBy: 'R&D Manager',
        notes: 'Gants pour manipulation produits chimiques R&D',
        condition: 'New',
        serialNumber: 'CG300-028'
    },
    {
        id: 'ASSIGN-011',
        employeeId: 'EMP-010',
        eppId: 'EPP-004',
        assignedDate: '2024-11-30',
        status: 'Active',
        assignedBy: 'Procurement Team',
        notes: 'Chaussures de sécurité pour achats terrain',
        condition: 'New',
        serialNumber: 'SS400-055'
    }
];

// Sample history data
export const eppHistory: EPPHistory[] = [
    {
        id: 'HIST-001',
        employeeId: 'EMP-001',
        eppId: 'EPP-001',
        action: 'Assigned',
        date: '2024-11-15',
        performedBy: 'Sarah Johnson',
        notes: 'Attribution initiale du casque de sécurité',
        newCondition: 'New'
    },
    {
        id: 'HIST-002',
        employeeId: 'EMP-001',
        eppId: 'EPP-003',
        action: 'Assigned',
        date: '2024-11-20',
        performedBy: 'Mike Wilson',
        notes: 'Attribution des gants pour manipulation chimique',
        newCondition: 'New'
    },
    {
        id: 'HIST-003',
        employeeId: 'EMP-003',
        eppId: 'EPP-002',
        action: 'Assigned',
        date: '2024-12-01',
        performedBy: 'David Chen',
        notes: 'Attribution des lunettes pour mission temporaire',
        newCondition: 'Good'
    },
    {
        id: 'HIST-004',
        employeeId: 'EMP-003',
        eppId: 'EPP-002',
        action: 'Returned',
        date: '2024-12-20',
        performedBy: 'David Chen',
        notes: 'Retour des lunettes après fin de mission',
        previousCondition: 'Good',
        newCondition: 'Good'
    },
    {
        id: 'HIST-005',
        employeeId: 'EMP-002',
        eppId: 'EPP-006',
        action: 'Assigned',
        date: '2024-10-30',
        performedBy: 'Sarah Johnson',
        notes: 'Attribution du gilet haute visibilité',
        newCondition: 'Good'
    },
    // Removed invalid objects with 'assignedDate' property that do not match EPPHistory interface
];

// Sample EPP requests data
export const eppRequests: EPPRequest[] = [
    {
        id: 'REQ-001',
        employeeIds: ['EMP-005', 'EMP-007'],
        eppIds: ['EPP-001', 'EPP-002'],
        requestDate: '2025-01-15',
        requestedDate: '2025-01-20',
        status: 'Pending',
        reason: 'Nouveau poste nécessitant protection tête et yeux',
        priority: 'High'
    },
    {
        id: 'REQ-002',
        employeeIds: ['EMP-006', 'EMP-008'],
        eppIds: ['EPP-004', 'EPP-005'],
        requestDate: '2025-01-14',
        requestedDate: '2025-01-18',
        status: 'Pending',
        reason: 'Équipements de protection pour nouvelle zone de travail',
        priority: 'Medium'
    },
    {
        id: 'REQ-003',
        employeeIds: ['EMP-003'],
        eppIds: ['EPP-005', 'EPP-007'],
        requestDate: '2025-01-13',
        requestedDate: '2025-01-16',
        status: 'Approved',
        reason: 'Travail en zone poussiéreuse',
        priority: 'Medium',
        approvedBy: 'Sarah Johnson',
        approvalDate: '2025-01-14',
        comments: 'Approuvé - formation sur utilisation requise'
    },
    {
        id: 'REQ-004',
        employeeIds: ['EMP-002'],
        eppIds: ['EPP-008'],
        requestDate: '2025-01-12',
        requestedDate: '2025-01-15',
        status: 'Rejected',
        reason: 'Travail en hauteur occasionnel',
        priority: 'Low',
        approvedBy: 'Mike Wilson',
        approvalDate: '2025-01-13',
        rejectionReason: 'Formation travail en hauteur non complétée'
    },
    {
        id: 'REQ-005',
        employeeIds: ['EMP-009', 'EMP-010'],
        eppIds: ['EPP-002', 'EPP-003', 'EPP-006'],
        requestDate: '2025-01-16',
        requestedDate: '2025-01-22',
        status: 'Pending',
        reason: 'Nouveaux projets R&D nécessitant équipements spécialisés',
        priority: 'High'
    }
];