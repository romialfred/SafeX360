import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/incident-investigation";

const reportInvestigation = async (investigationData: any) => {
    return axiosInstance.post(`${url}/create`, investigationData)
        .then((response) => {
            return response.data;
        });
}
const updateInvestigation = async (investigationData: any) => {
    return axiosInstance.put(`${url}/update`, investigationData)
        .then((response) => {
            return response.data;
        });
}

const getInvestigationById = async (id: any) => {
    return axiosInstance.get(`${url}/getById/${id}`)
        .then((response) => {
            return response.data;
        });
}
const getAllInvestigations = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => {
            return response.data;
        });
}
const getInvestigationByIncidentId = async (incidentId: any) => {
    return axiosInstance.get(`${url}/getByIncidentId/${incidentId}`)
        .then((response) => {
            return response.data;
        });
}

// Validation par un pair indépendant (ISO 45001 §10.2) — prérequis à la clôture.
const validateInvestigation = async (id: number | string, comment?: string) => {
    return axiosInstance.put(`${url}/${id}/validate`, { comment: comment ?? null })
        .then((response) => response.data);
};

export { reportInvestigation, getInvestigationById, getAllInvestigations, getInvestigationByIncidentId, updateInvestigation, validateInvestigation };