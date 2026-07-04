import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/risks/controls";

/**
 * Plan de maîtrise (ISO 45001 §8.1.2) : mesures de la hiérarchie de contrôle
 * rattachées à un risque général (RISK) ou chimique (CHEMICAL).
 */
export type RiskControlSourceType = 'RISK' | 'CHEMICAL';
export type RiskControlType =
    | 'ELIMINATION'
    | 'SUBSTITUTION'
    | 'ENGINEERING'
    | 'ADMINISTRATIVE'
    | 'PPE';
export type RiskControlStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE';

export interface RiskControlDTO {
    id?: number;
    sourceType: RiskControlSourceType;
    riskId: number;
    controlType: RiskControlType;
    description: string;
    responsibleId?: number | null;
    dueDate?: string | null; // yyyy-MM-dd
    status: RiskControlStatus;
}

const listRiskControls = async (sourceType: RiskControlSourceType, riskId: number | string) => {
    return axiosInstance.get<RiskControlDTO[]>(`${url}`, { params: { sourceType, riskId } })
        .then((response) => response.data);
};

const createRiskControl = async (dto: RiskControlDTO) => {
    return axiosInstance.post(`${url}/create`, dto)
        .then((response) => response.data);
};

const updateRiskControl = async (dto: RiskControlDTO) => {
    return axiosInstance.put(`${url}/update`, dto)
        .then((response) => response.data);
};

const deleteRiskControl = async (id: number | string) => {
    return axiosInstance.delete(`${url}/${id}`)
        .then((response) => response.data);
};

export { listRiskControls, createRiskControl, updateRiskControl, deleteRiskControl };
