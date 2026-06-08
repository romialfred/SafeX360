/**
 * BlastEvacuationReportService — Rapport d'evacuation post-tir (Phase 6).
 *
 * Service axios pour le rapport d'evacuation cloturant un tir confirme :
 * lecture, ajout d'incidents (avant signature), signature, telechargement PDF.
 *
 * Endpoints backend (cf. BlastEvacuationReportController.java) :
 *   GET  /hns/blast/evacuation-report/by-blast/{blastId}         (BLAST_VIEW)
 *   GET  /hns/blast/evacuation-report/{reportId}                 (BLAST_VIEW)
 *   GET  /hns/blast/evacuation-report/search?mineId=...          (BLAST_VIEW)
 *   POST /hns/blast/evacuation-report/sign/{reportId}            (BLAST_REPORT)
 *   POST /hns/blast/evacuation-report/add-incident/{reportId}    (BLAST_REPORT)
 *   GET  /hns/blast/evacuation-report/pdf/{reportId}?lang=fr|en  (BLAST_VIEW)
 *
 * RBAC :
 *   - Lecture / PDF : tout role disposant de BLAST_VIEW
 *   - Mutations (sign / add-incident) : BLAST_REPORT (typiquement HSE_OFFICER)
 *
 * Append-only apres signature :
 *   Le backend rejette toute mutation des champs incidents / mustered_count /
 *   missing_count des que signedAt est renseigne (defense applicative +
 *   trigger SQL trg_blast_evac_report_no_update_after_sign).
 */

import axiosInstance from '../interceptors/AxiosInterceptor';
import { resolveUserId } from './BlastService';

// ─────────────────────────────────────────────────────────────────────────────
//  Types DTO (alignes 1:1 sur BlastEvacuationReportDTO.java)
// ─────────────────────────────────────────────────────────────────────────────

/** DTO du rapport d'evacuation. */
export interface BlastEvacuationReportDTO {
    id: number;
    blastId: number;
    blastReference?: string | null;
    blastScheduledAt?: string | null;
    blastTimezone?: string | null;
    alarmZoneScope?: string | null;
    assemblyPoints?: string | null;
    alarmTriggeredAt?: string | null;
    musteredCount?: number | null;
    missingCount?: number | null;
    evacDurationSeconds?: number | null;
    firedAt?: string | null;
    allClearAt?: string | null;
    incidents?: string | null;
    signedOffBy?: number | null;
    signedAt?: string | null;
    /** Derive backend : true des que signedAt != null. */
    signed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const baseUrl = '/hns/blast/evacuation-report';

const writeHeaders = () => {
    const userId = resolveUserId();
    if (userId == null) return {};
    return { headers: { 'X-User-Id': String(userId) } };
};

// ─────────────────────────────────────────────────────────────────────────────
//  Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recupere le rapport d'evacuation associe a un tir. Retourne null si aucun
 * rapport n'a encore ete cree (cas tir non ALL_CLEAR).
 */
const getByBlastId = async (
    blastId: number | string,
): Promise<BlastEvacuationReportDTO | null> => {
    try {
        const response = await axiosInstance.get(`${baseUrl}/by-blast/${blastId}`);
        return response.data;
    } catch (error: any) {
        if (error?.response?.status === 404) return null;
        throw error;
    }
};

/** Recupere un rapport par son id (404 mappe en null). */
const getById = async (
    reportId: number | string,
): Promise<BlastEvacuationReportDTO | null> => {
    try {
        const response = await axiosInstance.get(`${baseUrl}/${reportId}`);
        return response.data;
    } catch (error: any) {
        if (error?.response?.status === 404) return null;
        throw error;
    }
};

/** Liste les rapports d'une mine, ALL_CLEAR le plus recent en premier. */
const search = async (mineId: number): Promise<BlastEvacuationReportDTO[]> => {
    const response = await axiosInstance.get(`${baseUrl}/search`, {
        params: { mineId },
    });
    return response.data;
};

/**
 * Ajoute un incident au rapport. Refuse si le rapport est deja signe
 * (HTTP 409 cote backend).
 */
const addIncident = async (
    reportId: number | string,
    description: string,
): Promise<BlastEvacuationReportDTO> => {
    const response = await axiosInstance.post(
        `${baseUrl}/add-incident/${reportId}`,
        { description },
        writeHeaders(),
    );
    return response.data;
};

/**
 * Signe le rapport. Apres signature, les incidents et le head-count sont
 * verrouilles (defense applicative + trigger BDD).
 *
 * @param signatureDataBase64 Empreinte canvas optionnelle (data URL PNG).
 */
const sign = async (
    reportId: number | string,
    signatureDataBase64?: string | null,
): Promise<BlastEvacuationReportDTO> => {
    const response = await axiosInstance.post(
        `${baseUrl}/sign/${reportId}`,
        { signatureDataBase64: signatureDataBase64 ?? null },
        writeHeaders(),
    );
    return response.data;
};

/**
 * Telecharge le PDF du rapport (Blob ; magic bytes "%PDF" garantis).
 *
 * @param lang Optionnel : 'fr' (defaut) ou 'en' pour la version anglaise.
 */
const downloadPdf = async (
    reportId: number | string,
    lang: 'fr' | 'en' = 'fr',
): Promise<Blob> => {
    const response = await axiosInstance.get(`${baseUrl}/pdf/${reportId}`, {
        params: { lang },
        responseType: 'blob',
    });
    return response.data as Blob;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Facade
// ─────────────────────────────────────────────────────────────────────────────

const BlastEvacuationReportService = {
    getByBlastId,
    getById,
    search,
    addIncident,
    sign,
    downloadPdf,
};

export default BlastEvacuationReportService;

export {
    getByBlastId,
    getById,
    search,
    addIncident,
    sign,
    downloadPdf,
};
