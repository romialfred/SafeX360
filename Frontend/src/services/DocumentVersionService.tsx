import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/document-versions";

const createDocumentVersion = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updateDocumentVersion = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getDocumentVersionById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getDocumentVersionsByDocId = async (docId: any) => {
    return axiosInstance.get(`${url}/by-document/${docId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

export interface MediaDTO {
    id: number;
    name: string;
    type: string;
    file: string;
}

const getMediaByVersionId = async (id: number): Promise<MediaDTO> => {
    return axiosInstance.get(`${url}/media/${id}`)
        .then((response) => response.data as MediaDTO)
        .catch((error) => { throw error; });
};

const getLatestMediaByDocumentId = async (docId: number | string): Promise<MediaDTO> => {
    return axiosInstance.get(`${url}/latest-media/${docId}`)
        .then((response) => response.data as MediaDTO)
        .catch((error) => { throw error; });
};

export {
    createDocumentVersion,
    updateDocumentVersion,
    getDocumentVersionById,
    getDocumentVersionsByDocId,
    getMediaByVersionId,
    getLatestMediaByDocumentId
};
