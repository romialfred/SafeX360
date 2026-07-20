import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/body-parts";



// /hns/incidents-category/create
const createBodyParts = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        });
}

const updateBodyParts = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        });
}
const GetAllBodyParts = async (incidentData: any) => {
    const response = await axiosInstance.get(`${url}/getAll`, { params: incidentData });
    return response.data;
};

/**
 * Parties du corps ACTIVES uniquement — à utiliser dans les formulaires de
 * saisie (déclaration d'événement). `GetAllBodyParts` renvoie aussi les entrées
 * désactivées : les proposer au déclarant rendait la désactivation sans effet.
 */
const getAllActiveBodyParts = async (params?: any) => {
    const response = await axiosInstance.get(`${url}/getAllActive`, { params });
    return response.data;
};
const activateBodyParts = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}

const deactivateBodyParts = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}
export { createBodyParts, updateBodyParts, GetAllBodyParts, getAllActiveBodyParts, activateBodyParts, deactivateBodyParts }