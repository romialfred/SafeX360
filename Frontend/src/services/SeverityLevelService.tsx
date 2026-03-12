import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/severity-level";

// /hns/incidents-category/create
const createSeverityLevel = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const createMultipleSeverityLevels = async (incidentData: any) => {
    return axiosInstance.post(`${url}/createMultiple`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const updateSeverityLevel = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const GetAllSeverityLevel = async (incidentData: any) => {
    try {
        const response = await axiosInstance.get(`${url}/getAll`, { params: incidentData });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getAllActiveSeverityLevel = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const activateSeverityLevel = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const deactivateSeverityLevel = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const addSeverityExample = async (body: any) => {
    return axiosInstance.post(`${url}/addExample`, body)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const removeSeverityExample = async (index: any, id: any) => {
    return axiosInstance.delete(`${url}/deleteExample/${index}/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getUniqueSeverityLevel = async () => {
    return axiosInstance.get(`${url}/getUniqueLevelName`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
export { createSeverityLevel, createMultipleSeverityLevels, updateSeverityLevel, GetAllSeverityLevel, activateSeverityLevel, deactivateSeverityLevel, getAllActiveSeverityLevel, addSeverityExample, removeSeverityExample, getUniqueSeverityLevel };