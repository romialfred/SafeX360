import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/incident-investigation";

const reportInvestigation = async (investigationData: any) => {
    return axiosInstance.post(`${url}/create`, investigationData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const updateInvestigation = async (investigationData: any) => {
    return axiosInstance.put(`${url}/update`, investigationData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getInvestigationById = async (id: any) => {
    return axiosInstance.get(`${url}/getById/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getAllInvestigations = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getInvestigationByIncidentId = async (incidentId: any) => {
    return axiosInstance.get(`${url}/getByIncidentId/${incidentId}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

export { reportInvestigation, getInvestigationById, getAllInvestigations, getInvestigationByIncidentId, updateInvestigation };