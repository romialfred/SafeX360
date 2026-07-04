import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/hs-activity";

const createActivity = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => response.data);
}
const updateActivity = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => response.data);
}
const getAllActivities = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data);
}
const getActivityById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
}
const getActivityInfo = async (id: any) => {
    return axiosInstance.get(`${url}/getInfo/${id}`)
        .then((response) => response.data);
}

const getAllMeetings = async () => {
    return axiosInstance.get(`${url}/getAllMeetings`)
        .then((response) => response.data);
}

const getAllTours = async () => {
    return axiosInstance.get(`${url}/getAllTours`)
        .then((response) => response.data);
}



export { createActivity, updateActivity, getAllActivities, getActivityById, getActivityInfo, getAllMeetings, getAllTours }