import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/activity";


const createActivity = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const updateActivity = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getAllActivity = async () => {
    return axiosInstance.get(`${url}/getAll`).then((response) => {
        return response.data;
    }).catch((error) => { throw error; });
};

const deleteActivity = async (id: string | number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getActivityById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getActivitiesByYear = async (year: number) => {
    return axiosInstance.get(`${url}/get/year/${year}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
};

const getActivitiesByYearStatusAndCategory = async (year: number, status: string, category: string) => {
    return axiosInstance.get(`${url}/get/year/${year}/status/${status}/category/${category}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

export { createActivity, updateActivity, getAllActivity, deleteActivity, getActivityById, getActivitiesByYear, getActivitiesByYearStatusAndCategory };