import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/team-member";

const addTeamMember = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/add`, data)
        .then((response) => response.data);
}

const updateTeamMember = async (data: Record<string, unknown>) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => response.data);
}
const deleteTeamMember = async (id: string | number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((response) => response.data);
}

const getAllTeamMembers = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data);
}
const getAllActiveTeamMembers = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data);
}
const getTeamMemberById = async (id: string | number) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
}

const getTeamMemberByEmployeeId = async (employeeId: string | number) => {
    return axiosInstance.get(`${url}/employee/${employeeId}`)
        .then((response) => response.data);
}

// Le backend (TeamMemberAPI) attend l'id dans le BODY (@RequestBody Long),
// pas en path variable — /activate/{id} renvoyait un 404 silencieux.
const activateTeamMember = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate`, Number(id), {
        headers: { 'Content-Type': 'application/json' },
    }).then((response) => response.data);
}
const deactivateTeamMember = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate`, Number(id), {
        headers: { 'Content-Type': 'application/json' },
    }).then((response) => response.data);
}

export { addTeamMember, updateTeamMember, deleteTeamMember, getAllTeamMembers, getAllActiveTeamMembers, getTeamMemberById, getTeamMemberByEmployeeId, activateTeamMember, deactivateTeamMember };
