import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/severity-level";

// /hns/incidents-category/create
const createSeverityLevel = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => {
            return response.data;
        });
}
const createMultipleSeverityLevels = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/createMultiple`, data)
        .then((response) => {
            return response.data;
        });
}

const updateSeverityLevel = async (data: Record<string, unknown>) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => {
            return response.data;
        });
}
const GetAllSeverityLevel = async (data: Record<string, unknown>) => {
    const response = await axiosInstance.get(`${url}/getAll`, { params: data });
    return response.data;
};

const getAllActiveSeverityLevel = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data);
}
const activateSeverityLevel = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}

const deactivateSeverityLevel = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}

const addSeverityExample = async (body: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/addExample`, body)
        .then((response) => response.data);
}
const removeSeverityExample = async (index: number, id: number) => {
    return axiosInstance.delete(`${url}/deleteExample/${index}/${id}`)
        .then((response) => response.data);
}
const getUniqueSeverityLevel = async () => {
    return axiosInstance.get(`${url}/getUniqueLevelName`)
        .then((response) => response.data);
}
export { createSeverityLevel, createMultipleSeverityLevels, updateSeverityLevel, GetAllSeverityLevel, activateSeverityLevel, deactivateSeverityLevel, getAllActiveSeverityLevel, addSeverityExample, removeSeverityExample, getUniqueSeverityLevel };