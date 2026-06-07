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
export type DoseSpecialStatus = 'NONE' | 'PREGNANCY' | 'APPRENTICE';

/** Statut d'une qualification / habilitation (cf. enum QualifStatus). */
export type QualifStatus = 'VALID' | 'EXPIRED' | 'REVOKED';

/** Niveau d'exposition agrege (calcule cote backend par ExposedWorkerQueryService). */
export type ExposureLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

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

/** Bloc identite RH de la fiche 360 (cf. ExposedWorkerDetailDTO.IdentityDTO Java). */
export interface WorkerIdentityDTO {
    workerId: number;
    employeeId: number;
    matricule?: string | null;
    fullName?: string | null;
    dateNaissance?: string | null;
    position?: string | null;
    department?: string | null;
}

/** Bloc classification radioprotection (cf. ExposedWorkerDetailDTO.ClassificationDTO Java). */
export interface WorkerClassificationDTO {
    category: DoseCategory;
    reason?: string | null;
    date?: string | null;
    rpoId?: number | null;
    rpoName?: string | null;
    specialStatus?: DoseSpecialStatus | null;
    specialStatusStartDate?: string | null;
    specialStatusEndDate?: string | null;
}

/** ExposureProfileDTO (cf. backend ExposureProfileDTO.java). */
export interface ExposureProfileDTO {
    id?: number | null;
    workerId: number;
    exposureType: string;
    zoneId?: number | null;
    postId?: number | null;
    frequency?: string | null;
    conditions?: string | null;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number | null;
    updatedBy?: number | null;
}

/** DoseCumulativeDTO (cf. backend DoseCumulativeDTO.java). */
export interface DoseCumulativeDTO {
    id?: number | null;
    workerId: number;
    year: number;
    annualHp10?: number | null;
    annualHp007?: number | null;
    annualHp3?: number | null;
    rolling5yHp10?: number | null;
    lifetimeHp10?: number | null;
    updatedAt?: string;
}

/** DosimeterAssignmentDTO (cf. backend DosimeterAssignmentDTO.java). */
export interface DosimeterAssignmentDTO {
    id?: number | null;
    dosimeterId: number;
    workerId: number;
    periodStart: string;
    periodEnd?: string | null;
    handoverAck?: boolean;
    handoverAckAt?: string | null;
    returnAck?: boolean;
    returnAckAt?: string | null;
    deviceCondition?: string | null;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number | null;
    updatedBy?: number | null;
}

/** MedicalSurveillanceDTO (cf. backend MedicalSurveillanceDTO.java). */
export interface MedicalSurveillanceDTO {
    id?: number | null;
    workerId: number;
    type: string;
    fitness: string;
    examDate: string;
    nextDueDate?: string | null;
    /** Donnees cliniques sensibles. Renvoye null par le backend si pas DOSIMETRY_MEDICAL. */
    restrictedClinicalDetails?: string | null;
    doctorId: number;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number | null;
    updatedBy?: number | null;
}

/** QualificationDTO (cf. backend QualificationDTO.java). */
export interface QualificationDTO {
    id?: number | null;
    workerId: number;
    trainingType: string;
    validFrom: string;
    validTo?: string | null;
    certificateUrl?: string | null;
    status: QualifStatus;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number | null;
    updatedBy?: number | null;
}

/**
 * ExposedWorkerDetailDTO — projection enrichie pour la fiche 360 d'un travailleur.
 *
 * Alignement 1:1 sur le DTO Java {@code ExposedWorkerDetailDTO}
 * (cf. {@code Backend/Health-Safety/src/main/java/.../dto/ExposedWorkerDetailDTO.java}).
 *
 * <p>Structure :
 *  - identity         : bloc identite RH (matricule, fullName, position, department, ...)
 *  - classification   : bloc classification radioprotection (category A/B, RPO, statut special)
 *  - exposureProfile  : liste des profils d'exposition (zone, poste, type, frequence)
 *  - doseHistory      : historique des records de dose (DESC sur period)
 *  - cumulative       : cumul annee N (Hp10 annuel/glissant 5 ans/vie)
 *  - dosimeters       : historique des affectations de dosimetres
 *  - medical          : derniere surveillance medicale (cloisonne si pas DOSIMETRY_MEDICAL)
 *  - qualifications   : habilitations radioprotection
 *  - alerts           : alertes de depassement
 *  - thresholds       : seuils reglementaires applicables a ce worker
 */
export interface ExposedWorkerDetailDTO {
    identity: WorkerIdentityDTO;
    classification: WorkerClassificationDTO;
    exposureProfile: ExposureProfileDTO[];
    doseHistory: DoseRecordDTO[];
    cumulative: DoseCumulativeDTO | null;
    dosimeters: DosimeterAssignmentDTO[];
    medical: MedicalSurveillanceDTO | null;
    qualifications: QualificationDTO[];
    alerts: ExposureAlertDTO[];
    thresholds: ThresholdDTO[];
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

/**
 * WorkerSearchFilters — body du POST /exposed-worker/search.
 *
 * Aligne 1:1 sur le DTO Java {@code SearchFiltersDTO}
 * (cf. {@code Backend/Health-Safety/src/main/java/.../dto/SearchFiltersDTO.java}).
 *
 * <p>Tous les champs sont optionnels sauf {@code mineId} qui est obligatoire.
 * Un champ {@code null}/{@code undefined} signifie "pas de restriction sur ce critere".
 */
export interface WorkerSearchFilters {
    /** Identifiant de la mine — REQUIS cote backend. */
    mineId: number;
    /** Categorie d'exposition CIPR (A ou B). */
    category?: DoseCategory | null;
    /** Statut special (grossesse, apprenti, etc.). */
    specialStatus?: DoseSpecialStatus | null;
    /** Niveau d'exposition calcule par le backend : GREEN | YELLOW | ORANGE | RED. */
    exposureLevel?: ExposureLevel | null;
    /** Filtre departement RH (id du departement de l'employee). */
    departmentId?: number | null;
    /** Filtre poste RH (id du poste de l'employee). */
    postId?: number | null;
    /** Recherche textuelle sur matricule ou nom complet (LIKE insensitive). */
    search?: string | null;
}

/**
 * Recherche multi-criteres des travailleurs exposes via POST /exposed-worker/search.
 * Le body est un {@link WorkerSearchFilters} aligne sur le SearchFiltersDTO backend ;
 * le backend renvoie une liste de projections {@code ExposedWorkerListItemDTO} avec
 * cumuls + niveau d'exposition pre-calcules.
 */
const searchWorkers = async (filters: WorkerSearchFilters) => {
    return axiosInstance
        .post(`${exposedWorkerUrl}/search`, filters)
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

/**
 * Recupere la projection 360 d'un travailleur expose : identite + classification +
 * profils d'exposition + historique doses + cumuls + dosimetres + surveillance
 * medicale + habilitations + alertes + seuils applicables.
 *
 * <p>Endpoint backend : {@code GET /hns/dosimetry/exposed-worker/detail/{id}}
 * (cf. ExposedWorkerController.getDetail). Le bloc medical n'expose
 * {@code restrictedClinicalDetails} qu'au porteur de la permission DOSIMETRY_MEDICAL.
 */
const getWorkerDetail = async (id: number | string) => {
    return axiosInstance
        .get(`${exposedWorkerUrl}/detail/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Export CSV du registre des travailleurs exposes.
 *
 * <p><b>RGPD / Conformite</b> : l'export est effectue cote backend
 * (cf. {@code ExposedWorkerController.export}) et journalise dans
 * {@code DosimetryAuditLog} (action=EXPORT) pour tracabilite des extractions
 * massives de donnees nominatives (RGPD art.30 + AIEA GSR Part 3). Le
 * frontend NE DOIT PAS construire le CSV cote client pour eviter de
 * contourner cet audit.
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/exposed-worker/export?mineId={id}&format=csv}
 * Permission backend : {@code DOSIMETRY_READ_NOMINATIVE}.
 */
const exportWorkersCsv = async (mineId: number): Promise<Blob> => {
    const res = await axiosInstance.get(
        `${exposedWorkerUrl}/export?mineId=${mineId}&format=csv`,
        { responseType: 'blob' },
    );
    return res.data;
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
    searchWorkers,
    getExposedWorkerById,
    getWorkerDetail,
    exportWorkersCsv,
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
