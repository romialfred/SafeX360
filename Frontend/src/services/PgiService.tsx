import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/general-inspections";




const createPgi = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const updatePgi = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}


const getAllPgi = async (incidentData: any) => {
    return axiosInstance.get(`${url}/getAll`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getPgiById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getPgiInfo = async (id: any) => {
    return axiosInstance.get(`${url}/getInfo/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

export { createPgi, getAllPgi, getPgiById, getPgiInfo, updatePgi }