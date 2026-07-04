import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/inspection-history";

const addInspectionHistory = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        });
}

const getInspectionHistoryByInspectionId = async (inspectionId: any) => {
    return axiosInstance.get(`${url}/get/${inspectionId}`)
        .then((response) => response.data);
};

export { addInspectionHistory, getInspectionHistoryByInspectionId };
