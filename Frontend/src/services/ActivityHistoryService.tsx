import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/hs-activity-history";

// POST
const addHsActivityHistory = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        });
}

// GET
const getHsActivityHistoryById = async (hsActivityId: any) => {
    return axiosInstance.get(`${url}/get/${hsActivityId}`)
        .then((res) => res.data);
};

export { addHsActivityHistory, getHsActivityHistoryById };
