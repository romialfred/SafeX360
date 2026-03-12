
import { predefinedRoles } from './roles';

export const mockUsers: any[] = [
    {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@company.com',
        role: predefinedRoles[0], // System Administrator
        isActive: true,
        createdAt: '2024-01-15T08:00:00Z',
        lastLogin: '2024-01-20T14:30:00Z',
        isOnline: true,
        lastActivity: '2024-01-20T16:45:00Z',
        department: 'IT',
        position: 'System Administrator'
    },
    {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@company.com',
        role: predefinedRoles[1], // Health & Safety Coordinator
        isActive: true,
        createdAt: '2024-01-10T09:00:00Z',
        lastLogin: '2024-01-20T16:45:00Z',
        isOnline: true,
        lastActivity: '2024-01-20T16:50:00Z',
        department: 'Health & Safety',
        position: 'Safety Coordinator'
    },
    {
        id: '3',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@company.com',
        role: predefinedRoles[2], // Incident Investigator
        isActive: true,
        createdAt: '2024-01-12T10:30:00Z',
        lastLogin: '2024-01-19T11:20:00Z',
        isOnline: false,
        lastActivity: '2024-01-19T15:30:00Z',
        department: 'Health & Safety',
        position: 'Incident Investigator'
    },
    {
        id: '4',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@company.com',
        role: predefinedRoles[3], // Auditor
        isActive: true,
        createdAt: '2024-01-08T11:00:00Z',
        lastLogin: '2024-01-20T09:15:00Z',
        isOnline: true,
        lastActivity: '2024-01-20T16:20:00Z',
        department: 'Quality Assurance',
        position: 'Internal Auditor'
    },
    {
        id: '5',
        firstName: 'Robert',
        lastName: 'Wilson',
        email: 'robert.wilson@company.com',
        role: predefinedRoles[4], // Employee
        isActive: true,
        createdAt: '2024-01-05T12:00:00Z',
        lastLogin: '2024-01-18T15:30:00Z',
        isOnline: false,
        lastActivity: '2024-01-18T17:45:00Z',
        department: 'Operations',
        position: 'Operator'
    },
    {
        id: '6',
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.anderson@company.com',
        role: predefinedRoles[4], // Employee
        isActive: false,
        createdAt: '2023-12-20T13:30:00Z',
        lastLogin: '2024-01-10T10:00:00Z',
        isOnline: false,
        lastActivity: '2024-01-10T12:30:00Z',
        department: 'Maintenance',
        position: 'Technician'
    }
];