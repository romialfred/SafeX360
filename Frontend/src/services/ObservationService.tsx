import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/observations";

const createObservation = async (observationData: any) => {
    return axiosInstance.post(`${url}/create`, observationData)
        .then((response) => response.data);
}

const updateObservation = async (observationData: any) => {
    return axiosInstance.put(`${url}/update`, observationData)
        .then((response) => response.data);
}

const getObservationById = async (id: number) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
};
const getObservationByAuditId = async (auditId: number) => {
    return axiosInstance.get(`${url}/getAllByAuditId/${auditId}`)
        .then((response) => response.data);
}

const getObservationDropdown = async (auditId: any) => {
    return axiosInstance.get(`${url}/getObservationTitlesByAuditId/${auditId}`)
        .then((response) => response.data);
};

export {
    createObservation,
    updateObservation,
    getObservationById,
    getObservationByAuditId,
    getObservationDropdown
}