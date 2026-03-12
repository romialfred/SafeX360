import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/compliance-requirement";


const createRequirement = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const updateRequirement = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getAllRequirement = async (_incidentData: any) => {
    try {
        const response = await axiosInstance.get(`${url}/getAll`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getRequirementById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getAllActiveRequirement = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const activateRequirement = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const deactivateRequirement = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
export { createRequirement, updateRequirement, getAllRequirement, activateRequirement, deactivateRequirement, getAllActiveRequirement, getRequirementById };