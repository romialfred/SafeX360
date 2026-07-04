import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/incident-history";


const addIncidentHistory = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        });
}
const getIncidentHistoryByIncidentId = async (incidentId: any) => {
    return axiosInstance.get(`${url}/getByIncidentId/${incidentId}`)
        .then((response) => response.data);
}
export { addIncidentHistory, getIncidentHistoryByIncidentId };