import axiosInstance from "../interceptors/AxiosInterceptor";

/**
 * Opportunités SST (ISO 45001 §6.1.2.3) : service d'accès aux opportunités
 * d'amélioration de la santé et sécurité au travail. Reflète le contrat
 * backend exposé sous le préfixe /hns/risks/opportunities.
 */

const url = "/hns/risks/opportunities";

export type OpportunityStatus = 'IDENTIFIED' | 'IN_PROGRESS' | 'REALIZED' | 'DISMISSED';

export interface OpportunityDTO {
    id?: number;
    title: string;
    description?: string | null;
    category?: string | null;
    expectedBenefit?: string | null;
    departmentId?: number | null;
    ownerId?: number | null;
    status: OpportunityStatus;
    targetDate?: string | null; // yyyy-MM-dd
    createdAt?: string;
    updatedAt?: string;
}

const listOpportunities = async (): Promise<OpportunityDTO[]> => {
    return axiosInstance.get(`${url}`)
        .then((response) => response.data);
};

const getOpportunity = async (id: number | string): Promise<OpportunityDTO> => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
};

const createOpportunity = async (dto: OpportunityDTO) => {
    return axiosInstance.post(`${url}/create`, dto)
        .then((response) => response.data);
};

const updateOpportunity = async (dto: OpportunityDTO) => {
    return axiosInstance.put(`${url}/update`, dto)
        .then((response) => response.data);
};

const updateOpportunityStatus = async (id: number | string, status: OpportunityStatus) => {
    return axiosInstance.put(`${url}/status/${id}?status=${status}`)
        .then((response) => response.data);
};

const deleteOpportunity = async (id: number | string) => {
    return axiosInstance.delete(`${url}/${id}`)
        .then((response) => response.data);
};

export {
    listOpportunities,
    getOpportunity,
    createOpportunity,
    updateOpportunity,
    updateOpportunityStatus,
    deleteOpportunity,
};
