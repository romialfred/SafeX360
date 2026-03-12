import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/corrective-action";


const createCorrectiveAction = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const removeCorrectiveAction = async (id: string | number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}


const getAllCorrectiveAction = async (incidentData: any) => {
    return axiosInstance.get(`${url}/getAll`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getAllAdhoc = async () => {
    return axiosInstance.get(`${url}/getAllAdhoc`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const updateCorrectiveAction = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getCorrectiveActionByIncidentId = async (id: any) => {
    return axiosInstance.get(`${url}/getByIncidentId/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getCorrectiveActionByInspectionId = async (id: any) => {
    return axiosInstance.get(`${url}/getByInspectionId/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getCorrectiveActionByActivityId = async (id: any) => {
    return axiosInstance.get(`${url}/getByActivityId/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getActionsByNonConformityId = async (id: any) => {
    return axiosInstance.get(`${url}/getByNonConformityId/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getCorrectiveActionsByDepartmentId = async (departmentId: string | number) => {
    return axiosInstance.get(`${url}/getByDepartmentId/${departmentId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getActionById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getPendingAdhocActions = async () => {
    return axiosInstance.get(`${url}/getAllPendingAdhoc`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

// Get all pending corrective actions
const getAllPending = async () => {
    return axiosInstance.get(`${url}/getAllPending`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// Get adhoc action rich-text description by ID
const getCorrectiveActionDescription = async (id: number | string) => {
    return axiosInstance.get(`${url}/getDescription/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

// Approve a corrective action (move to IN_PROGRESS)
const approveCorrectiveAction = async (id: number | string) => {
    return axiosInstance.put(`${url}/approve/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

// Cancel a corrective action (move to CANCELLED)
const cancelCorrectiveAction = async (id: number | string) => {
    return axiosInstance.put(`${url}/cancel/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
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
    getActionById,
    getPendingAdhocActions,
    getAllPending,
    approveCorrectiveAction,
    cancelCorrectiveAction,
    getCorrectiveActionDescription
};
