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
import store from '../Store';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers d'identite multi-tenant (mineId + X-User-Id)
//  Phase 3 — Le AxiosInterceptor ajoute companyId en query-param, mais pour les
//  bodies POST de recherche/affectation, le backend exige que mineId soit dans
//  le payload JSON (cf. SearchDosimeterFiltersDTO.mineId @NotNull).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resoud le mineId courant depuis le store Redux (companySelection) avec
 * repli sur localStorage (selectedCompanyId) pour les rechargements de page.
 * Retourne null si aucun tenant n'est selectionne.
 */
const resolveMineId = (): number | null => {
    try {
        const state: any = store.getState();
        const fromStore = state?.companySelection?.selectedCompanyId;
        if (fromStore !== null && fromStore !== undefined && !Number.isNaN(Number(fromStore))) {
            return Number(fromStore);
        }
    } catch {
        // store non disponible : on tombe sur localStorage
    }
    if (typeof window !== 'undefined') {
        try {
            const raw = window.localStorage.getItem('selectedCompanyId');
            if (raw && raw !== 'null') {
                const n = Number(raw);
                if (!Number.isNaN(n)) return n;
            }
        } catch {
            // ignore
        }
    }
    return null;
};

/**
 * Resoud l'identifiant utilisateur courant pour l'en-tete X-User-Id transmis
 * sur les endpoints d'ecriture du module dosimetrie (assign/return).
 * Retourne null si l'utilisateur n'est pas identifie.
 */
const resolveUserId = (): number | null => {
    try {
        const state: any = store.getState();
        const u = state?.user;
        const candidates = [u?.id, u?.userId, u?.sub];
        for (const c of candidates) {
            if (c !== null && c !== undefined && !Number.isNaN(Number(c))) {
                return Number(c);
            }
        }
    } catch {
        // ignore
    }
    return null;
};

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
//  DOSIMETER SEARCH + ASSIGNMENT / RETURN
//  Phase 3 Frontend-B : recherche multi-criteres + cycle attribution / restitution.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DosimeterSearchFilters — body du POST /dosimeter/search.
 *
 * <p>Aligne 1:1 sur le DTO Java {@code SearchDosimeterFiltersDTO}
 * (cf. {@code Backend/Health-Safety/.../dto/SearchDosimeterFiltersDTO.java}).
 *
 * <p>Champs :
 *   - mineId                  : OBLIGATOIRE. Isolation multi-tenant. Si omis,
 *                               le backend renvoie une liste vide.
 *   - status                  : liste de DosimeterStatus a filtrer (ex: ['AVAILABLE']).
 *                               NB : nom au singulier pour s'aligner sur le DTO Java.
 *                               Le backend accepte aussi 'statuses' via @JsonAlias.
 *   - type                    : DosimeterType unique (TLD/OSL/EPD/FILM).
 *   - calibrationDueWithinDays: alerte etalonnage — ne renvoie que les dosimetres
 *                               dus dans &lt; N jours.
 *   - search                  : recherche textuelle (LIKE insensible) sur serial ou qrCode.
 *
 * <p>Tolerant : si le backend ne propose pas encore /search (Phase 3),
 * le service basculera cote client sur getAll + filtre.
 */
export interface DosimeterSearchFilters {
    /** Identifiant de la mine — REQUIS cote backend. */
    mineId?: number | null;
    status?: DosimeterStatus[] | null;
    type?: DosimeterType | null;
    calibrationDueWithinDays?: number | null;
    search?: string | null;
}

/**
 * Recherche multi-criteres des dosimetres.
 *
 * <p><b>mineId obligatoire</b> : si le filtre ne contient pas de mineId, on tente
 * de l'injecter depuis le store Redux (companySelection.selectedCompanyId). Si
 * aucun tenant n'est selectionne, on rejette la promesse avec une erreur
 * explicite — appeler {@code resolveMineId()} avant ou passer {@code mineId}
 * dans les filtres.
 *
 * <p>Strategie tolerante Phase 3 :
 *   1. Tente POST /dosimeter/search avec le body filtres.
 *   2. Si l'endpoint renvoie 404/501, repli sur GET /getAll + filtrage cote client.
 *
 * <p>Le filtrage cote client est volontairement permissif (insensible a la
 * casse, trim sur serial / qrCode) pour servir le composant autocomplete
 * sans depender d'une API search dediee.
 */
const searchDosimeters = async (filters: DosimeterSearchFilters): Promise<DosimeterDTO[]> => {
    const mineId = filters.mineId ?? resolveMineId();
    if (mineId == null) {
        throw new Error('mineId required for searchDosimeters');
    }
    const body: DosimeterSearchFilters = { ...filters, mineId };
    try {
        const res = await axiosInstance.post(`${dosimeterUrl}/search`, body);
        return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
    } catch (err: any) {
        // Repli cote client si endpoint search pas encore deploye.
        const httpStatus = err?.response?.status;
        if (httpStatus === 404 || httpStatus === 405 || httpStatus === 501) {
            const fallback = await getAllDosimeters();
            const list: DosimeterDTO[] = Array.isArray(fallback) ? fallback : (fallback?.content ?? []);
            const q = (body.search ?? '').toLowerCase().trim();
            return list.filter((d) => {
                if (body.status && body.status.length > 0 && !body.status.includes(d.status)) {
                    return false;
                }
                if (body.type && d.type !== body.type) {
                    return false;
                }
                if (q) {
                    const hay = `${d.serial ?? ''} ${d.qrCode ?? ''}`.toLowerCase();
                    if (!hay.includes(q)) return false;
                }
                return true;
            });
        }
        throw err;
    }
};

/**
 * Lookup d'un dosimetre par son QR code dans le perimetre d'une mine.
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/dosimeter/find-by-qr?qrCode=X&mineId=Y}.
 * Retourne 200 + DosimeterDTO si trouve, 404 sinon.
 *
 * <p>Cas d'usage : scan QR terrain, autocompletion dans le formulaire
 * d'affectation. Le backend trace systematiquement un audit log (action=SEARCH_QR)
 * meme en cas de miss (tracabilite forensique).
 *
 * <p>Retourne null si 404, throw pour toute autre erreur.
 */
const findDosimeterByQr = async (qrCode: string, mineId?: number | null): Promise<DosimeterDTO | null> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for findDosimeterByQr');
    }
    try {
        const res = await axiosInstance.get(`${dosimeterUrl}/find-by-qr`, {
            params: { qrCode, mineId: resolvedMineId },
        });
        return (res.data ?? null) as DosimeterDTO | null;
    } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
    }
};

/**
 * Liste des dosimetres dont l'echeance d'etalonnage est dans les 30 jours
 * (ou depassee). Retourne des DosimeterListItemDTO (le DTO d'item etend
 * DosimeterDTO avec calibrationDueDays + assignedWorkerName).
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/dosimeter/calibration-alerts?mineId=X}.
 */
const getDosimeterCalibrationAlerts = async (mineId?: number | null): Promise<DosimeterDTO[]> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for getDosimeterCalibrationAlerts');
    }
    const res = await axiosInstance.get(`${dosimeterUrl}/calibration-alerts`, {
        params: { mineId: resolvedMineId },
    });
    return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
};

// ─── Assignment endpoints (cycle attribution / restitution) ─────────────────
// NB : les endpoints /assign et /return sont volontairement hostes sur le
// DosimeterController cote backend (cf. javadoc DosimeterController.assign) car
// ils mutent l'etat du dosimetre (status, currentWorker) en plus de creer ou
// cloturer une affectation. Le chemin canonique est donc /dosimeter/assign et
// /dosimeter/return.

const assignmentUrl = '/hns/dosimetry/dosimeter-assignment';

/**
 * Recupere les details d'une attribution (jointure dosimetre + worker).
 * Endpoint : GET /hns/dosimetry/dosimeter-assignment/get/{id}.
 */
const getAssignmentById = async (id: number | string): Promise<DosimeterAssignmentDTO> => {
    return axiosInstance
        .get(`${assignmentUrl}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Payload d'attribution — aligne 1:1 sur le DTO Java {@code DosimeterAssignDTO}
 * (cf. {@code Backend/Health-Safety/.../dto/DosimeterAssignDTO.java}).
 *
 * <p>Champs :
 *   - dosimeterId  : id du dosimetre AVAILABLE.
 *   - workerId     : id du travailleur expose porteur.
 *   - periodStart  : date debut de port (LocalDate ISO).
 *   - periodEnd    : optionnel — date prevue de fin (null = indeterminee).
 *   - handoverNote : note libre de remise (ex. etat constate, accessoires).
 */
export interface DosimeterAssignmentRequest {
    dosimeterId: number;
    workerId: number;
    periodStart: string;
    periodEnd?: string | null;
    handoverNote?: string | null;
}

/**
 * Cree une nouvelle attribution dosimetre -> travailleur.
 *
 * <p>Endpoint : {@code POST /hns/dosimetry/dosimeter/assign}.
 * Le backend bascule le dosimetre en statut ASSIGNED et trace
 * un DosimetryAuditLog (action=CREATE).
 *
 * <p>L'en-tete {@code X-User-Id} est renseignee depuis le store Redux pour
 * tracer createdBy/updatedBy cote backend.
 */
const assignDosimeter = async (payload: DosimeterAssignmentRequest) => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    return axiosInstance
        .post(`${dosimeterUrl}/assign`, payload, { headers })
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Payload de restitution d'un dosimetre attribue.
 *
 * <p>Aligne sur le DTO Java {@code DosimeterController.DosimeterReturnDTO}
 * (DTO local au controller backend) :
 *   - assignmentId       : id de l'attribution en cours
 *   - deviceCondition    : etat constate (INTACT / DAMAGED / LOST / OTHER)
 *   - deviceConditionNote: description detaillee — sera concatene au format
 *                          {@code "<condition> - <note>"} par le backend.
 *
 * <p>Champs frontend purs (non envoyes a un autre nom cote backend mais
 * conserves dans le payload pour journalisation locale UI) :
 *   - returnAck : confirmation explicite de l'utilisateur (UX seulement)
 *   - photoUrl  : URL placeholder (Phase 3 — pas encore uploade)
 */
export interface DosimeterReturnRequest {
    assignmentId: number;
    returnAck: boolean;
    deviceCondition: 'INTACT' | 'DAMAGED' | 'LOST' | 'OTHER';
    deviceConditionNote?: string | null;
    photoUrl?: string | null;
}

/**
 * Marque une attribution comme restituee.
 *
 * <p>Endpoint : {@code POST /hns/dosimetry/dosimeter/return}.
 * Le backend bascule le dosimetre en statut adequat
 * (IN_READING / AVAILABLE / DAMAGED / LOST selon deviceCondition) et trace
 * un DosimetryAuditLog (action=UPDATE).
 *
 * <p>L'en-tete {@code X-User-Id} est renseignee depuis le store Redux pour
 * tracer updatedBy cote backend.
 */
const returnDosimeter = async (payload: DosimeterReturnRequest) => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    return axiosInstance
        .post(`${dosimeterUrl}/return`, payload, { headers })
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
    searchDosimeters,
    findDosimeterByQr,
    getDosimeterCalibrationAlerts,
    // Dosimeter assignments (attribution / restitution)
    getAssignmentById,
    assignDosimeter,
    returnDosimeter,
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
