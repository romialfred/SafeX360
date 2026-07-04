import axiosInstance from "../interceptors/AxiosInterceptor";

const baseUrl = "/hns/notifications";

const getNotifications = async (params?: Record<string, any>) => {
    const response = await axiosInstance.get(`${baseUrl}/getAll`, { params });
    return response.data;
};

const getNotificationsByCommunication = async (communicationId: number | string, params?: Record<string, any>) => {
    const response = await axiosInstance.get(`${baseUrl}/communication/${communicationId}`, { params });
    return response.data;
};

export { getNotifications, getNotificationsByCommunication };
