import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/action-process";



const addActionProcess = async (actionProcess: any) => {
    return axiosInstance.post(`${url}/create`, actionProcess)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getAllActionProcessByActionId = async (actionId: any) => {
    return axiosInstance.get(`${url}/getByActionId/${actionId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
export { addActionProcess, getAllActionProcessByActionId }
