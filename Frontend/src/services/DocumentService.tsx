import axiosInstance from "../interceptors/AxiosInterceptor";
import { type DocumentSummary } from "../types/documents";

const url = "/hns/documents";

const createDocument = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updateDocument = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getDocumentById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAllDocuments = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getActiveDocuments = async () => {
    return axiosInstance.get(`${url}/getActive`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getApprovedDocuments = async (): Promise<DocumentSummary[]> => {
    return axiosInstance.get(`${url}/approved`)
        .then((response) => response.data as DocumentSummary[])
        .catch((error) => { throw error; });
};

const changeDocumentStatus = async (id: any, status: any) => {
    return axiosInstance.put(`${url}/status/${id}?status=${status}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getLatestDocuments = async () => {
    return axiosInstance.get(`${url}/latest`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

export {
    createDocument,
    updateDocument,
    getDocumentById,
    getAllDocuments,
    getActiveDocuments,
    getApprovedDocuments,
    changeDocumentStatus,
    getLatestDocuments
};
