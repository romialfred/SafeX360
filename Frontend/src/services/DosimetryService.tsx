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

/**
 * ExposureProfileLinkDTO — lien entre un profil d'exposition et un point de
 * mesure d'ambiance, avec une fraction de temps de presence dans [0,1].
 *
 * <p>Aligne 1:1 sur le DTO Java {@code ExposureProfileLinkDTO}
 * (cf. {@code Backend/Health-Safety/.../dto/ExposureProfileLinkDTO.java}).
 *
 * <p>Champs :
 *   - exposureProfileId  : OBLIGATOIRE — id du profil d'exposition.
 *   - measurementPointId : OBLIGATOIRE — id du point de mesure rattache.
 *   - fraction           : OBLIGATOIRE — fraction du temps de travail [0,1].
 *   - estimatedDoseRate  : lecture seule — moyenne des mesures d'ambiance
 *                          du point (uSv/h), calculee cote backend.
 *   - lastUpdated        : lecture seule — derniere mise a jour du lien.
 */
export interface ExposureProfileLinkDTO {
    id?: number | null;
    exposureProfileId: number;
    measurementPointId: number;
    /** Fraction de temps de presence sur le point [0,1]. */
    fraction: number;
    /** uSv/h — moyenne des AmbientMeasurement sur le point (calc. backend). */
    estimatedDoseRate?: number | null;
    lastUpdated?: string | null;
    createdAt?: string | null;
    createdBy?: number | null;
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
        .then((response) => response.data);
};

const getThresholdById = async (id: number | string) => {
    return axiosInstance
        .get(`${thresholdUrl}/get/${id}`)
        .then((response) => response.data);
};

const createThreshold = async (data: ThresholdDTO) => {
    return axiosInstance
        .post(`${thresholdUrl}/create`, data)
        .then((response) => response.data);
};

/**
 * update : pattern SafeX (cf. NonConformityService) — id dans le DTO body,
 * verbe PUT, pas d'id dans l'URL.
 */
const updateThreshold = async (data: ThresholdDTO) => {
    return axiosInstance
        .put(`${thresholdUrl}/update`, data)
        .then((response) => response.data);
};

const deleteThreshold = async (id: number | string) => {
    return axiosInstance
        .delete(`${thresholdUrl}/delete/${id}`)
        .then((response) => response.data);
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXPOSED WORKERS — Registre des travailleurs exposes
//  Base: /hns/dosimetry/exposed-worker
// ─────────────────────────────────────────────────────────────────────────────

const exposedWorkerUrl = '/hns/dosimetry/exposed-worker';

const getAllExposedWorkers = async () => {
    return axiosInstance
        .get(`${exposedWorkerUrl}/getAll`)
        .then((response) => response.data);
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
        .then((response) => response.data);
};

const getExposedWorkerById = async (id: number | string) => {
    return axiosInstance
        .get(`${exposedWorkerUrl}/get/${id}`)
        .then((response) => response.data);
};

const createExposedWorker = async (data: ExposedWorkerDTO) => {
    return axiosInstance
        .post(`${exposedWorkerUrl}/create`, data)
        .then((response) => response.data);
};

const updateExposedWorker = async (data: ExposedWorkerDTO) => {
    return axiosInstance
        .put(`${exposedWorkerUrl}/update`, data)
        .then((response) => response.data);
};

const deleteExposedWorker = async (id: number | string) => {
    return axiosInstance
        .delete(`${exposedWorkerUrl}/delete/${id}`)
        .then((response) => response.data);
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
        .then((response) => response.data);
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
        .then((response) => response.data);
};

const getDosimeterById = async (id: number | string) => {
    return axiosInstance
        .get(`${dosimeterUrl}/get/${id}`)
        .then((response) => response.data);
};

const createDosimeter = async (data: DosimeterDTO) => {
    return axiosInstance
        .post(`${dosimeterUrl}/create`, data)
        .then((response) => response.data);
};

const updateDosimeter = async (data: DosimeterDTO) => {
    return axiosInstance
        .put(`${dosimeterUrl}/update`, data)
        .then((response) => response.data);
};

const deleteDosimeter = async (id: number | string) => {
    return axiosInstance
        .delete(`${dosimeterUrl}/delete/${id}`)
        .then((response) => response.data);
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
        .then((response) => response.data);
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
        .then((response) => response.data);
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
        .then((response) => response.data);
};

// ─────────────────────────────────────────────────────────────────────────────
//  DOSE RECORDS — Saisie & suivi des doses (append-only)
//  Base: /hns/dosimetry/dose-record
// ─────────────────────────────────────────────────────────────────────────────

const doseRecordUrl = '/hns/dosimetry/dose-record';

const getAllDoseRecords = async () => {
    return axiosInstance
        .get(`${doseRecordUrl}/getAll`)
        .then((response) => response.data);
};

const getDoseRecordById = async (id: number | string) => {
    return axiosInstance
        .get(`${doseRecordUrl}/get/${id}`)
        .then((response) => response.data);
};

/**
 * Recupere les enregistrements actifs (non superseded) pour un worker donne.
 * Endpoint backend : GET /getActiveByWorker/{workerId}
 */
const getActiveDoseRecordsByWorker = async (workerId: number | string) => {
    return axiosInstance
        .get(`${doseRecordUrl}/getActiveByWorker/${workerId}`)
        .then((response) => response.data);
};

const createDoseRecord = async (data: DoseRecordDTO) => {
    return axiosInstance
        .post(`${doseRecordUrl}/create`, data)
        .then((response) => response.data);
};

/**
 * update : pattern append-only — cree un NOUVEAU record version+1 et marque
 * l'ancien comme superseded. Retourne l'id du nouvel enregistrement.
 */
const updateDoseRecord = async (data: DoseRecordDTO) => {
    return axiosInstance
        .put(`${doseRecordUrl}/update`, data)
        .then((response) => response.data);
};

const deleteDoseRecord = async (id: number | string) => {
    return axiosInstance
        .delete(`${doseRecordUrl}/delete/${id}`)
        .then((response) => response.data);
};

// ─────────────────────────────────────────────────────────────────────────────
//  CSV BULK IMPORT — Phase 4 Frontend-C
//  Base: /hns/dosimetry/dose-record/import
//
//  Format CSV attendu (entete obligatoire, ordre indicatif) :
//    matricule, period, hp10, hp007, hp3, source, below_detection, notes, attachment_url
//
//  Endpoints :
//   - POST /hns/dosimetry/dose-record/import/preview  (multipart, dry-run)
//   - POST /hns/dosimetry/dose-record/import/execute  (multipart, commit)
//
//  Le backend trace systematiquement un DosimetryAuditLog (action=IMPORT) avec
//  l'audit id retourne dans la reponse — visible dans le footer du wizard.
// ─────────────────────────────────────────────────────────────────────────────

/** Statut d'une ligne CSV apres parsing / dry-run cote backend. */
export type CsvRowStatus = 'OK' | 'WARNING' | 'ERROR';

/** Code d'erreur normalise pour une ligne CSV. */
export type CsvErrorCode =
    | 'WORKER_NOT_FOUND'
    | 'INVALID_FORMAT'
    | 'INVALID_PERIOD'
    | 'INVALID_DOSE'
    | 'DUPLICATE'
    | 'NEAR_DUPLICATE'
    | 'HIGH_VALUE'
    | 'BELOW_DETECTION_CONFLICT'
    | 'MISSING_REQUIRED'
    | 'UNKNOWN_SOURCE'
    | 'INTERNAL_ERROR';

/** Detail d'une erreur ou d'un warning sur une ligne CSV. */
export interface CsvRowIssue {
    code: CsvErrorCode | string;
    message: string;
    column?: string | null;
}

/** Une ligne du preview (dry-run) renvoyee par le backend. */
export interface CsvImportPreviewRow {
    /** Numero de ligne dans le fichier (1-based, sans l'entete). */
    lineNumber: number;
    matricule: string | null;
    period: string | null;
    hp10: number | null;
    hp007: number | null;
    hp3: number | null;
    source: string | null;
    belowDetection: boolean | null;
    notes: string | null;
    attachmentUrl: string | null;
    status: CsvRowStatus;
    errors: CsvRowIssue[];
    warnings: CsvRowIssue[];
}

/** Stats agregees retournees par le preview. */
export interface CsvImportPreviewStats {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
    duplicateRows: number;
    unknownWorkers: number;
}

/** Reponse du dry-run /preview. */
export interface CsvImportPreviewResponse {
    stats: CsvImportPreviewStats;
    rows: CsvImportPreviewRow[];
    /** Id de l'audit log (action=PREVIEW). */
    auditId?: number | string | null;
}

/** Options soumises a l'endpoint /execute. */
export interface CsvImportOptions {
    skipDuplicates: boolean;
    continueOnWarnings: boolean;
}

/** Resultat de l'import effectif. */
export interface CsvImportExecuteResponse {
    importedCount: number;
    skippedCount: number;
    errorCount: number;
    alertsCreated: number;
    /** Lignes restees en erreur — sert au download du log d'erreurs. */
    errorRows: CsvImportPreviewRow[];
    /** Id de l'audit log (action=IMPORT). */
    auditId?: number | string | null;
}

/**
 * Pre-visualise un fichier CSV (dry-run) : parse + valide chaque ligne SANS
 * persister. Permet d'afficher stats + erreurs / warnings dans le wizard.
 *
 * <p>Endpoint : {@code POST /hns/dosimetry/dose-record/import/preview}.
 * Le backend renvoie 200 avec {@link CsvImportPreviewResponse} meme si toutes
 * les lignes sont en erreur — la decision de continuer revient au wizard.
 *
 * <p>Strategie tolerante : si l'endpoint n'est pas encore deploye (404/501),
 * on renvoie un mock minimal avec stats=0 + alerte console pour debug.
 */
const previewCsvImport = async (
    file: File,
    mineId?: number | null,
): Promise<CsvImportPreviewResponse> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for previewCsvImport');
    }
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('mineId', String(resolvedMineId));
    try {
        // CsvImportController est monté sur /dosimetry/import (PAS sous
        // /dose-record) — l'ancien chemin renvoyait 404 et le wizard affichait
        // « 0 lignes » au lieu d'importer.
        const res = await axiosInstance.post(
            '/hns/dosimetry/import/preview',
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        const data = res.data ?? {};
        const stats: CsvImportPreviewStats = {
            totalRows: Number(data?.stats?.totalRows ?? 0),
            validRows: Number(data?.stats?.validRows ?? 0),
            errorRows: Number(data?.stats?.errorRows ?? 0),
            warningRows: Number(data?.stats?.warningRows ?? 0),
            duplicateRows: Number(data?.stats?.duplicateRows ?? 0),
            unknownWorkers: Number(data?.stats?.unknownWorkers ?? 0),
        };
        const rows: CsvImportPreviewRow[] = Array.isArray(data?.rows)
            ? (data.rows as any[]).map((r, idx) => ({
                  lineNumber: Number(r?.lineNumber ?? idx + 1),
                  matricule: r?.matricule ?? null,
                  period: r?.period ?? null,
                  hp10: typeof r?.hp10 === 'number' ? r.hp10 : (r?.hp10 != null ? Number(r.hp10) : null),
                  hp007: typeof r?.hp007 === 'number' ? r.hp007 : (r?.hp007 != null ? Number(r.hp007) : null),
                  hp3: typeof r?.hp3 === 'number' ? r.hp3 : (r?.hp3 != null ? Number(r.hp3) : null),
                  source: r?.source ?? null,
                  belowDetection: r?.belowDetection ?? null,
                  notes: r?.notes ?? null,
                  attachmentUrl: r?.attachmentUrl ?? r?.attachment_url ?? null,
                  status: (r?.status as CsvRowStatus) ?? 'OK',
                  errors: Array.isArray(r?.errors) ? r.errors : [],
                  warnings: Array.isArray(r?.warnings) ? r.warnings : [],
              }))
            : [];
        return { stats, rows, auditId: data?.auditId ?? null };
    } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 404 || httpStatus === 501) {
            // Endpoint pas encore deploye — renvoie une enveloppe vide pour
            // permettre au wizard d'afficher un message clair sans crasher.
            // eslint-disable-next-line no-console
            console.warn('[DosimetryService] previewCsvImport endpoint not deployed yet');
            return {
                stats: {
                    totalRows: 0,
                    validRows: 0,
                    errorRows: 0,
                    warningRows: 0,
                    duplicateRows: 0,
                    unknownWorkers: 0,
                },
                rows: [],
                auditId: null,
            };
        }
        throw err;
    }
};

/**
 * Execute l'import CSV en persistant les enregistrements valides.
 *
 * <p>Endpoint : {@code POST /hns/dosimetry/dose-record/import/execute}.
 * Le backend cree les DoseRecord en append-only, declenche les
 * ExposureAlert sur les depassements de seuils et journalise un audit log.
 *
 * <p>L'en-tete {@code X-User-Id} est renseignee depuis le store Redux pour
 * tracer createdBy cote backend.
 */
const executeCsvImport = async (
    file: File,
    mineId: number | null | undefined,
    options: CsvImportOptions,
): Promise<CsvImportExecuteResponse> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for executeCsvImport');
    }
    const userId = resolveUserId();
    const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
    };
    if (userId != null) headers['X-User-Id'] = String(userId);

    const form = new FormData();
    form.append('file', file, file.name);
    form.append('mineId', String(resolvedMineId));
    form.append('skipDuplicates', String(options.skipDuplicates));
    form.append('continueOnWarnings', String(options.continueOnWarnings));

    // Même correctif que preview : contrôleur monté sur /dosimetry/import.
    const res = await axiosInstance.post(
        '/hns/dosimetry/import/execute',
        form,
        { headers },
    );
    const data = res.data ?? {};
    return {
        importedCount: Number(data?.importedCount ?? 0),
        skippedCount: Number(data?.skippedCount ?? 0),
        errorCount: Number(data?.errorCount ?? 0),
        alertsCreated: Number(data?.alertsCreated ?? 0),
        errorRows: Array.isArray(data?.errorRows) ? data.errorRows : [],
        auditId: data?.auditId ?? null,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXPOSURE ALERTS — Depassements de seuils
//  Base: /hns/dosimetry/exposure-alert
// ─────────────────────────────────────────────────────────────────────────────

const exposureAlertUrl = '/hns/dosimetry/exposure-alert';

const getAllAlerts = async () => {
    return axiosInstance
        .get(`${exposureAlertUrl}/getAll`)
        .then((response) => response.data);
};

/**
 * Recupere les alertes actives (status=ACTIVE) pour un perimetre mine donne.
 *
 * <p>Strategie tolerante : tente d'abord l'endpoint dedie
 * {@code GET /hns/dosimetry/exposure-alert/active?mineId=X}. Si l'endpoint
 * n'est pas encore deploye (404/501), bascule sur {@link getAllAlerts}
 * + filtrage cote client par {@code status === 'ACTIVE'}.
 *
 * <p>Le mineId est obligatoire — si null/undefined, on tente de le
 * resoudre depuis le store Redux. Si aucun tenant n'est selectionne,
 * la promesse est rejetee.
 */
const getActiveAlerts = async (mineId?: number | null): Promise<ExposureAlertDTO[]> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for getActiveAlerts');
    }
    try {
        const res = await axiosInstance.get(`${exposureAlertUrl}/active`, {
            params: { mineId: resolvedMineId },
        });
        const list: any[] = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
        return list as ExposureAlertDTO[];
    } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 404 || httpStatus === 405 || httpStatus === 501) {
            const all = await getAllAlerts();
            const list: ExposureAlertDTO[] = Array.isArray(all) ? all : (all?.content ?? []);
            return list.filter((a) => a?.status === 'ACTIVE');
        }
        throw err;
    }
};

/**
 * Acquitte une alerte (status ACTIVE -> ACK).
 *
 * <p>Strategie tolerante : tente d'abord l'endpoint dedie POST
 * {@code /hns/dosimetry/exposure-alert/acknowledge/{id}} avec une note
 * obligatoire dans le body. Si l'endpoint n'existe pas, retombe sur un
 * {@link updateAlert} patch en client (status=ACK + acknowledgedAt + note).
 */
const acknowledgeAlert = async (alertId: number, note: string): Promise<ExposureAlertDTO> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    try {
        const res = await axiosInstance.post(
            `${exposureAlertUrl}/acknowledge/${alertId}`,
            { note },
            { headers },
        );
        return res.data as ExposureAlertDTO;
    } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 404 || httpStatus === 405 || httpStatus === 501) {
            const current = await getAlertById(alertId);
            const patched: ExposureAlertDTO = {
                ...current,
                status: 'ACK',
                acknowledgedAt: new Date().toISOString(),
                acknowledgedBy: userId ?? current.acknowledgedBy ?? null,
            };
            await updateAlert(patched);
            return patched;
        }
        throw err;
    }
};

/**
 * Resout une alerte (status ACK -> RESOLVED).
 *
 * <p>Meme strategie tolerante : tente d'abord POST
 * {@code /hns/dosimetry/exposure-alert/resolve/{id}} avec une note obligatoire,
 * puis fallback sur updateAlert client.
 */
const resolveAlert = async (alertId: number, note: string): Promise<ExposureAlertDTO> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    try {
        const res = await axiosInstance.post(
            `${exposureAlertUrl}/resolve/${alertId}`,
            { note },
            { headers },
        );
        return res.data as ExposureAlertDTO;
    } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 404 || httpStatus === 405 || httpStatus === 501) {
            const current = await getAlertById(alertId);
            const patched: ExposureAlertDTO = {
                ...current,
                status: 'RESOLVED',
            };
            await updateAlert(patched);
            return patched;
        }
        throw err;
    }
};

const getAlertById = async (id: number | string) => {
    return axiosInstance
        .get(`${exposureAlertUrl}/get/${id}`)
        .then((response) => response.data);
};

const createAlert = async (data: ExposureAlertDTO) => {
    return axiosInstance
        .post(`${exposureAlertUrl}/create`, data)
        .then((response) => response.data);
};

const updateAlert = async (data: ExposureAlertDTO) => {
    return axiosInstance
        .put(`${exposureAlertUrl}/update`, data)
        .then((response) => response.data);
};

const deleteAlert = async (id: number | string) => {
    return axiosInstance
        .delete(`${exposureAlertUrl}/delete/${id}`)
        .then((response) => response.data);
};

// ─────────────────────────────────────────────────────────────────────────────
//  OVEREXPOSURE CASES — Dossiers de depassement (Phase 5 Frontend-C)
//  Base: /hns/dosimetry/overexposure-case
//  Workflow : OPEN -> INVESTIGATING -> CLOSED.
// ─────────────────────────────────────────────────────────────────────────────

/** Statut d'un dossier de surexposition (cf. enum CaseStatus backend). */
export type CaseStatus = 'OPEN' | 'INVESTIGATING' | 'CLOSED';

/**
 * OverexposureCaseDTO — dossier de depassement.
 *
 * <p>Aligne 1:1 sur le DTO Java {@code OverexposureCaseDTO}
 * (cf. {@code Backend/Health-Safety/.../dto/OverexposureCaseDTO.java}).
 *
 * <p>Workflow :
 *   - OPEN          : dossier ouvert apres detection d'une alerte EXCEEDED.
 *   - INVESTIGATING : enquete en cours (actions correctives + decision medicale).
 *   - CLOSED        : cloture par un PCR/RPO (RBAC DOSIMETRY_PCR_RPO).
 */
export interface OverexposureCaseDTO {
    id?: number | null;
    workerId: number;
    level: AlertLevel;
    /** Lien vers l'alerte source (optionnel : null si ouverture manuelle). */
    alertId?: number | null;
    cause?: string | null;
    correctiveActions?: string | null;
    /** Decision medicale - cloisonnement RBAC DOSIMETRY_MEDICAL cote UI. */
    medicalDecision?: string | null;
    authorityDeclaration?: boolean;
    authorityDeclarationDate?: string | null;
    status: CaseStatus;
    openedAt?: string | null;
    closedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: number | null;
    updatedBy?: number | null;
}

/** Payload pour l'ouverture d'un dossier (POST /open). */
export interface OpenOverexposureCaseRequest {
    workerId: number;
    alertId?: number | null;
    openedBy?: number | null;
    cause?: string | null;
    level: AlertLevel;
}

/** Payload pour la transition vers INVESTIGATING (POST /investigate/{id}). */
export interface InvestigateOverexposureCaseRequest {
    correctiveActions?: string | null;
    medicalDecision?: string | null;
    actorId?: number | null;
}

/** Payload pour la cloture d'un dossier (POST /close/{id}). */
export interface CloseOverexposureCaseRequest {
    authorityDeclaration: boolean;
    actorId?: number | null;
    closureNote?: string | null;
}

const overexposureCaseUrl = '/hns/dosimetry/overexposure-case';

/**
 * Liste l'ensemble des dossiers de depassement pour la mine selectionnee.
 * Endpoint : {@code GET /hns/dosimetry/overexposure-case/getAll?companyId=X}
 * (companyId injecte par AxiosInterceptor).
 */
const getOverexposureCases = async (): Promise<OverexposureCaseDTO[]> => {
    const res = await axiosInstance.get(`${overexposureCaseUrl}/getAll`);
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
};

/**
 * Recupere le detail d'un dossier de depassement.
 * Endpoint : {@code GET /hns/dosimetry/overexposure-case/get/{id}}.
 */
const getOverexposureCaseById = async (id: number | string): Promise<OverexposureCaseDTO> => {
    const res = await axiosInstance.get(`${overexposureCaseUrl}/get/${id}`);
    return res.data as OverexposureCaseDTO;
};

/**
 * Liste les dossiers actifs (OPEN + INVESTIGATING) pour la mine.
 * Endpoint : {@code GET /hns/dosimetry/overexposure-case/active?mineId=X}.
 */
const getActiveOverexposureCases = async (mineId?: number | null): Promise<OverexposureCaseDTO[]> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for getActiveOverexposureCases');
    }
    const res = await axiosInstance.get(`${overexposureCaseUrl}/active`, {
        params: { mineId: resolvedMineId },
    });
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
};

/**
 * Liste les dossiers ouverts pour un travailleur donne.
 * Endpoint : {@code GET /hns/dosimetry/overexposure-case/by-worker/{workerId}}.
 */
const getOverexposureCasesByWorker = async (workerId: number | string): Promise<OverexposureCaseDTO[]> => {
    const res = await axiosInstance.get(`${overexposureCaseUrl}/by-worker/${workerId}`);
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
};

/**
 * Ouverture officielle d'un dossier de depassement (transition vers OPEN).
 *
 * <p>Endpoint : {@code POST /hns/dosimetry/overexposure-case/open}.
 * Le backend trace un DosimetryAuditLog (action=OPEN_OVEREXPOSURE) et applique
 * un garde-fou anti-doublon sur {@code alertId}.
 *
 * <p>L'en-tete {@code X-User-Id} est renseignee depuis le store Redux.
 */
const openOverexposureCase = async (payload: OpenOverexposureCaseRequest): Promise<number> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    const body: OpenOverexposureCaseRequest = {
        ...payload,
        openedBy: payload.openedBy ?? userId ?? null,
    };
    const res = await axiosInstance.post(`${overexposureCaseUrl}/open`, body, { headers });
    return Number(res.data);
};

/**
 * Ajout d'une investigation (transition OPEN -> INVESTIGATING ou ajout dans INVESTIGATING).
 * Endpoint : {@code POST /hns/dosimetry/overexposure-case/investigate/{id}}.
 *
 * <p>RBAC backend : DOSIMETRY_WRITE.
 */
const investigateOverexposureCase = async (
    caseId: number | string,
    payload: InvestigateOverexposureCaseRequest,
): Promise<void> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    const body: InvestigateOverexposureCaseRequest = {
        ...payload,
        actorId: payload.actorId ?? userId ?? null,
    };
    await axiosInstance.post(`${overexposureCaseUrl}/investigate/${caseId}`, body, { headers });
};

/**
 * Cloture d'un dossier (transition vers CLOSED).
 * Endpoint : {@code POST /hns/dosimetry/overexposure-case/close/{id}}.
 *
 * <p>RBAC backend : DOSIMETRY_PCR_RPO (separation des devoirs).
 */
const closeOverexposureCase = async (
    caseId: number | string,
    payload: CloseOverexposureCaseRequest,
): Promise<void> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    const body: CloseOverexposureCaseRequest = {
        ...payload,
        actorId: payload.actorId ?? userId ?? null,
    };
    await axiosInstance.post(`${overexposureCaseUrl}/close/${caseId}`, body, { headers });
};

/**
 * Met a jour un dossier (CRUD generique).
 * Endpoint : {@code PUT /hns/dosimetry/overexposure-case/update}.
 */
const updateOverexposureCase = async (data: OverexposureCaseDTO): Promise<void> => {
    await axiosInstance.put(`${overexposureCaseUrl}/update`, data);
};

/**
 * Supprime un dossier (admin uniquement — peu utilise).
 * Endpoint : {@code DELETE /hns/dosimetry/overexposure-case/delete/{id}}.
 */
const deleteOverexposureCase = async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`${overexposureCaseUrl}/delete/${id}`);
};

// ─────────────────────────────────────────────────────────────────────────────
//  DOSIMETRY AUDIT LOG — Journal d'audit append-only (lecture)
//  Base: /hns/dosimetry/audit-log
// ─────────────────────────────────────────────────────────────────────────────

/** DosimetryAuditLogDTO — entree append-only du journal d'audit. */
export interface DosimetryAuditLogDTO {
    id?: number | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    userId: number;
    userPermissions?: string | null;
    timestamp?: string | null;
    ipAddress?: string | null;
    details?: string | null;
}

const auditLogUrl = '/hns/dosimetry/audit-log';

/**
 * Recupere l'integralite du journal d'audit pour la mine selectionnee.
 * Le frontend filtre ensuite cote client pour ne garder que les entrees
 * d'un entityType + entityId donnes (ex. OverexposureCase + caseId).
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/audit-log/getAll?companyId=X}.
 */
const getAllAuditLogs = async (): Promise<DosimetryAuditLogDTO[]> => {
    const res = await axiosInstance.get(`${auditLogUrl}/getAll`);
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
};

// ─────────────────────────────────────────────────────────────────────────────
//  MEDICAL SURVEILLANCE — Phase 7
//  Visites medicales + fiches d'aptitude (donnees cliniques chiffrees AES-256-GCM).
//
//  Base visites : /hns/dosimetry/medical-visit
//  Base fiches  : /hns/dosimetry/fitness-assessment
//
//  RBAC SafeX :
//    - DOSIMETRY_MEDICAL          : full access (CRUD + FullDTO + cleartext clinique).
//    - DOSIMETRY_PCR_RPO          : Summary / Public uniquement (pas de details cliniques).
//    - DOSIMETRY_READ_NOMINATIVE  : SELF (le travailleur sur lui-meme).
//    - DOSIMETRY_EXPORT_MEDICAL   : export + audit reason obligatoire.
//
//  Toute lecture FullDTO (detailedReport / restrictions) ou export passe un
//  header X-Reason (RGPD art. 30 + AIEA GSR Part 3) trace dans DosimetryAuditLog.
// ─────────────────────────────────────────────────────────────────────────────

/** Type de visite medicale reglementaire (cf. enum MedicalVisitType backend). */
export type MedicalVisitType =
    | 'INITIAL'
    | 'PERIODIC_ANNUAL'
    | 'POST_EXPOSURE'
    | 'FOLLOWUP'
    | 'FINAL_AT_DEPARTURE';

/** Statut d'une visite (cf. enum VisitStatus backend). */
export type VisitStatus = 'SCHEDULED' | 'PERFORMED' | 'CANCELLED' | 'MISSED';

/** Niveau d'aptitude medicale (cf. enum FitnessLevel backend). */
export type FitnessLevel = 'FIT' | 'FIT_WITH_RESTRICTIONS' | 'TEMPORARILY_UNFIT' | 'UNFIT';

/**
 * MedicalVisitSummaryDTO — DTO RESUME, sans donnees cliniques.
 *
 * <p>Aligne 1:1 sur le DTO Java {@code MedicalVisitSummaryDTO}.
 * Destine aux roles PCR/RPO + SELF + Medecin du travail (vue planning).
 * Ne porte PAS {@code detailedReport} — impossible de fuiter cote API.
 */
export interface MedicalVisitSummaryDTO {
    id?: number | null;
    workerId: number;
    mineId: number;
    visitType: MedicalVisitType;
    scheduledDate: string;
    performedDate?: string | null;
    physicianId?: number | null;
    physicianName?: string | null;
    status: VisitStatus;
    generalConclusion?: string | null;
    cancellationReason?: string | null;
    createdAt?: string | null;
}

/**
 * MedicalVisitFullDTO — DTO COMPLET avec compte-rendu clinique dechiffre.
 *
 * <p>CONFIDENTIEL : reserve a {@code DOSIMETRY_MEDICAL}. Toute lecture passe
 * par un header {@code X-Reason} trace dans l'audit log.
 */
export interface MedicalVisitFullDTO {
    id?: number | null;
    workerId: number;
    mineId: number;
    visitType: MedicalVisitType;
    scheduledDate: string;
    performedDate?: string | null;
    physicianId: number;
    physicianName?: string | null;
    status: VisitStatus;
    generalConclusion?: string | null;
    /** CHIFFRE EN BDD - dechiffre uniquement pour role MEDICAL. */
    detailedReport?: string | null;
    cancellationReason?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: number | null;
    updatedBy?: number | null;
}

/**
 * FitnessAssessmentPublicDTO — vue non-clinique d'une fiche d'aptitude.
 *
 * <p>Visible PCR/RPO + SELF + Medecin du travail. Le champ {@code restrictions}
 * detaille est volontairement OMIS — seul un resume operationnel est expose.
 */
export interface FitnessAssessmentPublicDTO {
    id?: number | null;
    workerId: number;
    mineId: number;
    assessmentDate: string;
    validUntil?: string | null;
    fitness: FitnessLevel;
    /** Resume non-medical ("Eviter zone controlee 6 mois"). */
    publicRestrictionsSummary?: string | null;
    reviewRequiredDate?: string | null;
    signed: boolean;
}

/**
 * FitnessAssessmentFullDTO — vue clinique complete d'une fiche d'aptitude.
 *
 * <p>CONFIDENTIEL : reserve a {@code DOSIMETRY_MEDICAL}. Le champ
 * {@code restrictions} est dechiffre cote backend (audit reason obligatoire).
 */
export interface FitnessAssessmentFullDTO {
    id?: number | null;
    workerId: number;
    mineId: number;
    medicalVisitId?: number | null;
    assessmentDate: string;
    validUntil?: string | null;
    fitness: FitnessLevel;
    /** CHIFFRE EN BDD - role MEDICAL uniquement. */
    restrictions?: string | null;
    publicRestrictionsSummary?: string | null;
    reviewRequiredDate?: string | null;
    physicianId: number;
    physicianName?: string | null;
    signed: boolean;
    signedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: number | null;
    updatedBy?: number | null;
}

/** Body POST /medical-visit/schedule. */
export interface ScheduleMedicalVisitRequest {
    workerId: number;
    mineId: number;
    type: MedicalVisitType;
    scheduledDate: string;
    physicianId: number;
    physicianName?: string | null;
}

/** Body POST /medical-visit/perform/{id}. */
export interface PerformMedicalVisitRequest {
    generalConclusion?: string | null;
    /** Compte-rendu clinique — sera chiffre AES-256-GCM en BDD. */
    detailedReport?: string | null;
    performedDate?: string | null;
}

/** Body POST /fitness-assessment/create. */
export interface CreateFitnessAssessmentRequest {
    workerId: number;
    mineId: number;
    medicalVisitId?: number | null;
    fitness: FitnessLevel;
    /** Details cliniques — chiffres en BDD. */
    restrictions?: string | null;
    /** Resume operationnel non-medical visible PCR/RPO. */
    publicSummary?: string | null;
    assessmentDate: string;
    validUntil?: string | null;
    reviewRequiredDate?: string | null;
    physicianId: number;
    physicianName?: string | null;
}

const medicalVisitUrl = '/hns/dosimetry/medical-visit';
const fitnessAssessmentUrl = '/hns/dosimetry/fitness-assessment';

/**
 * Construit le bloc d'en-tetes pour les ecritures medicales : X-User-Id
 * + X-Reason (optionnel pour les lectures Public/Summary, OBLIGATOIRE pour les
 * lectures Full + export). Le backend trace systematiquement dans DosimetryAuditLog.
 */
const buildMedicalHeaders = (reason?: string | null): Record<string, string> => {
    const headers: Record<string, string> = {};
    const userId = resolveUserId();
    if (userId != null) headers['X-User-Id'] = String(userId);
    if (reason && reason.trim().length > 0) headers['X-Reason'] = reason.trim();
    return headers;
};

// ─── MedicalVisit — ECRITURES (MEDICAL only) ───

/**
 * Planifie une visite medicale (mode "schedule").
 * Endpoint : {@code POST /hns/dosimetry/medical-visit/schedule}.
 */
const scheduleMedicalVisit = async (
    payload: ScheduleMedicalVisitRequest,
): Promise<number> => {
    const headers = buildMedicalHeaders();
    const res = await axiosInstance.post(`${medicalVisitUrl}/schedule`, payload, { headers });
    return Number(res.data);
};

/**
 * Realise une visite planifiee (mode "perform" — APPEND-ONLY apres).
 * Le {@code detailedReport} sera chiffre AES-256-GCM cote backend.
 * Endpoint : {@code POST /hns/dosimetry/medical-visit/perform/{id}}.
 */
const performMedicalVisit = async (
    visitId: number | string,
    payload: PerformMedicalVisitRequest,
): Promise<void> => {
    const headers = buildMedicalHeaders();
    await axiosInstance.post(`${medicalVisitUrl}/perform/${visitId}`, payload, { headers });
};

/**
 * Annule une visite planifiee.
 * Endpoint : {@code POST /hns/dosimetry/medical-visit/cancel/{id}}.
 */
const cancelMedicalVisit = async (
    visitId: number | string,
    reason: string,
): Promise<void> => {
    const headers = buildMedicalHeaders();
    await axiosInstance.post(
        `${medicalVisitUrl}/cancel/${visitId}`,
        { reason },
        { headers },
    );
};

// ─── MedicalVisit — LECTURES Summary (PCR_RPO + MEDICAL + SELF) ───

/**
 * Visites planifiees a venir pour la mine selectionnee.
 * Endpoint : {@code GET /hns/dosimetry/medical-visit/upcoming?mineId=X&daysAhead=N}.
 */
const getUpcomingMedicalVisits = async (
    mineId: number,
    daysAhead: number = 30,
): Promise<MedicalVisitSummaryDTO[]> => {
    const res = await axiosInstance.get(`${medicalVisitUrl}/upcoming`, {
        params: { mineId, daysAhead },
    });
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
};

/**
 * Visites Summary d'un travailleur (PCR/RPO + MEDICAL + SELF).
 * Endpoint : {@code GET /hns/dosimetry/medical-visit/by-worker/{workerId}}.
 */
const getWorkerMedicalVisitsSummary = async (
    workerId: number | string,
): Promise<MedicalVisitSummaryDTO[]> => {
    const headers = buildMedicalHeaders();
    const res = await axiosInstance.get(`${medicalVisitUrl}/by-worker/${workerId}`, { headers });
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
};

// ─── MedicalVisit — LECTURES Full (MEDICAL only + X-Reason) ───

/**
 * Visites Full d'un travailleur — donnees cliniques dechiffrees.
 * REQUIS : MEDICAL + header {@code X-Reason}.
 * Endpoint : {@code GET /hns/dosimetry/medical-visit/by-worker/{workerId}/full}.
 */
const getWorkerMedicalVisitsFull = async (
    workerId: number | string,
    reason: string,
): Promise<MedicalVisitFullDTO[]> => {
    const headers = buildMedicalHeaders(reason);
    const res = await axiosInstance.get(
        `${medicalVisitUrl}/by-worker/${workerId}/full`,
        { headers },
    );
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
};

/**
 * Detail Full d'une visite. REQUIS : MEDICAL + X-Reason.
 * Endpoint : {@code GET /hns/dosimetry/medical-visit/get/{id}/full}.
 */
const getMedicalVisitFull = async (
    visitId: number | string,
    reason: string,
): Promise<MedicalVisitFullDTO> => {
    const headers = buildMedicalHeaders(reason);
    const res = await axiosInstance.get(`${medicalVisitUrl}/get/${visitId}/full`, { headers });
    return res.data as MedicalVisitFullDTO;
};

// ─── FitnessAssessment — ECRITURES (MEDICAL only) ───

/**
 * Cree une fiche d'aptitude (non signee — peut etre editee).
 * Endpoint : {@code POST /hns/dosimetry/fitness-assessment/create}.
 */
const createFitnessAssessment = async (
    payload: CreateFitnessAssessmentRequest,
): Promise<number> => {
    const headers = buildMedicalHeaders();
    const res = await axiosInstance.post(`${fitnessAssessmentUrl}/create`, payload, { headers });
    return Number(res.data);
};

/**
 * Signe une fiche d'aptitude — APPEND-ONLY apres signature
 * (AIEA GSR Part 3 §3.106 — archivage 30 ans).
 * Endpoint : {@code POST /hns/dosimetry/fitness-assessment/sign/{id}}.
 */
const signFitnessAssessment = async (
    assessmentId: number | string,
): Promise<void> => {
    const headers = buildMedicalHeaders();
    await axiosInstance.post(`${fitnessAssessmentUrl}/sign/${assessmentId}`, null, { headers });
};

// ─── FitnessAssessment — LECTURES Public (PCR_RPO + MEDICAL + SELF) ───

/**
 * Aptitude courante d'un travailleur (Public).
 * Endpoint : {@code GET /hns/dosimetry/fitness-assessment/current/{workerId}}.
 */
const getCurrentFitnessPublic = async (
    workerId: number | string,
): Promise<FitnessAssessmentPublicDTO | null> => {
    const headers = buildMedicalHeaders();
    try {
        const res = await axiosInstance.get(
            `${fitnessAssessmentUrl}/current/${workerId}`,
            { headers },
        );
        return (res.data ?? null) as FitnessAssessmentPublicDTO | null;
    } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
    }
};

/**
 * Historique des fiches d'aptitude (Public).
 * Endpoint : {@code GET /hns/dosimetry/fitness-assessment/history/{workerId}}.
 */
const getFitnessHistoryPublic = async (
    workerId: number | string,
): Promise<FitnessAssessmentPublicDTO[]> => {
    const headers = buildMedicalHeaders();
    const res = await axiosInstance.get(
        `${fitnessAssessmentUrl}/history/${workerId}`,
        { headers },
    );
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
};

// ─── FitnessAssessment — LECTURES Full (MEDICAL only + X-Reason) ───

/**
 * Aptitude courante Full — restrictions cliniques dechiffrees.
 * REQUIS : MEDICAL + X-Reason.
 * Endpoint : {@code GET /hns/dosimetry/fitness-assessment/current/{workerId}/full}.
 */
const getCurrentFitnessFull = async (
    workerId: number | string,
    reason: string,
): Promise<FitnessAssessmentFullDTO | null> => {
    const headers = buildMedicalHeaders(reason);
    try {
        const res = await axiosInstance.get(
            `${fitnessAssessmentUrl}/current/${workerId}/full`,
            { headers },
        );
        return (res.data ?? null) as FitnessAssessmentFullDTO | null;
    } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
    }
};

/**
 * Historique Full — restrictions cliniques dechiffrees.
 * REQUIS : MEDICAL + X-Reason.
 * Endpoint : {@code GET /hns/dosimetry/fitness-assessment/history/{workerId}/full}.
 */
const getFitnessHistoryFull = async (
    workerId: number | string,
    reason: string,
): Promise<FitnessAssessmentFullDTO[]> => {
    const headers = buildMedicalHeaders(reason);
    const res = await axiosInstance.get(
        `${fitnessAssessmentUrl}/history/${workerId}/full`,
        { headers },
    );
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
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
    // CSV bulk import
    previewCsvImport,
    executeCsvImport,
    // Alerts
    getAllAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert,
    getActiveAlerts,
    acknowledgeAlert,
    resolveAlert,
    // Overexposure cases (Phase 5 Frontend-C)
    getOverexposureCases,
    getOverexposureCaseById,
    getActiveOverexposureCases,
    getOverexposureCasesByWorker,
    openOverexposureCase,
    investigateOverexposureCase,
    closeOverexposureCase,
    updateOverexposureCase,
    deleteOverexposureCase,
    // Audit logs (Phase 5 Frontend-C)
    getAllAuditLogs,
    // Ambient monitoring (Phase 6 Frontend-A)
    listMeasurementPoints,
    listMeasurementPointsByZone,
    getMeasurementPoint,
    createMeasurementPoint,
    updateMeasurementPoint,
    activateMeasurementPoint,
    deactivateMeasurementPoint,
    recordAmbientMeasurement,
    listAmbientMeasurementsByPoint,
    getAmbientMeasurementStats,
    // Monitoring campaigns (Phase 6 Frontend-B)
    listMonitoringCampaigns,
    getMonitoringCampaign,
    createMonitoringCampaign,
    startMonitoringCampaign,
    completeMonitoringCampaign,
    cancelMonitoringCampaign,
    addPointToCampaign,
    listMeasurementsByCampaign,
    generateMonitoringCampaignReport,
    // Exposure profiles & exposure profile links (Phase 6 Frontend-C)
    getAllExposureProfiles,
    getExposureProfileById,
    createExposureProfile,
    updateExposureProfile,
    deleteExposureProfile,
    getExposureProfileLinks,
    setExposureProfileLinks,
    getExposureProfileEstimatedDose,
    // Medical surveillance (Phase 7 Frontend-A)
    scheduleMedicalVisit,
    performMedicalVisit,
    cancelMedicalVisit,
    getUpcomingMedicalVisits,
    getWorkerMedicalVisitsSummary,
    getWorkerMedicalVisitsFull,
    getMedicalVisitFull,
    createFitnessAssessment,
    signFitnessAssessment,
    getCurrentFitnessPublic,
    getFitnessHistoryPublic,
    getCurrentFitnessFull,
    getFitnessHistoryFull,
};

// ─────────────────────────────────────────────────────────────────────────────
//  AMBIENT MONITORING — Points de mesure d'ambiance + mesures H*(10)
//  Phase 6 Frontend-A
//  Base: /hns/dosimetry/measurement-point
//         /hns/dosimetry/ambient-measurement
// ─────────────────────────────────────────────────────────────────────────────

/** Classification reglementaire d'une zone de mesure (CIPR 103 / AIEA GSR Part 3). */
export type ZoneClass = 'SURVEILLED' | 'CONTROLLED' | 'NONE';

/** Contexte operationnel d'une mesure d'ambiance. */
export type MeasurementContext = 'ROUTINE' | 'CAMPAIGN' | 'INCIDENT_RESPONSE' | 'COMMISSIONING';

/**
 * MeasurementPointDTO — point fixe de mesure d'ambiance.
 *
 * <p>Aligne 1:1 sur le DTO Java {@code MeasurementPointDTO}
 * (cf. {@code Backend/Health-Safety/.../dto/MeasurementPointDTO.java}).
 *
 * <p>Champs :
 *   - mineId             : OBLIGATOIRE — isolation multi-tenant.
 *   - code               : OBLIGATOIRE — unique par mine.
 *   - label              : OBLIGATOIRE — libelle court.
 *   - zoneId             : optionnel — lien vers une WorkArea / zone metier.
 *   - description        : description libre.
 *   - location           : libelle textuel (galerie, niveau, repere).
 *   - latitude/longitude : coordonnees decimales (optionnelles).
 *   - elevation          : altitude / cote (optionnel).
 *   - zoneClassification : OBLIGATOIRE — SURVEILLED / CONTROLLED / NONE.
 *   - referenceLevel     : niveau de reference (uSv/h).
 *   - active             : etat du point (true = surveille).
 */
export interface MeasurementPointDTO {
    id?: number | null;
    mineId: number;
    code: string;
    label: string;
    zoneId?: number | null;
    description?: string | null;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    elevation?: number | null;
    zoneClassification: ZoneClass;
    referenceLevel?: number | null;
    active?: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: number | null;
    updatedBy?: number | null;
    version?: number | null;
}

/**
 * AmbientMeasurementDTO — mesure d'ambiance H*(10) sur un point.
 *
 * <p>Aligne 1:1 sur le DTO Java {@code AmbientMeasurementDTO}.
 *
 * <p>Champs ecriture (POST /record) :
 *   - mineId            : OBLIGATOIRE
 *   - measurementPointId: OBLIGATOIRE
 *   - measuredAt        : OBLIGATOIRE — ISO LocalDateTime
 *   - measuredBy        : OBLIGATOIRE — userId
 *   - value             : OBLIGATOIRE — H*(10) en uSv/h ; doit etre > 0
 *   - context           : OBLIGATOIRE — ROUTINE | CAMPAIGN | INCIDENT_RESPONSE | COMMISSIONING
 *
 * <p>Champs lecture seule renvoyes par le backend :
 *   - aboveReferenceLevel: indique si value > referenceLevel du point
 *   - trendVsPrevious    : variation relative vs. derniere mesure du meme point
 */
export interface AmbientMeasurementDTO {
    id?: number | null;
    mineId: number;
    measurementPointId: number;
    measuredAt: string;
    measuredBy: number;
    value: number;
    uncertainty?: number | null;
    instrumentId?: number | null;
    instrumentSerial?: string | null;
    context: MeasurementContext;
    campaignId?: number | null;
    notes?: string | null;
    createdAt?: string | null;
    createdBy?: number | null;
    aboveReferenceLevel?: boolean | null;
    trendVsPrevious?: number | null;
}

/** Statistiques d'ambiance sur un point pour une periode. */
export interface AmbientMeasurementStatsDTO {
    measurementPointId: number;
    from?: string | null;
    to?: string | null;
    count: number;
    min?: number | null;
    max?: number | null;
    avg?: number | null;
    median?: number | null;
    referenceLevel?: number | null;
    overReferenceCount: number;
}

const measurementPointUrl = '/hns/dosimetry/measurement-point';
const ambientMeasurementUrl = '/hns/dosimetry/ambient-measurement';

/**
 * Liste les points de mesure d'ambiance pour une mine.
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/measurement-point/search?mineId=X}.
 * RBAC backend : DOSIMETRY_READ_AGGREGATE.
 */
const listMeasurementPoints = async (mineId?: number | null): Promise<MeasurementPointDTO[]> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for listMeasurementPoints');
    }
    const res = await axiosInstance.get(`${measurementPointUrl}/search`, {
        params: { mineId: resolvedMineId },
    });
    return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
};

/**
 * Liste les points de mesure filtres par classification de zone.
 * Endpoint : {@code GET /hns/dosimetry/measurement-point/by-zone?mineId=X&zoneClassification=Y}.
 */
const listMeasurementPointsByZone = async (
    mineId: number | null | undefined,
    zoneClassification: ZoneClass,
): Promise<MeasurementPointDTO[]> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for listMeasurementPointsByZone');
    }
    const res = await axiosInstance.get(`${measurementPointUrl}/by-zone`, {
        params: { mineId: resolvedMineId, zoneClassification },
    });
    return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
};

/**
 * Recupere le detail d'un point de mesure.
 * Endpoint : {@code GET /hns/dosimetry/measurement-point/detail/{id}}.
 */
const getMeasurementPoint = async (id: number | string): Promise<MeasurementPointDTO> => {
    const res = await axiosInstance.get(`${measurementPointUrl}/detail/${id}`);
    return res.data as MeasurementPointDTO;
};

/**
 * Cree un nouveau point de mesure.
 * Endpoint : {@code POST /hns/dosimetry/measurement-point/create}.
 * RBAC : DOSIMETRY_WRITE. L'en-tete X-User-Id est injectee depuis le store.
 */
const createMeasurementPoint = async (payload: MeasurementPointDTO): Promise<number> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    const res = await axiosInstance.post(`${measurementPointUrl}/create`, payload, { headers });
    return Number(res.data);
};

/**
 * Met a jour un point de mesure existant.
 * Endpoint : {@code PUT /hns/dosimetry/measurement-point/update/{id}}.
 */
const updateMeasurementPoint = async (
    id: number | string,
    payload: MeasurementPointDTO,
): Promise<void> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    await axiosInstance.put(`${measurementPointUrl}/update/${id}`, payload, { headers });
};

/**
 * Active un point de mesure (le replace en surveillance).
 * Endpoint : {@code POST /hns/dosimetry/measurement-point/activate/{id}}.
 */
const activateMeasurementPoint = async (id: number | string): Promise<void> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    await axiosInstance.post(`${measurementPointUrl}/activate/${id}`, null, { headers });
};

/**
 * Desactive un point de mesure (sortie de la surveillance reguliere).
 * Endpoint : {@code POST /hns/dosimetry/measurement-point/deactivate/{id}}.
 */
const deactivateMeasurementPoint = async (id: number | string): Promise<void> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    await axiosInstance.post(`${measurementPointUrl}/deactivate/${id}`, null, { headers });
};

/**
 * Enregistre une nouvelle mesure d'ambiance.
 *
 * <p>Endpoint : {@code POST /hns/dosimetry/ambient-measurement/record}.
 * RBAC : DOSIMETRY_WRITE.
 */
const recordAmbientMeasurement = async (
    payload: AmbientMeasurementDTO,
): Promise<AmbientMeasurementDTO> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    const body: AmbientMeasurementDTO = {
        ...payload,
        measuredBy: payload.measuredBy ?? userId ?? 0,
    };
    const res = await axiosInstance.post(`${ambientMeasurementUrl}/record`, body, { headers });
    return res.data as AmbientMeasurementDTO;
};

/**
 * Liste les mesures d'ambiance d'un point sur une periode.
 * Endpoint : {@code GET /hns/dosimetry/ambient-measurement/by-point?measurementPointId=X&from=...&to=...}.
 */
const listAmbientMeasurementsByPoint = async (
    measurementPointId: number | string,
    from?: string | null,
    to?: string | null,
): Promise<AmbientMeasurementDTO[]> => {
    const params: Record<string, string | number> = { measurementPointId };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await axiosInstance.get(`${ambientMeasurementUrl}/by-point`, { params });
    return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
};

/**
 * Recupere les statistiques agregees (min/max/avg/median + nb depassements) sur un point.
 * Endpoint : {@code GET /hns/dosimetry/ambient-measurement/stats?measurementPointId=X&from=...&to=...}.
 */
const getAmbientMeasurementStats = async (
    measurementPointId: number | string,
    from?: string | null,
    to?: string | null,
): Promise<AmbientMeasurementStatsDTO> => {
    const params: Record<string, string | number> = { measurementPointId };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await axiosInstance.get(`${ambientMeasurementUrl}/stats`, { params });
    return res.data as AmbientMeasurementStatsDTO;
};

// ─────────────────────────────────────────────────────────────────────────────
//  MONITORING CAMPAIGNS — Campagnes de surveillance d'ambiance (Phase 6 Frontend-B)
//  Base: /hns/dosimetry/monitoring-campaign
//  Workflow : DRAFT -> ONGOING -> COMPLETED, avec branche CANCELLED depuis DRAFT/ONGOING.
// ─────────────────────────────────────────────────────────────────────────────

/** Statut du workflow d'une campagne (cf. enum CampaignStatus backend). */
export type CampaignStatus = 'DRAFT' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

/**
 * MonitoringCampaignDTO — campagne de surveillance H*(10).
 *
 * <p>Aligne 1:1 sur le DTO Java {@code MonitoringCampaignDTO}
 * (cf. {@code Backend/Health-Safety/.../dto/MonitoringCampaignDTO.java}).
 *
 * <p>Champs cles :
 *   - mineId               : OBLIGATOIRE — isolation multi-tenant.
 *   - code                 : OBLIGATOIRE — unique par mine (ex. CAMP-2026-Q1).
 *   - label                : OBLIGATOIRE — libelle court (ex. "Campagne Q1 zones surveillees").
 *   - objective            : objectif descriptif libre.
 *   - startDate / endDate  : periode planifiee (LocalDate ISO).
 *   - status               : DRAFT par defaut a la creation.
 *   - protocol             : protocole de mesure (textarea libre).
 *   - responsibleId        : id du responsable de campagne (employee).
 *   - measurementPointIds  : liste des points couverts par la campagne.
 */
export interface MonitoringCampaignDTO {
    id?: number | null;
    mineId: number;
    code: string;
    label: string;
    objective?: string | null;
    startDate: string;
    endDate?: string | null;
    status?: CampaignStatus;
    protocol?: string | null;
    responsibleId?: number | null;
    measurementPointIds?: number[];
    createdAt?: string | null;
    createdBy?: number | null;
    updatedAt?: string | null;
    updatedBy?: number | null;
    completedAt?: string | null;
    completedBy?: number | null;
}

const monitoringCampaignUrl = '/hns/dosimetry/monitoring-campaign';

/**
 * Liste les campagnes de surveillance pour une mine.
 * Endpoint : {@code GET /hns/dosimetry/monitoring-campaign/search?mineId=X}.
 * RBAC : DOSIMETRY_READ_AGGREGATE.
 */
const listMonitoringCampaigns = async (
    mineId?: number | null,
): Promise<MonitoringCampaignDTO[]> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for listMonitoringCampaigns');
    }
    const res = await axiosInstance.get(`${monitoringCampaignUrl}/search`, {
        params: { mineId: resolvedMineId },
    });
    return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
};

/**
 * Recupere le detail d'une campagne (avec points couverts + responsable).
 * Endpoint : {@code GET /hns/dosimetry/monitoring-campaign/detail/{id}}.
 */
const getMonitoringCampaign = async (
    id: number | string,
): Promise<MonitoringCampaignDTO> => {
    const res = await axiosInstance.get(`${monitoringCampaignUrl}/detail/${id}`);
    return res.data as MonitoringCampaignDTO;
};

/**
 * Cree une nouvelle campagne (statut initial = DRAFT).
 * Endpoint : {@code POST /hns/dosimetry/monitoring-campaign/create}.
 * RBAC : DOSIMETRY_PCR_RPO.
 */
const createMonitoringCampaign = async (
    payload: MonitoringCampaignDTO,
): Promise<number> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    const res = await axiosInstance.post(`${monitoringCampaignUrl}/create`, payload, { headers });
    return Number(res.data);
};

/**
 * Transition DRAFT -> ONGOING (demarrage officiel).
 * Endpoint : {@code POST /hns/dosimetry/monitoring-campaign/start/{id}}.
 * RBAC : DOSIMETRY_PCR_RPO.
 */
const startMonitoringCampaign = async (id: number | string): Promise<void> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    await axiosInstance.post(`${monitoringCampaignUrl}/start/${id}`, null, { headers });
};

/**
 * Transition ONGOING -> COMPLETED (cloture de la campagne).
 * Endpoint : {@code POST /hns/dosimetry/monitoring-campaign/complete/{id}}.
 * RBAC : DOSIMETRY_PCR_RPO.
 */
const completeMonitoringCampaign = async (id: number | string): Promise<void> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    await axiosInstance.post(`${monitoringCampaignUrl}/complete/${id}`, null, { headers });
};

/**
 * Transition DRAFT/ONGOING -> CANCELLED (annulation).
 * Endpoint : {@code POST /hns/dosimetry/monitoring-campaign/cancel/{id}}.
 * RBAC : DOSIMETRY_PCR_RPO.
 */
const cancelMonitoringCampaign = async (id: number | string): Promise<void> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    await axiosInstance.post(`${monitoringCampaignUrl}/cancel/${id}`, null, { headers });
};

/**
 * Ajoute un point de mesure a la campagne.
 * Endpoint : {@code POST /hns/dosimetry/monitoring-campaign/add-point/{id}?measurementPointId=Y}.
 * RBAC : DOSIMETRY_WRITE.
 */
const addPointToCampaign = async (
    campaignId: number | string,
    measurementPointId: number,
): Promise<void> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    await axiosInstance.post(
        `${monitoringCampaignUrl}/add-point/${campaignId}`,
        null,
        { headers, params: { measurementPointId } },
    );
};

/**
 * Liste les mesures rattachees a une campagne.
 * Endpoint : {@code GET /hns/dosimetry/ambient-measurement/by-campaign?campaignId=X}.
 */
const listMeasurementsByCampaign = async (
    campaignId: number | string,
): Promise<AmbientMeasurementDTO[]> => {
    const res = await axiosInstance.get(`${ambientMeasurementUrl}/by-campaign`, {
        params: { campaignId },
    });
    return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
};

/**
 * Genere le rapport texte d'une campagne (placeholder en attendant PDF).
 * Endpoint : {@code GET /hns/dosimetry/monitoring-campaign/report/{id}}.
 */
const generateMonitoringCampaignReport = async (
    id: number | string,
): Promise<string> => {
    const res = await axiosInstance.get(`${monitoringCampaignUrl}/report/${id}`, {
        responseType: 'text',
    });
    return typeof res.data === 'string' ? res.data : String(res.data ?? '');
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXPOSURE PROFILES + EXPOSURE PROFILE LINKS (Phase 6 Frontend-C)
//  Base profils : /hns/dosimetry/exposure-profile
//  Base liens   : /hns/dosimetry/exposure-profile-link
//
//  Concept : un ExposureProfile decrit l'exposition d'un worker (type, zone,
//  poste, frequence). Un ensemble d'ExposureProfileLink rattache ce profil
//  a 1..N MeasurementPoint avec une fraction de temps de presence dans [0,1],
//  permettant au backend de calculer une dose estimee annuelle
//  SUM(fraction * doseRate * hours).
// ─────────────────────────────────────────────────────────────────────────────

const exposureProfileUrl = '/hns/dosimetry/exposure-profile';
const exposureProfileLinkUrl = '/hns/dosimetry/exposure-profile-link';

/**
 * Liste l'ensemble des profils d'exposition pour la mine selectionnee.
 * Endpoint : {@code GET /hns/dosimetry/exposure-profile/getAll?companyId=X}
 * (companyId injecte par AxiosInterceptor).
 */
const getAllExposureProfiles = async (): Promise<ExposureProfileDTO[]> => {
    const res = await axiosInstance.get(`${exposureProfileUrl}/getAll`);
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
};

/**
 * Recupere le detail d'un profil d'exposition.
 * Endpoint : {@code GET /hns/dosimetry/exposure-profile/get/{id}}.
 */
const getExposureProfileById = async (
    id: number | string,
): Promise<ExposureProfileDTO> => {
    const res = await axiosInstance.get(`${exposureProfileUrl}/get/${id}`);
    return res.data as ExposureProfileDTO;
};

/**
 * Cree un nouveau profil d'exposition.
 * Endpoint : {@code POST /hns/dosimetry/exposure-profile/create?companyId=X}.
 */
const createExposureProfile = async (
    payload: ExposureProfileDTO,
): Promise<number> => {
    const res = await axiosInstance.post(`${exposureProfileUrl}/create`, payload);
    return Number(res.data);
};

/**
 * Met a jour un profil d'exposition.
 * Endpoint : {@code PUT /hns/dosimetry/exposure-profile/update?companyId=X}.
 */
const updateExposureProfile = async (
    payload: ExposureProfileDTO,
): Promise<void> => {
    await axiosInstance.put(`${exposureProfileUrl}/update`, payload);
};

/**
 * Supprime un profil d'exposition.
 * Endpoint : {@code DELETE /hns/dosimetry/exposure-profile/delete/{id}}.
 */
const deleteExposureProfile = async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`${exposureProfileUrl}/delete/${id}`);
};

/**
 * Liste les liens (point de mesure x fraction de temps) d'un profil.
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/exposure-profile-link/by-profile/{profileId}}.
 * RBAC backend : DOSIMETRY_READ_AGGREGATE.
 */
const getExposureProfileLinks = async (
    profileId: number | string,
): Promise<ExposureProfileLinkDTO[]> => {
    const res = await axiosInstance.get(`${exposureProfileLinkUrl}/by-profile/${profileId}`);
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
};

/**
 * Remplace l'ensemble des liens d'un profil "all-or-nothing".
 *
 * <p>Le backend supprime tous les liens existants puis reinsere la liste.
 * Valide cote backend que {@code SUM(fraction) <= 1.0} (sinon 400).
 *
 * <p>Endpoint : {@code POST /hns/dosimetry/exposure-profile-link/set/{profileId}}.
 * RBAC backend : DOSIMETRY_WRITE. L'en-tete X-User-Id est injectee depuis le store.
 */
const setExposureProfileLinks = async (
    profileId: number | string,
    links: ExposureProfileLinkDTO[],
): Promise<void> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    await axiosInstance.post(`${exposureProfileLinkUrl}/set/${profileId}`, links, { headers });
};

/**
 * Calcule la dose estimee annuelle (mSv) pour un profil donne :
 * {@code SUM(fraction * estimatedDoseRate * workHoursPerYear)}.
 *
 * <p>Le backend renvoie la valeur en unite coherente avec l'estimatedDoseRate
 * (uSv/h * h = uSv, divise par 1000 cote frontend pour affichage mSv).
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/exposure-profile-link/estimated-dose/{profileId}?workHoursPerYear=N}.
 */
const getExposureProfileEstimatedDose = async (
    profileId: number | string,
    workHoursPerYear: number = 1607,
): Promise<number> => {
    const res = await axiosInstance.get(
        `${exposureProfileLinkUrl}/estimated-dose/${profileId}`,
        { params: { workHoursPerYear } },
    );
    const v = res.data;
    if (v == null) return 0;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
};

// ─────────────────────────────────────────────────────────────────────────────
//  PHASE 8 — KPI EXECUTIVE DASHBOARD
//  Base: /hns/dosimetry/kpi
//
//  RBAC : DOSIMETRY_READ_AGGREGATE (donnees STRICTEMENT agregees, pas de nominatif).
//
//  Endpoints (cf. KpiController.java) :
//    - GET /summary?mineId=X&date=Y                     -> List<DosimetryKpiSnapshotDTO>
//    - GET /trend?mineId=X&months=N&category=&metric=   -> List<DosimetryTrendPointDTO>
//    - GET /distribution?mineId=X&year=Y&category=      -> DosimetryDistributionDTO
//    - GET /top-exposed?mineId=X&limit=N&year=Y         -> List<DosimetryTopExposedDTO>
//    - GET /multi-mine-comparison?date=Y                -> List<DosimetryMineComparisonDTO>
//    - GET /global-status                               -> DosimetryGlobalStatusDTO
// ─────────────────────────────────────────────────────────────────────────────

/** Categorie KPI (cf. enum KpiCategory backend). */
export type KpiCategory = 'WORKER_A' | 'WORKER_B' | 'APPRENTICE' | 'PREGNANCY' | 'PUBLIC';

/**
 * DosimetryKpiSnapshotDTO — snapshot KPI quotidien par mine + categorie.
 * Aligne 1:1 sur le DTO Java {@code DosimetryKpiSnapshotDTO}.
 */
export interface DosimetryKpiSnapshotDTO {
    id?: number | null;
    mineId: number;
    snapshotDate: string;
    category: KpiCategory;
    workersCount: number;
    doseRecordsCount: number;
    avgAnnualDose?: number | null;
    medianAnnualDose?: number | null;
    maxAnnualDose?: number | null;
    workersOver50Pct: number;
    workersOver75Pct: number;
    workersOver90Pct: number;
    workersOver100Pct: number;
    activeAlertsCount: number;
    overexposureCasesOpen: number;
    fitnessExpiringSoon: number;
    measurementPointsCount: number;
    ambientAvgUsvh?: number | null;
    createdAt?: string | null;
}

/** Point d'une serie temporelle KPI (mensuel). */
export interface DosimetryTrendPointDTO {
    period: string; // "YYYY-MM"
    snapshotDate: string;
    metric: string;
    value: number | null;
}

/** Bucket d'un histogramme de distribution. */
export interface DosimetryDistributionBucketDTO {
    fromPct: number;
    toPct: number;
    label: string;
    count: number;
}

/** Distribution des doses annuelles (6 buckets vs limite reglementaire). */
export interface DosimetryDistributionDTO {
    mineId: number;
    year: number;
    category?: KpiCategory | null;
    regulatoryLimit?: number | null;
    workersCount: number;
    buckets: DosimetryDistributionBucketDTO[];
}

/** Ligne du top N des workers les plus exposes (pseudonymise — workerId + dose). */
export interface DosimetryTopExposedDTO {
    rank: number;
    workerId: number;
    category: KpiCategory;
    annualDose?: number | null;
    percentOfLimit?: number | null;
}

/** Agregat KPI a la maille mine pour le comparatif cross-tenant. */
export interface DosimetryMineComparisonDTO {
    mineId: number;
    snapshotDate: string;
    workersCount: number;
    avgAnnualDose?: number | null;
    maxAnnualDose?: number | null;
    workersOver100Pct: number;
    activeAlertsCount: number;
    overexposureCasesOpen: number;
    ambientAvgUsvh?: number | null;
}

/** Etat global plateforme Dosimetrie (tous sites confondus). */
export interface DosimetryGlobalStatusDTO {
    snapshotDate: string;
    minesCount: number;
    workersCount: number;
    doseRecordsCount: number;
    avgAnnualDose?: number | null;
    maxAnnualDose?: number | null;
    workersOver50Pct: number;
    workersOver75Pct: number;
    workersOver90Pct: number;
    workersOver100Pct: number;
    activeAlertsCount: number;
    overexposureCasesOpen: number;
    fitnessExpiringSoon: number;
    measurementPointsCount: number;
    ambientAvgUsvh?: number | null;
}

const kpiUrl = '/hns/dosimetry/kpi';

/**
 * Recupere les snapshots KPI (1 par categorie) pour la mine + date demandee.
 * Si {@code date} omis, retourne la derniere date disponible (fallback 365j).
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/kpi/summary?mineId=X&date=Y}.
 * RBAC : DOSIMETRY_READ_AGGREGATE.
 */
const getKpiSummary = async (
    mineId?: number | null,
    date?: string | null,
): Promise<DosimetryKpiSnapshotDTO[]> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for getKpiSummary');
    }
    const params: Record<string, string | number> = { mineId: resolvedMineId };
    if (date) params.date = date;
    try {
        const res = await axiosInstance.get(`${kpiUrl}/summary`, { params });
        return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
    } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 404 || httpStatus === 501) {
            // eslint-disable-next-line no-console
            console.warn('[DosimetryService] /kpi/summary endpoint not deployed yet');
            return [];
        }
        throw err;
    }
};

/**
 * Recupere une serie temporelle mensuelle de la metrique demandee.
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/kpi/trend?mineId=X&months=N&category=&metric=}.
 * RBAC : DOSIMETRY_READ_AGGREGATE.
 */
const getKpiTrend = async (
    mineId?: number | null,
    months: number = 12,
    category?: KpiCategory | null,
    metric?: string | null,
): Promise<DosimetryTrendPointDTO[]> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for getKpiTrend');
    }
    const params: Record<string, string | number> = { mineId: resolvedMineId, months };
    if (category) params.category = category;
    if (metric) params.metric = metric;
    try {
        const res = await axiosInstance.get(`${kpiUrl}/trend`, { params });
        return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
    } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 404 || httpStatus === 501) {
            return [];
        }
        throw err;
    }
};

/**
 * Recupere l'histogramme de distribution des doses annuelles (6 buckets).
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/kpi/distribution?mineId=X&year=Y&category=}.
 * RBAC : DOSIMETRY_READ_AGGREGATE.
 */
const getKpiDistribution = async (
    mineId?: number | null,
    year?: number | null,
    category?: KpiCategory | null,
): Promise<DosimetryDistributionDTO | null> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for getKpiDistribution');
    }
    const params: Record<string, string | number> = { mineId: resolvedMineId };
    if (year != null) params.year = year;
    if (category) params.category = category;
    try {
        const res = await axiosInstance.get(`${kpiUrl}/distribution`, { params });
        return (res.data ?? null) as DosimetryDistributionDTO | null;
    } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 404 || httpStatus === 501) {
            return null;
        }
        throw err;
    }
};

/**
 * Top N des workers les plus exposes (pseudonymise — workerId + dose).
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/kpi/top-exposed?mineId=X&limit=N&year=Y}.
 * RBAC : DOSIMETRY_READ_AGGREGATE (donnees pseudonymisees, pas de nominatif).
 */
const getTopExposed = async (
    mineId?: number | null,
    limit: number = 10,
    year?: number | null,
): Promise<DosimetryTopExposedDTO[]> => {
    const resolvedMineId = mineId ?? resolveMineId();
    if (resolvedMineId == null) {
        throw new Error('mineId required for getTopExposed');
    }
    const params: Record<string, string | number> = { mineId: resolvedMineId, limit };
    if (year != null) params.year = year;
    try {
        const res = await axiosInstance.get(`${kpiUrl}/top-exposed`, { params });
        return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
    } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 404 || httpStatus === 501) {
            return [];
        }
        throw err;
    }
};

/**
 * Comparatif cross-tenant : KPI agregeS par mine pour une date donnee.
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/kpi/multi-mine-comparison?date=Y}.
 * RBAC : DOSIMETRY_READ_AGGREGATE.
 */
const getMultiMineComparison = async (
    date?: string | null,
): Promise<DosimetryMineComparisonDTO[]> => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    try {
        const res = await axiosInstance.get(`${kpiUrl}/multi-mine-comparison`, { params });
        return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
    } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 404 || httpStatus === 501) {
            return [];
        }
        throw err;
    }
};

/**
 * Etat global plateforme Dosimetrie (tous sites confondus).
 *
 * <p>Endpoint : {@code GET /hns/dosimetry/kpi/global-status}.
 * RBAC : DOSIMETRY_READ_AGGREGATE.
 */
const getGlobalStatus = async (): Promise<DosimetryGlobalStatusDTO | null> => {
    try {
        const res = await axiosInstance.get(`${kpiUrl}/global-status`);
        return (res.data ?? null) as DosimetryGlobalStatusDTO | null;
    } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 404 || httpStatus === 501) {
            return null;
        }
        throw err;
    }
};

export {
    // Phase 8 — KPI executive dashboard
    getKpiSummary,
    getKpiTrend,
    getKpiDistribution,
    getTopExposed,
    getMultiMineComparison,
    getGlobalStatus,
};

// ─────────────────────────────────────────────────────────────────────────────
//  PHASE 9-B — RAPPORTS PDF + EXPORTS REGLEMENTAIRES
//  Base rapports :       /hns/dosimetry/report
//  Base exports :        /hns/dosimetry/regulatory-export
//
//  Tous les endpoints renvoient un flux binaire (PDF / XML / CSV) :
//   - axios.responseType = 'blob' obligatoire.
//   - Le header X-Reason est requis pour les rapports nominatifs (attestation,
//     fiche carriere, surexposition) — il est journalise dans DosimetryAuditLog
//     (action=EXPORT_PDF) pour tracabilite RGPD art.30 + AIEA GSR Part 3.
//   - Les exports reglementaires institutionnels (ASN XML/CSV, incidents XML)
//     ne demandent PAS de motif individuel mais sont journalises en bloc
//     (action=REGULATORY_EXPORT).
//
//  RBAC :
//   - Attestation individuelle / fiche carriere : DOSIMETRY_READ_NOMINATIVE
//     ou DOSIMETRY_MEDICAL ou SELF (le travailleur sur lui-meme).
//   - Rapport surexposition       : DOSIMETRY_PCR_RPO + DOSIMETRY_READ_NOMINATIVE.
//   - Registre annuel mine        : DOSIMETRY_READ_AGGREGATE (donnees agregees,
//     pas de motif individuel requis).
//   - Exports reglementaires      : DOSIMETRY_PCR_RPO uniquement (banner UI).
// ─────────────────────────────────────────────────────────────────────────────

const reportUrl = '/hns/dosimetry/report';
const regulatoryExportUrl = '/hns/dosimetry/regulatory-export';

/**
 * Construit les headers communs aux endpoints de rapports nominatifs :
 *   - X-User-Id : identifiant utilisateur (audit createdBy).
 *   - X-Reason  : motif RGPD obligatoire pour les rapports nominatifs.
 */
const buildReportHeaders = (reason?: string | null): Record<string, string> => {
    const headers: Record<string, string> = {};
    const userId = resolveUserId();
    if (userId != null) headers['X-User-Id'] = String(userId);
    if (reason && reason.trim().length > 0) headers['X-Reason'] = reason.trim();
    return headers;
};

/**
 * Helper navigateur : declenche un download local d'un Blob via une URL
 * objet temporaire. Compatible Chromium / Firefox / Edge / Safari.
 *
 * <p>Le frontend n'attend pas le filename du backend (header
 * {@code Content-Disposition} masque par axios apres CORS) — le composant
 * appelant doit fournir un nom explicite localise.
 *
 * <p>Usage typique :
 * <pre>
 *   const blob = await downloadIndividualAttestation(123, 2026, 'audit');
 *   triggerBrowserDownload(blob, `attestation_${matricule}_${year}.pdf`);
 * </pre>
 */
const triggerBrowserDownload = (blob: Blob, filename: string): void => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        // Environnement SSR / test — no-op silencieux.
        return;
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    // Le navigateur exige que l'element soit dans le DOM pour Firefox.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Liberation de l'URL objet apres un cycle event-loop pour eviter de
    // couper le download avant son demarrage effectif.
    setTimeout(() => {
        try {
            window.URL.revokeObjectURL(url);
        } catch {
            // ignore — best-effort cleanup
        }
    }, 1000);
};

/**
 * Telecharge l'attestation individuelle de dose d'un travailleur pour une annee.
 *
 * <p>Endpoint backend : {@code GET /hns/dosimetry/report/attestation/individual?workerId=X&year=Y}.
 * Header obligatoire : {@code X-Reason}. Retour : PDF binaire (Blob).
 * RBAC : DOSIMETRY_READ_NOMINATIVE / DOSIMETRY_MEDICAL / SELF.
 */
const downloadIndividualAttestation = async (
    workerId: number,
    year: number,
    reason: string,
): Promise<Blob> => {
    const headers = buildReportHeaders(reason);
    const res = await axiosInstance.get(`${reportUrl}/attestation/individual`, {
        params: { workerId, year },
        headers,
        responseType: 'blob',
    });
    return res.data as Blob;
};

/**
 * Telecharge la fiche carriere complete d'un travailleur (historique doses +
 * aptitudes + visites). Strict RGPD.
 *
 * <p>Endpoint backend : {@code GET /hns/dosimetry/report/career-summary?workerId=X}.
 * Header obligatoire : {@code X-Reason}.
 * RBAC : DOSIMETRY_MEDICAL ou SELF.
 */
const downloadCareerSummary = async (
    workerId: number,
    reason: string,
): Promise<Blob> => {
    const headers = buildReportHeaders(reason);
    const res = await axiosInstance.get(`${reportUrl}/career-summary`, {
        params: { workerId },
        headers,
        responseType: 'blob',
    });
    return res.data as Blob;
};

/**
 * Telecharge le registre annuel des travailleurs exposes d'une mine pour
 * une annee (PDF A4 paysage). Donnees agregees pseudonymisees.
 *
 * <p>Endpoint backend : {@code GET /hns/dosimetry/report/annual-register?mineId=X&year=Y}.
 * Pas de header X-Reason — RBAC : DOSIMETRY_READ_AGGREGATE.
 */
const downloadAnnualRegister = async (
    mineId: number,
    year: number,
): Promise<Blob> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    const res = await axiosInstance.get(`${reportUrl}/annual-register`, {
        params: { mineId, year },
        headers,
        responseType: 'blob',
    });
    return res.data as Blob;
};

/**
 * Telecharge le rapport detaille d'un dossier de surexposition (cause, actions
 * correctives, decision medicale, declaration autorite).
 *
 * <p>Endpoint backend : {@code GET /hns/dosimetry/report/overexposure/{caseId}}.
 * Header obligatoire : {@code X-Reason}. RBAC : DOSIMETRY_PCR_RPO.
 */
const downloadOverexposureReport = async (
    caseId: number,
    reason: string,
): Promise<Blob> => {
    const headers = buildReportHeaders(reason);
    const res = await axiosInstance.get(`${reportUrl}/overexposure/${caseId}`, {
        headers,
        responseType: 'blob',
    });
    return res.data as Blob;
};

/**
 * Telecharge l'export reglementaire XML ASN annuel pour une mine.
 * Format : XML conforme schema ASN (Autorite de Surete Nucleaire).
 *
 * <p>Endpoint backend : {@code GET /hns/dosimetry/regulatory-export/annual-xml?mineId=X&year=Y}.
 * RBAC : DOSIMETRY_PCR_RPO. Tracabilite : action=REGULATORY_EXPORT_XML_ANNUAL.
 */
const downloadAnnualXmlAsn = async (
    mineId: number,
    year: number,
): Promise<Blob> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    const res = await axiosInstance.get(`${regulatoryExportUrl}/annual-xml`, {
        params: { mineId, year },
        headers,
        responseType: 'blob',
    });
    return res.data as Blob;
};

/**
 * Telecharge l'export CSV regulateur (donnees nominales) pour declaration
 * annuelle aupres du ministere / autorite sanitaire.
 *
 * <p>Endpoint backend : {@code GET /hns/dosimetry/regulatory-export/annual-csv?mineId=X&year=Y}.
 * RBAC : DOSIMETRY_PCR_RPO. Tracabilite : action=REGULATORY_EXPORT_CSV_ANNUAL.
 */
const downloadAnnualCsvRegulator = async (
    mineId: number,
    year: number,
): Promise<Blob> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    const res = await axiosInstance.get(`${regulatoryExportUrl}/annual-csv`, {
        params: { mineId, year },
        headers,
        responseType: 'blob',
    });
    return res.data as Blob;
};

/**
 * Telecharge l'export XML des incidents (depassements) de l'annee pour
 * une mine. Conforme schema ASN/IRSN.
 *
 * <p>Endpoint backend : {@code GET /hns/dosimetry/regulatory-export/incidents-xml?mineId=X&year=Y}.
 * RBAC : DOSIMETRY_PCR_RPO. Tracabilite : action=REGULATORY_EXPORT_XML_INCIDENTS.
 */
const downloadIncidentsXml = async (
    mineId: number,
    year: number,
): Promise<Blob> => {
    const userId = resolveUserId();
    const headers: Record<string, string> = {};
    if (userId != null) headers['X-User-Id'] = String(userId);
    const res = await axiosInstance.get(`${regulatoryExportUrl}/incidents-xml`, {
        params: { mineId, year },
        headers,
        responseType: 'blob',
    });
    return res.data as Blob;
};

export {
    // Phase 9-B — Reports & regulatory exports
    triggerBrowserDownload,
    downloadIndividualAttestation,
    downloadCareerSummary,
    downloadAnnualRegister,
    downloadOverexposureReport,
    downloadAnnualXmlAsn,
    downloadAnnualCsvRegulator,
    downloadIncidentsXml,
};
