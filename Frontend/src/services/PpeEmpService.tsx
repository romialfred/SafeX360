import axiosInstance from "../interceptors/AxiosInterceptor";


const url = "/hns/ppeEmp";

const getPpeById = async (id: number) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then(res => res.data);
};

const getPpeByEmp = async (empId: number) => {
    return axiosInstance.get(`${url}/by-emp/${empId}`)
        .then(res => res.data);
};

const getPpeByPpe = async (ppeId: number) => {
    return axiosInstance.get(`${url}/by-ppe/${ppeId}`)
        .then(res => res.data);
};

const getPpeByStatus = async (status: string) => {
    return axiosInstance.get(`${url}/by-status`, { params: { status } })
        .then(res => res.data);
};

const getAllAssignmentCounts = async () => {
    return axiosInstance.get(`${url}/counts`)
        .then(res => res.data);
};

export { getPpeById, getPpeByEmp, getPpeByPpe, getPpeByStatus, getAllAssignmentCounts };
