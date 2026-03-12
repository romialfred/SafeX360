import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "hns/ppe-request";
const createPpeRequest = async (ppeData: any) => {
    return axiosInstance.post(`${url}/create`, ppeData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updatePpeRequest = async (ppeData: any) => {
    return axiosInstance.put(`${url}/update`, ppeData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const approvePpeRequest = async (id: any, comment?: string) => {
    return axiosInstance.put(`${url}/approve/${id}`, null, {
        params: { comment }
    })
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const rejectPpeRequest = async (id: any, comment: string) => {
    return axiosInstance.put(`${url}/reject/${id}`, null, {
        params: { comment }
    })
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getPpeRequestById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAllPpeRequests = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

export { createPpeRequest, updatePpeRequest, approvePpeRequest, rejectPpeRequest, getPpeRequestById, getAllPpeRequests }