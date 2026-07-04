import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/activity-report";

const createActivityReport = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((res) => res.data);
};

const createActivityReportDTO = async (data: any) => {
    return axiosInstance.post(`${url}/createDTO`, data)
        .then((res) => res.data);
}

const updateActivityReport = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((res) => res.data);
};

const deleteActivityReport = async (id: number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((res) => res.data);
};

const getActivityReportById = async (id: number) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((res) => res.data);
};

const getActivityReportByActivityId = async (activityId: any) => {
    return axiosInstance.get(`${url}/getByActivityId/${activityId}`)
        .then((res) => res.data);
};

export {
    createActivityReport,
    createActivityReportDTO,
    updateActivityReport,
    deleteActivityReport,
    getActivityReportById,
    getActivityReportByActivityId,
};