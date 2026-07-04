import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/locations";

// /hns/incidents-category/create
const createLocation = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => {
            return response.data;
        });
}

const updateLocation = async (data: Record<string, unknown>) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => {
            return response.data;
        });
}
const getAllLocations = async (data: Record<string, unknown>) => {
    const response = await axiosInstance.get(`${url}/getAll`, { params: data });
    return response.data;
};

const getAllActiveLocations = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data);
}
const activateLocation = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}

const deactivateLocation = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}
export { createLocation, updateLocation, getAllLocations, activateLocation, deactivateLocation, getAllActiveLocations };