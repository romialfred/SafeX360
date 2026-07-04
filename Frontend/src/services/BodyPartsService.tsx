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
const activateBodyParts = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}

const deactivateBodyParts = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}
export { createBodyParts, updateBodyParts, GetAllBodyParts, activateBodyParts, deactivateBodyParts }