const actionStatuses = [{ label: "Pending", value: "PENDING" }, { label: "In-Progress", value: "IN_PROGRESS" }, { label: "Canceled", value: "CANCELLED" }, { label: "Completed", value: "COMPLETED" }]

const actionStatusesMap: Record<string, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In-Progress",
    CANCELLED: "Canceled",
    COMPLETED: "Completed"
}

const auditAreadata = [
    { label: "Process", value: "PROCESS" },
    { label: "System", value: "SYSTEM" },
    { label: "People", value: "PEOPLE" },
    { label: "OPEX Account", value: "OPEX ACCOUNT" },
    { label: "APEX Account", value: "APEX ACCOUNT" },
    { label: "Other", value: "OTHER" }
]

const inspectionTypesMap: Record<string, string> = {
    mechanical: "Mechanical",
    chemical: "Chemical",
    electrical: "Electrical",
    environmental: "Environmental",
    ergonomic: "Ergonomic"
};

const activityTypes = [{ label: "Health & Safety Meeting", value: "HSM" }, { label: "Steering Committee Tour", value: "ST" }]
const activityTypesMap: Record<string, string> = {
    HSM: "Health & Safety Meeting",
    ST: "Steering Committee Tour"
};
const auditTypes = ["Financial", "IT System", "Process", "Compliance", "Quality", "Environmental"]
const PlannedMethod = ["Individual interviews", "Group interviews", "Field observations", "Document verification", "Equipment Inspection", "Tests and measurements", "Sample analysis", "Emergency simulation"]

const auditCategories = [{ label: "Internal", value: "INTERNAL" }, { label: "External", value: "EXTERNAL" }]

const recommendationStatus = [{ label: "Pending", value: "PENDING" }, { label: "In Progress", value: "IN_PROGRESS" }, { label: "Completed", value: "COMPLETED" }]

const recMap: Record<string, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled"
}

const severityLevels = [{ label: 'Level 1', value: '1' }, { label: 'Level 2', value: '2' }, { label: 'Level 3', value: '3' }, { label: "Level 4", value: "4" }, { label: "Level 5", value: "5" }]
const severityMap: Record<string, string> = {
    '1': 'Level 1',
    '2': 'Level 2',
    '3': 'Level 3',
    '4': 'Level 4',
    '5': 'Level 5'
}

const investMethod = [
    { label: "ICAM (Incident Cause Analysis Method)", value: "ICAM" },
    { label: "Méthode des 5 Pourquoi", value: "M5P" },
    { label: "Ishikawa – Diagramme 6M", value: "ISH" },
    { label: "Arbre des causes", value: "AC" },
    { label: "FTA – Fault Tree Analysis", value: "FTA" },
    { label: "Analyse des systèmes (SMS)", value: "SMS" },
    { label: "Root Cause Analysis (RCA)", value: "RCA" }
]
const investMethodMap: Record<string, string> = {
    ICAM: "Incident Cause Analysis Method",
    M5P: "Méthode des 5 Pourquoi",
    ISH: "Diagramme d'Ishikawa (6M)",
    AC: "Arbre des causes",
    FTA: "Fault Tree Analysis",
    SMS: "Analyse des systèmes (SMS)",
    RCA: "Root Cause Analysis (RCA)"
}

const incidentStatuses = [
    { label: "Pending", value: "PENDING" },
    { label: "Reported ", value: "REPORTED" },
    { label: "Investigation", value: "INVESTIGATION" },
    { label: "Investigated", value: "INVESTIGATION_COMPLETED" },
    { label: "CA in progress", value: "CORRECTIVE_ACTIONS" },
    { label: "Closed", value: "CLOSED" },
    { label: "Rejected", value: "REJECTED" },
]

const incidentHistoryStatus = [
    { label: "Pending", value: "PENDING" },
    { label: "Reported ", value: "REPORTED" },
    { label: "Investigation", value: "INVESTIGATION" },
    { label: "Investigated", value: "INVESTIGATION_COMPLETED" },
    { label: "CA in progress", value: "CORRECTIVE_ACTIONS" },
    { label: "Closed", value: "CLOSED" },
    { label: "Rejected", value: "REJECTED" },
]

const incidentStatusMap: Record<string, string> = {
    PENDING: "Pending",
    REPORTED: "Reported",
    INVESTIGATION: "Investigation",
    INVESTIGATION_COMPLETED: "Investigated",
    CORRECTIVE_ACTIONS: "CA in progress",
    CLOSED: "Closed",
    REJECTED: "Rejected",
}

const riskLevels: { [key: string]: string } = {
    "1": "Low",
    "2": "Low",
    "3": "Medium",
    "4": "Medium",
    "5": "High"
}

const severities = [
    { label: "1 - Negligible", value: "1" },
    { label: "2 - Minor", value: "2" },
    { label: "3 - Moderate", value: "3" },
    { label: "4 - Major", value: "4" },
    { label: "5 - Catastrophic", value: "5" }
]
const probabilities = [
    { label: "1 - Very Unlikely", value: "1" },
    { label: "2 - Unlikely", value: "2" },
    { label: "3 - Possible", value: "3" },
    { label: "4 - Likely", value: "4" },
    { label: "5 - Very Likely", value: "5" }
]
const gravities = [
    { value: '1', label: '1 - Low' },
    { value: '2', label: '2 - Low-Medium' },
    { value: '3', label: '3 - Medium' },
    { value: '4', label: '4 - High' },
    { value: '5', label: '5 - Critical' }
]
const gravitiesMap: Record<string, string> = {
    '1': 'Low',
    '2': 'Low-Medium',
    '3': 'Medium',
    '4': 'High',
    '5': 'Critical'
}
const severitiesMap: Record<string, string> = {
    '1': 'Negligible',
    '2': 'Minor',
    '3': 'Moderate',
    '4': 'Major',
    '5': 'Catastrophic'
}
const probabilitiesMap: Record<string, string> = {
    '1': 'Very Unlikely',
    '2': 'Unlikely',
    '3': 'Possible',
    '4': 'Likely',
    '5': 'Very Likely'
}
const actionTypesMap: any = {
    "INCIDENT": "Incident",
    "GENERAL_INSPECTION": "General Inspection",
    "HS_ACTIVITY": "Health & Safety Activity",
    'NON_CONFORMITY': 'Non-Conformity',
    'NEAR_MISS': 'Near Miss',
    'HAZARD': 'Hazard',
    'ADHOC': 'Improvement Ideas'
}

const mantineColorToLevel: Record<string, string> = {
    "1": "green",
    "2": "yellow",
    "3": "orange",
    "4": "red",
    "5": "brown"
}
const tailwindColorToLevel: Record<string, string> = {
    "1": "bg-green-100 text-green-800",
    "2": "bg-yellow-100 text-yellow-800",
    "3": "bg-orange-100 text-orange-800",
    "4": "bg-red-100 text-red-800",
    "5": "bg-brown-100 text-brown-800"
}

const auditTypesLabels = [
    'Audit de conformité réglementaire',
    'Audit de conformité normative',
    'Audit interne',
    'Audit fournisseur',
    'Audit de certification',
    'Audit d\'investigation',
    'Audit croisé',
    'Audit d\'efficacité',
    'Audit HSE intégré',
    'Audit de processus'
];

const criteriaByLabel: any = {
    'Audit de conformité réglementaire': [
        'Code du Travail',
        'Réglementation ICPE',
        'Réglementation environnementale',
        'Règlement minier',
        'Arrêtés préfectoraux',
        'Réglementation transport de matières dangereuses'
    ],
    'Audit de conformité normative': [
        'ISO 45001:2018 (Santé et Sécurité au Travail)',
        'ISO 14001:2015 (Management Environnemental)',
        'ISO 9001:2015 (Management de la Qualité)',
        'ISO 17025:2017 (Laboratoires d\'essais)',
        'ISO 50001:2018 (Management de l\'Énergie)',
        'ISO 27001:2013 (Sécurité de l\'Information)'
    ],
    'Audit interne': [
        'ISO 45001:2018 (Santé et Sécurité au Travail)',
        'ISO 14001:2015 (Management Environnemental)',
        'ISO 9001:2015 (Management de la Qualité)',
        'Procédures internes SSE',
        'Politique SSE de l\'entreprise',
        'Manuel de management intégré',
        'Instructions de travail'
    ],
    'Audit de certification': [
        'ISO 45001:2018 (Santé et Sécurité au Travail)',
        'ISO 14001:2015 (Management Environnemental)',
        'ISO 9001:2015 (Management de la Qualité)',
        'Exigences de l\'organisme certificateur',
        'Référentiel de certification spécifique'
    ],
    'Audit fournisseur': [
        'Exigences contractuelles',
        'ISO 9001:2015 (Qualité Fournisseur)',
        'ISO 45001:2018 (SST Fournisseur)',
        'Politique d\'achat responsable',
        'Cahier des charges technique',
        'Code de conduite fournisseurs'
    ],
    'Audit d\'investigation': [
        'Procédures internes d\'incident',
        'Réglementation locale SSE',
        'ISO 45001:2018 (Investigation d\'incidents)',
        'Méthodes d\'analyse des causes',
        'Procédures d\'urgence'
    ],
    'Audit croisé': [
        'ISO 45001:2018',
        'ISO 14001:2015',
        'Procédures internes',
        'Bonnes pratiques sectorielles',
        'Benchmarks industriels'
    ],
    'Audit d\'efficacité': [
        'Indicateurs de performance SSE',
        'Objectifs et cibles',
        'Tableaux de bord',
        'Retour sur investissement SSE',
        'Amélioration continue'
    ],
    'Audit HSE intégré': [
        'ISO 45001:2018 (Santé et Sécurité)',
        'ISO 14001:2015 (Environnement)',
        'Réglementations locales SSE',
        'Système de management intégré',
        'Politique HSE intégrée'
    ],
    'Audit de processus': [
        'Cartographie des processus',
        'Procédures opérationnelles',
        'Interfaces entre processus',
        'Indicateurs de processus',
        'Maîtrise des risques processus'
    ]
};


const observationTypes = [
    { value: "Observation", label: "Observation" },
    { value: "Compliance", label: "Compliance" },
    { value: "Non-compliance", label: "Non-compliance" },
    { value: "Opportunity for improvement", label: "Opportunity for improvement" }
];

const auditStatuses = [
    { label: "Planification", value: "PLANNING" },
    { label: "Préparation", value: "PREPARATION" },
    { label: "Exécution", value: "EXECUTION" },
    { label: "Clôturés", value: "CLOSED" },
    { label: "Annulés", value: "CANCELLED" },
]

const inspectionStatuses = [
    { label: "En attente", value: "PENDING" },
    { label: "En cours", value: "IN_PROGRESS" },
    { label: "Terminée", value: "COMPLETED" },
    { label: "Annulée", value: "CANCELLED" },
]
const auditStatusMap: Record<string, string> = {
    PLANNING: "Planification",
    PREPARATION: "Préparation",
    EXECUTION: "Exécution",
    CLOSED: "Clôturé",
    CANCELLED: "Annulé"
}



const eventTypes = [
    { label: 'Non-Conformity', value: 'NON_CONFORMITY' },
    { label: 'Near Miss', value: 'NEAR_MISS' },
    { label: "Hazard", value: "HAZARD" }
]
const eventTypesMap: Record<string, string> = {
    NON_CONFORMITY: "Non-Conformity",
    NEAR_MISS: "Near Miss",
    HAZARD: "Hazard"
}
const eventStatuses = [
    { label: "Reported", value: "REPORTED" },
    { label: "Analysis", value: "ANALYSIS" },
    { label: "AC Implementation", value: "AC_IMPLEMENTATION" },
    { label: "Closed", value: "CLOSED" },
    { label: "Cancelled", value: "CANCELLED" }
]
const eventStatusMap: Record<string, string> = {
    REPORTED: "Reported",
    ANALYSIS: "Analysis",
    AC_IMPLEMENTATION: "AC Implementation",
    CLOSED: "Closed",
    CANCELLED: "Cancelled"
}
const analysisMethods = [
    { value: '5 Pourquoi', label: '5 Pourquoi' },
    { value: 'Ishikawa', label: 'Diagramme d\'Ishikawa' },
    { value: 'ICAM', label: 'ICAM (Incident Cause Analysis)' },
    { value: 'AMDEC', label: 'AMDEC' },
    { value: 'Arbre des causes', label: 'Arbre des causes' },
    { value: 'Brainstorming', label: 'Brainstorming' },
    { value: 'Autre', label: 'Autre méthode' }
]
const analysisMethodsMap: Record<string, string> = {
    '5 Pourquoi': '5 Pourquoi',
    'Ishikawa': 'Diagramme d\'Ishikawa',
    'ICAM': 'ICAM (Incident Cause Analysis)',
    'AMDEC': 'AMDEC',
    'Arbre des causes': 'Arbre des causes',
    'Brainstorming': 'Brainstorming',
    'Autre': 'Autre méthode'
}


const auditorRoles = ["Lead Auditor", "Auditor", "Technical Expert", "Observer", "Audit Reporter"];

const riskMap: Record<string, any> = {
    "11": { level: "Low", color: "green" },
    "12": { level: "Low", color: "green" },
    "13": { level: "Low", color: "green" },
    "14": { level: "Low", color: "green" },
    "15": { level: "Low Med", color: "limegreen" },

    // Unlikely (row 2)
    "21": { level: "Low", color: "green" },
    "22": { level: "Low", color: "green" },
    "23": { level: "Low Med", color: "limegreen" },
    "24": { level: "Low Med", color: "limegreen" },
    "25": { level: "Medium", color: "yellow" },

    // Possible (row 3)
    "31": { level: "Low", color: "green" },
    "32": { level: "Low Med", color: "limegreen" },
    "33": { level: "Low Med", color: "limegreen" },
    "34": { level: "Medium", color: "yellow" },
    "35": { level: "Med High", color: "orange" },

    // Likely (row 4)
    "41": { level: "Low", color: "green" },
    "42": { level: "Low Med", color: "limegreen" },
    "43": { level: "Medium", color: "yellow" },
    "44": { level: "Med High", color: "orange" },
    "45": { level: "High", color: "red" },

    // Almost Certain (row 5)
    "51": { level: "Low Med", color: "limegreen" },
    "52": { level: "Medium", color: "yellow" },
    "53": { level: "Med High", color: "orange" },
    "54": { level: "High", color: "red" },
    "55": { level: "High", color: "red" },
};
// Maps a risk matrix key to a 1-5 risk level score based on riskMap.level
// Ranking: Low=1, Low Med=2, Medium=3, Med High=4, High=5
// Examples: '11' (Low) -> '1', '15' (Low Med) -> '2', '45' (High) -> '5'
const riskKeyToSeverity: Record<string, string> = (() => {
    const rank: Record<string, number> = {
        'Low': 1,
        'Low Med': 2,
        'Medium': 3,
        'Med High': 4,
        'High': 5,
    };
    const map: Record<string, string> = {};
    for (const key of Object.keys(riskMap)) {
        const level = riskMap[key]?.level as string | undefined;
        if (level && rank[level] !== undefined) {
            map[key] = String(rank[level]);
        }
    }
    return map;
})();
// Alias for clarity in other modules
const riskKeyToLevelScore: Record<string, string> = riskKeyToSeverity;
export { actionStatuses, inspectionTypesMap, activityTypes, activityTypesMap, auditTypes, auditCategories, auditAreadata, recommendationStatus, recMap, severityLevels, severityMap, investMethod, investMethodMap, incidentStatuses, incidentStatusMap, riskLevels, severities, probabilities, severitiesMap, probabilitiesMap, actionTypesMap, mantineColorToLevel, tailwindColorToLevel, incidentHistoryStatus, PlannedMethod, actionStatusesMap, auditTypesLabels, criteriaByLabel, observationTypes, auditStatuses, auditStatusMap, eventTypes, eventTypesMap, eventStatuses, eventStatusMap, analysisMethods, analysisMethodsMap, inspectionStatuses, auditorRoles, gravitiesMap, gravities, riskMap, riskKeyToSeverity, riskKeyToLevelScore };
