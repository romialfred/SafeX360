import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/hs-activity-history";

// POST
const addHsActivityHistory = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

// GET
const getHsActivityHistoryById = async (hsActivityId: any) => {
    return axiosInstance.get(`${url}/get/${hsActivityId}`)
        .then((res) => res.data)
        .catch((err) => { throw err });
};

export { addHsActivityHistory, getHsActivityHistoryById };
