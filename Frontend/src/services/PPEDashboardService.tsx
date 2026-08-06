import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/ppe-dashboard";

// Synthèse décisionnelle EPI : valorisation du stock + flux valorisés sur [from, to]
// (dates ISO yyyy-MM-dd, optionnelles). Cloisonné par la mine active (header).
const getPpeDashboard = async (from?: string, to?: string) => {
    return axiosInstance.get(`${url}/summary`, { params: { from, to } })
        .then((response) => response.data);
};

export { getPpeDashboard };
