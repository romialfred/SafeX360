import axiosInstance from "../interceptors/AxiosInterceptor";

// Fil de notifications SLA HSE (ISO 45001 §9.1). companyId est injecté
// automatiquement par l'AxiosInterceptor depuis la mine active.
const url = "/hns/hse-notification";

export interface HseNotification {
    id: number;
    companyId: number;
    recipientId?: number;
    type: string;
    severity: "INFO" | "WARNING" | "CRITICAL" | string;
    entityType?: string;
    entityId?: number;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export const getHseNotifications = async (unreadOnly = false, limit = 30): Promise<HseNotification[]> => {
    return axiosInstance.get(url, { params: { unreadOnly, limit } }).then((r) => r.data ?? []);
};

export const getHseUnreadCount = async (): Promise<number> => {
    return axiosInstance.get(`${url}/unread-count`).then((r) => r.data?.count ?? 0);
};

export const markHseNotificationRead = async (id: number) => {
    return axiosInstance.put(`${url}/${id}/read`).then((r) => r.data);
};

export const markAllHseNotificationsRead = async () => {
    return axiosInstance.put(`${url}/read-all`).then((r) => r.data);
};
