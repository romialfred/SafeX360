import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/corrective-action";

/**
 * Action corrective (CAPA). Les sources possibles sont des FK nullables :
 * incidentId, hsActivityId, nonConformityId, inspectionId et, depuis le
 * Plan de maitrise (ISO 45001 §8.1.2), riskControlId.
 */
export interface CorrectiveAction {
    id?: number;
    actionName: string;
    description?: string;
    assignedEmployeeId?: number | string | null;
    assignedEmployeeName?: string;
    deadline?: string | null;
    status?: string;
    progress?: number;
    departmentId?: number | string | null;
    ownerId?: number | string | null;
    riskControlId?: number | null;
}


const createCorrectiveAction = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => {
            return response.data;
        });
}

const removeCorrectiveAction = async (id: string | number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((response) => response.data);
}


const getAllCorrectiveAction = async (params?: Record<string, unknown>) => {
    return axiosInstance.get(`${url}/getAll`, { params })
        .then((response) => {
            return response.data;
        });
}

const getAllAdhoc = async () => {
    return axiosInstance.get(`${url}/getAllAdhoc`)
        .then((response) => {
            return response.data;
        });
}

const updateCorrectiveAction = async (data: Record<string, unknown>) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => response.data);
}

const getCorrectiveActionByIncidentId = async (id: number) => {
    return axiosInstance.get(`${url}/getByIncidentId/${id}`)
        .then((response) => response.data);
}

const getCorrectiveActionByInspectionId = async (id: number) => {
    return axiosInstance.get(`${url}/getByInspectionId/${id}`)
        .then((response) => response.data);
}
const getCorrectiveActionByActivityId = async (id: number) => {
    return axiosInstance.get(`${url}/getByActivityId/${id}`)
        .then((response) => response.data);
}
const getActionsByNonConformityId = async (id: number) => {
    return axiosInstance.get(`${url}/getByNonConformityId/${id}`)
        .then((response) => response.data);
}

const getCorrectiveActionsByDepartmentId = async (departmentId: string | number) => {
    return axiosInstance.get(`${url}/getByDepartmentId/${departmentId}`)
        .then((response) => response.data);
}

// Plan de maitrise (RiskControl) : actions correctives rattachees a une mesure.
const getCorrectiveActionsByRiskControl = async (riskControlId: string | number) => {
    return axiosInstance.get(`${url}/by-risk-control/${riskControlId}`)
        .then((response) => response.data);
}

const getActionById = async (id: number) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
}
const getPendingAdhocActions = async () => {
    return axiosInstance.get(`${url}/getAllPendingAdhoc`)
        .then((response) => response.data);
}

// Get all pending corrective actions
const getAllPending = async () => {
    return axiosInstance.get(`${url}/getAllPending`)
        .then((response) => response.data);
};

// Get adhoc action rich-text description by ID
const getCorrectiveActionDescription = async (id: number | string) => {
    return axiosInstance.get(`${url}/getDescription/${id}`)
        .then((response) => response.data);
}

// Approve a corrective action (move to IN_PROGRESS)
const approveCorrectiveAction = async (id: number | string) => {
    return axiosInstance.put(`${url}/approve/${id}`)
        .then((response) => response.data);
}

// Cancel a corrective action (move to CANCELLED)
const cancelCorrectiveAction = async (id: number | string) => {
    return axiosInstance.put(`${url}/cancel/${id}`)
        .then((response) => response.data);
}
export {
    removeCorrectiveAction,
    getAllAdhoc,
    getAllCorrectiveAction,
    updateCorrectiveAction,
    getCorrectiveActionByIncidentId,
    createCorrectiveAction,
    getCorrectiveActionByInspectionId,
    getCorrectiveActionByActivityId,
    getActionsByNonConformityId,
    getCorrectiveActionsByDepartmentId,
    getCorrectiveActionsByRiskControl,
    getActionById,
    getPendingAdhocActions,
    getAllPending,
    approveCorrectiveAction,
    cancelCorrectiveAction,
    getCorrectiveActionDescription
};
