
import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hrms/account";

const updatePassword = async (account: any) => {
    return axiosInstance.post(`${url}/update-password`, account)
        .then(result => result.data);
}
const resetPassword = async (account: any) => {
    return axiosInstance.post(`${url}/reset-password`, account)
        .then(result => result.data);
}

/** Liste tous les comptes utilisateurs (admin). */
const getAllAccounts = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then(result => result.data);
}

export { updatePassword, resetPassword, getAllAccounts }