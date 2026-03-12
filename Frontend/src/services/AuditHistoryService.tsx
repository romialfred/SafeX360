import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/audit-history";


const addAuditHistory = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getAuditHistoryByAuditId = async (auditId: any) => {
    return axiosInstance.get(`${url}/getByAuditId/${auditId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};
export { addAuditHistory, getAuditHistoryByAuditId };