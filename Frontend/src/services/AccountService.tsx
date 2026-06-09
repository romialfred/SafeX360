
import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hrms/account";

const updatePassword = async (account: any) => {
    return axiosInstance.post(`${url}/update-password`, account)
        .then(result => result.data)
        .catch(error => { throw error; });
}
const resetPassword = async (account: any) => {
    return axiosInstance.post(`${url}/reset-password`, account)
        .then(result => result.data)
        .catch(error => { throw error; });
}

/** Liste tous les comptes utilisateurs (admin). */
const getAllAccounts = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then(result => result.data)
        .catch(error => { throw error; });
}

export { updatePassword, resetPassword, getAllAccounts }