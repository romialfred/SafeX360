import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/check-list";

// /hns/incidents-category/create
const createCheckList = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        });
}

const updateCheckList = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        });
}
const GetAllCheckList = async (incidentData: any) => {
    const response = await axiosInstance.get(`${url}/getAll`, { params: incidentData });
    return response.data;
};

const getAllActiveCheckList = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data);
}
const activateCheckList = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}

const deactivateCheckList = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}
export { createCheckList, updateCheckList, GetAllCheckList, activateCheckList, deactivateCheckList, getAllActiveCheckList }