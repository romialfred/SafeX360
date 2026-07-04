import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/general-inspections";




const createPgi = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => {
            return response.data;
        });
}
const updatePgi = async (data: Record<string, unknown>) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => {
            return response.data;
        });
}


const getAllPgi = async (data: Record<string, unknown>) => {
    return axiosInstance.get(`${url}/getAll`, data)
        .then((response) => {
            return response.data;
        });
}
const getPgiById = async (id: number) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => {
            return response.data;
        });
}

const getPgiInfo = async (id: number) => {
    return axiosInstance.get(`${url}/getInfo/${id}`)
        .then((response) => {
            return response.data;
        });
}

export { createPgi, getAllPgi, getPgiById, getPgiInfo, updatePgi }