import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Fiche utilisateur : informations consolidées, traçabilité et second facteur.
 *
 * Toutes ces routes sont réservées aux administrateurs côté serveur — l'IHM ne
 * fait que présenter, elle ne garde rien.
 */

export interface UserOverview {
    id: number;
    login: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
    status?: string;
    identitySource?: string;
    firstLogin: boolean;
    startDate?: string;
    endDate?: string;
    company?: string | null;
    companyId?: number | null;
    position?: string | null;
    department?: string | null;
    employeeId?: number | null;
    allMinesAccess: boolean;
    assignedCompanies: { id: number; name: string }[];
    mfa: { required: boolean; exempt: boolean; enrolled: boolean; enrolledAt?: string | null };
    stats: {
        sessions: number;
        pages: number;
        actions: number;
        lastLoginAt?: string;
        lastLoginIp?: string;
        sessionOpen?: boolean;
    };
}

export interface UserSessionRow {
    id: number;
    startedAt: string;
    endedAt?: string | null;
    endReason?: string | null;
    lastSeenAt?: string | null;
    open: boolean;
    ipAddress?: string | null;
    userAgent?: string | null;
    mfaUsed: boolean;
    companyId?: number | null;
}

export interface UserActivityRow {
    id: number;
    occurredAt: string;
    kind: 'PAGE' | 'ACTION';
    actionType?: string | null;
    method?: string | null;
    path?: string | null;
    label?: string | null;
    statusCode?: number | null;
    sessionId?: number | null;
    source?: string | null;
    ipAddress?: string | null;
}

export interface Paged<T> {
    content: T[];
    total: number;
    page: number;
    size: number;
}

export interface ModuleCatalogCategory {
    category: string;
    modules: { key: string; mineManaged: boolean }[];
}

const getUserOverview = (id: number): Promise<UserOverview> =>
    axiosInstance.get(`/hrms/admin/users/${id}/overview`).then((r) => r.data);

const getUserSessions = (id: number, page = 0, size = 25): Promise<Paged<UserSessionRow>> =>
    axiosInstance.get(`/hrms/admin/users/${id}/sessions`, { params: { page, size } }).then((r) => r.data);

const getUserActivity = (
    id: number,
    kind?: 'PAGE' | 'ACTION',
    page = 0,
    size = 50,
): Promise<Paged<UserActivityRow>> =>
    axiosInstance
        .get(`/hrms/admin/users/${id}/activity`, { params: { kind, page, size } })
        .then((r) => r.data);

/** Retire la dispense : le second facteur redevient obligatoire pour ce compte. */
const enableUserMfa = (id: number) =>
    axiosInstance.post(`/hrms/admin/users/${id}/mfa/enable`).then((r) => r.data);

/** Pose la dispense et efface le secret existant. */
const disableUserMfa = (id: number) =>
    axiosInstance.post(`/hrms/admin/users/${id}/mfa/disable`).then((r) => r.data);

/** Réinitialise le second facteur : le compte devra s'enrôler à nouveau. */
const resetUserMfa = (id: number) =>
    axiosInstance.post(`/hrms/admin/users/${id}/mfa/reset`).then((r) => r.data);

/**
 * Catalogue des modules attribuables. L'IHM ne tient PAS sa propre liste : la
 * matrice de droits est construite depuis cette réponse, ce qui rend impossible
 * de proposer un module que le serveur ignore — ou d'en oublier un.
 */
const getModuleCatalog = (): Promise<ModuleCatalogCategory[]> =>
    axiosInstance.get('/hns/users/permissions/catalog').then((r) => r.data?.categories ?? []);

/** Droits actuels d'un compte (CSV de clés de modules). */
const getAccountModules = (accountId: number): Promise<string[]> =>
    axiosInstance.get(`/hns/users/permissions/by-account/${accountId}`).then((r) => {
        const csv = String(r.data?.allowedModules ?? '');
        return csv.split(',').map((s) => s.trim()).filter(Boolean);
    });

const updateAccountModules = (accountId: number, modules: string[], role?: string) =>
    axiosInstance
        .post(`/hns/users/permissions/update-modules/${accountId}`, {
            allowedModules: modules.join(','),
            role,
        })
        .then((r) => r.data);

export {
    getUserOverview,
    getUserSessions,
    getUserActivity,
    enableUserMfa,
    disableUserMfa,
    resetUserMfa,
    getModuleCatalog,
    getAccountModules,
    updateAccountModules,
};
