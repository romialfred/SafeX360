import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "hns/chemical-risks";

const createChemicalRisk = async (chemicalRiskData: any) => {
    return axiosInstance.post(`${url}/create`, chemicalRiskData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updateChemicalRisk = async (chemicalRiskData: any) => {
    return axiosInstance.put(`${url}/update`, chemicalRiskData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getChemicalRiskByID = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAllChemicalRisks = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};


const updateChemicalRiskStatus = async (id: number, status: "ACTIVE" | "INACTIVE") => {
    return axiosInstance.put(`${url}/status/${id}?status=${status}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * DTO partiel d'un risque chimique : seuls les champs ISO 45001 §6.1.2
 * (identification du danger) ajoutés en phase B sont typés ici, le reste
 * du payload restant traité de façon souple par les formulaires existants.
 */
export interface ChemicalRiskIdentificationFields {
    activityType?: string | null;
    hazardCategory?: string | null;
    personsExposed?: string | null; // CSV
    exposureCount?: number | null;
    // ISO 45001 §6.1.3 : exigences legales et revue planifiee
    legalRequirements?: string | null;
    nextReviewDate?: string | null; // yyyy-MM-dd
}

export { createChemicalRisk, updateChemicalRisk, getChemicalRiskByID, getAllChemicalRisks, updateChemicalRiskStatus };
