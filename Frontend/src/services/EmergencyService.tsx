import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Client API du module Gestion des Urgences (LOT 48 Phase 1).
 *
 * Base path : `/hns/emergency/*`.
 *
 * NOTE Phase 1 : ne couvre que les endpoints Settings + Permissions, suffisants
 * pour la page « Paramètres » squelette livrée Phase 1. Les endpoints SOS,
 * Assembly Points, General Alert arriveront aux Phases 2-4.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type EmergencyPermissionKey = 'COORDINATOR' | 'RESPONDER' | 'ALERT_LAUNCHER';

export interface EmergencySettingsDTO {
    id?: number;
    companyId: number;
    autoDispatchSeconds?: number;
    drillModeEnabled?: boolean;
    headCountMethod?: 'GPS' | 'QR' | 'NFC' | 'MANUAL';
    geolocationRequired?: boolean;
    auditRetentionYears?: number;
    smsProvider?: string | null;
    smsSenderId?: string | null;
    voiceProvider?: string | null;
    voiceLocale?: string;
    voiceVoiceName?: string;
}

export interface EmergencyPermissionDTO {
    id?: number;
    userId: number;
    permission: EmergencyPermissionKey;
    grantedBy?: number | null;
    grantedAt?: string;
    revokedAt?: string | null;
    revokedBy?: number | null;
    companyId?: number | null;
    active?: boolean;
}

// ── Settings ───────────────────────────────────────────────────────────────

export const getEmergencySettings = (companyId: number): Promise<EmergencySettingsDTO> =>
    axiosInstance.get(`/hns/emergency/settings/${companyId}`).then((res) => res.data);

export const updateEmergencySettings = (
    dto: EmergencySettingsDTO,
    actorId?: number
): Promise<EmergencySettingsDTO> =>
    axiosInstance
        .put(`/hns/emergency/settings`, dto, { params: actorId !== undefined ? { actorId } : {} })
        .then((res) => res.data);

// ── Permissions RBAC ───────────────────────────────────────────────────────

export const listEmergencyPermissionsForUser = (
    userId: number,
    companyId?: number
): Promise<EmergencyPermissionDTO[]> =>
    axiosInstance
        .get(`/hns/emergency/permissions/user/${userId}`, {
            params: companyId !== undefined ? { companyId } : {},
        })
        .then((res) => res.data);

export const listEmergencyPermissionHolders = (
    permission: EmergencyPermissionKey,
    companyId: number
): Promise<EmergencyPermissionDTO[]> =>
    axiosInstance
        .get(`/hns/emergency/permissions/holders`, { params: { permission, companyId } })
        .then((res) => res.data);

export const grantEmergencyPermission = (
    dto: EmergencyPermissionDTO,
    grantedBy: number
): Promise<EmergencyPermissionDTO> =>
    axiosInstance
        .post(`/hns/emergency/permissions/grant`, dto, { params: { grantedBy } })
        .then((res) => res.data);

export const revokeEmergencyPermission = (
    permissionId: number,
    revokedBy: number
): Promise<EmergencyPermissionDTO> =>
    axiosInstance
        .delete(`/hns/emergency/permissions/${permissionId}`, { params: { revokedBy } })
        .then((res) => res.data);

// ── Rescue Teams / Members / Shifts (Phase 1.c) ───────────────────────────

export type RescueShiftType = 'DAY' | 'NIGHT' | 'CUSTOM';

export interface RescueTeamDTO {
    id?: number;
    name: string;
    description?: string;
    companyId: number;
    status?: string;
    memberCount?: number;
    shiftCount?: number;
}

export interface RescueTeamMemberDTO {
    id?: number;
    teamId: number;
    employeeId: number;
    role?: string | null;
    isTeamLeader?: boolean;
}

export interface RescueShiftDTO {
    id?: number;
    teamId: number;
    shiftType: RescueShiftType;
    startTime: string; // 'HH:mm' or 'HH:mm:ss'
    endTime: string;
    daysOfWeek?: string;
    validFrom?: string; // 'YYYY-MM-DD'
    validTo?: string | null;
    status?: string;
}

export const listRescueTeams = (companyId: number): Promise<RescueTeamDTO[]> =>
    axiosInstance.get('/hns/emergency/teams', { params: { companyId } }).then((r) => r.data);

export const createRescueTeam = (dto: RescueTeamDTO, actorId?: number): Promise<RescueTeamDTO> =>
    axiosInstance
        .post('/hns/emergency/teams', dto, { params: actorId !== undefined ? { actorId } : {} })
        .then((r) => r.data);

export const updateRescueTeam = (
    id: number,
    dto: RescueTeamDTO,
    actorId?: number
): Promise<RescueTeamDTO> =>
    axiosInstance
        .put(`/hns/emergency/teams/${id}`, dto, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

export const deleteRescueTeam = (id: number, actorId?: number): Promise<void> =>
    axiosInstance
        .delete(`/hns/emergency/teams/${id}`, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then(() => undefined);

export const listRescueTeamMembers = (teamId: number): Promise<RescueTeamMemberDTO[]> =>
    axiosInstance.get(`/hns/emergency/teams/${teamId}/members`).then((r) => r.data);

export const addRescueTeamMember = (
    dto: RescueTeamMemberDTO,
    actorId?: number
): Promise<RescueTeamMemberDTO> =>
    axiosInstance
        .post('/hns/emergency/teams/members', dto, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

export const removeRescueTeamMember = (memberId: number, actorId?: number): Promise<void> =>
    axiosInstance
        .delete(`/hns/emergency/teams/members/${memberId}`, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then(() => undefined);

export const listRescueShifts = (teamId: number): Promise<RescueShiftDTO[]> =>
    axiosInstance.get(`/hns/emergency/teams/${teamId}/shifts`).then((r) => r.data);

export const createRescueShift = (
    dto: RescueShiftDTO,
    actorId?: number
): Promise<RescueShiftDTO> =>
    axiosInstance
        .post('/hns/emergency/teams/shifts', dto, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

export const deleteRescueShift = (shiftId: number, actorId?: number): Promise<void> =>
    axiosInstance
        .delete(`/hns/emergency/teams/shifts/${shiftId}`, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then(() => undefined);

// ── Escalation Rules (Phase 1.d) ──────────────────────────────────────────

export interface EscalationRuleDTO {
    id?: number;
    companyId: number;
    name: string;
    description?: string;
    stepOrder: number;
    targetUserId?: number | null;
    targetPermission?: EmergencyPermissionKey | null;
    delaySeconds: number;
    status?: string;
}

export const listEscalationRules = (companyId: number): Promise<EscalationRuleDTO[]> =>
    axiosInstance.get('/hns/emergency/escalation', { params: { companyId } }).then((r) => r.data);

export const createEscalationRule = (
    dto: EscalationRuleDTO,
    actorId?: number
): Promise<EscalationRuleDTO> =>
    axiosInstance
        .post('/hns/emergency/escalation', dto, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

export const updateEscalationRule = (
    id: number,
    dto: EscalationRuleDTO,
    actorId?: number
): Promise<EscalationRuleDTO> =>
    axiosInstance
        .put(`/hns/emergency/escalation/${id}`, dto, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

export const deleteEscalationRule = (id: number, actorId?: number): Promise<void> =>
    axiosInstance
        .delete(`/hns/emergency/escalation/${id}`, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then(() => undefined);

// ── Emergency Media (Phase 1.e) ───────────────────────────────────────────

export type EmergencyMediaType = 'SIREN' | 'VOICE_MESSAGE';

export interface EmergencyMediaDTO {
    id?: number;
    companyId: number;
    mediaType: EmergencyMediaType;
    locale: string;
    label: string;
    filePath?: string | null;
    ttsText?: string | null;
    isDefault?: boolean;
    status?: string;
}

export const listEmergencyMedia = (companyId: number): Promise<EmergencyMediaDTO[]> =>
    axiosInstance.get('/hns/emergency/media', { params: { companyId } }).then((r) => r.data);

export const createEmergencyMedia = (
    dto: EmergencyMediaDTO,
    actorId?: number
): Promise<EmergencyMediaDTO> =>
    axiosInstance
        .post('/hns/emergency/media', dto, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

export const deleteEmergencyMedia = (id: number, actorId?: number): Promise<void> =>
    axiosInstance
        .delete(`/hns/emergency/media/${id}`, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then(() => undefined);

// ── Rescue Weekly Planning (Phase 1.c.2) ──────────────────────────────────

export interface RescueWeeklyPlanningDTO {
    id?: number;
    companyId: number;
    weekStartDate: string; // 'YYYY-MM-DD' (lundi)
    dayTeamId?: number | null;
    dayTeamName?: string | null;
    nightTeamId?: number | null;
    nightTeamName?: string | null;
    dayStartHour?: string;     // 'HH:mm'
    dayEndHour?: string;
    nightStartHour?: string;
    nightEndHour?: string;
    notes?: string | null;
    status?: string;
}

export const listRescueWeeklyPlanning = (
    companyId: number,
    from?: string,
    to?: string
): Promise<RescueWeeklyPlanningDTO[]> =>
    axiosInstance
        .get('/hns/emergency/planning', { params: { companyId, from, to } })
        .then((r) => r.data);

export const getRescueWeeklyPlanning = (
    companyId: number,
    weekStartDate: string
): Promise<RescueWeeklyPlanningDTO | null> =>
    axiosInstance
        .get('/hns/emergency/planning/week', { params: { companyId, weekStartDate } })
        .then((r) => r.data)
        .catch((err) => (err?.response?.status === 404 ? null : Promise.reject(err)));

export const upsertRescueWeeklyPlanning = (
    dto: RescueWeeklyPlanningDTO,
    actorId?: number
): Promise<RescueWeeklyPlanningDTO> =>
    axiosInstance
        .put('/hns/emergency/planning', dto, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

export const deleteRescueWeeklyPlanning = (id: number, actorId?: number): Promise<void> =>
    axiosInstance
        .delete(`/hns/emergency/planning/${id}`, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then(() => undefined);

// ── Assembly Points (Phase 2) ─────────────────────────────────────────────

export interface AssemblyPointDTO {
    id?: number;
    name: string;
    description?: string | null;
    locationText?: string | null;
    latitude: number;
    longitude: number;
    managerId?: number | null;
    deputyManagerId?: number | null;
    cameraId?: number | null;
    evacuationPriority?: number;
    maxCapacity?: number | null;
    status?: string;
    companyId: number;
    departmentIdsCsv?: string | null;
}

export interface AssemblyPointHistoryDTO {
    id?: number;
    assemblyPointId: number;
    companyId: number;
    action: string;
    actorId?: number | null;
    snapshotJson?: string;
    diffSummary?: string;
    createdAt?: string;
}

export const listAssemblyPoints = (
    companyId: number,
    includeArchived = false
): Promise<AssemblyPointDTO[]> =>
    axiosInstance
        .get('/hns/emergency/assembly-points', { params: { companyId, includeArchived } })
        .then((r) => r.data);

export const getAssemblyPoint = (id: number): Promise<AssemblyPointDTO> =>
    axiosInstance.get(`/hns/emergency/assembly-points/${id}`).then((r) => r.data);

export const getAssemblyPointHistory = (id: number): Promise<AssemblyPointHistoryDTO[]> =>
    axiosInstance.get(`/hns/emergency/assembly-points/${id}/history`).then((r) => r.data);

export const createAssemblyPoint = (
    dto: AssemblyPointDTO,
    actorId?: number
): Promise<AssemblyPointDTO> =>
    axiosInstance
        .post('/hns/emergency/assembly-points', dto, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

export const updateAssemblyPoint = (
    id: number,
    dto: AssemblyPointDTO,
    actorId?: number
): Promise<AssemblyPointDTO> =>
    axiosInstance
        .put(`/hns/emergency/assembly-points/${id}`, dto, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

export const archiveAssemblyPoint = (id: number, actorId?: number): Promise<void> =>
    axiosInstance
        .delete(`/hns/emergency/assembly-points/${id}`, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then(() => undefined);
