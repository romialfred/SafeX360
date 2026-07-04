import axiosInstance from "../interceptors/AxiosInterceptor";

export type UpcomingEventType =
    | "INSPECTION"
    | "AUDIT"
    | "NON_CONFORMITY"
    | "NEAR_MISS"
    | "HAZARD"
    | "HS_MEETING"
    | "STEERING_TOUR";

export interface UpcomingEventDTO {
    id: number;
    title: string;
    type: UpcomingEventType;
    scheduledDate: string | null;
    location: string | null;
    description: string | null;
}

const getUpcomingEvents = async (): Promise<UpcomingEventDTO[]> => {
    return axiosInstance
        .get("/hns/events/upcoming")
        .then((response) => response.data as UpcomingEventDTO[]);
};

export { getUpcomingEvents };
