import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/incidents";

export type YearlyClosureResponse = {
    date: string;
    totalIncidents: number;
    closedIncidents: number;
};

const reportIncident = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/report`, data)
        .then((response) => {
            return response.data;
        });
}
const getAllIncidents = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => {
            return response.data;
        });
}

const getIncidentById = async (id: number) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => {
            return response.data;
        });
}


const updateIncident = async (data: Record<string, unknown>) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => {
            return response.data;
        });
}
const getIncidentDetails = async (id: number) => {
    return axiosInstance.get(`${url}/getDetails/${id}`)
        .then((response) => {
            return response.data;
        });
}
const getYearlyClosureSummary = async (year: number): Promise<YearlyClosureResponse[]> => {
    return axiosInstance.get(`${url}/yearly-closure/${year}`)
        .then((response) => response.data as YearlyClosureResponse[]);
}

const getDepartmentStatistics = async (departmentId: number | string | null) => {
    // Fix Phase 2.a — ne pas envoyer la chaîne littérale "null" au backend (Spring rejette le cast Long).
    // Si departmentId est null/undefined, on appelle l'endpoint global sans ID.
    if (departmentId === null || departmentId === undefined || departmentId === '' || departmentId === 'null') {
        const response = await axiosInstance.get<any>(`${url}/department/stats`);
        return response.data;
    }
    const response = await axiosInstance.get<any>(`${url}/department/stats/${departmentId}`);
    return response.data;
};


export { reportIncident, getAllIncidents, getIncidentById, updateIncident, getIncidentDetails, getYearlyClosureSummary, getDepartmentStatistics }
