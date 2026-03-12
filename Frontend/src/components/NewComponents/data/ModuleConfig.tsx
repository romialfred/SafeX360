import { errorNotification } from "../../../utility/NotificationUtility";
import { getAllModuleFeatures, type ModuleFeatureDto } from "../../../services/ModuleManagementService";

export const moduleConfigurations: any[] = [
    // Prevention Activities
    {
        id: 'non-conformity',
        name: 'Central Findings',
        isEnabled: true,
        category: 'Prevention Activities',
        description: 'Manage central findings and non-conformities'
    },
    {
        id: 'inspections',
        name: 'Inspections Managers',
        isEnabled: true,
        category: 'Prevention Activities',
        description: 'Plan and manage safety inspections'
    },
    {
        id: 'meetings',
        name: 'Meeting Managers',
        isEnabled: true,
        category: 'Prevention Activities',
        description: 'Schedule and track Meeting Managers sessions'
    },
    {
        id: 'management-tour',
        name: 'Leadership Walk',
        isEnabled: true,
        category: 'Prevention Activities',
        description: 'Management safety tours and walks'
    },

    // Monitoring Activities
    {
        id: 'incident-management',
        name: 'Incidents Management',
        isEnabled: true,
        category: 'Monitoring Activities',
        description: 'Report and manage safety incidents'
    },
    {
        id: 'investigations',
        name: 'Investigations',
        isEnabled: true,
        category: 'Monitoring Activities',
        description: 'Conduct incident investigations'
    },
    {
        id: 'action-plans-inc',
        name: 'Action Plans',
        isEnabled: true,
        category: 'Monitoring Activities',
        description: 'Manage incident action plans'
    },

    // Actions Managers
    {
        id: 'pending-actions',
        name: 'Pending Actions',
        isEnabled: true,
        category: 'Actions Managers',
        description: 'Track pending actions and tasks'
    },
    {
        id: 'action-plan',
        name: 'Action Plan',
        isEnabled: true,
        category: 'Actions Managers',
        description: 'Create and manage action plans'
    },
    {
        id: 'recommendations',
        name: 'Recommendations',
        isEnabled: true,
        category: 'Actions Managers',
        description: 'Manage safety recommendations'
    },
    {
        id: 'adhoc-actions',
        name: 'Improvement Ideas',
        isEnabled: true,
        category: 'Actions Managers',
        description: 'Capture and manage improvement ideas and initiatives'
    },

    // Risk Management
    {
        id: 'risk-overview',
        name: 'Risk Overview',
        isEnabled: true,
        category: 'Risk Management',
        description: 'Overview of organizational risks'
    },
    {
        id: 'risk-register',
        name: 'Risk Register',
        isEnabled: true,
        category: 'Risk Management',
        description: 'Maintain risk register'
    },
    {
        id: 'risk-assessment',
        name: 'Risk Assessment',
        isEnabled: true,
        category: 'Risk Management',
        description: 'Conduct risk assessments'
    },
    {
        id: 'chemical-register',
        name: 'Chemical Register',
        isEnabled: true,
        category: 'Risk Management',
        description: 'Manage chemical inventory and risks'
    },

    // PPE Management
    {
        id: 'ppe-overview',
        name: 'PPE Overview',
        isEnabled: true,
        category: 'PPE Management',
        description: 'Overview of PPE status'
    },
    {
        id: 'ppe-monitoring',
        name: 'PPE Monitoring',
        isEnabled: true,
        category: 'PPE Management',
        description: 'Monitor PPE usage and condition'
    },
    {
        id: 'ppe-request',
        name: 'PPE Request',
        isEnabled: true,
        category: 'PPE Management',
        description: 'Request new PPE equipment'
    },

    // Audits Management
    {
        id: 'audit-plan',
        name: 'Annual audit plan',
        isEnabled: true,
        category: 'Audits Management',
        description: 'Plan annual audit schedule'
    },
    {
        id: 'audits',
        name: 'Audits',
        isEnabled: true,
        category: 'Audits Management',
        description: 'Conduct and manage audits'
    },
    {
        id: 'audit-recommendations',
        name: 'Recommendations',
        isEnabled: true,
        category: 'Audits Management',
        description: 'Manage audit recommendations'
    },

    // Compliance Management
    {
        id: 'compliance-dashboard',
        name: 'Dashboard',
        isEnabled: true,
        category: 'Compliance Management',
        description: 'Compliance overview dashboard'
    },
    {
        id: 'requirements',
        name: 'Requirements',
        isEnabled: true,
        category: 'Compliance Management',
        description: 'Manage regulatory requirements'
    },
    {
        id: 'position-assignments',
        name: 'Positions Assignments',
        isEnabled: true,
        category: 'Compliance Management',
        description: 'Assign compliance positions'
    },
    {
        id: 'employee-assignments',
        name: 'Employee Assignments',
        isEnabled: true,
        category: 'Compliance Management',
        description: 'Assign employees to compliance roles'
    },
    {
        id: 'documents',
        name: 'Documents',
        isEnabled: true,
        category: 'Compliance Management',
        description: 'Manage compliance documents'
    },
    {
        id: 'document-validation',
        name: 'Document Validation',
        isEnabled: true,
        category: 'Compliance Management',
        description: 'Validate compliance documents'
    },

    // Knowledge Center
    {
        id: 'lessons-learned',
        name: 'Lesson Learned',
        isEnabled: true,
        category: 'Knowledge Center',
        description: 'Capture and share lessons learned'
    },
    {
        id: 'document-manager',
        name: 'Document Manager',
        isEnabled: true,
        category: 'Knowledge Center',
        description: 'Manage knowledge documents'
    },
    {
        id: 'iso-documents',
        name: 'ISO Standards',
        isEnabled: true,
        category: 'Knowledge Center',
        description: 'Access ISO standards documentation'
    },

    // Safety Communication
    {
        id: 'comm-dashboard',
        name: 'Dashboard',
        isEnabled: true,
        category: 'Safety Communication',
        description: 'Communication overview dashboard'
    },
    {
        id: 'employee-comm',
        name: 'HSE Communications',
        isEnabled: true,
        category: 'Safety Communication',
        description: 'Manage employee communications'
    },
    {
        id: 'notifications',
        name: 'Notification Managers',
        isEnabled: true,
        category: 'Safety Communication',
        description: 'Manage system notifications'
    }
];

// Function to get module configuration
export const getModuleConfig = (moduleId: string): any | undefined => {
    return moduleConfigurations.find(config => config.id === moduleId);
};

// Function to check if module is enabled
export const isModuleEnabled = (moduleId: string): boolean => {
    const config = getModuleConfig(moduleId);
    return config ? config.isEnabled : true; // Default to enabled if not found
};

// Function to update module status
export const updateModuleStatus = (moduleId: string, isEnabled: boolean): void => {
    const config = moduleConfigurations.find(config => config.id === moduleId);
    if (config) {
        config.isEnabled = isEnabled;
    }
};

// --- Dynamic loading from backend ---
const idToKey = (id: string) => id.replace(/-/g, '_');

let flagsLoaded = false;
let loadingPromise: Promise<void> | null = null;

const applyRemoteFlags = (list: ModuleFeatureDto[]) => {
    const map = new Map<string, ModuleFeatureDto>(list.map((m) => [m.module, m]));
    for (const cfg of moduleConfigurations) {
        const remote = map.get(idToKey(cfg.id));
        if (remote) cfg.isEnabled = remote.status === 'ACTIVE';
    }
};

// Load once (idempotent) and apply into local config so consumers of isModuleEnabled() reflect server state.
export const loadModuleFlagsOnce = async (): Promise<void> => {
    if (flagsLoaded) return;
    if (loadingPromise) return loadingPromise;
    loadingPromise = getAllModuleFeatures()
        .then((all) => {
            applyRemoteFlags(all);
            flagsLoaded = true;
        })
        .catch(() => {
            errorNotification('Failed to load module flags');
        })
        .finally(() => {
            loadingPromise = null;
        });
    return loadingPromise;
};

// Force refresh flags from server
export const refreshModuleFlags = async (): Promise<void> => {
    const all = await getAllModuleFeatures();
    applyRemoteFlags(all);
    flagsLoaded = true;
};
