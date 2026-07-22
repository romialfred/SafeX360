import axiosInstance from "../interceptors/AxiosInterceptor";

/**
 * Journal d'audit champ-par-champ (ISO 45001 §7.5.3). Générique : rattaché à une
 * entité par (entityType, entityId). companyId auto-injecté par l'intercepteur.
 */

export interface ChangeLogEntry {
    id: number;
    entityType: string;
    entityId: number;
    field: string;
    oldValue?: string | null;
    newValue?: string | null;
    actorId?: number | null;
    actorName?: string | null;
    changedAt: string;
}

export type ChangeLogEntityType = 'INCIDENT' | 'CORRECTIVE_ACTION' | 'INVESTIGATION';

const getHistory = async (entityType: ChangeLogEntityType, entityId: number | string): Promise<ChangeLogEntry[]> => {
    const res = await axiosInstance.get(`/hns/change-log/${entityType}/${entityId}`);
    return res.data ?? [];
};

export { getHistory };
