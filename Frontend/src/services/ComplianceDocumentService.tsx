import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/compliance-docs";


const createComplianceDocument = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        });
}

const getDocumentById = async (id: any) => {
    return axiosInstance.get(`${url}/getDocDetails/${id}`)
        .then((response) => response.data);
}


const getAllComplianceDocuments = async () => {

    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data);
};

const getEmployeeComplianceStatus = async () => {
    return axiosInstance.get(`${url}/getAllEmpStatus`)
        .then((response) => response.data);
};

const getByEmployeeId = async (employeeId: any) => {
    return axiosInstance.get(`${url}/getByEmployeeId/${employeeId}`)
        .then((response) => response.data);
}
const getRequirementsByEmpId = async (employeeId: any) => {
    return axiosInstance.get(`${url}/getRequirementsByEmpId/${employeeId}`)
        .then((response) => response.data);
}

const approveComplianceDocument = async (id: number) => {
    return axiosInstance.put(`${url}/approve/${id}`)
        .then((response) => response.data);
};

const rejectComplianceDocument = async (id: number, comment: string) => {
    return axiosInstance.put(`${url}/reject/${id}`, null, {
        params: { comment }
    })
        .then((response) => response.data);
};


export { createComplianceDocument, getAllComplianceDocuments, getEmployeeComplianceStatus, getByEmployeeId, getRequirementsByEmpId, getDocumentById, approveComplianceDocument, rejectComplianceDocument }