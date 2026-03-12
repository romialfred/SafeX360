
export const mockUserActivities: any[] = [
    {
        id: '1',
        userId: '1',
        userName: 'John Smith',
        action: 'Login',
        page: '/login',
        timestamp: '2024-01-20T14:30:00Z',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'sess_001',
        details: 'Successful login'
    },
    {
        id: '2',
        userId: '1',
        userName: 'John Smith',
        action: 'Page Visit',
        page: '/dashboard',
        timestamp: '2024-01-20T14:31:00Z',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'sess_001',
        details: 'Viewed main dashboard'
    },
    {
        id: '3',
        userId: '1',
        userName: 'John Smith',
        action: 'Incident Report Created',
        page: '/incident-management',
        timestamp: '2024-01-20T14:45:00Z',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'sess_001',
        details: 'Created incident report #INC-2024-001'
    },
    {
        id: '4',
        userId: '2',
        userName: 'Sarah Johnson',
        action: 'Login',
        page: '/login',
        timestamp: '2024-01-20T16:45:00Z',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        sessionId: 'sess_002',
        details: 'Successful login'
    },
    {
        id: '5',
        userId: '2',
        userName: 'Sarah Johnson',
        action: 'Page Visit',
        page: '/risk-assessment',
        timestamp: '2024-01-20T16:46:00Z',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        sessionId: 'sess_002',
        details: 'Accessed risk assessment module'
    },
    {
        id: '6',
        userId: '2',
        userName: 'Sarah Johnson',
        action: 'Risk Assessment Updated',
        page: '/risk-assessment',
        timestamp: '2024-01-20T16:50:00Z',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        sessionId: 'sess_002',
        details: 'Updated risk assessment RA-2024-005'
    },
    {
        id: '7',
        userId: '4',
        userName: 'Emily Davis',
        action: 'Login',
        page: '/login',
        timestamp: '2024-01-20T09:15:00Z',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'sess_003',
        details: 'Successful login'
    },
    {
        id: '8',
        userId: '4',
        userName: 'Emily Davis',
        action: 'Audit Created',
        page: '/audits',
        timestamp: '2024-01-20T09:30:00Z',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'sess_003',
        details: 'Created new audit AUD-2024-003'
    },
    {
        id: '9',
        userId: '4',
        userName: 'Emily Davis',
        action: 'Document Downloaded',
        page: '/documents',
        timestamp: '2024-01-20T16:20:00Z',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'sess_003',
        details: 'Downloaded ISO 45001 document'
    },
    {
        id: '10',
        userId: '3',
        userName: 'Michael Brown',
        action: 'Investigation Completed',
        page: '/investigations',
        timestamp: '2024-01-19T15:30:00Z',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'sess_004',
        details: 'Completed investigation INV-2024-002'
    }
];

export const mockUserSessions: any[] = [
    {
        id: 'sess_001',
        userId: '1',
        userName: 'John Smith',
        loginTime: '2024-01-20T14:30:00Z',
        lastActivity: '2024-01-20T16:45:00Z',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        isActive: true,
        pagesVisited: ['/dashboard', '/incident-management', '/users-management', '/settings'],
        actionsPerformed: 5
    },
    {
        id: 'sess_002',
        userId: '2',
        userName: 'Sarah Johnson',
        loginTime: '2024-01-20T16:45:00Z',
        lastActivity: '2024-01-20T16:50:00Z',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        isActive: true,
        pagesVisited: ['/dashboard', '/risk-assessment', '/risk-register'],
        actionsPerformed: 3
    },
    {
        id: 'sess_003',
        userId: '4',
        userName: 'Emily Davis',
        loginTime: '2024-01-20T09:15:00Z',
        lastActivity: '2024-01-20T16:20:00Z',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        isActive: true,
        pagesVisited: ['/dashboard', '/audits', '/audit-plan', '/documents', '/compliance-dashboard'],
        actionsPerformed: 8
    },
    {
        id: 'sess_004',
        userId: '3',
        userName: 'Michael Brown',
        loginTime: '2024-01-19T11:20:00Z',
        lastActivity: '2024-01-19T15:30:00Z',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        isActive: false,
        pagesVisited: ['/dashboard', '/investigations', '/incident-management'],
        actionsPerformed: 4
    },
    {
        id: 'sess_005',
        userId: '5',
        userName: 'Robert Wilson',
        loginTime: '2024-01-18T15:30:00Z',
        lastActivity: '2024-01-18T17:45:00Z',
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        isActive: false,
        pagesVisited: ['/dashboard', '/ppe-request', '/non-conformity'],
        actionsPerformed: 2
    }
];