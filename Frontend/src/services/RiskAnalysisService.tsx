import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/risks/analysis";

const addRiskAnalysis = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => response.data);
};
const getAnalysisByRisk = async (riskId: any) => {
    return axiosInstance.get(`${url}/risk/${riskId}`)
        .then((response) => response.data);
};

const getAllRiskAnalysis = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data);
};

const getAnalysisById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
}

/**
 * Champs de risque résiduel (ISO 45001 — après application des mesures de
 * maîtrise) ajoutés au DTO d'analyse en phase B. Calcul identique à la
 * cotation initiale (probabilité × gravité → sévérité → niveau).
 */
export interface RiskAnalysisResidualFields {
    residualProbability?: number | null;
    residualGravity?: number | null;
    residualSeverity?: number | null;
    residualRiskLevel?: string | null;
}

export { addRiskAnalysis, getAllRiskAnalysis, getAnalysisById, getAnalysisByRisk };