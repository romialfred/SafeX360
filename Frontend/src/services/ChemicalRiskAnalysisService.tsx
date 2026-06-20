import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/chemical-risks/analysis";

const addChemicalRiskAnalysis = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};
const getChemicalAnalysisByRisk = async (riskId: any) => {
    return axiosInstance.get(`${url}/risk/${riskId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAllChemicalRiskAnalysis = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getChemicalAnalysisById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

/**
 * Champs de risque résiduel (ISO 45001 — après application des mesures de
 * maîtrise) ajoutés au DTO d'analyse chimique en phase B. Calcul identique à
 * la cotation initiale (probabilité × gravité → sévérité → niveau).
 */
export interface ChemicalRiskAnalysisResidualFields {
    residualProbability?: number | null;
    residualGravity?: number | null;
    residualSeverity?: number | null;
    residualRiskLevel?: string | null;
}

export { addChemicalRiskAnalysis, getAllChemicalRiskAnalysis, getChemicalAnalysisById, getChemicalAnalysisByRisk };