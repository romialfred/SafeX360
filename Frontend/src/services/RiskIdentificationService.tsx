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

export { createChemicalRisk, updateChemicalRisk, getChemicalRiskByID, getAllChemicalRisks, updateChemicalRiskStatus };
