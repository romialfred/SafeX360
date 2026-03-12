import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/media";


const removeMedia = async (id: string | number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getMedia = async (id: string | number) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
export { removeMedia, getMedia }