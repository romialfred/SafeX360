import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/incidents-category";

// /hns/incidents-category/create
const createIncidentsCategory = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const updateIncidentCategory = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const GetAllIncidentCategories = async (incidentData: any) => {
    try {
        const response = await axiosInstance.get(`${url}/getAll`, { params: incidentData });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getAllActiveIncidentCategories = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const activateIncidentCategory = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const deactivateIncidentCategory = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
export { createIncidentsCategory, updateIncidentCategory, GetAllIncidentCategories, activateIncidentCategory, deactivateIncidentCategory, getAllActiveIncidentCategories };