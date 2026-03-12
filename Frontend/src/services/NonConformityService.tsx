import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/non-conformity";

const reportNonConformity = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const updateNonConformity = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
}
const getNonConformity = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getEventAnalysisByNonConformityId = async (id: any) => {
    return axiosInstance.get(`${url}/getAnalysis/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getAllNonConformities = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getInfoByNonConformityId = async (id: any) => {
    return axiosInstance.get(`${url}/getInfo/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

export {
    reportNonConformity,
    getNonConformity,
    updateNonConformity,
    getAllNonConformities,
    getInfoByNonConformityId,
    getEventAnalysisByNonConformityId
}
