import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/audit";


const createAudit = async (data: any) => {
    return axiosInstance.post(`${url}/create`, data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getAllAudit = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getAreasByAuditId = async (id: any) => {
    return axiosInstance.get(`${url}/getAreas/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const executeAudit = async (data: any) => {
    return axiosInstance.post(`${url}/execute`, data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const reportExists = async (id: any) => {
    return axiosInstance.get(`${url}/reportExists/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const createRecommendation = async (data: any) => {
    return axiosInstance.post(`${url}/createRecommendation`, data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getAllRecommendations = async () => {
    return axiosInstance.get(`${url}/getAllRecommendations`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getRecommendationByAuditId = async (auditId: any) => {
    return axiosInstance.get(`${url}/getRecommendationsByAuditId/${auditId}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const createFollowup = async (data: any) => {
    return axiosInstance.post(`${url}/createFollowup`, data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getRecommendationFollowups = async (id: any) => {
    return axiosInstance.get(`${url}/getFollowup/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getRecommendationById = async (id: any) => {
    return axiosInstance.get(`${url}/getRecommendation/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const getAuditDetails = async (id: any) => {
    return axiosInstance.get(`${url}/getDetails/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}


const getAuditorsByAuditId = async (id: any) => {
    return axiosInstance.get(`${url}/getAuditors/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getAreasDetailsByAuditId = async (id: any) => {
    return axiosInstance.get(`${url}/getAreasDetails/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const getPlanningAudits = async () => {
    return axiosInstance.get(`${url}/getPlanningAudits`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}

const approvePlanning = async (id: any) => {
    return axiosInstance.put(`${url}/approvePlanning/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
const rejectPlanning = async (id: any) => {
    return axiosInstance.put(`${url}/rejectPlanning/${id}`)
        .then((response) => {
            return response.data;
        }).catch((error) => { throw error; })
}

const getLeadAuditors = async () => {
    return axiosInstance.get(`${url}/getLeadAuditors`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getLeadAuditorsForPlanning = async () => {
    return axiosInstance.get(`${url}/getLeadAuditorsForPlanning`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const updateAudit = async (data: any) => {
    return axiosInstance.put(`${url}/update`, data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}


const deleteAuditor = async (id: any) => {
    return axiosInstance.delete(`${url}/deleteAuditor/${id}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => { throw error; });
}
export { createAudit, getAllAudit, getAreasByAuditId, executeAudit, reportExists, getAllRecommendations, createFollowup, getRecommendationFollowups, getRecommendationById, getAuditDetails, getAuditorsByAuditId, getAreasDetailsByAuditId, createRecommendation, getRecommendationByAuditId, getPlanningAudits, approvePlanning, rejectPlanning, getLeadAuditors, getLeadAuditorsForPlanning, updateAudit, deleteAuditor };
// New endpoints for dashboard recommendations
const getPendingRecommendations = async () => {
    return axiosInstance.get(`${url}/getPendingRecommendations`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}
const getInProgressRecommendations = async () => {
    return axiosInstance.get(`${url}/getInProgressRecommendations`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
}

export { getPendingRecommendations, getInProgressRecommendations };
