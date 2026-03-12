// services/communications.service.ts
import axiosInstance from "../interceptors/AxiosInterceptor";

const baseUrl = "/hns/communications";

const createCommunication = async (data: any) => {
    try {
        const res = await axiosInstance.post(`${baseUrl}/create`, data);
        return res.data;
    } catch (err) {
        throw err;
    }
};

const updateCommunication = async (data: any) => {
    try {
        const res = await axiosInstance.put(`${baseUrl}/update`, data);
        return res.data;
    } catch (err) {
        throw err;
    }
};

const getCommunicationById = async (id: any) => {
    try {
        const res = await axiosInstance.get(`${baseUrl}/get/${id}`);
        return res.data;
    } catch (err) {
        throw err;
    }
};
const getAllCommunications = async (params?: Record<string, any>) => {
    try {
        const res = await axiosInstance.get(`${baseUrl}/getAll`, { params });
        return res.data;
    } catch (err) {
        throw err;
    }
};

const getRecentCommunications = async (limit?: number) => {
    try {
        const params = limit && limit > 0 ? { limit } : undefined;
        const res = await axiosInstance.get(`${baseUrl}/recent`, { params });
        return res.data;
    } catch (err) {
        throw err;
    }
};

const getCommunicationStats = async () => {
    try {
        const res = await axiosInstance.get(`${baseUrl}/stats`);
        return res.data;
    } catch (err) {
        throw err;
    }
};

const getCommunicationsByDepartment = async (departmentId: number | string, params?: Record<string, any>) => {
    try {
        const res = await axiosInstance.get(`${baseUrl}/by-department/${departmentId}`, { params });
        return res.data;
    } catch (err) {
        throw err;
    }
};

const resumeCommunicationSchedule = async (communicationId: number | string, payload?: Record<string, any>) => {
    try {
        const res = await axiosInstance.put(
            `${baseUrl}/schedule/resume/${communicationId}`,
            payload ?? {}
        );
        return res.data;
    } catch (err) {
        throw err;
    }
};

const pauseCommunicationSchedule = async (communicationId: number | string, payload?: Record<string, any>) => {
    try {
        const res = await axiosInstance.put(
            `${baseUrl}/schedule/pause/${communicationId}`,
            payload ?? {}
        );
        return res.data;
    } catch (err) {
        throw err;
    }
};

const cancelCommunicationSchedule = async (communicationId: number | string, payload?: Record<string, any>) => {
    try {
        const res = await axiosInstance.put(
            `${baseUrl}/schedule/cancel/${communicationId}`,
            payload ?? {}
        );
        return res.data;
    } catch (err) {
        throw err;
    }
};

const sendCommunicationNow = async (communicationId: number | string, payload?: Record<string, any>) => {
    try {
        const res = await axiosInstance.post(
            `${baseUrl}/send-now/${communicationId}`,
            payload ?? {}
        );
        return res.data;
    } catch (err) {
        throw err;
    }
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
