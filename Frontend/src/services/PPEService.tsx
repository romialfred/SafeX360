import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "hns/ppe";

const createPPE = async (ppeData: any) => {
    return axiosInstance.post(`${url}/create`, ppeData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updatePPE = async (ppeData: any) => {
    return axiosInstance.put(`${url}/update`, ppeData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAllPPE = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};
const getLowStocks = async () => {
    return axiosInstance.get(`${url}/getLowStock`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getPPEById = async (id: number | string) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getActivePPE = async () => {
    return axiosInstance.get(`${url}/getActive`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const activatePPE = async (id: number | string) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const deactivatePPE = async (id: number | string) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
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
