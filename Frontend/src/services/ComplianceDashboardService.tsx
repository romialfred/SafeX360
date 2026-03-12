import axiosInstance from "../interceptors/AxiosInterceptor";

const baseUrl = "/hns/compliance/dashboard";

export interface ActionItemEmployee {
    id: string;
    name: string;
    role: string;
    department: string;
}

export interface ActionItem {
    id: string;
    requirementTitle: string;
    employee: ActionItemEmployee;
    statusDetail?: string;
    expiredOn?: string | null;
    dueOn?: string | null;
    description?: string | null;
}

export interface ActionStatus {
    code: string;
    label: string;
    count: number;
    items: ActionItem[];
}

export interface ActionItemsResponse {
    statuses: ActionStatus[];
    lastUpdated?: string;
}

export interface DepartmentSummaryEntry {
    name: string;
    compliant: number;
    upcoming: number;
    expired: number;
    missing: number;
}

export interface DepartmentSummaryResponse {
    asOf?: string;
    departments: DepartmentSummaryEntry[];
}

export interface StatusBreakdownEntry {
    status: string;
    count: number;
    color?: string;
}

export interface OverallStatusResponse {
    totalRequirements: number;
    breakdown: StatusBreakdownEntry[];
}

export interface CompliantEmployeeReviewInfo {
    completedOn?: string | null;
    validatedBy?: string | null;
    dueOn?: string | null;
    daysUntilDue?: number | null;
}

export interface CompliantEmployee {
    employeeId: string;
    name: string;
    jobTitle: string;
    department: string;
    requirement: string;
    lastReview: CompliantEmployeeReviewInfo;
    nextReview: CompliantEmployeeReviewInfo;
}

export interface CompliantEmployeesResponse {
    page: number;
    pageSize: number;
    total: number;
    employees: CompliantEmployee[];
}

export interface SendActionItemAlertRequest {
    employeeId: string | number;
    requirementId: string | number;
}

const getActionItems = async (): Promise<ActionItemsResponse> => {
    const response = await axiosInstance.get(`${baseUrl}/action-items`);
    return response.data;
};

const getDepartmentSummary = async (): Promise<DepartmentSummaryResponse> => {
    const response = await axiosInstance.get(`${baseUrl}/department-summary`);
    return response.data;
};

const getOverallStatus = async (): Promise<OverallStatusResponse> => {
    const response = await axiosInstance.get(`${baseUrl}/overall-status`);
    return response.data;
};

const getCompliantEmployees = async (page: number, pageSize: number): Promise<CompliantEmployeesResponse> => {
    const response = await axiosInstance.get(`${baseUrl}/compliant-employees`, {
        params: { page, pageSize },
    });
    return response.data;
};

const notifyActionItem = async (payload: SendActionItemAlertRequest): Promise<void> => {
    await axiosInstance.post(`${baseUrl}/action-items/notify`, payload);
};

export {
    getActionItems,
    getDepartmentSummary,
    getOverallStatus,
    getCompliantEmployees,
    notifyActionItem,
};
