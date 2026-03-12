import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/theme";


const createTheme = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const updateTheme = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getAllTheme = async () => {

    return axiosInstance.get(`${url}/getAll`).then((response) => {
        return response.data;
    }).catch((error) => { throw error; })
};
const deleteTheme = async (id: string | number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getThemeById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getThemesByYear = async (year: number) => {
    return axiosInstance.get(`${url}/get/year/${year}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
};


export { createTheme, updateTheme, getAllTheme, deleteTheme, getThemeById, getThemesByYear };