import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/inspection-process";

const addInspectionChecklist = async (data: any) => {
    return axiosInstance.post(`${url}/addChecklist`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; })
}

const addInspectionMeasurement = async (data: any) => {
    return axiosInstance.post(`${url}/addMeasurement`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; })
}

const getChecklistsByInspectionId = async (id: any) => {
    return axiosInstance.get(`${url}/getChecklists/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; })
}
const getMeasurementsByInspectionId = async (id: any) => {
    return axiosInstance.get(`${url}/getMeasurements/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; })
}

const draftInspectionProcess = async (data: any) => {
    return axiosInstance.post(`${url}/save-draft`, data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getDraftInspectionProcess = async (id: any) => {
    return axiosInstance.get(`${url}/get-draft/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const removeInsChecklist = async (id: any) => {
    return axiosInstance.delete(`${url}/remove-checklist/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const removeInsMeasurement = async (id: any) => {
    return axiosInstance.delete(`${url}/remove-measurement/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
export { draftInspectionProcess, getDraftInspectionProcess, removeInsChecklist, removeInsMeasurement, addInspectionChecklist, addInspectionMeasurement, getChecklistsByInspectionId, getMeasurementsByInspectionId }