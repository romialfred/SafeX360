import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/risks";

const createRisk = async (risksData: any) => {
    return axiosInstance.post(`${url}/create`, risksData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updateRisk = async (risksData: any) => {
    return axiosInstance.put(`${url}/update`, risksData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAllRisk = async () => {
    return axiosInstance.get(`${url}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getRisksWithRiskLevel = async () => {
    return axiosInstance.get(`${url}/withRiskLevel`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};


const getRiskById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updateRiskStatus = async (id: number | string, status: string) => {
    return axiosInstance.put(`${url}/status/${id}?status=${status}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

export interface RiskSearchParams {
    status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    departmentId?: number | string;
    ownerId?: number | string;
    from?: string;
    to?: string;
    q?: string;
}

export interface RiskDto {
    id: number;
    title: string;
    description: string;
    departmentId: number | null;
    workProcessId: number | null;
    hazardSource: string | null;
    riskLevel: string | null;
    potentialConsequences: string | null;
    ownerId: number | null;
    reviewDate: string | null;
    status: RiskStatus;
    createdAt: string;
    updatedAt: string;
    probability?: number;
    severity?: number;
}

const searchRisks = async (params?: RiskSearchParams) => {
    return axiosInstance.get<RiskDto[]>(`${url}/search`, { params })
        .then((res) => res.data)
        .catch((err) => { throw err; });
};

const getRiskOverview = async (params?: Record<string, any>) => {
    return axiosInstance.get(`${url}/overview`, { params })
        .then((res) => res.data)
        .catch((err) => { throw err; });
}


export { createRisk, updateRisk, getAllRisk, getRisksWithRiskLevel, getRiskById, updateRiskStatus, getRiskOverview, searchRisks };



export type RiskStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export interface OverviewMetrics {
    total: number;
    open: number;
    inProgress: number;
    closed: number;
    overdue: number;
}

export interface RiskMatrixResponse {
    counts: number[][]; // [prob-1][sev-1]
    probabilityLabels?: string[];
    severityLabels?: string[];
}

export interface DistributionItem { key: string; label?: string; count: number }

export interface Distributions {
    byLevelKey: Record<string, number>;
    byStatus: Record<RiskStatus, number>;
    byDepartment: DistributionItem[];
    byHazardSource: DistributionItem[];
}

export interface TrendPoint { month: string; total: number; open: number; closed: number }

export interface RiskOverviewResponse {
    metrics: OverviewMetrics;
    matrix: RiskMatrixResponse;
    distributions: Distributions;
    monthly: TrendPoint[];
}
