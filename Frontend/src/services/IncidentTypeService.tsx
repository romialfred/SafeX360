import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/incidents-type";

// /hns/incidents-category/create
const createIncidentsType = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => {
            return response.data;
        });
}

const updateIncidentType = async (data: Record<string, unknown>) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => {
            return response.data;
        });
}
const GetAllIncidentType = async (data: Record<string, unknown>) => {
    const response = await axiosInstance.get(`${url}/getAll`, { params: data });
    return response.data;
};

const getAllActiveIncidentType = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data);
}
const activateIncidentType = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}

const deactivateIncidentType = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}

const getCountBySeverityLevel = async () => {
    return axiosInstance.get(`${url}/countBySeverityLevel`)
        .then((response) => response.data);
}

const getCountByCategory = async () => {
    return axiosInstance.get(`${url}/countByCategory`)
        .then((response) => response.data);
}
const getCountByCategoryAndSeverity = async () => {
    return axiosInstance.get(`${url}/countByCategoryAndSeverityLevel`)
        .then((response) => response.data);
}

export { createIncidentsType, updateIncidentType, GetAllIncidentType, activateIncidentType, deactivateIncidentType, getAllActiveIncidentType, getCountByCategory, getCountBySeverityLevel, getCountByCategoryAndSeverity };