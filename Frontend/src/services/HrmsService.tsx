import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hrms";

const getEmployeesByDepartment = (id: any) => {
    return axiosInstance.get(`${url}/employee/getByDepartment/${id}`)
        .then(result => result.data);
}
const getAllDepartments = () => {
    return axiosInstance.get(`${url}/department/getNames`)
        .then(result => result.data);
}

const getAllCompanies = async () => {
    return axiosInstance.get(`${url}/company/getAll`)
        .then(result => result.data);
}

const getEmployeesWithPosition = () => {
    return axiosInstance.get(`${url}/employee/getAllWithEmailAndPosition`)
        .then(result => result.data);
}

// LOT 52 — départements filtrés par mine (création d'utilisateur)
const getDepartmentsByCompany = (companyId: number) => {
    return axiosInstance.get(`${url}/department/getByCompanyId/${companyId}`)
        .then(result => result.data);
}
export { getEmployeesByDepartment, getAllDepartments, getAllCompanies, getEmployeesWithPosition, getDepartmentsByCompany }