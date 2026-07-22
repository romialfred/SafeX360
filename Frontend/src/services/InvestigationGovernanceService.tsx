import axiosInstance from "../interceptors/AxiosInterceptor";

/**
 * Gouvernance d'enquête (ISO 45001 §10.2) — frise chronologique (ECFC) et
 * témoignages structurés. companyId est auto-injecté par l'intercepteur (dérivé
 * / vérifié côté serveur via l'enquête parente).
 */

export type TimelineEventType = 'EVENT' | 'CONDITION' | 'BARRIER';

export interface TimelineEventDTO {
    id?: number | null;
    investigationId?: number | null;
    occurredAt?: string | null;
    sequenceOrder?: number | null;
    eventType?: TimelineEventType | null;
    description: string;
    barrierFailed?: boolean | null;
}

export interface WitnessStatementDTO {
    id?: number | null;
    investigationId?: number | null;
    witnessEmployeeId?: number | null;
    witnessName?: string | null;
    witnessRole?: string | null;
    statement: string;
    takenAt?: string | null;
    takenBy?: number | null;
    witnessEmployeeName?: string | null;
}

const base = "/hns/investigation-governance";

// ── Frise chronologique ──────────────────────────────────────────────────────

const listTimeline = async (investigationId: number): Promise<TimelineEventDTO[]> => {
    const res = await axiosInstance.get(`${base}/investigations/${investigationId}/timeline`);
    return res.data ?? [];
};

const addTimelineEvent = async (investigationId: number, dto: TimelineEventDTO): Promise<TimelineEventDTO> => {
    const res = await axiosInstance.post(`${base}/investigations/${investigationId}/timeline`, dto);
    return res.data;
};

const deleteTimelineEvent = async (eventId: number): Promise<void> => {
    await axiosInstance.delete(`${base}/timeline/${eventId}`);
};

// ── Témoignages ──────────────────────────────────────────────────────────────

const listWitnesses = async (investigationId: number): Promise<WitnessStatementDTO[]> => {
    const res = await axiosInstance.get(`${base}/investigations/${investigationId}/witnesses`);
    return res.data ?? [];
};

const addWitness = async (investigationId: number, dto: WitnessStatementDTO): Promise<WitnessStatementDTO> => {
    const res = await axiosInstance.post(`${base}/investigations/${investigationId}/witnesses`, dto);
    return res.data;
};

const deleteWitness = async (statementId: number): Promise<void> => {
    await axiosInstance.delete(`${base}/witnesses/${statementId}`);
};

export {
    listTimeline, addTimelineEvent, deleteTimelineEvent,
    listWitnesses, addWitness, deleteWitness,
};
