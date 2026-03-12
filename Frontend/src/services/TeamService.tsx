import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/incident-team";

export interface TeamMemberDTO {
    id: number;
    employeeId: number;
    employeeName: string;
    teamId: number | null;
    notificationLevel: number[] | null;
    role: string;
    status: string;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface TeamMemberDetailsResponse {
    id: number;
    teamName: string;
    departmentName: string;
    members: TeamMemberDTO[];
}

// /hns/incidents-category/create
const createIncidentTeam = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const updateIncidentTeam = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const deleteIncidentTeam = async (id: string | number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getIncidentTeamDetails = async (id: string | number) => {
    return axiosInstance.get(`${url}/getTeamDetails/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getAllIncidentTeams = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getAllActiveIncidentTeams = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getIncidentTeamById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const activateIncidentTeam = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const deactivateIncidentTeam = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getTeamMembers = async (teamId: any) => {
    return axiosInstance.get(`${url}/getTeamMembers/${teamId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const removeTeamMember = async (id: any) => {
    return axiosInstance.delete(`${url}/removeMember/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

const getMemberTeamDetails = async (employeeId: string | number) => {
    return axiosInstance.get<TeamMemberDetailsResponse>(`${url}/member/team-details/${employeeId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
export { createIncidentTeam, updateIncidentTeam, deleteIncidentTeam, getAllIncidentTeams, getAllActiveIncidentTeams, getIncidentTeamById, activateIncidentTeam, deactivateIncidentTeam, getTeamMembers, removeTeamMember, getIncidentTeamDetails, getMemberTeamDetails };
