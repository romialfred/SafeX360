/**
 * UserManagementService — Service appelé par le module Gestion des utilisateurs.
 *
 * Endpoints couverts (via gateway /hrms/admin/users et /hrms/me) :
 *  - createUser()          : POST /hrms/admin/users/create
 *  - resetUserPassword()   : POST /hrms/admin/users/reset-password/{id}
 *  - toggleUserStatus()    : PUT  /hrms/admin/users/toggle-status/{id}
 *  - getMyProfile()        : GET  /hrms/me/profile
 *  - changePasswordFirst() : POST /hrms/me/change-password-first
 *  - updateUserModules()   : POST /hns/users/permissions/update-modules/{accountId}
 *  - getModulesByAccount() : GET  /hns/users/permissions/by-account/{accountId}
 */

import axiosInstance from '../interceptors/AxiosInterceptor';

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────

export interface CreateUserRequest {
    login: string;
    email: string;
    name: string;
    phoneNumber?: string;
    role: string;
    allowedModules?: string; // CSV moduleIds
    /** Mine principale / par défaut (mine active par défaut). OBLIGATOIRE côté backend. */
    companyId?: number;
    departmentId?: number;
    /** Multi-mines — ids des mines assignées (périmètre autorisé). Ignoré si allMinesAccess=true. */
    assignedCompanyIds?: number[];
    /** Multi-mines — true = accès à TOUTES les mines (vue consolidée). */
    allMinesAccess?: boolean;
    /** LOT 52 — LOCAL (MDP temporaire SafeX) ou ACTIVE_DIRECTORY (identifiants AD). */
    identitySource?: 'LOCAL' | 'ACTIVE_DIRECTORY';
}

export interface CreateUserResponse {
    accountId: number;
    login: string;
    email: string;
    temporaryPassword: string | null; // null si email envoyé OK
    emailSent: boolean;
    message: string;
}

export interface ResetPasswordResponse {
    accountId: number;
    temporaryPassword: string | null;
    emailSent: boolean;
    message: string;
}

export interface ToggleStatusResponse {
    accountId: number;
    status: 'ACTIVE' | 'INACTIVE';
    message: string;
}

export interface DeleteUserResponse {
    accountId: number;
    status: 'DELETED';
    message: string;
}

export interface MyProfile {
    accountId: number;
    login: string;
    name: string;
    email: string;
    role: string;
    status: string;
    firstLogin: boolean;
    companyId?: number;
    departmentId?: number;
    allowedModules: string; // CSV
}

export interface UpdateModulesRequest {
    allowedModules: string; // CSV moduleIds
    role?: string;
}

export interface AccountPermissionInfo {
    id?: number;
    accountId: number;
    role?: string;
    status?: string;
    allowedModules: string; // CSV
}

// ─────────────────────────────────────────────────────────────────────────
// ADMIN — Création / Reset / Toggle (réservé aux administrateurs)
// ─────────────────────────────────────────────────────────────────────────

const createUser = async (req: CreateUserRequest): Promise<CreateUserResponse> => {
    const res = await axiosInstance.post('/hrms/admin/users/create', req);
    return res.data;
};

const resetUserPassword = async (accountId: number): Promise<ResetPasswordResponse> => {
    const res = await axiosInstance.post(`/hrms/admin/users/reset-password/${accountId}`);
    return res.data;
};

const toggleUserStatus = async (accountId: number): Promise<ToggleStatusResponse> => {
    const res = await axiosInstance.put(`/hrms/admin/users/toggle-status/${accountId}`);
    return res.data;
};

/**
 * Supprime definitivement un compte utilisateur.
 * DELETE /hrms/admin/users/{id} (via gateway).
 * Erreurs HRMSException possibles : CANNOT_DELETE_SELF, ACCOUNT_PROTECTED, ACCOUNT_NOT_FOUND.
 */
const deleteUser = async (accountId: number): Promise<DeleteUserResponse> => {
    const res = await axiosInstance.delete(`/hrms/admin/users/${accountId}`);
    return res.data;
};

// ─────────────────────────────────────────────────────────────────────────
// SELF — profil + 1er changement de MDP
// ─────────────────────────────────────────────────────────────────────────

const getMyProfile = async (): Promise<MyProfile> => {
    const res = await axiosInstance.get('/hrms/me/profile');
    return res.data;
};

const changePasswordFirst = async (oldPassword: string, newPassword: string): Promise<{ message: string; firstLogin: boolean }> => {
    const res = await axiosInstance.post('/hrms/me/change-password-first', { oldPassword, newPassword });
    return res.data;
};

// ─────────────────────────────────────────────────────────────────────────
// HSE — gestion des modules autorises
// ─────────────────────────────────────────────────────────────────────────

const getModulesByAccount = async (accountId: number): Promise<AccountPermissionInfo> => {
    const res = await axiosInstance.get(`/hns/users/permissions/by-account/${accountId}`);
    return res.data;
};

const updateUserModules = async (accountId: number, req: UpdateModulesRequest): Promise<AccountPermissionInfo> => {
    const res = await axiosInstance.post(`/hns/users/permissions/update-modules/${accountId}`, req);
    return res.data;
};

// ─────────────────────────────────────────────────────────────────────────
// VALIDATION CLIENT — meme regex que serveur (OWASP ASVS V2.1)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Valide un mot de passe selon la politique OWASP (alignee backend AccountServiceImpl).
 * Retourne null si valide, sinon un message d'erreur en francais.
 */
export const validatePassword = (pwd: string): string | null => {
    if (!pwd || pwd.length === 0) return 'Le mot de passe est requis';
    if (pwd.length < 10) return 'Le mot de passe doit comporter au moins 10 caracteres';
    if (!/[A-Z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une majuscule';
    if (!/[a-z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une minuscule';
    if (!/[0-9]/.test(pwd)) return 'Le mot de passe doit contenir au moins un chiffre';
    if (!/[^A-Za-z0-9]/.test(pwd)) return 'Le mot de passe doit contenir au moins un caractere special';
    return null;
};

/**
 * Score de force du mot de passe (0..4) pour le PasswordStrength meter Mantine.
 * 0 = vide / 1 = tres faible / 2 = faible / 3 = correct / 4 = fort
 */
export const passwordStrengthScore = (pwd: string): number => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 10) score++;
    if (pwd.length >= 14) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(4, score);
};

export const validateLogin = (login: string): string | null => {
    if (!login || login.trim().length === 0) return 'Le login est requis';
    if (login.length < 3) return 'Le login doit comporter au moins 3 caracteres';
    if (login.length > 50) return 'Le login ne peut pas exceder 50 caracteres';
    if (!/^[A-Za-z0-9._-]+$/.test(login)) return 'Le login ne peut contenir que des lettres, chiffres, point, underscore ou tiret';
    return null;
};

export const validateEmail = (email: string): string | null => {
    if (!email || email.trim().length === 0) return "L'email est requis";
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) return "Format email invalide";
    return null;
};

export {
    createUser,
    resetUserPassword,
    toggleUserStatus,
    deleteUser,
    getMyProfile,
    changePasswordFirst,
    getModulesByAccount,
    updateUserModules,
};
