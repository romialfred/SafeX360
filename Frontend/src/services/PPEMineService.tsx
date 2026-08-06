import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/ppe-mine";

// Consommation & coût EPI agrégés par employé de la mine active (base des
// comparaisons entre pairs de la page « Mes EPI »).
const getPpeConsumption = async () => {
    return axiosInstance.get(`${url}/consumption`)
        .then((response) => response.data);
};

export { getPpeConsumption };
