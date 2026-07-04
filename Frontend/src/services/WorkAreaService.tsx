
import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/work-area";


const createWorkArea = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        });
}

const updateWorkArea = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        });
}
const GetAllWorkArea = async (incidentData: any) => {
    const response = await axiosInstance.get(`${url}/getAll`, { params: incidentData });
    return response.data;
};

const getAllActiveWorkArea = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data);
}
const activateWorkArea = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}

const deactivateWorkArea = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}
export { createWorkArea, updateWorkArea, GetAllWorkArea, activateWorkArea, deactivateWorkArea, getAllActiveWorkArea }