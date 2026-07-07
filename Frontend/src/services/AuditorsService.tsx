import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/auditors";

// /hns/incidents-category/create
const createAuditors = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        });
}

const updateAuditors = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        });
}
const getAllAuditors = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data);
};

// InternalAuditorAPI n'expose pas /getAllActive (contrairement aux autres
// paramètres) : on filtre côté client pour éviter un 404.
const getAllActiveAuditors = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => (Array.isArray(response.data) ? response.data : [])
            .filter((a: any) => String(a?.status ?? '').toUpperCase() === 'ACTIVE'));
}
const activateAuditors = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}

const deactivateAuditors = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}


export { createAuditors, updateAuditors, getAllAuditors, activateAuditors, deactivateAuditors, getAllActiveAuditors };