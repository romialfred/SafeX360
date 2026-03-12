export interface Employee {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    position: string;
    hireDate: string;
    manager: string;
    phoneNumber: string;
    location: string;
    status: 'active' | 'inactive' | 'on-leave';
    contractType: 'permanent' | 'temporary' | 'contractor';
    workSchedule: string;
}

// Mock HRMS data - In real application, this would come from HRMS API
export const hrmsEmployees: Employee[] = [
    {
        id: 'emp001',
        employeeNumber: 'EMP-2024-001',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@company.com',
        department: 'Operations',
        position: 'Senior Operator',
        hireDate: '2023-03-15',
        manager: 'Marie Martin',
        phoneNumber: '+33 1 23 45 67 89',
        location: 'Paris - Site A',
        status: 'active',
        contractType: 'permanent',
        workSchedule: 'Full-time (40h/week)'
    },
    {
        id: 'emp002',
        employeeNumber: 'EMP-2024-002',
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@company.com',
        department: 'Health & Safety',
        position: 'Safety Manager',
        hireDate: '2022-01-10',
        manager: 'Pierre Dubois',
        phoneNumber: '+33 1 23 45 67 90',
        location: 'Paris - Site A',
        status: 'active',
        contractType: 'permanent',
        workSchedule: 'Full-time (40h/week)'
    },
    {
        id: 'emp003',
        employeeNumber: 'EMP-2024-003',
        firstName: 'Pierre',
        lastName: 'Dubois',
        email: 'pierre.dubois@company.com',
        department: 'Management',
        position: 'Operations Director',
        hireDate: '2020-06-01',
        manager: 'CEO',
        phoneNumber: '+33 1 23 45 67 91',
        location: 'Paris - Headquarters',
        status: 'active',
        contractType: 'permanent',
        workSchedule: 'Full-time (40h/week)'
    },
    {
        id: 'emp004',
        employeeNumber: 'EMP-2024-004',
        firstName: 'Sophie',
        lastName: 'Bernard',
        email: 'sophie.bernard@company.com',
        department: 'Quality Assurance',
        position: 'QA Specialist',
        hireDate: '2023-09-01',
        manager: 'Marie Martin',
        phoneNumber: '+33 1 23 45 67 92',
        location: 'Lyon - Site B',
        status: 'active',
        contractType: 'permanent',
        workSchedule: 'Full-time (35h/week)'
    },
    {
        id: 'emp005',
        employeeNumber: 'EMP-2024-005',
        firstName: 'Thomas',
        lastName: 'Leroy',
        email: 'thomas.leroy@company.com',
        department: 'Maintenance',
        position: 'Maintenance Technician',
        hireDate: '2023-11-15',
        manager: 'Jean Dupont',
        phoneNumber: '+33 1 23 45 67 93',
        location: 'Lyon - Site B',
        status: 'active',
        contractType: 'temporary',
        workSchedule: 'Full-time (40h/week)'
    },
    {
        id: 'emp006',
        employeeNumber: 'EMP-2024-006',
        firstName: 'Isabelle',
        lastName: 'Moreau',
        email: 'isabelle.moreau@company.com',
        department: 'IT',
        position: 'System Administrator',
        hireDate: '2022-08-20',
        manager: 'Pierre Dubois',
        phoneNumber: '+33 1 23 45 67 94',
        location: 'Paris - Headquarters',
        status: 'active',
        contractType: 'permanent',
        workSchedule: 'Full-time (40h/week)'
    },
    {
        id: 'emp007',
        employeeNumber: 'EMP-2024-007',
        firstName: 'Antoine',
        lastName: 'Rousseau',
        email: 'antoine.rousseau@company.com',
        department: 'Operations',
        position: 'Junior Operator',
        hireDate: '2024-01-08',
        manager: 'Jean Dupont',
        phoneNumber: '+33 1 23 45 67 95',
        location: 'Paris - Site A',
        status: 'active',
        contractType: 'permanent',
        workSchedule: 'Part-time (30h/week)'
    },
    {
        id: 'emp008',
        employeeNumber: 'EMP-2024-008',
        firstName: 'Camille',
        lastName: 'Petit',
        email: 'camille.petit@company.com',
        department: 'Health & Safety',
        position: 'Safety Coordinator',
        hireDate: '2023-05-12',
        manager: 'Marie Martin',
        phoneNumber: '+33 1 23 45 67 96',
        location: 'Lyon - Site B',
        status: 'on-leave',
        contractType: 'permanent',
        workSchedule: 'Full-time (40h/week)'
    },
    {
        id: 'emp009',
        employeeNumber: 'EMP-2024-009',
        firstName: 'Nicolas',
        lastName: 'Garnier',
        email: 'nicolas.garnier@company.com',
        department: 'Quality Assurance',
        position: 'Internal Auditor',
        hireDate: '2021-12-03',
        manager: 'Sophie Bernard',
        phoneNumber: '+33 1 23 45 67 97',
        location: 'Paris - Site A',
        status: 'active',
        contractType: 'permanent',
        workSchedule: 'Full-time (40h/week)'
    },
    {
        id: 'emp010',
        employeeNumber: 'EMP-2024-010',
        firstName: 'Lucie',
        lastName: 'Fabre',
        email: 'lucie.fabre@company.com',
        department: 'Operations',
        position: 'Process Engineer',
        hireDate: '2023-07-25',
        manager: 'Pierre Dubois',
        phoneNumber: '+33 1 23 45 67 98',
        location: 'Lyon - Site B',
        status: 'active',
        contractType: 'contractor',
        workSchedule: 'Full-time (40h/week)'
    }
];