import type { RiskStatus } from "../../services/RiskRegisterService";

export interface RiskSummary {
    id: number;
    title: string;
    description: string;
    status: RiskStatus;
    statusLabel: string;
    riskLevelKey: string | null;
    riskLevelLabel: string;
    riskLevelColor: string;
    probability: number | null;
    severity: number | null;
    score: number | null;
    hazardSource: string;
    potentialConsequences: string;
    ownerId: number | null | undefined;
    ownerLabel: string;
    departmentId: number | null;
    workProcessId: number | null;
    reviewDate: string | null;
    createdAt: string;
    updatedAt: string;
}
