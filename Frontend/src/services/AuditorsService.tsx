import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/auditors";

// /hns/incidents-category/create
const createAuditors = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const updateAuditors = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getAllAuditors = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAllActiveAuditors = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const activateAuditors = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const deactivateAuditors = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}


export { createAuditors, updateAuditors, getAllAuditors, activateAuditors, deactivateAuditors, getAllActiveAuditors };