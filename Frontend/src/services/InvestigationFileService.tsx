import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/investigation-process";

// Investigation process create
const addInvestigationProcess = async (processData: any) => {
    return axiosInstance.post(`${url}/create`, processData)
        .then((response) => response.data);
}

// Get all processes by investigation ID
const getAllInvestigationProcessByInvestigationId = async (investigationId: number) => {
    return axiosInstance.get(`${url}/getByInvestigationId/${investigationId}`)
        .then((response) => response.data);
}

export {
    addInvestigationProcess,
    getAllInvestigationProcessByInvestigationId
}
