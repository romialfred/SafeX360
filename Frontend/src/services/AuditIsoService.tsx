import axiosInstance from "../interceptors/AxiosInterceptor";

/**
 * AuditIsoService — LOT 52 Module B : mise en conformité ISO 19011 du module
 * Gestion des Audits.
 *
 * Couvre les quatre contrôleurs backend dédiés (préfixe gateway /hns) :
 *   • /hns/audit-program    — programme d'audit annuel (§5) : CRUD, approbation,
 *                             priorisation par les risques (§5.4.2), KPI (§5.6)
 *   • /hns/audit-checklist  — checklists par référentiel ISO 45001/14001/9001
 *   • /hns/audit-iso        — validation d'équipe (§5.4.4/§7), réunions (§6.4),
 *                             escalade NC, vérification d'efficacité (§6.6)
 *   • /hns/audit-report/pdf — rapport d'audit PDF structuré (§6.5)
 *
 * Les types TS sont alignés sur les DTOs Java (dto/audit/*.java). Le companyId
 * est injecté automatiquement en query param par AxiosInterceptor.
 */

const programUrl = "/hns/audit-program";
const checklistUrl = "/hns/audit-checklist";
const isoUrl = "/hns/audit-iso";
const reportUrl = "/hns/audit-report";

// ─── Types alignés sur les DTOs Java ────────────────────────────────────────

/** AuditProgramDTO.java — programme d'audit annuel (ISO 19011 §5). */
export interface AuditProgramDTO {
    id?: number | null;
    year: number | null;
    title: string;
    objectives?: string | null;
    scope?: string | null;
    resources?: string | null;
    status?: 'PROPOSED' | 'APPROVED' | 'CLOSED' | null;
    approvedBy?: number | null;
    approvedAt?: string | null;
    companyId?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

/** RiskSuggestionDTO.java — priorisation basée risques d'un domaine (§5.4.2). */
export interface RiskSuggestionDTO {
    areaId: number;
    areaName: string;
    /** Non-conformités ouvertes prises en compte dans le score. */
    openNonConformities: number;
    /** Mois depuis le dernier audit clôturé couvrant ce domaine (24 si jamais audité). */
    monthsSinceLastClosedAudit: number;
    score: number;
    /** TRIMESTRIEL (score > 30), SEMESTRIEL (score > 15), sinon ANNUEL. */
    suggestedFrequency: string;
}

/** AuditProgramKpisDTO.java — indicateurs de pilotage du programme (§5.6). */
export interface AuditProgramKpisDTO {
    totalAudits: number;
    /** Audits clôturés (status CLOSED). */
    realises: number;
    /** Pourcentage de réalisation (0-100, une décimale). */
    tauxRealisation: number;
    /** Constats groupés par classification ISO (NON_CLASSE si absente). */
    constatsParClassification: Record<string, number>;
    /** Top 10 des clauses les plus citées dans les constats. */
    constatsParClause: Record<string, number>;
    /** Recommandations non terminées. */
    actionsOuvertes: number;
    /** Recommandations non terminées dont l'échéance est dépassée. */
    actionsEnRetard: number;
    /** Vérifications d'efficacité sans verdict. */
    verificationsEfficacitePendantes: number;
}

/** AuditChecklistTemplateDTO.java — question type d'une checklist. */
export interface AuditChecklistTemplateDTO {
    id: number;
    referential: string;
    clause: string;
    question: string;
    guidance?: string | null;
    orderIndex?: number | null;
    active?: boolean | null;
}

export type ChecklistResult = 'CONFORME' | 'NON_CONFORME' | 'NON_APPLICABLE' | 'A_EVALUER';

/** AuditChecklistItemDTO.java — ligne de checklist instanciée pour un audit. */
export interface AuditChecklistItemDTO {
    id: number;
    auditId?: number | null;
    templateId?: number | null;
    referential: string;
    clause: string;
    question: string;
    result: ChecklistResult;
    comment?: string | null;
    evidence?: string | null;
    observationId?: number | null;
    updatedAt?: string | null;
}

/** ValidateTeamRequest.java — validation d'équipe d'audit (§5.4.4 / §7). */
export interface ValidateTeamRequest {
    auditId?: number | null;
    auditorEmployeeIds: number[];
    leadEmployeeId?: number | null;
    auditedDepartmentIds?: number[] | null;
    /** Optionnel : restreint la recherche des auditeurs internes à une société. */
    companyId?: number | null;
}

/** ValidateTeamResponse.java — conforme ou violations (messages FR). */
export interface ValidateTeamResponse {
    valid: boolean;
    violations: string[];
}

/** MeetingDTO.java — réunion d'ouverture / de clôture (§6.4). */
export interface MeetingDTO {
    id?: number | null;
    date?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    agenda?: string | null;
    minutes?: string | null;
    auditId?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    /** OPENING / CLOSING / OTHER. */
    type?: 'OPENING' | 'CLOSING' | 'OTHER' | null;
    /** Participants JSON [{employeeId,name,present}]. */
    attendees?: string | null;
}

/** Réponse de POST /audit-iso/observations/{id}/escalate. */
export interface EscalationResult {
    nonConformityId: number;
    message: string;
}

/** EffectivenessCheckDTO.java — vérification d'efficacité (§6.6). */
export interface EffectivenessCheckDTO {
    id: number;
    recommendationId: number;
    /** Titre de la recommandation — rempli en lecture pour les listes. */
    recommendationTitle?: string | null;
    dueDate?: string | null;
    evaluatorEmployeeId?: number | null;
    /** null / EFFICACE / PARTIELLEMENT_EFFICACE / INEFFICACE. */
    verdict?: string | null;
    comment?: string | null;
    checkedAt?: string | null;
    createdAt?: string | null;
}

// ─── Programme d'audit annuel (ISO 19011 §5) ────────────────────────────────

/** Liste des programmes — companyId injecté par l'interceptor. */
const getAllAuditPrograms = async (): Promise<AuditProgramDTO[]> => {
    return axiosInstance.get(`${programUrl}/getAll`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAuditProgram = async (id: number): Promise<AuditProgramDTO> => {
    return axiosInstance.get(`${programUrl}/get/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/** Crée un programme (statut forcé PROPOSED côté backend). Retourne l'id. */
const createAuditProgram = async (program: AuditProgramDTO): Promise<number> => {
    return axiosInstance.post(`${programUrl}/create`, program)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updateAuditProgram = async (program: AuditProgramDTO) => {
    return axiosInstance.put(`${programUrl}/update`, program)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/** Approbation par la direction (PROPOSED → APPROVED). */
const approveAuditProgram = async (id: number, approvedBy?: number | null) => {
    return axiosInstance.put(`${programUrl}/approve/${id}`, null, {
        params: approvedBy != null ? { approvedBy } : {},
    })
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const deleteAuditProgram = async (id: number) => {
    return axiosInstance.delete(`${programUrl}/delete/${id}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/** Priorisation des domaines d'audit fondée sur les risques (§5.4.2). */
const getProgramRiskSuggestions = async (programId: number): Promise<RiskSuggestionDTO[]> => {
    return axiosInstance.get(`${programUrl}/${programId}/risk-suggestions`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/** Indicateurs de surveillance du programme (§5.6). */
const getProgramKpis = async (programId: number): Promise<AuditProgramKpisDTO> => {
    return axiosInstance.get(`${programUrl}/${programId}/kpis`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// ─── Checklists par référentiel ISO ─────────────────────────────────────────

/** Questions types actives, filtrées par référentiel si fourni. */
const getChecklistTemplates = async (referential?: string): Promise<AuditChecklistTemplateDTO[]> => {
    return axiosInstance.get(`${checklistUrl}/templates`, {
        params: referential ? { referential } : {},
    })
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Initialise la checklist d'un audit pour les référentiels demandés
 * (ex. ['ISO_45001','ISO_9001']). Idempotent par référentiel.
 */
const initAuditChecklist = async (auditId: number | string, referentials: string[]) => {
    return axiosInstance.post(`${checklistUrl}/${auditId}/init`, null, {
        params: { referentials: referentials.join(',') },
    })
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAuditChecklist = async (auditId: number | string): Promise<AuditChecklistItemDTO[]> => {
    return axiosInstance.get(`${checklistUrl}/${auditId}`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Met à jour une ligne de checklist (body partiel accepté). Un résultat
 * NON_CONFORME sans commentaire est rejeté (COMMENT_REQUIRED_FOR_NON_CONFORME).
 */
const updateChecklistItem = async (itemId: number, item: Partial<AuditChecklistItemDTO>) => {
    return axiosInstance.put(`${checklistUrl}/item/${itemId}`, item)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// ─── Équipe, réunions, escalade, efficacité (ISO 19011 transverse) ──────────

/** Validation d'équipe d'audit : lead qualifié + indépendance + certifications. */
const validateAuditTeam = async (request: ValidateTeamRequest): Promise<ValidateTeamResponse> => {
    return axiosInstance.post(`${isoUrl}/validate-team`, request)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/** Crée une réunion d'ouverture / clôture / autre. Retourne l'id. */
const createAuditMeeting = async (auditId: number | string, meeting: MeetingDTO): Promise<number> => {
    return axiosInstance.post(`${isoUrl}/${auditId}/meetings`, meeting)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getAuditMeetings = async (auditId: number | string): Promise<MeetingDTO[]> => {
    return axiosInstance.get(`${isoUrl}/${auditId}/meetings`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/**
 * Escalade un constat classé NC_* vers les Constats centraux (NonConformity).
 * Idempotent : renvoie l'id existant si déjà escaladé.
 */
const escalateObservation = async (observationId: number): Promise<EscalationResult> => {
    return axiosInstance.post(`${isoUrl}/observations/${observationId}/escalate`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/** Planifie une vérification d'efficacité sur une recommandation COMPLETED. */
const planEffectivenessCheck = async (
    recommendationId: number,
    payload: { dueDate: string; evaluatorEmployeeId: number | null },
): Promise<number> => {
    return axiosInstance.post(`${isoUrl}/recommendations/${recommendationId}/effectiveness`, payload)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/** Enregistre le verdict d'une vérification d'efficacité. */
const concludeEffectivenessCheck = async (
    checkId: number,
    payload: { verdict: string; comment?: string | null },
) => {
    return axiosInstance.put(`${isoUrl}/effectiveness/${checkId}`, payload)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/** Vérifications d'efficacité encore sans verdict (toutes recommandations). */
const getPendingEffectivenessChecks = async (): Promise<EffectivenessCheckDTO[]> => {
    return axiosInstance.get(`${isoUrl}/effectiveness/pending`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

/** Vérifications d'efficacité d'une recommandation donnée. */
const getEffectivenessChecksByRecommendation = async (
    recommendationId: number,
): Promise<EffectivenessCheckDTO[]> => {
    return axiosInstance.get(`${isoUrl}/recommendations/${recommendationId}/effectiveness`)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// ─── Rapport d'audit PDF (ISO 19011 §6.5) ───────────────────────────────────

/**
 * Télécharge le rapport d'audit PDF (flux binaire) et déclenche le download
 * navigateur — nom de fichier aligné sur le Content-Disposition backend.
 */
const downloadAuditReportPdf = async (auditId: number | string): Promise<void> => {
    const response = await axiosInstance.get(`${reportUrl}/pdf/${auditId}`, {
        responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `rapport-audit-${auditId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
};

// ─── Assistance IA audit (LOT 53 — optionnelle, l'IA propose, l'auditeur dispose) ───

const aiAuditUrl = "/hns/ai-audits";

export interface AiClassificationSuggestion {
    classification: string;
    clause: string;
    justification: string;
    demo: boolean;
}

export interface AiAuditReview {
    qualityScore: number;
    strengths: string[];
    gaps: string[];
    suggestions: string[];
    demo: boolean;
}

/** Suggère une classification ISO + clause à partir du fait observé. */
const suggestObservationClassification = async (payload: {
    title?: string;
    observedFact: string;
    referential?: string | null;
}): Promise<AiClassificationSuggestion> => {
    const response = await axiosInstance.post(`${aiAuditUrl}/observations/suggest-classification`, payload);
    return response.data;
};

/** Relecture IA du rapport d'audit (complétude ISO §6.5, cohérence, manques). */
const reviewAuditReportAi = async (auditId: number | string): Promise<AiAuditReview> => {
    const response = await axiosInstance.post(`${aiAuditUrl}/${auditId}/review-report`, {});
    return response.data;
};

export {
    // Programme d'audit annuel
    getAllAuditPrograms,
    getAuditProgram,
    createAuditProgram,
    updateAuditProgram,
    approveAuditProgram,
    deleteAuditProgram,
    getProgramRiskSuggestions,
    getProgramKpis,
    // Checklists ISO
    getChecklistTemplates,
    initAuditChecklist,
    getAuditChecklist,
    updateChecklistItem,
    // Équipe / réunions / escalade / efficacité
    validateAuditTeam,
    createAuditMeeting,
    getAuditMeetings,
    escalateObservation,
    planEffectivenessCheck,
    concludeEffectivenessCheck,
    getPendingEffectivenessChecks,
    getEffectivenessChecksByRecommendation,
    // Rapport PDF
    downloadAuditReportPdf,
    // Assistance IA (LOT 53)
    suggestObservationClassification,
    reviewAuditReportAi,
};
