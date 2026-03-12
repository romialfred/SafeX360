import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/ppe-stock";

// Create PPE Stock
const createPPEStock = async (stockData: any) => {
    return axiosInstance.post(`${url}/create`, stockData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// Update PPE Stock
const updatePPEStock = async (stockData: any) => {
    return axiosInstance.put(`${url}/update`, stockData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// Get PPE Stock by ID
const getPPEStockById = async (id: number | string) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// Get All PPE Stocks
const getAllPPEStocks = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// Get PPE Stocks by PPE ID
const getPPEStocksByPPEId = async (ppeId: number | string) => {
    return axiosInstance.get(`${url}/ppe/${ppeId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

export {
    createPPEStock,
    updatePPEStock,
    getPPEStockById,
    getAllPPEStocks,
    getPPEStocksByPPEId,
};
