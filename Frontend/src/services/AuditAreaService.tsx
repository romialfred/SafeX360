import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/audit-area";

// /hns/incidents-category/create
const createAuditArea = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const updateAuditArea = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const GetAllAuditArea = async (incidentData: any) => {
    try {
        const response = await axiosInstance.get(`${url}/getAll`, { params: incidentData });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getAllActiveAuditArea = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const activateAuditArea = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const deactivateAuditArea = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
export { createAuditArea, updateAuditArea, GetAllAuditArea, activateAuditArea, deactivateAuditArea, getAllActiveAuditArea }