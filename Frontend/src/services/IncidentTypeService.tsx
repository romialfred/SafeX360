import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/incidents-type";

// /hns/incidents-category/create
const createIncidentsType = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const updateIncidentType = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const GetAllIncidentType = async (incidentData: any) => {
    try {
        const response = await axiosInstance.get(`${url}/getAll`, { params: incidentData });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getAllActiveIncidentType = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const activateIncidentType = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const deactivateIncidentType = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getCountBySeverityLevel = async () => {
    return axiosInstance.get(`${url}/countBySeverityLevel`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getCountByCategory = async () => {
    return axiosInstance.get(`${url}/countByCategory`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getCountByCategoryAndSeverity = async () => {
    return axiosInstance.get(`${url}/countByCategoryAndSeverityLevel`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

export { createIncidentsType, updateIncidentType, GetAllIncidentType, activateIncidentType, deactivateIncidentType, getAllActiveIncidentType, getCountByCategory, getCountBySeverityLevel, getCountByCategoryAndSeverity };