import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/incident-history";


const addIncidentHistory = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getIncidentHistoryByIncidentId = async (incidentId: any) => {
    return axiosInstance.get(`${url}/getByIncidentId/${incidentId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
export { addIncidentHistory, getIncidentHistoryByIncidentId };