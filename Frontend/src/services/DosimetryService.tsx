/**
 * DosimetryService — Module Dosimetrie & Expositions (SafeX 360).
 *
 * Service axios pour les principaux agregats du module :
 *   - Threshold        : limites reglementaires (CIPR / AIEA)
 *   - ExposedWorker    : registre des travailleurs exposes (cat A/B)
 *   - Dosimeter        : dosimetres et instruments de mesure
 *   - DoseRecord       : saisie et suivi des doses individuelles (append-only)
 *   - ExposureAlert    : alertes de depassement de seuils
 *
 * Pattern URL : pluriel "/hns/dosimetry/<aggregat>" + verbe custom, aligne sur
 *               les @RequestMapping reels des controllers Spring du module
 *               (cf. ThresholdController, ExposedWorkerController, etc.).
 *
 *  Base singulier :
 *    - /hns/dosimetry/threshold/{getAll|get/{id}|create|update|delete/{id}}
 *    - /hns/dosimetry/exposed-worker/{getAll|get/{id}|create|update|delete/{id}}
 *    - /hns/dosimetry/dosimeter/{getAll|get/{id}|create|update|delete/{id}}
 *    - /hns/dosimetry/dose-record/{getAll|get/{id}|create|update|delete/{id}|getActiveByWorker/{id}}
 *    - /hns/dosimetry/exposure-alert/{getAll|get/{id}|create|update|delete/{id}}
 *
 * Le companyId est injecte automatiquement en query param par AxiosInterceptor,
 * il ne doit donc PAS etre passe explicitement par l'appelant.
 *
 * Convention update : aligne sur NonConformityService — l'id est dans le body
 * (DTO), PAS dans l'URL. Le payload doit contenir { id, ...patch }.
 */

import axiosInstance from '../interceptors/AxiosInterceptor';

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES DTO — alignes 1:1 sur les DTO Java du backend
// ─────────────────────────────────────────────────────────────────────────────

/** Grandeur dosimetrique CIPR 103 (cf. enum ThresholdGrandeur). */
export type ThresholdGrandeur = 'HP10' | 'HP007' | 'HP3';

/** Categorie d'exposition CIPR 103 (cf. enum DoseCategory). */
export type DoseCategory = 'A' | 'B';

/** Niveau de criticite d'une alerte (cf. enum AlertLevel). */
export type AlertLevel = 'APPROACH' | 'INVESTIGATION' | 'ACTION' | 'EXCEEDED';

/** Statut d'une alerte (cf. enum AlertStatus). */
export type AlertStatus = 'ACTIVE' | 'ACK' | 'RESOLVED';

/** Origine d'un enregistrement de dose (cf. enum DoseSource). */
export type DoseSource = 'AGENCY' | 'EPD' | 'ESTIMATED';

/** Technologie du dosimetre (cf. enum DosimeterType). */
export type DosimeterType = 'TLD' | 'OSL' | 'FILM' | 'EPD';

/** Cycle de vie operationnel d'un dosimetre (cf. enum DosimeterStatus). */
export type DosimeterStatus = 'AVAILABLE' | 'ASSIGNED' | 'IN_READING' | 'LOST' | 'DAMAGED' | 'RETIRED';

/** Statut special d'un travailleur expose (cf. enum DoseSpecialStatus). */
export type DoseSpecialStatus = string;

/** ThresholdDTO — limite reglementaire. */
export interface ThresholdDTO {
    id?: number | null;
    /** Null = seuil global par defaut. */
    mineId?: number | null;
    grandeur: ThresholdGrandeur;
    /** Code categorie personne expose. Ex: "A", "B", "PUBLIC", "APPRENTICE". */
    personCategory: string;
    doseConstraint?: number | null;
    investigationLevel?: number | null;
    actionLevel?: number | null;
    regulatoryLimit?: number | null;
    /** JSON array d'entiers, ex. "[75,90]". */
    warnPercentages?: string | null;
    unit: string;
    /** Ex: "CIPR_103" | "AIEA_GSR_PART3" | "CUSTOM". */
    referenceFramework: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number | null;
    updatedBy?: number | null;
}

/** ExposedWorkerDTO — travailleur expose enregistre. */
export interface ExposedWorkerDTO {
    id?: number | null;
    employeeId: number;
    category: DoseCategory;
    classificationReason?: string | null;
    classificationDate?: string | null;
    rpoId?: number | null;
    specialStatus?: DoseSpecialStatus | null;
    specialStatusStartDate?: string | null;
    specialStatusEndDate?: string | null;
    active?: boolean;
    mineId: number;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number | null;
    updatedBy?: number | null;
}

/** DosimeterDTO — dosimetre / instrument de mesure. */
export interface DosimeterDTO {
    id?: number | null;
    serial: string;
    type: DosimeterType;
    qrCode?: string | null;
    status: DosimeterStatus;
    calibrationDueDate?: string | null;
    mineId: number;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number | null;
    updatedBy?: number | null;
}

/** DoseRecordDTO — enregistrement de dose append-only. */
export interface DoseRecordDTO {
    id?: number | null;
    workerId: number;
    period: string;
    hp10?: number | null;
    hp007?: number | null;
    hp3?: number | null;
    source: DoseSource;
    belowDetection?: boolean;
    attachmentUrls?: string | null;
    notes?: string | null;
    recordedBy?: number | null;
    recordedAt?: string | null;
    version?: number;
    supersededRecordId?: number | null;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number | null;
    updatedBy?: number | null;
}

/** ExposureAlertDTO — alerte de depassement. */
export interface ExposureAlertDTO {
    id?: number | null;
    workerId: number;
    zoneId?: number | null;
    level: AlertLevel;
    grandeur: ThresholdGrandeur;
    value: number;
    thresholdId: number;
    triggeredAt?: string | null;
    acknowledgedAt?: string | null;
    acknowledgedBy?: number | null;
    status: AlertStatus;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number | null;
    updatedBy?: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  THRESHOLDS — Limites reglementaires
//  Base: /hns/dosimetry/threshold
// ─────────────────────────────────────────────────────────────────────────────

const thresholdUrl = '/hns/dosimetry/threshold';

const getAllThresholds = async () => {
    return axiosInstance
        .get(`${thresholdUrl}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getThresholdById = async (id: number | string) => {
    return axiosInstance
        .get(`${thresholdUrl}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const createThreshold = async (data: ThresholdDTO) => {
    return axiosInstance
        .post(`${thresholdUrl}/create`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * update : pattern SafeX (cf. NonConformityService) — id dans le DTO body,
 * verbe PUT, pas d'id dans l'URL.
 */
const updateThreshold = async (data: ThresholdDTO) => {
    return axiosInstance
        .put(`${thresholdUrl}/update`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const deleteThreshold = async (id: number | string) => {
    return axiosInstance
        .delete(`${thresholdUrl}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXPOSED WORKERS — Registre des travailleurs exposes
//  Base: /hns/dosimetry/exposed-worker
// ─────────────────────────────────────────────────────────────────────────────

const exposedWorkerUrl = '/hns/dosimetry/exposed-worker';

const getAllExposedWorkers = async () => {
    return axiosInstance
        .get(`${exposedWorkerUrl}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getExposedWorkerById = async (id: number | string) => {
    return axiosInstance
        .get(`${exposedWorkerUrl}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const createExposedWorker = async (data: ExposedWorkerDTO) => {
    return axiosInstance
        .post(`${exposedWorkerUrl}/create`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updateExposedWorker = async (data: ExposedWorkerDTO) => {
    return axiosInstance
        .put(`${exposedWorkerUrl}/update`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const deleteExposedWorker = async (id: number | string) => {
    return axiosInstance
        .delete(`${exposedWorkerUrl}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// ─────────────────────────────────────────────────────────────────────────────
//  DOSIMETERS & INSTRUMENTS
//  Base: /hns/dosimetry/dosimeter
// ─────────────────────────────────────────────────────────────────────────────

const dosimeterUrl = '/hns/dosimetry/dosimeter';

const getAllDosimeters = async () => {
    return axiosInstance
        .get(`${dosimeterUrl}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getDosimeterById = async (id: number | string) => {
    return axiosInstance
        .get(`${dosimeterUrl}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const createDosimeter = async (data: DosimeterDTO) => {
    return axiosInstance
        .post(`${dosimeterUrl}/create`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updateDosimeter = async (data: DosimeterDTO) => {
    return axiosInstance
        .put(`${dosimeterUrl}/update`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const deleteDosimeter = async (id: number | string) => {
    return axiosInstance
        .delete(`${dosimeterUrl}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// ─────────────────────────────────────────────────────────────────────────────
//  DOSE RECORDS — Saisie & suivi des doses (append-only)
//  Base: /hns/dosimetry/dose-record
// ─────────────────────────────────────────────────────────────────────────────

const doseRecordUrl = '/hns/dosimetry/dose-record';

const getAllDoseRecords = async () => {
    return axiosInstance
        .get(`${doseRecordUrl}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getDoseRecordById = async (id: number | string) => {
    return axiosInstance
        .get(`${doseRecordUrl}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Recupere les enregistrements actifs (non superseded) pour un worker donne.
 * Endpoint backend : GET /getActiveByWorker/{workerId}
 */
const getActiveDoseRecordsByWorker = async (workerId: number | string) => {
    return axiosInstance
        .get(`${doseRecordUrl}/getActiveByWorker/${workerId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const createDoseRecord = async (data: DoseRecordDTO) => {
    return axiosInstance
        .post(`${doseRecordUrl}/create`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * update : pattern append-only — cree un NOUVEAU record version+1 et marque
 * l'ancien comme superseded. Retourne l'id du nouvel enregistrement.
 */
const updateDoseRecord = async (data: DoseRecordDTO) => {
    return axiosInstance
        .put(`${doseRecordUrl}/update`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const deleteDoseRecord = async (id: number | string) => {
    return axiosInstance
        .delete(`${doseRecordUrl}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXPOSURE ALERTS — Depassements de seuils
//  Base: /hns/dosimetry/exposure-alert
// ─────────────────────────────────────────────────────────────────────────────

const exposureAlertUrl = '/hns/dosimetry/exposure-alert';

const getAllAlerts = async () => {
    return axiosInstance
        .get(`${exposureAlertUrl}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAlertById = async (id: number | string) => {
    return axiosInstance
        .get(`${exposureAlertUrl}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const createAlert = async (data: ExposureAlertDTO) => {
    return axiosInstance
        .post(`${exposureAlertUrl}/create`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updateAlert = async (data: ExposureAlertDTO) => {
    return axiosInstance
        .put(`${exposureAlertUrl}/update`, data)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const deleteAlert = async (id: number | string) => {
    return axiosInstance
        .delete(`${exposureAlertUrl}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
    // Thresholds
    getAllThresholds,
    getThresholdById,
    createThreshold,
    updateThreshold,
    deleteThreshold,
    // Exposed workers
    getAllExposedWorkers,
    getExposedWorkerById,
    createExposedWorker,
    updateExposedWorker,
    deleteExposedWorker,
    // Dosimeters
    getAllDosimeters,
    getDosimeterById,
    createDosimeter,
    updateDosimeter,
    deleteDosimeter,
    // Dose records
    getAllDoseRecords,
    getDoseRecordById,
    getActiveDoseRecordsByWorker,
    createDoseRecord,
    updateDoseRecord,
    deleteDoseRecord,
    // Alerts
    getAllAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert,
};
