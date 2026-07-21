import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Client API des paramètres d'évacuation du personnel (SIRH / MineXpert).
 *
 * Base : `/hrms/evacuation`. Priorité d'évacuation, point de rassemblement
 * affecté (référence un assembly_point HSE par id) et contacts d'urgence.
 * Règle : tout Directeur est P1 automatiquement (priorité effective).
 */

export type EvacPriorityLevel = 'P1' | 'P2' | 'P3';

export interface EmergencyContactDTO {
    id?: number;
    employeeId?: number;
    name?: string | null;
    relationship?: string | null;
    phone?: string | null;
    altPhone?: string | null;
    email?: string | null;
    priority?: number | null;
    note?: string | null;
}

export interface EmployeeEvacuationDTO {
    employeeId: number;
    companyId?: number | null;
    employeeName?: string | null;
    department?: string | null;
    positionName?: string | null;
    /** true si l'employé est un directeur (→ P1 automatique). */
    director: boolean;
    /** Priorité explicitement enregistrée (peut être null). */
    priorityLevel?: EvacPriorityLevel | null;
    /** Priorité effective = enregistrée, sinon P1 si directeur, sinon null. */
    effectivePriority?: EvacPriorityLevel | null;
    assemblyPointId?: number | null;
    specialNeeds?: string | null;
    contacts?: EmergencyContactDTO[];
}

const base = '/hrms/evacuation';

/** Vue SIRH par mine : priorité effective par employé (consommée par la salle de crise). */
export const listEmployeeEvacuation = (companyId: number): Promise<EmployeeEvacuationDTO[]> =>
    axiosInstance.get(base, { params: { companyId } }).then((r) => r.data);

export const getEmployeeEvacuation = (employeeId: number): Promise<EmployeeEvacuationDTO> =>
    axiosInstance.get(`${base}/${employeeId}`).then((r) => r.data);

export const upsertEmployeeEvacuation = (
    employeeId: number,
    dto: Partial<EmployeeEvacuationDTO>,
    actorId?: number
): Promise<EmployeeEvacuationDTO> =>
    axiosInstance
        .put(`${base}/${employeeId}`, dto, { params: actorId !== undefined ? { actorId } : {} })
        .then((r) => r.data);

export const addEmergencyContact = (
    employeeId: number,
    dto: EmergencyContactDTO
): Promise<EmergencyContactDTO> =>
    axiosInstance.post(`${base}/${employeeId}/contacts`, dto).then((r) => r.data);

export const updateEmergencyContact = (id: number, dto: EmergencyContactDTO): Promise<EmergencyContactDTO> =>
    axiosInstance.put(`${base}/contacts/${id}`, dto).then((r) => r.data);

export const deleteEmergencyContact = (id: number): Promise<void> =>
    axiosInstance.delete(`${base}/contacts/${id}`).then(() => undefined);
