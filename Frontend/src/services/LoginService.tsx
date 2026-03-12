import axiosInstance from "../interceptors/AxiosInterceptor";

const loginUser = async (data: any) => {
    return axiosInstance.post(`/hrms/auth/login`, data)
        .then(result => result.data)
        .catch(error => { throw error; });
}

const getUser = async () => {
    return axiosInstance.get(`/hrms/auth/me`)
        .then(result => result.data)
        .catch(error => { throw error; });
}

const logoutUser = async () => {
    return axiosInstance.get(`/hrms/auth/logout`)
        .then(result => result.data)
        .catch(error => { throw error; });
}

export { loginUser, getUser, logoutUser };