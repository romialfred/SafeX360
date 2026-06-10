/**
 * DirectoryService — Connecteur Active Directory / LDAP (LOT 52).
 *
 * Endpoints couverts (via gateway /hrms/directory) :
 *  - getDirectoryStatus() : GET /hrms/directory/status
 *  - searchDirectory(q)   : GET /hrms/directory/search?q=...
 *
 * L'annuaire peut être réel (LDAP/AD) ou en mode démo (demoMode=true) :
 * la réponse de recherche a exactement la même forme dans les deux cas.
 * Aucun secret ne transite par ces endpoints (politique backend).
 */

import axiosInstance from '../interceptors/AxiosInterceptor';

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────

export interface DirectoryStatus {
    /** Connecteur activé côté backend (sinon import AD refusé : DIRECTORY_DISABLED). */
    enabled: boolean;
    /** Annuaire de démonstration (14 profils réalistes) au lieu d'un vrai LDAP. */
    demoMode: boolean;
    /** Configuration suffisante pour interroger l'annuaire. */
    configured: boolean;
    /** Hôte LDAP configuré (vide en mode démo). */
    host: string;
}

export interface DirectoryUser {
    login: string;          // sAMAccountName
    email: string;
    displayName: string;
    department: string;
    title: string;          // intitulé de poste si disponible
    /** Un compte SafeX existe déjà pour ce login — non importable une 2e fois. */
    alreadyImported: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// APPELS
// ─────────────────────────────────────────────────────────────────────────

const getDirectoryStatus = async (): Promise<DirectoryStatus> => {
    const res = await axiosInstance.get('/hrms/directory/status');
    return res.data;
};

const searchDirectory = async (q: string): Promise<DirectoryUser[]> => {
    const res = await axiosInstance.get('/hrms/directory/search', { params: { q } });
    return Array.isArray(res.data) ? res.data : [];
};

export { getDirectoryStatus, searchDirectory };
