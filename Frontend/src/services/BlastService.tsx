/**
 * BlastService — Module Gestion des Dynamitages / Blast Management (SafeX 360).
 *
 * Service axios pour le registre des tirs de mine. Les endpoints backend sont
 * deployes en P1 sous la racine `/hns/blast/*` (cf. BlastController.java).
 *
 * Pattern aligne sur DosimetryService :
 *   - companyId injecte automatiquement en query param via AxiosInterceptor
 *   - X-User-Id ajoute en header sur les ecritures (audit append-only)
 *   - mineId obligatoire dans le body POST (multi-tenant)
 *
 * Cycle de vie d'un tir (cf. BlastStatus.java) :
 *   DRAFT -> PLANNED -> CONFIRMED -> IMMINENT -> FIRED -> ALL_CLEAR
 *                                                  \-> MISFIRE -> ALL_CLEAR
 *   Tout etat peut basculer en CANCELLED ou POSTPONED.
 */

import axiosInstance from '../interceptors/AxiosInterceptor';
import store from '../Store';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers d'identite multi-tenant (mineId + X-User-Id)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resoud l'id de la mine courante depuis le store Redux avec fallback localStorage.
 */
export const resolveMineId = (): number | null => {
    try {
        const state: any = store.getState();
        const fromStore = state?.companySelection?.selectedCompanyId;
        if (fromStore !== null && fromStore !== undefined && !Number.isNaN(Number(fromStore))) {
            return Number(fromStore);
        }
    } catch {
        // store non disponible : fallback localStorage
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
 * Resoud l'identifiant utilisateur courant pour l'en-tete X-User-Id requis sur
 * les endpoints d'ecriture du module Blast (create/confirm/cancel/...).
 */
export const resolveUserId = (): number | null => {
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

/** Builder d'en-tetes X-User-Id pour les ecritures. */
const writeHeaders = () => {
    const userId = resolveUserId();
    if (userId == null) return {};
    return { headers: { 'X-User-Id': String(userId) } };
};

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES DTO — alignes 1:1 sur les DTO Java du backend (P1)
// ─────────────────────────────────────────────────────────────────────────────

/** Cycle de vie d'un tir (cf. BlastStatus.java). */
export type BlastStatus =
    | 'DRAFT'
    | 'PLANNED'
    | 'CONFIRMED'
    | 'IMMINENT'
    | 'FIRED'
    | 'ALL_CLEAR'
    | 'MISFIRE'
    | 'CANCELLED'
    | 'POSTPONED';

/** Type de tir (cf. BlastType.java). */
export type BlastType = 'PRODUCTION' | 'DEVELOPMENT' | 'SECONDARY' | 'PRESPLIT' | 'FINAL';

/** Plan de tir (sous-objet). */
export interface BlastPlanDTO {
    id?: number | null;
    holeCount?: number | null;
    holeDiameterMm?: number | null;
    depthM?: number | null;
    burdenM?: number | null;
    spacingM?: number | null;
    stemmingM?: number | null;
    explosiveType?: string | null;
    explosiveQtyKg?: number | null;
    powderFactor?: number | null;
    initiationSystem?: string | null;
    delaySequence?: string | null;
}

/** Garde / sentinelle de tir. */
export interface BlastGuardDTO {
    id?: number | null;
    employeeId: number;
    position?: string | null;
}

/** Destinataire e-mail (employe interne OU email externe). */
export interface BlastRecipientDTO {
    id?: number | null;
    employeeId?: number | null;
    externalEmail?: string | null;
    /** FR ou EN. */
    preferredLanguage?: string | null;
}

/** Payload de creation d'un tir (status initial = DRAFT). */
export interface BlastCreateDTO {
    reference?: string | null;
    scheduledAt: string;
    timezone?: string | null;
    type: BlastType;
    pit?: string | null;
    bench?: string | null;
    block?: string | null;
    lat?: number | null;
    lng?: number | null;
    /** Voies d'acces concernees (V015 — P2.1). */
    accessConcerned?: string | null;
    /** Points de rassemblement (CSV libre, V015 — P2.1). */
    assemblyPoints?: string | null;
    exclusionRadiusM?: number | null;
    blasterId?: number | null;
    /** Composition de l'equipe (V015 — P2.1). */
    team?: string | null;
    hseLeadId?: number | null;
    /** Limite PPV (mm/s, V015 — P2.1). */
    ppvLimit?: number | null;
    /** Recepteurs sensibles (V015 — P2.1). */
    sensitiveReceivers?: string | null;
    alarmZoneScope?: string | null;
    /** Notes pieces jointes (V015 — P2.1). */
    attachmentsNote?: string | null;
    /** Notes libres (V015 — P2.1). */
    notes?: string | null;
    mineId: number;
    plan?: BlastPlanDTO | null;
    guards?: BlastGuardDTO[];
    recipients?: BlastRecipientDTO[];
}

/** Payload de mise a jour d'un tir. */
export interface BlastUpdateDTO {
    id: number;
    scheduledAt?: string | null;
    timezone?: string | null;
    type?: BlastType | null;
    pit?: string | null;
    bench?: string | null;
    block?: string | null;
    lat?: number | null;
    lng?: number | null;
    /** Voies d'acces concernees (V015 — P2.1). */
    accessConcerned?: string | null;
    /** Points de rassemblement (V015 — P2.1). */
    assemblyPoints?: string | null;
    exclusionRadiusM?: number | null;
    blasterId?: number | null;
    /** Equipe de tir (V015 — P2.1). */
    team?: string | null;
    hseLeadId?: number | null;
    /** Limite PPV mm/s (V015 — P2.1). */
    ppvLimit?: number | null;
    /** Recepteurs sensibles (V015 — P2.1). */
    sensitiveReceivers?: string | null;
    alarmZoneScope?: string | null;
    /** Notes pieces jointes (V015 — P2.1). */
    attachmentsNote?: string | null;
    /** Notes libres (V015 — P2.1). */
    notes?: string | null;
    plan?: BlastPlanDTO | null;
    guards?: BlastGuardDTO[];
    recipients?: BlastRecipientDTO[];
    /** Obligatoire si le tir est deja CONFIRMED ou ulterieur. */
    reason?: string | null;
}

/** Projection legere pour le registre des tirs (page de liste). */
export interface BlastListItemDTO {
    id: number;
    reference: string;
    scheduledAt: string;
    timezone?: string | null;
    type: BlastType;
    status: BlastStatus;
    pit?: string | null;
    bench?: string | null;
    blasterId?: number | null;
    hseLeadId?: number | null;
    mineId: number;
}

/** Vue detaillee d'un tir. */
export interface BlastDetailDTO {
    id: number;
    reference: string;
    scheduledAt: string;
    timezone?: string | null;
    type: BlastType;
    pit?: string | null;
    bench?: string | null;
    block?: string | null;
    lat?: number | null;
    lng?: number | null;
    /** Voies d'acces concernees (V015 — P2.1). */
    accessConcerned?: string | null;
    /** Points de rassemblement (V015 — P2.1). */
    assemblyPoints?: string | null;
    status: BlastStatus;
    exclusionRadiusM?: number | null;
    blasterId?: number | null;
    /** Equipe de tir (V015 — P2.1). */
    team?: string | null;
    hseLeadId?: number | null;
    /** Limite PPV mm/s (V015 — P2.1). */
    ppvLimit?: number | null;
    /** Recepteurs sensibles (V015 — P2.1). */
    sensitiveReceivers?: string | null;
    alarmZoneScope?: string | null;
    /** Notes pieces jointes (V015 — P2.1). */
    attachmentsNote?: string | null;
    /** Notes libres (V015 — P2.1). */
    notes?: string | null;
    mineId: number;
    misfireResolvedAt?: string | null;
    /**
     * Notes de resolution du dernier raté (V017 — P5). Renseigne par le
     * BLAST_ADMIN lors de la levee du verrou misfire. Texte libre conserve
     * pour audit reglementaire.
     */
    misfireResolutionNotes?: string | null;
    version?: number;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number | null;
    updatedBy?: number | null;
    plan?: BlastPlanDTO | null;
    guards?: BlastGuardDTO[];
    recipients?: BlastRecipientDTO[];
}

/** Filtres de recherche du registre des tirs (body POST /search). */
export interface BlastSearchFilters {
    mineId: number;
    statuses?: BlastStatus[] | null;
    from?: string | null;
    to?: string | null;
    pit?: string | null;
    blasterId?: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  DTO — Tableau de bord Blast Management (P7)
// ─────────────────────────────────────────────────────────────────────────────

/** Resume du prochain tir confirme (compte a rebours en secondes). */
export interface NextBlastSummaryDTO {
    id: number;
    reference: string;
    scheduledAt: string;
    /** Zone d'alerte ou pit concerne (libelle court pour affichage). */
    zone: string;
    /** Secondes restantes (peut etre negatif si le tir est en cours). */
    secondsUntil: number;
    status: BlastStatus;
}

/** Compteurs de l'etat des notifications du mois. */
export interface NotificationsStateDTO {
    sent: number;
    scheduled: number;
    failed: number;
}

/** Indicateurs cles agreges du mois courant. */
export interface BlastDashboardKpisDTO {
    blastsThisMonth: number;
    totalExplosivesKg: number;
    avgPowderFactor: number;
    onTimeRate: number;
    misfireCount: number;
    blastsToday: number;
}

/**
 * Agregat complet du tableau de bord Blast Management. Aligne 1:1 sur
 * {@code BlastDashboardDTO.java} (Phase 7 backend).
 */
export interface BlastDashboardDTO {
    upcomingToday: BlastListItemDTO[];
    upcomingThisWeek: BlastListItemDTO[];
    upcomingThisWeekCount: number;
    nextConfirmedBlast: NextBlastSummaryDTO | null;
    statusBreakdown: Partial<Record<BlastStatus, number>>;
    notificationsState: NotificationsStateDTO;
    lastFinishedBlasts: BlastListItemDTO[];
    kpis: BlastDashboardKpisDTO;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENDPOINTS — /hns/blast/*
// ─────────────────────────────────────────────────────────────────────────────

const baseUrl = '/hns/blast';

/**
 * Cree un nouveau tir au statut DRAFT.
 * Backend : POST /hns/blast/create  (RBAC : BLAST_PLAN)
 */
const createBlast = async (data: BlastCreateDTO): Promise<number> => {
    return axiosInstance
        .post(`${baseUrl}/create`, data, writeHeaders())
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Met a jour un tir existant. Sur statut CONFIRMED ou ulterieur, seul un
 * BLAST_ADMIN peut modifier, avec param adminOverride=true et raison tracee.
 * Backend : PUT /hns/blast/update/{id}  (RBAC : BLAST_PLAN ou BLAST_ADMIN)
 */
const updateBlast = async (
    id: number | string,
    data: BlastUpdateDTO,
    adminOverride = false,
) => {
    const qs = adminOverride ? '?adminOverride=true' : '';
    return axiosInstance
        .put(`${baseUrl}/update/${id}${qs}`, data, writeHeaders())
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Confirme un tir DRAFT/PLANNED -> CONFIRMED. Lance la chaine de rappels en P3.
 * Backend : POST /hns/blast/confirm/{id}  (RBAC : BLAST_CONFIRM)
 */
const confirmBlast = async (id: number | string) => {
    return axiosInstance
        .post(`${baseUrl}/confirm/${id}`, null, writeHeaders())
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Annule un tir avec raison obligatoire. P5 : envoie un body JSON
 * {@code { reason }} (le backend accepte aussi l'ancien query param
 * {@code ?reason=...} pour retrocompatibilite).
 * Backend : POST /hns/blast/cancel/{id}  (RBAC : BLAST_PLAN ou BLAST_ADMIN)
 */
const cancelBlast = async (id: number | string, reason: string) => {
    return axiosInstance
        .post(`${baseUrl}/cancel/${id}`, { reason }, writeHeaders())
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Reporte un tir avec une nouvelle heure prevue et une raison. P5 : envoie un
 * body JSON {@code { newScheduledAt, reason }}.
 * Backend : POST /hns/blast/reschedule/{id}  (RBAC : BLAST_PLAN ou BLAST_ADMIN)
 */
const rescheduleBlast = async (
    id: number | string,
    newScheduledAt: string,
    reason: string,
) => {
    return axiosInstance
        .post(
            `${baseUrl}/reschedule/${id}`,
            { newScheduledAt, reason },
            writeHeaders(),
        )
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Declare un tir tire (CONFIRMED/IMMINENT -> FIRED).
 * Backend : POST /hns/blast/declare-fired/{id}  (RBAC : BLAST_CONFIRM)
 */
const declareFired = async (id: number | string) => {
    return axiosInstance
        .post(`${baseUrl}/declare-fired/${id}`, null, writeHeaders())
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Declare un tir rate (FIRED/IMMINENT -> MISFIRE). Perimetre maintenu, "site
 * degage" bloque tant que la situation n'est pas resolue par un BLAST_ADMIN.
 * P5 : envoie un body JSON {@code { reason }}.
 * Backend : POST /hns/blast/declare-misfire/{id}  (RBAC : BLAST_CONFIRM)
 */
const declareMisfire = async (id: number | string, reason: string) => {
    return axiosInstance
        .post(
            `${baseUrl}/declare-misfire/${id}`,
            { reason },
            writeHeaders(),
        )
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Resout un raté (MISFIRE -> peut transitionner vers ALL_CLEAR). P5 : envoie
 * un body JSON {@code { resolutionNotes }} ; les notes sont persistees dans
 * la colonne {@code misfire_resolution_notes} (V017) et tracees dans
 * {@code blast_status_event} (append-only).
 * Backend : POST /hns/blast/resolve-misfire/{id}  (RBAC : BLAST_ADMIN)
 */
const resolveMisfire = async (
    id: number | string,
    resolutionNotes?: string,
) => {
    return axiosInstance
        .post(
            `${baseUrl}/resolve-misfire/${id}`,
            { resolutionNotes: resolutionNotes ?? null },
            writeHeaders(),
        )
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Prononce le "site degage" : FIRED -> ALL_CLEAR (bloque si misfire non resolu).
 * Backend : POST /hns/blast/all-clear/{id}  (RBAC : BLAST_CONFIRM)
 */
const allClear = async (id: number | string) => {
    return axiosInstance
        .post(`${baseUrl}/all-clear/${id}`, null, writeHeaders())
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Recherche multi-criteres du registre des tirs.
 * Backend : POST /hns/blast/search  (RBAC : BLAST_VIEW)
 * Body : BlastSearchFiltersDTO (mineId obligatoire).
 */
const searchBlasts = async (filters: BlastSearchFilters): Promise<BlastListItemDTO[]> => {
    return axiosInstance
        .post(`${baseUrl}/search`, filters)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Recupere la vue detaillee d'un tir.
 * Backend : GET /hns/blast/detail/{id}  (RBAC : BLAST_VIEW)
 */
const getBlastDetail = async (id: number | string): Promise<BlastDetailDTO> => {
    return axiosInstance
        .get(`${baseUrl}/detail/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * P7 — Recupere l'agregat consolide du tableau de bord pour une mine donnee.
 * Backend : GET /hns/blast/dashboard/summary?mineId=X  (RBAC : BLAST_VIEW)
 */
const getBlastDashboardSummary = async (mineId: number): Promise<BlastDashboardDTO> => {
    return axiosInstance
        .get(`${baseUrl}/dashboard/summary`, { params: { mineId } })
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Helper de duplication client-side : prepare un BlastCreateDTO a partir d'un
 * BlastDetailDTO existant. La reference et l'id sont volontairement vides pour
 * que le backend regenere une reference fraiche au format BLT-YYYY-NNNN.
 */
const duplicateBlastPayload = (source: BlastDetailDTO): BlastCreateDTO => {
    return {
        reference: null,
        scheduledAt: source.scheduledAt,
        timezone: source.timezone ?? null,
        type: source.type,
        pit: source.pit ?? null,
        bench: source.bench ?? null,
        block: source.block ?? null,
        lat: source.lat ?? null,
        lng: source.lng ?? null,
        // V015 (P2.1) : on duplique aussi les 7 champs additionnels.
        accessConcerned: source.accessConcerned ?? null,
        assemblyPoints: source.assemblyPoints ?? null,
        team: source.team ?? null,
        ppvLimit: source.ppvLimit ?? null,
        sensitiveReceivers: source.sensitiveReceivers ?? null,
        attachmentsNote: source.attachmentsNote ?? null,
        notes: source.notes ?? null,
        exclusionRadiusM: source.exclusionRadiusM ?? null,
        blasterId: source.blasterId ?? null,
        hseLeadId: source.hseLeadId ?? null,
        alarmZoneScope: source.alarmZoneScope ?? null,
        mineId: source.mineId,
        plan: source.plan ? { ...source.plan, id: null } : null,
        guards: (source.guards ?? []).map((g) => ({
            employeeId: g.employeeId,
            position: g.position ?? null,
        })),
        recipients: (source.recipients ?? []).map((r) => ({
            employeeId: r.employeeId ?? null,
            externalEmail: r.externalEmail ?? null,
            preferredLanguage: r.preferredLanguage ?? 'FR',
        })),
    };
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXPORT — facade unique du service
// ─────────────────────────────────────────────────────────────────────────────

const BlastService = {
    // Reads
    searchBlasts,
    getBlastDetail,
    getBlastDashboardSummary,
    // Writes
    createBlast,
    updateBlast,
    confirmBlast,
    cancelBlast,
    rescheduleBlast,
    declareFired,
    declareMisfire,
    resolveMisfire,
    allClear,
    // Helpers
    duplicateBlastPayload,
};

export default BlastService;

export {
    searchBlasts,
    getBlastDetail,
    getBlastDashboardSummary,
    createBlast,
    updateBlast,
    confirmBlast,
    cancelBlast,
    rescheduleBlast,
    declareFired,
    declareMisfire,
    resolveMisfire,
    allClear,
    duplicateBlastPayload,
};
