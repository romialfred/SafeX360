import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/inspection-reports";


const addInspectionReport = async (report: any) => {
    return axiosInstance.post(`${url}/create`, report)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getInspectionReportByInspectionId = async (inspectionId: any) => {
    return axiosInstance.get(`${url}/getByInspection/${inspectionId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};




const updateInspectionReport = async (report: any) => {
    return axiosInstance.put(`${url}/update`, report)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}


const getInspectionReportById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

export { addInspectionReport, getInspectionReportByInspectionId, updateInspectionReport, getInspectionReportById, };
