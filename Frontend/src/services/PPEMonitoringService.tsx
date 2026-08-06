import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/ppe-monitoring";

// Tableau de bord « Suivi des EPI » : pilotage des stocks & distributions de la mine
// active (header). `days` = fenêtre d'analyse (30 / 90 / 180 / 365).
const getPpeMonitoring = async (days: number = 30) => {
    return axiosInstance.get(`${url}/summary`, { params: { days } })
        .then((response) => response.data);
};

export { getPpeMonitoring };
