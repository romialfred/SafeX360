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
    // Le backend n'expose QUE /department/stats/{departmentId} — la variante
    // globale sans id n'existe pas (404). Sans département sélectionné, on
    // retourne null : l'appelant affiche des zéros proprement.
    if (departmentId === null || departmentId === undefined || departmentId === '' || departmentId === 'null') {
        return null;
    }
    const response = await axiosInstance.get<any>(`${url}/department/stats/${departmentId}`);
    return response.data;
};


// ── Reporting réglementaire (ISO 45001 §7.5.3 · E3.1) ──
const setRegulatoryStatus = async (id: number, notifiable: boolean, regulatoryDeadline: string | null) => {
    return axiosInstance.put(`${url}/${id}/regulatory`, { notifiable, regulatoryDeadline })
        .then((response) => response.data);
};

const markNotifiedToAuthority = async (id: number) => {
    return axiosInstance.put(`${url}/${id}/mark-notified`).then((response) => response.data);
};

/** Télécharge le PDF officiel de l'incident (réponse binaire). */
const exportIncidentPdf = async (id: number): Promise<Blob> => {
    return axiosInstance.get(`${url}/${id}/export-pdf`, { responseType: "blob" })
        .then((response) => response.data as Blob);
};

/** Incidents similaires (même lieu/processus, même mine) — recherche de récurrence (E3.2). */
const getSimilarIncidents = async (id: number) => {
    return axiosInstance.get(`${url}/${id}/similar`).then((response) => response.data ?? []);
};

export {
    reportIncident, getAllIncidents, getIncidentById, updateIncident, getIncidentDetails,
    getYearlyClosureSummary, getDepartmentStatistics,
    setRegulatoryStatus, markNotifiedToAuthority, exportIncidentPdf, getSimilarIncidents,
}
