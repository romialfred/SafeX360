import axiosInstance from "../interceptors/AxiosInterceptor";
import { cachedGet } from "../utility/referenceCache";
const url = "/hrms";

const getEmployeesByDepartment = (id: any) => {
    return axiosInstance.get(`${url}/employee/getByDepartment/${id}`)
        .then(result => result.data);
}
// Liste des départements MISE EN CACHE (mine-scopé, dédup, TTL 5 min) : 34 écrans
// la re-demandent à chaque montage. Les départements sont gérés dans le SIRH,
// pas depuis SafeX — la fraîcheur bornée par le TTL suffit. Voir referenceCache.ts.
const getAllDepartments = () =>
    cachedGet('departments:names', () =>
        axiosInstance.get(`${url}/department/getNames`).then(result => result.data));

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