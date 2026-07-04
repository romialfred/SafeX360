import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/compliance-requirement";


const createRequirement = async (payload: any) => {
    return axiosInstance.post(`${url}/create`, payload)
        .then((response) => {
            return response.data;
        });
}

const updateRequirement = async (payload: any) => {
    return axiosInstance.put(`${url}/update`, payload)
        .then((response) => {
            return response.data;
        });
}
const getAllRequirement = async (_payload: any) => {
    const response = await axiosInstance.get(`${url}/getAll`);
    return response.data;
};

const getRequirementById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
}
const getAllActiveRequirement = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data);
}
const activateRequirement = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}

const deactivateRequirement = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}
export { createRequirement, updateRequirement, getAllRequirement, activateRequirement, deactivateRequirement, getAllActiveRequirement, getRequirementById };