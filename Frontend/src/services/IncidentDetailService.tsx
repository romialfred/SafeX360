import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/incident-detail";


const removeIncidentDetail = async (id: string | number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getSeverityLevelCount = async () => {
    return axiosInstance.get(`${url}/severity-level-count`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getCategoryCount = async () => {
    return axiosInstance.get(`${url}/category-count`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getCategorySeverityCount = async () => {
    return axiosInstance.get(`${url}/category-severity-count`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
export { removeIncidentDetail, getSeverityLevelCount, getCategoryCount, getCategorySeverityCount };