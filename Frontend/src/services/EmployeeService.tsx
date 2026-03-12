
import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hrms/employee";
const getEmployeeDropdown = () => {
    return axiosInstance.get(`${url}/getEmployeeDropdown`)
        .then(result => result.data)
        .catch(error => { throw error; });
}
const getEmployeeDropdownWithEmail = () => {
    return axiosInstance.get(`${url}/getEmployeeDropdownWithEmail`)
        .then(result => result.data)
        .catch(error => { throw error; });
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
    return axiosInstance.get(`${url}/getPicture/` + empId)
        .then(result => result.data)
        .catch(error => { throw error; });
}
const getEmployeesWithDepartment = async () => {
    return axiosInstance.get(`${url}/getEmployeesWithDepartment`)
        .then(result => result.data)
        .catch(error => { throw error; });
}

const getAllEmployeeWithDirection = async () => {
    return axiosInstance.get(`${url}/getAllEmployeeWithDirection`)
        .then(result => result.data)
        .catch(error => { throw error; });
}


const getEmployee = async (empId: any) => {
    return axiosInstance.get(`${url}/getEmpEmailAndPosition/${empId}`)
        .then(result => result.data)
        .catch(error => { throw error; });
}
export {
    getEmployeeDropdown, getEmployeesByIds, getProfilePicture, getEmployeeDropdownWithEmail, getEmployeesWithDepartment, getAllEmployeeWithDirection, getEmployee
};