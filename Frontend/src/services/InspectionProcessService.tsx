import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/inspection-process";

const addInspectionChecklist = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/addChecklist`, data)
        .then((response) => response.data)
}

const addInspectionMeasurement = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/addMeasurement`, data)
        .then((response) => response.data)
}

const getChecklistsByInspectionId = async (id: number) => {
    return axiosInstance.get(`${url}/getChecklists/${id}`)
        .then((response) => response.data)
}
const getMeasurementsByInspectionId = async (id: number) => {
    return axiosInstance.get(`${url}/getMeasurements/${id}`)
        .then((response) => response.data)
}

const draftInspectionProcess = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/save-draft`, data)
        .then((response) => {
            return response.data;
        });
}

const getDraftInspectionProcess = async (id: number) => {
    return axiosInstance.get(`${url}/get-draft/${id}`)
        .then((response) => {
            return response.data;
        });
}

const removeInsChecklist = async (id: number) => {
    return axiosInstance.delete(`${url}/remove-checklist/${id}`)
        .then((response) => {
            return response.data;
        });
}
const removeInsMeasurement = async (id: number) => {
    return axiosInstance.delete(`${url}/remove-measurement/${id}`)
        .then((response) => {
            return response.data;
        });
}
export { draftInspectionProcess, getDraftInspectionProcess, removeInsChecklist, removeInsMeasurement, addInspectionChecklist, addInspectionMeasurement, getChecklistsByInspectionId, getMeasurementsByInspectionId }