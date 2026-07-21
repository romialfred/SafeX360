import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Client API du registre du personnel prioritaire à évacuer (VIP P1..P3).
 *
 * Base : `/hns/emergency/priority`. Registre persistant par mine — désigne les
 * personnes dont l'évacuation doit être suivie de près (salle de crise).
 */

export type EvacPriorityLevel = 'P1' | 'P2' | 'P3';

export interface EvacuationPriorityDTO {
    id?: number;
    companyId: number;
    employeeId: number;
    level: EvacPriorityLevel;
    roleLabel?: string | null;
    note?: string | null;
}

export const listEvacuationPriorities = (companyId: number): Promise<EvacuationPriorityDTO[]> =>
    axiosInstance.get('/hns/emergency/priority', { params: { companyId } }).then((r) => r.data);

export const upsertEvacuationPriority = (
    dto: EvacuationPriorityDTO,
    actorId?: number
): Promise<EvacuationPriorityDTO> =>
    axiosInstance
        .post('/hns/emergency/priority', dto, { params: actorId !== undefined ? { actorId } : {} })
        .then((r) => r.data);

export const deleteEvacuationPriority = (id: number): Promise<void> =>
    axiosInstance.delete(`/hns/emergency/priority/${id}`).then(() => undefined);
