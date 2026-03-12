import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/risks/analysis";

const addRiskAnalysis = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};
const getAnalysisByRisk = async (riskId: any) => {
    return axiosInstance.get(`${url}/risk/${riskId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAllRiskAnalysis = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAnalysisById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

export { addRiskAnalysis, getAllRiskAnalysis, getAnalysisById, getAnalysisByRisk };