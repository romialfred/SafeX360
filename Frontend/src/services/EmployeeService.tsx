
import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hrms/employee";
const getEmployeeDropdown = () => {
    return axiosInstance.get(`${url}/getEmployeeDropdown`)
        .then(result => result.data);
}
const getEmployeeDropdownWithEmail = () => {
    return axiosInstance.get(`${url}/getEmployeeDropdownWithEmail`)
        .then(result => result.data);
}
const getEmployeesByIds = (ids: number[]) => {
    const safeIds = Array.isArray(ids) ? ids.filter(v => v != null) : [];
    return axiosInstance.get(`${url}/getByIds`, {
        params: { ids: safeIds },
        paramsSerializer: params =>
            (params.ids || [])
                .map((id: number) => `ids=${encodeURIComponent(id)}`)
                .join('&'),
    })
        .then(res => res.data);
};
const getProfilePicture = async (empId: any) => {
    // Garde anti-undefined : evite l'appel /getPicture/undefined qui retourne 500.
    // Survient quand le composant appelant n'a pas encore charge l'employee (UI initial state).
    if (empId === undefined || empId === null || empId === '' || empId === 'undefined' || empId === 'null') {
        return Promise.resolve(null);
    }
    return axiosInstance.get(`${url}/getPicture/` + empId)
        .then(result => result.data);
}
const getEmployeesWithDepartment = async () => {
    return axiosInstance.get(`${url}/getEmployeesWithDepartment`)
        .then(result => result.data);
}

const getAllEmployeeWithDirection = async () => {
    return axiosInstance.get(`${url}/getAllEmployeeWithDirection`)
        .then(result => result.data);
}


const getEmployee = async (empId: any) => {
    return axiosInstance.get(`${url}/getEmpEmailAndPosition/${empId}`)
        .then(result => result.data);
}
export {
    getEmployeeDropdown, getEmployeesByIds, getProfilePicture, getEmployeeDropdownWithEmail, getEmployeesWithDepartment, getAllEmployeeWithDirection, getEmployee
};