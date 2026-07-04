// services/communications.service.ts
import axiosInstance from "../interceptors/AxiosInterceptor";

const baseUrl = "/hns/communications";

const createCommunication = async (data: any) => {
    const res = await axiosInstance.post(`${baseUrl}/create`, data);
    return res.data;
};

const updateCommunication = async (data: any) => {
    const res = await axiosInstance.put(`${baseUrl}/update`, data);
    return res.data;
};

const getCommunicationById = async (id: any) => {
    const res = await axiosInstance.get(`${baseUrl}/get/${id}`);
    return res.data;
};
const getAllCommunications = async (params?: Record<string, any>) => {
    const res = await axiosInstance.get(`${baseUrl}/getAll`, { params });
    return res.data;
};

const getRecentCommunications = async (limit?: number) => {
    const params = limit && limit > 0 ? { limit } : undefined;
    const res = await axiosInstance.get(`${baseUrl}/recent`, { params });
    return res.data;
};

const getCommunicationStats = async () => {
    const res = await axiosInstance.get(`${baseUrl}/stats`);
    return res.data;
};

const getCommunicationsByDepartment = async (departmentId: number | string, params?: Record<string, any>) => {
    const res = await axiosInstance.get(`${baseUrl}/by-department/${departmentId}`, { params });
    return res.data;
};

const resumeCommunicationSchedule = async (communicationId: number | string, payload?: Record<string, any>) => {
    const res = await axiosInstance.put(
        `${baseUrl}/schedule/resume/${communicationId}`,
        payload ?? {}
    );
    return res.data;
};

const pauseCommunicationSchedule = async (communicationId: number | string, payload?: Record<string, any>) => {
    const res = await axiosInstance.put(
        `${baseUrl}/schedule/pause/${communicationId}`,
        payload ?? {}
    );
    return res.data;
};

const cancelCommunicationSchedule = async (communicationId: number | string, payload?: Record<string, any>) => {
    const res = await axiosInstance.put(
        `${baseUrl}/schedule/cancel/${communicationId}`,
        payload ?? {}
    );
    return res.data;
};

const sendCommunicationNow = async (communicationId: number | string, payload?: Record<string, any>) => {
    const res = await axiosInstance.post(
        `${baseUrl}/send-now/${communicationId}`,
        payload ?? {}
    );
    return res.data;
};

// (Optional) default export as a grouped API
export {
    createCommunication,
    updateCommunication,
    getCommunicationById,
    getAllCommunications,
    getRecentCommunications,
    getCommunicationStats,
    getCommunicationsByDepartment,
    resumeCommunicationSchedule,
    pauseCommunicationSchedule,
    cancelCommunicationSchedule,
    sendCommunicationNow,
};
