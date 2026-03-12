import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/team-member";

const addTeamMember = async (data: any) => {
    return axiosInstance.post(`${url}/add`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const updateTeamMember = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const deleteTeamMember = async (id: string | number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getAllTeamMembers = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getAllActiveTeamMembers = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getTeamMemberById = async (id: string | number) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getTeamMemberByEmployeeId = async (employeeId: string | number) => {
    return axiosInstance.get(`${url}/employee/${employeeId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const activateTeamMember = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const deactivateTeamMember = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

export { addTeamMember, updateTeamMember, deleteTeamMember, getAllTeamMembers, getAllActiveTeamMembers, getTeamMemberById, getTeamMemberByEmployeeId, activateTeamMember, deactivateTeamMember };
