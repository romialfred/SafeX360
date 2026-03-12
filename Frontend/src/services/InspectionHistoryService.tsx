import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/inspection-history";

const addInspectionHistory = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getInspectionHistoryByInspectionId = async (inspectionId: any) => {
    return axiosInstance.get(`${url}/get/${inspectionId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

export { addInspectionHistory, getInspectionHistoryByInspectionId };
