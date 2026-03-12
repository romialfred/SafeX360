import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/compliance-docs";


const createComplianceDocument = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getDocumentById = async (id: any) => {
    return axiosInstance.get(`${url}/getDocDetails/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}


const getAllComplianceDocuments = async () => {

    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getEmployeeComplianceStatus = async () => {
    return axiosInstance.get(`${url}/getAllEmpStatus`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getByEmployeeId = async (employeeId: any) => {
    return axiosInstance.get(`${url}/getByEmployeeId/${employeeId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getRequirementsByEmpId = async (employeeId: any) => {
    return axiosInstance.get(`${url}/getRequirementsByEmpId/${employeeId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const approveComplianceDocument = async (id: number) => {
    return axiosInstance.put(`${url}/approve/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const rejectComplianceDocument = async (id: number, comment: string) => {
    return axiosInstance.put(`${url}/reject/${id}`, null, {
        params: { comment }
    })
        .then((response) => response.data)
        .catch((error) => { throw error; });
};


export { createComplianceDocument, getAllComplianceDocuments, getEmployeeComplianceStatus, getByEmployeeId, getRequirementsByEmpId, getDocumentById, approveComplianceDocument, rejectComplianceDocument }