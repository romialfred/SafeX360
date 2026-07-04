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
const createIncidentTeam = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => response.data);
}

const updateIncidentTeam = async (data: Record<string, unknown>) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => response.data);
}
const deleteIncidentTeam = async (id: string | number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((response) => response.data);
}

const getIncidentTeamDetails = async (id: string | number) => {
    return axiosInstance.get(`${url}/getTeamDetails/${id}`)
        .then((response) => response.data);
}

const getAllIncidentTeams = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data);
}
const getAllActiveIncidentTeams = async () => {
    return axiosInstance.get(`${url}/getAllActive`)
        .then((response) => response.data);
}
const getIncidentTeamById = async (id: number) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
}
const activateIncidentTeam = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}
const deactivateIncidentTeam = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}
const getTeamMembers = async (teamId: number) => {
    return axiosInstance.get(`${url}/getTeamMembers/${teamId}`)
        .then((response) => response.data);
}

const removeTeamMember = async (id: number) => {
    return axiosInstance.delete(`${url}/removeMember/${id}`)
        .then((response) => response.data);
}

const getMemberTeamDetails = async (employeeId: string | number) => {
    return axiosInstance.get<TeamMemberDetailsResponse>(`${url}/member/team-details/${employeeId}`)
        .then((response) => response.data);
}
export { createIncidentTeam, updateIncidentTeam, deleteIncidentTeam, getAllIncidentTeams, getAllActiveIncidentTeams, getIncidentTeamById, activateIncidentTeam, deactivateIncidentTeam, getTeamMembers, removeTeamMember, getIncidentTeamDetails, getMemberTeamDetails };
