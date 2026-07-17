/**
 * IndicatorService — Referentiel des indicateurs HSE et leurs plans de
 * cibles/previsions (module "Target and Forecast", backend HNS).
 *
 * Scoping mine : l'intercepteur Axios injecte automatiquement `?companyId=` sur
 * toutes les requetes — on ne le passe JAMAIS ici (aligne sur EquipmentService).
 *
 * Contrat backend (fige) :
 *   Indicateurs (/hns/indicator) :
 *     POST   /create           -> cree, retourne l'id
 *     PUT    /update           -> met a jour (+ garde d'appartenance)
 *     GET    /getAll           -> liste scopee mine (actifs en tete)
 *     GET    /getForecastable  -> actifs planifiables (hasForecast=true)
 *     GET    /get/{id}         -> detail (+ garde)
 *     DELETE /delete/{id}      -> desactivation logique (+ garde)
 *   Plans (/hns/indicator-plan) :
 *     GET    /get?indicatorId=&year=  -> plan existant OU squelette pret a remplir
 *     POST   /save                    -> upsert plan + periodes, renvoie le plan recalcule
 */

import axiosInstance from '../interceptors/AxiosInterceptor';

const IND = '/hns/indicator';
const PLAN = '/hns/indicator-plan';

export type IndicatorCategory = 'LEADING' | 'LAGGING' | 'COMMUNITY';
export type IndicatorFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type IndicatorDirection = 'LOWER_IS_BETTER' | 'HIGHER_IS_BETTER';

export interface IndicatorDTO {
    id?: number;
    code?: string;
    name: string;
    definition?: string;
    category?: IndicatorCategory;
    frequency?: IndicatorFrequency;
    direction?: IndicatorDirection;
    hasForecast?: boolean;
    unit?: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface PlanEntryDTO {
    id?: number;
    planId?: number;
    periodIndex: number;
    periodLabel: string;
    target?: number | null;
    forecast?: number | null;
    actual?: number | null;
    /** Calcules serveur (lecture seule). */
    variancePct?: number | null;
    status?: 'PENDING' | 'ON_TARGET' | 'OFF_TARGET' | string;
}

export interface IndicatorPlanDTO {
    id?: number | null;
    indicatorId: number;
    year: number;
    indicatorCode?: string;
    indicatorName?: string;
    unit?: string;
    frequency?: IndicatorFrequency;
    direction?: IndicatorDirection;
    hasForecast?: boolean;
    entries: PlanEntryDTO[];
}

/* ── Indicateurs ─────────────────────────────────────────────────────────── */

/** Liste des indicateurs de la mine active. Degradation gracieuse -> []. */
export const getAllIndicators = (): Promise<IndicatorDTO[]> =>
    axiosInstance.get<IndicatorDTO[]>(`${IND}/getAll`).then((r) => r.data ?? []).catch(() => []);

export const getForecastableIndicators = (): Promise<IndicatorDTO[]> =>
    axiosInstance.get<IndicatorDTO[]>(`${IND}/getForecastable`).then((r) => r.data ?? []).catch(() => []);

export const getIndicator = (id: number): Promise<IndicatorDTO> =>
    axiosInstance.get<IndicatorDTO>(`${IND}/get/${id}`).then((r) => r.data);

export const createIndicator = (data: IndicatorDTO) =>
    axiosInstance.post(`${IND}/create`, data).then((r) => r.data);

export const updateIndicator = (data: IndicatorDTO) =>
    axiosInstance.put(`${IND}/update`, data).then((r) => r.data);

export const deleteIndicator = (id: number) =>
    axiosInstance.delete(`${IND}/delete/${id}`).then((r) => r.data);

/* ── Plans ───────────────────────────────────────────────────────────────── */

/** Plan (existant ou squelette). Ne rattrape PAS l'erreur : l'appelant gere. */
export const getPlan = (indicatorId: number, year: number): Promise<IndicatorPlanDTO> =>
    axiosInstance
        .get<IndicatorPlanDTO>(`${PLAN}/get`, { params: { indicatorId, year } })
        .then((r) => r.data);

export const savePlan = (dto: IndicatorPlanDTO): Promise<IndicatorPlanDTO> =>
    axiosInstance.post<IndicatorPlanDTO>(`${PLAN}/save`, dto).then((r) => r.data);
