import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/incidents";

export type YearlyClosureResponse = {
    date: string;
    totalIncidents: number;
    closedIncidents: number;
};

const reportIncident = async (incidentData: any) => {
    return axiosInstance.post(`${url}/report`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getAllIncidents = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getIncidentById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}


const updateIncident = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getIncidentDetails = async (id: any) => {
    return axiosInstance.get(`${url}/getDetails/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getYearlyClosureSummary = async (year: number): Promise<YearlyClosureResponse[]> => {
    return axiosInstance.get(`${url}/yearly-closure/${year}`)
        .then((response) => response.data as YearlyClosureResponse[])
        .catch((error) => { throw error; });
}

const getDepartmentStatistics = async (departmentId: number | string | null) => {
    const resolvedDepartmentId = departmentId ?? "null";
    const response = await axiosInstance.get<any>(
        `${url}/department/stats/${resolvedDepartmentId}`
    );
    return response.data;
};


export { reportIncident, getAllIncidents, getIncidentById, updateIncident, getIncidentDetails, getYearlyClosureSummary, getDepartmentStatistics }
