import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/nc-history";


const createNCHistory = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}


const getNCHistorybyNonConformityID = async (nonConformityId: any) => {
    return axiosInstance.get(`${url}/getByNonConformityId/${nonConformityId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

export { createNCHistory, getNCHistorybyNonConformityID };
