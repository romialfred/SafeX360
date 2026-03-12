import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/audit-report";


const addAuditReport = async (report: any) => {
    return axiosInstance.post(`${url}/create`, report)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getAuditReportByAuditId = async (auditId: any) => {
    return axiosInstance.get(`${url}/getByAuditId/${auditId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updateAuditReport = async (report: any) => {
    return axiosInstance.put(`${url}/update`, report)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getAuditReportById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const isReportExists = async (auditId: any) => {
    return axiosInstance.get(`${url}/exists/${auditId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

export { addAuditReport, getAuditReportByAuditId, updateAuditReport, getAuditReportById, isReportExists };