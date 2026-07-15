/**
 * EquipmentService — Registre des équipements (module Inspections HSE).
 *
 * Service axios pour l'entité Equipment (backend HNS, gateway `/hns/equipment`).
 * Chaque équipement est scopé par mine (company_id) : l'intercepteur Axios
 * injecte automatiquement `?companyId=` sur toutes les requêtes — aucun besoin
 * de le passer ici (aligné sur LocationService / WorkProcessService).
 *
 * Contrat backend (figé) :
 *   POST   /hns/equipment/create      → crée, retourne id/DTO
 *   PUT    /hns/equipment/update      → met à jour (+ garde d'appartenance)
 *   GET    /hns/equipment/getAll      → liste scopée mine (ACTIVE en priorité)
 *   GET    /hns/equipment/get/{id}    → détail (+ garde)
 *   DELETE /hns/equipment/delete/{id} → suppression / désactivation (+ garde)
 */

import axiosInstance from '../interceptors/AxiosInterceptor';

const url = '/hns/equipment';

export interface EquipmentDTO {
    id?: number;
    code: string;
    name: string;
    type?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    locationId?: number | null;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Liste des équipements de la mine active. Dégradation gracieuse : en cas
 * d'erreur (endpoint non déployé, réseau…), on renvoie une liste vide plutôt
 * que de propager l'exception, pour que les écrans consommateurs (formulaire
 * d'inspection notamment) ne crashent pas.
 */
export const getAllEquipment = (): Promise<EquipmentDTO[]> =>
    axiosInstance
        .get<EquipmentDTO[]>(`${url}/getAll`)
        .then((r) => r.data ?? [])
        .catch(() => []);

export const getEquipment = (id: number): Promise<EquipmentDTO> =>
    axiosInstance.get<EquipmentDTO>(`${url}/get/${id}`).then((r) => r.data);

export const createEquipment = (data: EquipmentDTO) =>
    axiosInstance.post(`${url}/create`, data).then((r) => r.data);

export const updateEquipment = (data: EquipmentDTO) =>
    axiosInstance.put(`${url}/update`, data).then((r) => r.data);

export const deleteEquipment = (id: number) =>
    axiosInstance.delete(`${url}/delete/${id}`).then((r) => r.data);
