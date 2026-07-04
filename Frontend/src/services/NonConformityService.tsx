import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/non-conformity";

const reportNonConformity = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => response.data);
}
const updateNonConformity = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => response.data);
}
const getNonConformity = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
}

const getEventAnalysisByNonConformityId = async (id: any) => {
    return axiosInstance.get(`${url}/getAnalysis/${id}`)
        .then((response) => response.data);
}

const getAllNonConformities = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data);
}
const getInfoByNonConformityId = async (id: any) => {
    return axiosInstance.get(`${url}/getInfo/${id}`)
        .then((response) => response.data);
}

export {
    reportNonConformity,
    getNonConformity,
    updateNonConformity,
    getAllNonConformities,
    getInfoByNonConformityId,
    getEventAnalysisByNonConformityId
}
