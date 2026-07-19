/**
 * OverexposureCaseDetailPage — Phase 5 Frontend-C (LOT Dosimetrie & Expositions).
 *
 * Detail premium d'un dossier de depassement avec workflow OPEN -> INVESTIGATING ->
 * CLOSED, sections sous forme d'onglets et timeline d'audit en bas.
 *
 * Route : /dosimetry/overexposure/:caseId
 *
 * Sections (Tabs Mantine) :
 *   1. Informations generales : worker (lien fiche 360), niveau franchi,
 *      alerte d'origine, dates.
 *   2. Investigation : cause racine + actions correctives + decision medicale.
 *      Bouton "Ajouter investigation" (RBAC DOSIMETRY_WRITE).
 *   3. Decision medicale : visible uniquement si user a DOSIMETRY_MEDICAL.
 *   4. Declaration autorite : checkbox + date + numero declaration.
 *   5. Cloture : si user a DOSIMETRY_PCR_RPO :
 *      - Bouton "Cloturer le dossier"
 *      - Modal demande resolutionNote + authorityDeclaration confirmation
 *      - Confirm transition vers CLOSED
 *   6. Journal d'audit : timeline append-only de tous les evenements du dossier.
 *
 * Donnees :
 *   - getOverexposureCaseById(caseId) : detail du dossier
 *   - searchWorkers : resolution nom/matricule
 *   - getAllAuditLogs + filtre cote client sur entityType=OverexposureCase
 *
 * RBAC :
 *   - "Ajouter investigation" : DOSIMETRY_WRITE
 *   - Onglet "Decision medicale" : DOSIMETRY_MEDICAL
 *   - "Cloturer le dossier"     : DOSIMETRY_PCR_RPO
 *
 * Contraintes : tsc strict + vite EXIT 0.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Tabs,
    Modal,
    Textarea,
    Button,
    Group,
    Checkbox,
    TextInput,
    Tooltip,
    Badge,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconChevronRight,
    IconFolderOpen,
    IconUserCircle,
    IconClipboardList,
    IconStethoscope,
    IconShieldLock,
    IconClock,
    IconCircleCheck,
    IconPencilPlus,
    IconAlertOctagon,
    IconLockAccess,
    IconInfoCircle,
    IconHistory,
    IconCheck,
    IconCalendarTime,
    IconExternalLink,
    IconFlag,
    IconFileCertificate,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import { successNotification, errorNotification, extractErrorMessage } from '../../utility/NotificationUtility';
import {
    getOverexposureCaseById,
    investigateOverexposureCase,
    closeOverexposureCase,
    updateOverexposureCase,
    getAllAuditLogs,
    searchWorkers,
    downloadOverexposureReport,
    type OverexposureCaseDTO,
    type CaseStatus,
    type AlertLevel,
    type DosimetryAuditLogDTO,
} from '../../services/DosimetryService';
import PdfDownloadModal from './PdfDownloadModal';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC helper
// ─────────────────────────────────────────────────────────────────────────────

function hasDosimetryPermission(user: any, permission: string): boolean {
    if (!user) return false;
    if (['ADMINISTRATOR', 'SYSTEM_ADMINISTRATOR', 'ADMIN', 'SUPER_ADMIN'].includes(String(user.role ?? '').toUpperCase())) return true;
    const candidates: string[] = [];
    if (Array.isArray(user.permissions)) candidates.push(...user.permissions);
    if (Array.isArray(user.authorities)) {
        candidates.push(...user.authorities.map((a: any) => a?.authority ?? a));
    }
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (typeof user.role === 'string') candidates.push(user.role);
    return candidates.includes(permission);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Types & helpers
// ─────────────────────────────────────────────────────────────────────────────

interface WorkerLite {
    id: number;
    matricule: string;
    fullName: string;
    rpoId?: number | null;
    rpoName?: string | null;
}

const STATUS_BADGE: Record<CaseStatus, string> = {
    OPEN: 'bg-red-100 text-red-800 border border-red-200',
    INVESTIGATING: 'bg-amber-100 text-amber-800 border border-amber-200',
    CLOSED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
};

const LEVEL_BADGE: Record<AlertLevel, string> = {
    APPROACH: 'bg-blue-100 text-blue-900 border border-blue-200',
    INVESTIGATION: 'bg-yellow-100 text-yellow-900 border border-yellow-200',
    ACTION: 'bg-orange-100 text-orange-900 border border-orange-200',
    EXCEEDED: 'bg-red-100 text-red-900 border border-red-300',
};

const formatDateTime = (s?: string | null): string => {
    if (!s) return '—';
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return s;
    }
};

const formatDate = (s?: string | null): string => {
    if (!s) return '—';
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return s;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const OverexposureCaseDetailPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const params = useParams<{ caseId: string }>();
    const caseId = params.caseId;

    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const canWrite = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');
    const canMedical = hasDosimetryPermission(user, 'DOSIMETRY_MEDICAL');
    const canPcr = hasDosimetryPermission(user, 'DOSIMETRY_PCR_RPO');

    const mineId: number = selectedMineId ?? user?.mineId ?? user?.companyId ?? 1;

    const [caseDto, setCaseDto] = useState<OverexposureCaseDTO | null>(null);
    const [worker, setWorker] = useState<WorkerLite | null>(null);
    const [auditLogs, setAuditLogs] = useState<DosimetryAuditLogDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<string | null>('general');

    // Modal investigation
    const [investigationModal, setInvestigationModal] = useState(false);
    const [invCause, setInvCause] = useState('');
    const [invCorrective, setInvCorrective] = useState('');
    const [invMedical, setInvMedical] = useState('');
    const [invSubmitting, setInvSubmitting] = useState(false);

    // Modal cloture
    const [closeModal, setCloseModal] = useState(false);
    const [closureNote, setClosureNote] = useState('');
    const [closureAuthority, setClosureAuthority] = useState(false);
    const [closeSubmitting, setCloseSubmitting] = useState(false);

    // Authority declaration inline edit
    const [authDeclared, setAuthDeclared] = useState(false);

    // Phase 9-B : modal download rapport surexposition (PDF).
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [authDate, setAuthDate] = useState<string>('');
    const [authNumber, setAuthNumber] = useState('');
    const [authSavingState, setAuthSavingState] = useState(false);

    const fetchAll = useCallback(async () => {
        if (!caseId) return;
        setLoading(true);
        setLoadError(null);
        try {
            const [caseResult, workersResult, auditResult] = await Promise.allSettled([
                getOverexposureCaseById(caseId),
                searchWorkers({ mineId }),
                getAllAuditLogs(),
            ]);

            if (caseResult.status === 'fulfilled' && caseResult.value) {
                const dto = caseResult.value;
                setCaseDto(dto);
                setInvCause(dto.cause ?? '');
                setInvCorrective(dto.correctiveActions ?? '');
                setInvMedical(dto.medicalDecision ?? '');
                setAuthDeclared(Boolean(dto.authorityDeclaration));
                setAuthDate(dto.authorityDeclarationDate ?? '');
                // authNumber est conserve dans cause/notes faute de champ dedie cote backend
                setAuthNumber('');
            } else {
                setLoadError(t('overexposureCases.detail.loadError'));
            }

            if (workersResult.status === 'fulfilled') {
                const list: any = workersResult.value;
                const arr: any[] = Array.isArray(list) ? list : (list?.content ?? []);
                const target = caseResult.status === 'fulfilled' ? caseResult.value.workerId : null;
                const found = arr.find((w: any) => Number(w.id ?? w.workerId ?? 0) === Number(target));
                if (found) {
                    setWorker({
                        id: Number(found.id ?? found.workerId ?? 0),
                        matricule: String(found.matricule ?? `#${found.employeeId ?? ''}`),
                        fullName: String(found.fullName ?? `Employee #${found.employeeId ?? ''}`),
                        rpoId: found.rpoId ?? null,
                        rpoName: found.rpoName ?? null,
                    });
                }
            }

            if (auditResult.status === 'fulfilled') {
                const arr: DosimetryAuditLogDTO[] = Array.isArray(auditResult.value)
                    ? auditResult.value
                    : [];
                const filtered = arr.filter(
                    (a) => a.entityType === 'OverexposureCase' && String(a.entityId) === String(caseId),
                );
                filtered.sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''));
                setAuditLogs(filtered);
            } else {
                setAuditLogs([]);
            }
        } finally {
            setLoading(false);
        }
    }, [caseId, mineId, t]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ───── Helpers calcules ─────
    const headerStatusClass = useMemo(() => {
        if (!caseDto) return STATUS_BADGE.OPEN;
        return STATUS_BADGE[caseDto.status] ?? STATUS_BADGE.OPEN;
    }, [caseDto]);

    const isClosed = caseDto?.status === 'CLOSED';

    // ───── Actions ─────
    const submitInvestigation = async () => {
        if (!caseDto?.id) return;
        if (!canWrite) {
            errorNotification(t('overexposureCases.detail.investigation.denied'));
            return;
        }
        setInvSubmitting(true);
        try {
            await investigateOverexposureCase(caseDto.id, {
                correctiveActions: invCorrective.trim() || null,
                medicalDecision: invMedical.trim() || null,
            });
            // La cause racine n'est pas couverte par /investigate cote backend.
            // Si elle a change, on bascule sur PUT /update pour la persister.
            if ((caseDto.cause ?? '') !== invCause.trim()) {
                await updateOverexposureCase({
                    ...caseDto,
                    cause: invCause.trim() || null,
                    status: caseDto.status === 'OPEN' ? 'INVESTIGATING' : caseDto.status,
                });
            }
            successNotification(t('overexposureCases.detail.investigation.success'));
            setInvestigationModal(false);
            await fetchAll();
        } catch (err) {
            errorNotification(extractErrorMessage(err, t('overexposureCases.detail.investigation.error')));
        } finally {
            setInvSubmitting(false);
        }
    };

    const submitClosure = async () => {
        if (!caseDto?.id) return;
        if (!canPcr) {
            errorNotification(t('overexposureCases.detail.closure.denied'));
            return;
        }
        if (closureNote.trim().length < 10) {
            errorNotification(t('overexposureCases.detail.closure.noteRequired'));
            return;
        }
        if (!closureAuthority) {
            errorNotification(t('overexposureCases.detail.closure.noteRequired'));
            return;
        }
        setCloseSubmitting(true);
        try {
            await closeOverexposureCase(caseDto.id, {
                authorityDeclaration: closureAuthority,
                closureNote: closureNote.trim(),
            });
            successNotification(t('overexposureCases.detail.closure.success'));
            setCloseModal(false);
            setClosureNote('');
            setClosureAuthority(false);
            await fetchAll();
        } catch (err) {
            errorNotification(extractErrorMessage(err, t('overexposureCases.detail.closure.error')));
        } finally {
            setCloseSubmitting(false);
        }
    };

    const submitAuthorityChange = async () => {
        if (!caseDto?.id) return;
        if (!canWrite) {
            errorNotification(t('overexposureCases.detail.investigation.denied'));
            return;
        }
        setAuthSavingState(true);
        try {
            await updateOverexposureCase({
                ...caseDto,
                authorityDeclaration: authDeclared,
                authorityDeclarationDate: authDate || null,
            });
            successNotification(t('overexposureCases.detail.investigation.success'));
            await fetchAll();
        } catch (err) {
            errorNotification(extractErrorMessage(err, t('overexposureCases.detail.investigation.error')));
        } finally {
            setAuthSavingState(false);
        }
    };

    // ───── Rendering ─────

    if (loading && !caseDto) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
                <div className="w-full">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center text-slate-500">
                        <span className="inline-block w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-2 align-middle" />
                        {t('overexposureCases.detail.loading')}
                    </div>
                </div>
            </div>
        );
    }

    if (!caseDto) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
                <div className="w-full">
                    <div className="bg-white border border-amber-200 rounded-xl shadow-sm p-8 text-center text-amber-700">
                        <IconAlertOctagon size={28} className="mx-auto mb-2" />
                        {loadError ?? t('overexposureCases.detail.notFound')}
                        <div className="mt-4">
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<IconArrowLeft size={13} />}
                                onClick={() => navigate('/dosimetry/overexposure')}
                            >
                                {t('overexposureCases.detail.back')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/settings')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('overexposureCases.breadcrumbRoot')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/overexposure')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('overexposureCases.breadcrumbCurrent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        #{caseDto.id}
                    </span>
                </div>

                {/* ─── Hero card ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className={`absolute top-0 left-0 right-0 h-1 ${
                                caseDto.status === 'OPEN'
                                    ? 'bg-gradient-to-r from-red-500 via-red-400 to-orange-500'
                                    : caseDto.status === 'INVESTIGATING'
                                    ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500'
                                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'
                            }`}
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                                type="button"
                                onClick={() => navigate('/dosimetry/overexposure')}
                                className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition flex-shrink-0"
                                aria-label={t('overexposureCases.detail.back')}
                            >
                                <IconArrowLeft size={16} stroke={1.8} className="text-slate-600" />
                            </button>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md shadow-red-200 flex-shrink-0">
                                <IconFolderOpen size={22} stroke={1.8} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-slate-900 leading-tight"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(20px, 2.2vw, 26px)',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {t('overexposureCases.detail.title', { id: caseDto.id })}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${headerStatusClass}`}
                                    >
                                        {t(`overexposureCases.status.${caseDto.status}`, {
                                            defaultValue: caseDto.status,
                                        })}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                            LEVEL_BADGE[caseDto.level] ?? ''
                                        }`}
                                    >
                                        {t(`alerts.level.${caseDto.level}`, { defaultValue: caseDto.level })}
                                    </span>
                                    {worker && (
                                        <Badge
                                            variant="light"
                                            color="indigo"
                                            radius="sm"
                                            size="sm"
                                            leftSection={<IconUserCircle size={11} />}
                                        >
                                            {worker.matricule} — {worker.fullName}
                                        </Badge>
                                    )}
                                    {caseDto.openedAt && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                            <IconCalendarTime size={12} />
                                            {formatDate(caseDto.openedAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ─── Phase 9-B : actions hero (download rapport) ─── */}
                        {canPcr && (
                            <div className="flex items-stretch gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setReportModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md bg-red-600 text-white hover:bg-red-700 transition self-start shadow-sm"
                                    title={t('overexposureCases.detail.actions.downloadReportHint')}
                                >
                                    <IconFileCertificate size={13} stroke={1.8} />
                                    {t('overexposureCases.detail.actions.downloadReport')}
                                </button>
                            </div>
                        )}
                    </div>

                    {isClosed && caseDto.closedAt && (
                        <div className="px-5 py-2 bg-emerald-50/60 border-t border-emerald-100 text-[12px] text-emerald-800 flex items-center gap-1.5">
                            <IconCircleCheck size={13} stroke={1.8} />
                            {t('overexposureCases.detail.closure.closedBanner', {
                                date: formatDate(caseDto.closedAt),
                            })}
                        </div>
                    )}
                </div>

                {/* ─── Tabs ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <Tabs
                        value={activeTab}
                        onChange={setActiveTab}
                        keepMounted={false}
                        color="indigo"
                    >
                        <Tabs.List className="border-b border-slate-100 bg-slate-50/50 px-2">
                            <Tabs.Tab
                                value="general"
                                leftSection={<IconClipboardList size={13} />}
                            >
                                {t('overexposureCases.detail.tabs.general')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="investigation"
                                leftSection={<IconPencilPlus size={13} />}
                            >
                                {t('overexposureCases.detail.tabs.investigation')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="medical"
                                leftSection={<IconStethoscope size={13} />}
                            >
                                {t('overexposureCases.detail.tabs.medical')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="authority"
                                leftSection={<IconFlag size={13} />}
                            >
                                {t('overexposureCases.detail.tabs.authority')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="closure"
                                leftSection={<IconShieldLock size={13} />}
                            >
                                {t('overexposureCases.detail.tabs.closure')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="audit"
                                leftSection={<IconHistory size={13} />}
                            >
                                {t('overexposureCases.detail.tabs.audit')}
                            </Tabs.Tab>
                        </Tabs.List>

                        {/* === Onglet : Informations generales === */}
                        <Tabs.Panel value="general" p="md">
                            <h2 className="text-[13px] font-semibold text-slate-800 mb-3">
                                {t('overexposureCases.detail.general.title')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                                <InfoRow
                                    label={t('overexposureCases.detail.general.worker')}
                                    value={
                                        worker ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(`/dosimetry/workers/detail/${worker.id}`)
                                                }
                                                className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 hover:underline underline-offset-2 transition"
                                            >
                                                <IconUserCircle size={13} stroke={1.8} />
                                                <span className="font-mono text-[11.5px]">
                                                    {worker.matricule}
                                                </span>
                                                <span>{worker.fullName}</span>
                                                <IconExternalLink size={11} />
                                            </button>
                                        ) : (
                                            `#${caseDto.workerId}`
                                        )
                                    }
                                />
                                <InfoRow
                                    label={t('overexposureCases.detail.general.level')}
                                    value={
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                LEVEL_BADGE[caseDto.level] ?? ''
                                            }`}
                                        >
                                            {t(`alerts.level.${caseDto.level}`, {
                                                defaultValue: caseDto.level,
                                            })}
                                        </span>
                                    }
                                />
                                <InfoRow
                                    label={t('overexposureCases.detail.general.alertId')}
                                    value={
                                        caseDto.alertId != null ? (
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/dosimetry/alerts`)}
                                                className="inline-flex items-center gap-1 text-indigo-700 hover:underline underline-offset-2"
                                            >
                                                #{caseDto.alertId}
                                                <IconExternalLink size={11} />
                                            </button>
                                        ) : (
                                            <span className="text-slate-500 italic">
                                                {t('overexposureCases.detail.general.noAlert')}
                                            </span>
                                        )
                                    }
                                />
                                <InfoRow
                                    label={t('overexposureCases.detail.general.openedAt')}
                                    value={formatDateTime(caseDto.openedAt)}
                                />
                                <InfoRow
                                    label={t('overexposureCases.detail.general.closedAt')}
                                    value={
                                        caseDto.closedAt ? formatDateTime(caseDto.closedAt) : '—'
                                    }
                                />
                                <InfoRow
                                    label={t('overexposureCases.detail.general.createdBy')}
                                    value={caseDto.createdBy ? `#${caseDto.createdBy}` : '—'}
                                />
                                <InfoRow
                                    label={t('overexposureCases.detail.general.updatedBy')}
                                    value={caseDto.updatedBy ? `#${caseDto.updatedBy}` : '—'}
                                />
                            </div>
                        </Tabs.Panel>

                        {/* === Onglet : Investigation === */}
                        <Tabs.Panel value="investigation" p="md">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <h2 className="text-[13px] font-semibold text-slate-800">
                                        {t('overexposureCases.detail.investigation.title')}
                                    </h2>
                                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                                        {t('overexposureCases.detail.investigation.subtitle')}
                                    </p>
                                </div>
                                {!isClosed && (
                                    <Tooltip
                                        label={canWrite ? '' : t('overexposureCases.detail.investigation.denied')}
                                        disabled={canWrite}
                                        withArrow
                                    >
                                        <Button
                                            size="xs"
                                            color="indigo"
                                            leftSection={<IconPencilPlus size={13} />}
                                            disabled={!canWrite}
                                            onClick={() => {
                                                setInvCause(caseDto.cause ?? '');
                                                setInvCorrective(caseDto.correctiveActions ?? '');
                                                setInvMedical(caseDto.medicalDecision ?? '');
                                                setInvestigationModal(true);
                                            }}
                                        >
                                            {t('overexposureCases.detail.investigation.addBtn')}
                                        </Button>
                                    </Tooltip>
                                )}
                            </div>

                            <div className="space-y-4">
                                <BlockText
                                    label={t('overexposureCases.detail.investigation.cause')}
                                    value={caseDto.cause}
                                    empty={t('overexposureCases.detail.investigation.causeEmpty')}
                                />
                                <BlockText
                                    label={t('overexposureCases.detail.investigation.corrective')}
                                    value={caseDto.correctiveActions}
                                    empty={t('overexposureCases.detail.investigation.correctiveEmpty')}
                                />
                                <BlockText
                                    label={t('overexposureCases.detail.investigation.medical')}
                                    value={caseDto.medicalDecision}
                                    empty={t('overexposureCases.detail.investigation.medicalEmpty')}
                                />
                            </div>
                        </Tabs.Panel>

                        {/* === Onglet : Decision medicale === */}
                        <Tabs.Panel value="medical" p="md">
                            <h2 className="text-[13px] font-semibold text-slate-800 mb-1">
                                {t('overexposureCases.detail.medicalSection.title')}
                            </h2>
                            <p className="text-[11.5px] text-slate-500 mb-3">
                                {t('overexposureCases.detail.medicalSection.subtitle')}
                            </p>

                            {!canMedical ? (
                                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[12.5px]">
                                    <IconLockAccess size={16} stroke={1.8} className="mt-0.5 flex-shrink-0 text-slate-500" />
                                    <span>{t('overexposureCases.detail.medicalSection.denied')}</span>
                                </div>
                            ) : caseDto.medicalDecision ? (
                                <BlockText
                                    label={t('overexposureCases.detail.investigation.medical')}
                                    value={caseDto.medicalDecision}
                                    empty={t('overexposureCases.detail.medicalSection.empty')}
                                />
                            ) : (
                                <div className="text-[12.5px] text-slate-500 italic px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                                    {t('overexposureCases.detail.medicalSection.empty')}
                                </div>
                            )}
                        </Tabs.Panel>

                        {/* === Onglet : Declaration autorite === */}
                        <Tabs.Panel value="authority" p="md">
                            <h2 className="text-[13px] font-semibold text-slate-800 mb-1">
                                {t('overexposureCases.detail.authority.title')}
                            </h2>
                            <p className="text-[11.5px] text-slate-500 mb-4">
                                {t('overexposureCases.detail.authority.subtitle')}
                            </p>

                            <div className="space-y-3 max-w-2xl">
                                <Checkbox
                                    label={t('overexposureCases.detail.authority.checkboxLabel')}
                                    checked={authDeclared}
                                    onChange={(e) => setAuthDeclared(e.currentTarget.checked)}
                                    disabled={isClosed || !canWrite}
                                />
                                <TextInput
                                    size="xs"
                                    label={t('overexposureCases.detail.authority.declarationDate')}
                                    type="date"
                                    value={authDate ? authDate.slice(0, 10) : ''}
                                    onChange={(e) => setAuthDate(e.currentTarget.value)}
                                    disabled={isClosed || !canWrite || !authDeclared}
                                />
                                <TextInput
                                    size="xs"
                                    label={t('overexposureCases.detail.authority.declarationNumber')}
                                    placeholder={t('overexposureCases.detail.authority.declarationNumberPlaceholder')}
                                    value={authNumber}
                                    onChange={(e) => setAuthNumber(e.currentTarget.value)}
                                    disabled={isClosed || !canWrite || !authDeclared}
                                />
                                {!isClosed && canWrite && (
                                    <div className="pt-2">
                                        <Button
                                            size="xs"
                                            color="indigo"
                                            loading={authSavingState}
                                            leftSection={<IconCheck size={13} />}
                                            onClick={submitAuthorityChange}
                                        >
                                            {t('overexposureCases.detail.investigation.submit')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Tabs.Panel>

                        {/* === Onglet : Cloture === */}
                        <Tabs.Panel value="closure" p="md">
                            <h2 className="text-[13px] font-semibold text-slate-800 mb-1">
                                {t('overexposureCases.detail.closure.title')}
                            </h2>
                            <p className="text-[11.5px] text-slate-500 mb-3">
                                {t('overexposureCases.detail.closure.subtitle')}
                            </p>

                            {isClosed ? (
                                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12.5px]">
                                    <IconCircleCheck size={16} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                                    <span>
                                        {t('overexposureCases.detail.closure.closedBanner', {
                                            date: formatDate(caseDto.closedAt),
                                        })}
                                    </span>
                                </div>
                            ) : (
                                <div>
                                    <Tooltip
                                        label={canPcr ? '' : t('overexposureCases.detail.closure.denied')}
                                        disabled={canPcr}
                                        withArrow
                                    >
                                        <Button
                                            size="sm"
                                            color="red"
                                            leftSection={<IconShieldLock size={14} />}
                                            disabled={!canPcr}
                                            onClick={() => setCloseModal(true)}
                                        >
                                            {t('overexposureCases.detail.closure.closeBtn')}
                                        </Button>
                                    </Tooltip>
                                </div>
                            )}
                        </Tabs.Panel>

                        {/* === Onglet : Journal d'audit === */}
                        <Tabs.Panel value="audit" p="md">
                            <h2 className="text-[13px] font-semibold text-slate-800 mb-1">
                                {t('overexposureCases.detail.audit.title')}
                            </h2>
                            <p className="text-[11.5px] text-slate-500 mb-3">
                                {t('overexposureCases.detail.audit.subtitle')}
                            </p>

                            {auditLogs.length === 0 ? (
                                <div className="text-[12.5px] text-slate-500 italic px-4 py-6 bg-slate-50 rounded-lg border border-slate-200 text-center">
                                    {t('overexposureCases.detail.audit.empty')}
                                </div>
                            ) : (
                                <AuditTimeline logs={auditLogs} t={t} />
                            )}
                        </Tabs.Panel>
                    </Tabs>
                </div>
            </div>

            {/* ─── Modal investigation ─── */}
            <Modal
                opened={investigationModal}
                onClose={() => setInvestigationModal(false)}
                title={
                    <span
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '15px',
                        }}
                        className="text-slate-900"
                    >
                        {t('overexposureCases.detail.investigation.modalTitle')}
                    </span>
                }
                centered
                size="lg"
            >
                <div className="space-y-3">
                    <p className="text-[12px] text-slate-500">
                        {t('overexposureCases.detail.investigation.modalSubtitle')}
                    </p>
                    <Textarea
                        label={t('overexposureCases.detail.investigation.causeLabel')}
                        placeholder={t('overexposureCases.detail.investigation.causePlaceholder')}
                        value={invCause}
                        onChange={(e) => setInvCause(e.currentTarget.value)}
                        minRows={3}
                        autosize
                    />
                    <Textarea
                        label={t('overexposureCases.detail.investigation.correctiveLabel')}
                        placeholder={t('overexposureCases.detail.investigation.correctivePlaceholder')}
                        value={invCorrective}
                        onChange={(e) => setInvCorrective(e.currentTarget.value)}
                        minRows={3}
                        autosize
                    />
                    {canMedical && (
                        <Textarea
                            label={t('overexposureCases.detail.investigation.medicalLabel')}
                            placeholder={t('overexposureCases.detail.investigation.medicalPlaceholder')}
                            value={invMedical}
                            onChange={(e) => setInvMedical(e.currentTarget.value)}
                            minRows={3}
                            autosize
                        />
                    )}
                    <Group justify="flex-end" gap="sm" mt="md">
                        <Button
                            variant="default"
                            size="xs"
                            onClick={() => setInvestigationModal(false)}
                            disabled={invSubmitting}
                        >
                            {t('overexposureCases.detail.back')}
                        </Button>
                        <Button
                            size="xs"
                            color="indigo"
                            loading={invSubmitting}
                            onClick={submitInvestigation}
                            leftSection={<IconCheck size={13} />}
                        >
                            {t('overexposureCases.detail.investigation.submit')}
                        </Button>
                    </Group>
                </div>
            </Modal>

            {/* ─── Modal cloture ─── */}
            <Modal
                opened={closeModal}
                onClose={() => {
                    setCloseModal(false);
                    setClosureNote('');
                    setClosureAuthority(false);
                }}
                title={
                    <span
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '15px',
                        }}
                        className="text-slate-900 inline-flex items-center gap-2"
                    >
                        <IconShieldLock size={16} className="text-red-600" />
                        {t('overexposureCases.detail.closure.modalTitle', { id: caseDto.id })}
                    </span>
                }
                centered
                size="md"
            >
                <div className="space-y-3">
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-800 text-[12px]">
                        <IconInfoCircle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{t('overexposureCases.detail.closure.modalSubtitle')}</span>
                    </div>
                    <Textarea
                        label={t('overexposureCases.detail.closure.noteLabel')}
                        placeholder={t('overexposureCases.detail.closure.notePlaceholder')}
                        value={closureNote}
                        onChange={(e) => setClosureNote(e.currentTarget.value)}
                        minRows={4}
                        autosize
                        required
                        error={
                            closureNote.length > 0 && closureNote.trim().length < 10
                                ? t('overexposureCases.detail.closure.noteRequired')
                                : undefined
                        }
                    />
                    <Checkbox
                        label={t('overexposureCases.detail.closure.authorityConfirm')}
                        checked={closureAuthority}
                        onChange={(e) => setClosureAuthority(e.currentTarget.checked)}
                    />
                    <Group justify="flex-end" gap="sm" mt="md">
                        <Button
                            variant="default"
                            size="xs"
                            onClick={() => {
                                setCloseModal(false);
                                setClosureNote('');
                                setClosureAuthority(false);
                            }}
                            disabled={closeSubmitting}
                        >
                            {t('overexposureCases.detail.back')}
                        </Button>
                        <Button
                            size="xs"
                            color="red"
                            loading={closeSubmitting}
                            onClick={submitClosure}
                            disabled={closureNote.trim().length < 10 || !closureAuthority}
                            leftSection={<IconShieldLock size={13} />}
                        >
                            {t('overexposureCases.detail.closure.submit')}
                        </Button>
                    </Group>
                </div>
            </Modal>

            {/* ─── Phase 9-B : modal download rapport surexposition ─── */}
            <PdfDownloadModal
                opened={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                title={t('reports.cards.overexposure.modalTitle')}
                subtitle={t('reports.cards.overexposure.modalSubtitle')}
                filename={`surexposition_case${caseDto.id}.pdf`}
                onConfirm={(reasonStr) =>
                    downloadOverexposureReport(Number(caseDto.id), reasonStr)
                }
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-2 text-[12.5px] py-1 border-b border-slate-100">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-800 text-right">{value}</span>
        </div>
    );
}

function BlockText({
    label,
    value,
    empty,
}: {
    label: string;
    value?: string | null;
    empty: string;
}) {
    return (
        <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1.5">
                {label}
            </h3>
            {value && value.trim().length > 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-[12.5px] text-slate-800 whitespace-pre-wrap">
                    {value}
                </div>
            ) : (
                <div className="text-[12px] text-slate-400 italic px-3 py-2.5 bg-slate-50/40 rounded-lg border border-dashed border-slate-200">
                    {empty}
                </div>
            )}
        </div>
    );
}

interface AuditTimelineProps {
    logs: DosimetryAuditLogDTO[];
    t: (key: string, opts?: Record<string, unknown>) => string;
}

function AuditTimeline({ logs, t }: AuditTimelineProps) {
    return (
        <ol className="relative border-l-2 border-indigo-100 ml-3 space-y-4 pl-4">
            {logs.map((log, idx) => {
                const key = log.id ?? `audit-${idx}`;
                return (
                    <li key={key} className="relative">
                        <span className="absolute -left-[22px] top-0.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold uppercase tracking-[0.05em] bg-indigo-100 text-indigo-800 border border-indigo-200">
                                        {log.action}
                                    </span>
                                    <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                                        <IconClock size={11} />
                                        {formatDateTime(log.timestamp)}
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-500">
                                    {t('overexposureCases.detail.audit.cols.userId')} : #{log.userId}
                                </span>
                            </div>
                            {log.details && (
                                <div className="mt-1.5 text-[11.5px] text-slate-600 font-mono whitespace-pre-wrap break-all">
                                    {log.details}
                                </div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

export default OverexposureCaseDetailPage;
