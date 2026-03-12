
import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/work-process";


const createWorkProcess = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const updateWorkProcess = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const GetAllWorkProcess = async (incidentData: any) => {
    try {
        const response = await axiosInstance.get(`${url}/getAll`, { params: incidentData });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getAllActiveWorkProcess = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const activateWorkProcess = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const deactivateWorkProcess = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
export { createWorkProcess, updateWorkProcess, GetAllWorkProcess, activateWorkProcess, deactivateWorkProcess, getAllActiveWorkProcess }