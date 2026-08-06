import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/ppe-stocktake";

// Crée une session d'inventaire (brouillon) : le serveur fige le stock système
// par ligne et calcule les écarts. Payload : { reference, notes, lines: [{ ppeId,
// countedQuantity, note }] }.
const createStocktake = async (payload: any) => {
    return axiosInstance.post(`${url}/create`, payload)
        .then((response) => response.data);
};

// Clôture l'inventaire : passe les écarts en ajustements de stock (via le journal).
const validateStocktake = async (id: number | string) => {
    return axiosInstance.put(`${url}/validate/${id}`)
        .then((response) => response.data);
};

const cancelStocktake = async (id: number | string) => {
    return axiosInstance.put(`${url}/cancel/${id}`)
        .then((response) => response.data);
};

const getStocktakeById = async (id: number | string) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
};

const getAllStocktakes = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data);
};

export { createStocktake, validateStocktake, cancelStocktake, getStocktakeById, getAllStocktakes };
