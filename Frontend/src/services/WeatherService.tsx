import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/weather-conditions";

// /hns/incidents-category/create
const createWeatherConditions = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        });
}

const updateWeatherConditions = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        });
}
const GetAllWeatherConditions = async (incidentData: any) => {
    const response = await axiosInstance.get(`${url}/getAll`, { params: incidentData });
    return response.data;
};
const getAllActiveWeatherConditions = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data);
}
const activateWeatherConditions = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}

const deactivateWeatherConditions = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}
const getWeathersByIds = async (ids: string[]) => {
    return axiosInstance.get(`${url}/getByIds`, {
        params: { ids }, paramsSerializer: (params) =>
            params.ids.map((id: number) => `ids=${id}`).join('&'),
    })
        .then(response => response.data);
}
export { createWeatherConditions, updateWeatherConditions, GetAllWeatherConditions, activateWeatherConditions, deactivateWeatherConditions, getAllActiveWeatherConditions, getWeathersByIds };