import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/ppe";

const createPPE = async (ppeData: any) => {
    return axiosInstance.post(`${url}/create`, ppeData)
        .then((response) => response.data);
};

const updatePPE = async (ppeData: any) => {
    return axiosInstance.put(`${url}/update`, ppeData)
        .then((response) => response.data);
};

const getAllPPE = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data);
};
const getLowStocks = async () => {
    return axiosInstance.get(`${url}/getLowStock`)
        .then((response) => response.data);
};

const getPPEById = async (id: number | string) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
};

const getActivePPE = async () => {
    return axiosInstance.get(`${url}/getActive`)
        .then((response) => response.data);
};

const activatePPE = async (id: number | string) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
};

const deactivatePPE = async (id: number | string) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
};

export {
    createPPE,
    updatePPE,
    getAllPPE,
    getPPEById,
    getActivePPE,
    activatePPE,
    getLowStocks,
    deactivatePPE,
};
