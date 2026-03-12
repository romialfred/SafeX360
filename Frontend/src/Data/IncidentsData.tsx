const severity = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
]


const PgiFrequency = [
    { value: 'ANNUALLY', label: 'Annually' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'MONTHLY', label: 'Monthly' },

]
const lessondata = [
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" }
]
const HSEFrequency = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'ANNUAL', label: 'Annual' },
    { value: 'AD_HOC', label: 'Ad Hoc' },



]

const PPE = [
    { value: 'REQUIRED', label: 'Required' },
    { value: 'OPTIONAL', label: 'Optional' },

]

const auditType = [
    { value: 'INTERNAL', label: 'Internal' },
    { value: 'EXTERNAL', label: 'External' },

]

const recommendationTableData = [
    {
        recommendation: 'Enhance Risk Assessment Documentation',
        audit: 'Annual Safety Management System Audit',
        department: 'Safety',
        date: '2024-06-30',
        status: 'in progress',
        progress: '35%',
    },
    {
        recommendation: 'Implement Multi-Factor Authentication',
        audit: 'ISO 27001 Information Security Audit',
        department: 'IT',
        date: '2024-07-31',
        status: 'pending',
        progress: '0%',
    },
    {
        recommendation: 'Regular Security Training Program',
        audit: 'ISO 27001 Information Security Audit',
        department: 'IT',
        date: '2024-08-15',
        status: 'in progress',
        progress: '25%',
    },
];



const incidentData = [
    {
        name: 'Database Outage',
        type: 'Outage',
        level: 'Critical',
        occurred: '2025-04-10 14:32',
        status: 'Resolved'
    },
    {
        name: 'Unauthorized Access Attempt',
        type: 'Security',
        level: 'High',
        occurred: '2025-04-11 09:15',
        status: 'Investigating'
    },
    {
        name: 'API Latency Spike',
        type: 'Performance',
        level: 'Medium',
        occurred: '2025-04-09 18:45',
        status: 'Monitoring'
    },
    {
        name: 'Service Restart Required',
        type: 'Maintenance',
        level: 'Low',
        occurred: '2025-04-08 11:05',
        status: 'Scheduled'
    },
    {
        name: 'Login Issues Reported',
        type: 'User Issue',
        level: 'Medium',
        occurred: '2025-04-12 08:22',
        status: 'Open'
    }
];
const ActionData = [
    {
        incident: 'Equipment Malfunction - Drill Rig Failure',
        severity: 'Level 3',
        actionPlan: 'Hydraulic System Overhaul',
        assigned: 'John Doe',
        department: 'maintenance',
        deadline: '15/3/2024',
        progress: '50%',
        status: 'in progress',
        actions: 'Update',
    },
    {
        incident: 'Equipment Malfunction - Drill Rig Failure',
        severity: 'Level 3',
        actionPlan: 'Safety Protocol Update',
        assigned: 'Robert',
        department: 'safety',
        deadline: '20/3/2024',
        progress: '0%',
        status: 'pending',
        actions: 'Update',
    },
    {
        incident: 'Chemical Spill - Storage Area',
        severity: 'Level 4',
        actionPlan: 'Containment System Upgrade',
        assigned: 'Luis',
        department: 'environmental',
        deadline: '1/4/2024',
        progress: '0%',
        status: 'pending',
        actions: 'Update',
    },
];


const InspectionData = [
    {
        name: "Fire Extinguisher Check",
        shortName: "FEC",
        type: "Safety Audit",
        level: "High",
        occurred: "2025-04-12 11:00",
        status: "ACTIVE"
    },
    {
        name: "Emergency Exit Review",
        shortName: "EER",
        type: "Compliance Inspection",
        level: "Medium",
        occurred: "2025-03-30 09:30",
        status: "PENDING"
    },
    {
        name: "Equipment Calibration",
        shortName: "EC",
        type: "Routine Check",
        level: "Low",
        occurred: "2025-04-05 15:20",
        status: "INACTIVE"
    },
    {
        name: "Chemical Storage Audit",
        shortName: "CSA",
        type: "Hazard Inspection",
        level: "Critical",
        occurred: "2025-03-20 08:45",
        status: "RETURNED"
    }
];

const sampleData1 = [
    {
        "id": 1,
        "day1": { "day": "" },
        "day2": { "day": "" },
        "day3": { "day": "" },
        "day4": { "day": "1" },
        "day5": { "day": "2" },
        "day6": { "day": "3" },
        "day7": { "day": "4" }
    },
    {
        "id": 2,
        "day1": { "day": "5" },
        "day2": { "day": "6" },
        "day3": { "day": "7" },
        "day4": { "day": "8" },
        "day5": { "day": "9" },
        "day6": { "day": "10" },
        "day7": { "day": "11" }
    },
    {
        "id": 3,
        "day1": { "day": "12" },
        "day2": { "day": "13" },
        "day3": { "day": "14" },
        "day4": { "day": "15" },
        "day5": { "day": "16" },
        "day6": { "day": "17" },
        "day7": { "day": "18" }
    },
    {
        "id": 4,
        "day1": { "day": "19" },
        "day2": { "day": "20" },
        "day3": { "day": "21" },
        "day4": { "day": "22" },
        "day5": { "day": "23" },
        "day6": { "day": "24" },
        "day7": { "day": "25" }
    },
    {
        "id": 5,
        "day1": { "day": "26" },
        "day2": { "day": "27" },
        "day3": { "day": "28" },
        "day4": { "day": "29" },
        "day5": { "day": "30" },
        "day6": { "day": "31" },
        "day7": { "day": "" }
    }
];

const AuditsData = [
    {
        id: 1,
        title: 'Workplace Safety Audit',
        type: 'Internal',
        objective: ['Conformity assessment', 'Continuous improvement'],
        sites: ['Mining areas', 'Equipment'],
        ppe: 'Required',
    },
    {
        id: 2,
        title: 'ISO Compliance Check',
        type: 'External',
        objective: ['ISO certification'],
        sites: ['Specific facilities'],
        ppe: 'Optional',
    },
    {
        id: 3,
        title: 'Fire Safety Drill Audit',
        type: 'Internal',
        objective: ['Continuous improvement'],
        sites: ['Office buildings', 'Warehouses'],
        ppe: 'Required',
    },
    {
        id: 4,
        title: 'Health and Hygiene Inspection',
        type: 'External',
        objective: ['Conformity assessment'],
        sites: ['Canteens', 'Restrooms'],
        ppe: 'Optional',
    },
    {
        id: 5,
        title: 'Environmental Impact Review',
        type: 'Internal',
        objective: ['ISO certification', 'Conformity assessment'],
        sites: ['Construction sites', 'Mining areas'],
        ppe: 'Required',
    },
    {
        id: 6,
        title: 'Chemical Safety Evaluation',
        type: 'Internal',
        objective: ['Continuous improvement'],
        sites: ['Lab facilities'],
        ppe: 'Required',
    },
    {
        id: 7,
        title: 'Supply Chain Audit',
        type: 'External',
        objective: ['ISO certification', 'Conformity assessment'],
        sites: ['Warehouse', 'Logistics center'],
        ppe: 'Optional',
    },
];

const Categorydata = [
    { name: 'Alpha Team', status: 'Pending' },
    { name: 'Bravo Squad', status: 'Inactive' },
    { name: 'Charlie Group', status: 'Active' },
    { name: 'Delta Force', status: 'Pending' },
    { name: 'Echo Unit', status: 'Active' },

];

const IncidentTypesData = [
    {
        id: 1,
        name: "Unauthorized Access",
        incidentCategory: "Security",
        description: "Unauthorized login attempt detected.",
        status: "ACTIVE"
    },
    {
        id: 2,
        name: "Server Outage",
        incidentCategory: "Infrastructure",
        description: "Server went down unexpectedly.",
        status: "INACTIVE"
    },
    {
        id: 3,
        name: "Data Breach",
        incidentCategory: "Security",
        description: "Sensitive data leaked externally.",
        status: "ACTIVE"
    },
    {
        id: 4,
        name: "Compliance Violation",
        incidentCategory: "Compliance",
        description: "Regulatory compliance not met.",
        status: "INACTIVE"
    }
];
const SeverityLevelsData = [
    {
        id: 1,
        name: 'Critical',
        incidentType: 'Security',
        description: 'Critical security breach.',
        color: '#FF0000',
        status: 'ACTIVE',
    },
    {
        id: 2,
        name: 'High',
        incidentType: 'Application',
        description: 'High severity application issue.',
        color: '#FFA500',
        status: 'INACTIVE',
    },
    {
        id: 3,
        name: 'Medium',
        incidentType: 'Infrastructure',
        description: 'Medium severity infrastructure issue.',
        color: '#FFFF00',
        status: 'ACTIVE',
    },
    {
        id: 4,
        name: 'Low',
        incidentType: 'Compliance',
        description: 'Low severity compliance issue.',
        color: '#008000',
        status: 'INACTIVE',
    },
];

const LocationDataMockss = [
    { id: 1, name: "Location A", location: "New York", status: "ACTIVE" },
    { id: 2, name: "Location B", location: "Los Angeles", status: "INACTIVE" },
    { id: 3, name: "Location C", location: "Chicago", status: "ACTIVE" },
    { id: 4, name: "Location D", location: "San Francisco", status: "ACTIVE" },
    { id: 5, name: "Location E", location: "Miami", status: "INACTIVE" },
    { id: 6, name: "Location F", location: "Dallas", status: "ACTIVE" },

];
const weatherdatas = [
    { id: 1, name: "Clear Sky", description: "Bright and clear weather with no clouds.", status: "ACTIVE" },
    { id: 2, name: "Rainy", description: "Heavy rain with occasional thunderstorms.", status: "INACTIVE" },
    { id: 3, name: "Partly Cloudy", description: "Some clouds in the sky but mostly sunny.", status: "ACTIVE" },
    { id: 4, name: "Snowy", description: "Snowfall with low visibility and cold temperatures.", status: "ACTIVE" },
    { id: 5, name: "Windy", description: "Strong winds with occasional gusts.", status: "INACTIVE" },
    { id: 6, name: "Foggy", description: "Visibility is significantly reduced due to fog.", status: "ACTIVE" }

];

const ppeRecord: Record<string, string> = {
    helmet: "Safety Helmet",
    goggles: "Safety Goggles",
    gloves: "Safety Gloves",
    boots: "Safety Boots",
    vest: "High-Visibility Vest",
    mask: "Respiratory Mask",
    harness: "Safety Harness"
};

const severityLevelMap: Record<string, string> = {
    low: "1 - Low Impact",
    medium: "2 - Medium Impact",
    high: "3 - High Impact",
    critical: "4 - Critical Impact"
};
const statusLabels: Record<string, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
};

const statusColors: Record<string, string> = {
    PENDING: "orange",
    IN_PROGRESS: "blue",
    COMPLETED: "green",
    CANCELLED: "red",
};

const Teamsetup = [
    {
        id: 1,
        name: "Fire Safety Team",
        CategoryName: "Emergency Response",
        description: "Handles all fire-related emergencies and drills.",
        status: "ACTIVE",
    },
    {
        id: 2,
        name: "First Aid Group",
        CategoryName: "Medical Support",
        description: "Provides immediate medical aid in case of injuries.",
        status: "INACTIVE",
    },
    {
        id: 3,
        name: "Evacuation Crew",
        CategoryName: "Emergency Response",
        description: "Responsible for safe and orderly evacuations.",
        status: "ACTIVE",
    },
    {
        id: 4,
        name: "Hazard Inspection Team",
        CategoryName: "Safety Audit",
        description: "Conducts routine inspections for workplace hazards.",
        status: "INACTIVE",
    },
];

export { incidentData, ActionData, InspectionData, severity, PgiFrequency, sampleData1, AuditsData, PPE, auditType, Categorydata, IncidentTypesData, SeverityLevelsData, LocationDataMockss, weatherdatas, ppeRecord, severityLevelMap, statusLabels, Teamsetup, statusColors, HSEFrequency, recommendationTableData, lessondata }