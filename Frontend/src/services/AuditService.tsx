import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/audit";


const createAudit = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => {
            return response.data;
        });
}

const getAllAudit = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => {
            return response.data;
        });
}

const getAreasByAuditId = async (id: number) => {
    return axiosInstance.get(`${url}/getAreas/${id}`)
        .then((response) => {
            return response.data;
        });
}
const executeAudit = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/execute`, data)
        .then((response) => {
            return response.data;
        });
}

const reportExists = async (id: number) => {
    return axiosInstance.get(`${url}/reportExists/${id}`)
        .then((response) => {
            return response.data;
        });
}

const createRecommendation = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/createRecommendation`, data)
        .then((response) => {
            return response.data;
        });
}
const getAllRecommendations = async () => {
    return axiosInstance.get(`${url}/getAllRecommendations`)
        .then((response) => {
            return response.data;
        });
}
const getRecommendationByAuditId = async (auditId: number) => {
    return axiosInstance.get(`${url}/getRecommendationsByAuditId/${auditId}`)
        .then((response) => {
            return response.data;
        });
}
const createFollowup = async (data: Record<string, unknown>) => {
    return axiosInstance.post(`${url}/createFollowup`, data)
        .then((response) => {
            return response.data;
        });
}
const getRecommendationFollowups = async (id: number) => {
    return axiosInstance.get(`${url}/getFollowup/${id}`)
        .then((response) => {
            return response.data;
        });
}

const getRecommendationById = async (id: number) => {
    return axiosInstance.get(`${url}/getRecommendation/${id}`)
        .then((response) => {
            return response.data;
        });
}

const getAuditDetails = async (id: number) => {
    return axiosInstance.get(`${url}/getDetails/${id}`)
        .then((response) => {
            return response.data;
        });
}


const getAuditorsByAuditId = async (id: number) => {
    return axiosInstance.get(`${url}/getAuditors/${id}`)
        .then((response) => {
            return response.data;
        });
}
const getAreasDetailsByAuditId = async (id: number) => {
    return axiosInstance.get(`${url}/getAreasDetails/${id}`)
        .then((response) => {
            return response.data;
        });
}
const getPlanningAudits = async () => {
    return axiosInstance.get(`${url}/getPlanningAudits`)
        .then((response) => {
            return response.data;
        });
}

const approvePlanning = async (id: number) => {
    return axiosInstance.put(`${url}/approvePlanning/${id}`)
        .then((response) => {
            return response.data;
        });
}
const rejectPlanning = async (id: number) => {
    return axiosInstance.put(`${url}/rejectPlanning/${id}`)
        .then((response) => {
            return response.data;
        })
}

const getLeadAuditors = async () => {
    return axiosInstance.get(`${url}/getLeadAuditors`)
        .then((response) => response.data);
}
const getLeadAuditorsForPlanning = async () => {
    return axiosInstance.get(`${url}/getLeadAuditorsForPlanning`)
        .then((response) => response.data);
}
const updateAudit = async (data: Record<string, unknown>) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => {
            return response.data;
        });
}


const deleteAuditor = async (id: number) => {
    return axiosInstance.delete(`${url}/deleteAuditor/${id}`)
        .then((response) => {
            return response.data;
        });
}
export { createAudit, getAllAudit, getAreasByAuditId, executeAudit, reportExists, getAllRecommendations, createFollowup, getRecommendationFollowups, getRecommendationById, getAuditDetails, getAuditorsByAuditId, getAreasDetailsByAuditId, createRecommendation, getRecommendationByAuditId, getPlanningAudits, approvePlanning, rejectPlanning, getLeadAuditors, getLeadAuditorsForPlanning, updateAudit, deleteAuditor };
// New endpoints for dashboard recommendations
const getPendingRecommendations = async () => {
    return axiosInstance.get(`${url}/getPendingRecommendations`)
        .then((response) => response.data);
}
const getInProgressRecommendations = async () => {
    return axiosInstance.get(`${url}/getInProgressRecommendations`)
        .then((response) => response.data);
}

export { getPendingRecommendations, getInProgressRecommendations };
