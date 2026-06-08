/**
 * BlastDetailPage — Module Gestion des Dynamitages (Phase 2 Frontend).
 *
 * Fiche detaillee d'un tir : header (reference, statut, boutefeu, heure),
 * 5 onglets (Plan, Equipe, Annonce, Etat des rappels, Historique) et actions
 * contextuelles selon le statut et le RBAC.
 *
 * Route : /blast/detail/:id
 *
 * Actions disponibles (gated par RBAC + statut) :
 *  - Confirmer        (DRAFT/PLANNED -> CONFIRMED ; BLAST_CONFIRM)
 *  - Reporter         (PLANNED/CONFIRMED -> POSTPONED ; BLAST_PLAN/BLAST_ADMIN)
 *  - Annuler          (any -> CANCELLED ; BLAST_PLAN/BLAST_ADMIN)
 *  - Declarer tire    (CONFIRMED/IMMINENT -> FIRED ; BLAST_CONFIRM)
 *  - Declarer rate    (FIRED -> MISFIRE ; BLAST_CONFIRM ; perimetre maintenu)
 *  - Site degage      (FIRED -> ALL_CLEAR ; BLAST_CONFIRM ; bloquee si misfire
 *                     non resolu)
 *  - Modifier         (-> formulaire d'edition)
 *  - Voir rapport d'evacuation (>= ALL_CLEAR)
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Paper,
    Group,
    Button,
    Tabs,
    Modal,
    Textarea,
    Text,
    Tooltip,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
    IconArrowLeft,
    IconChevronRight,
    IconBolt,
    IconClock,
    IconUser,
    IconCheck,
    IconCalendarTime,
    IconX,
    IconFlame,
    IconAlertOctagon,
    IconShieldCheck,
    IconFileText,
    IconPencil,
    IconClipboardList,
    IconUsers,
    IconMail,
    IconHistory,
    IconMapPin,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import {
    getBlastDetail,
    confirmBlast,
    cancelBlast,
    rescheduleBlast,
    declareFired,
    declareMisfire,
    resolveMisfire,
    allClear,
    type BlastDetailDTO,
    type BlastStatus,
} from '../../services/BlastService';
import { STATUS_CONFIG, StatusBadge } from './BlastRegistryPage';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatDateTime = (iso: string | null | undefined, lang: string): string => {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    } catch {
        return iso;
    }
};

function hasBlastPermission(user: any, permission: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    const candidates: string[] = [];
    if (Array.isArray(user.permissions)) candidates.push(...user.permissions);
    if (Array.isArray(user.authorities)) {
        candidates.push(...user.authorities.map((a: any) => a?.authority ?? a));
    }
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (typeof user.role === 'string') candidates.push(user.role);
    return candidates.includes(permission);
}

const isoLocal = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Pure helper : matrice des actions disponibles selon statut + RBAC
//  Extrait pour permettre des tests unitaires deterministes (P2.1).
// ─────────────────────────────────────────────────────────────────────────────

export interface BlastAvailableActions {
    confirm: boolean;
    reschedule: boolean;
    cancel: boolean;
    fired: boolean;
    misfire: boolean;
    /** Bouton "site degage" affiche (FIRED ou MISFIRE — phase d'inspection). */
    allClear: boolean;
    /**
     * Bouton "site degage" reellement cliquable. False quand le statut est
     * MISFIRE et que misfireResolvedAt est null (raté non resolu).
     */
    allClearActionable: boolean;
    /**
     * Bouton "Resoudre raté" (P5). Visible uniquement si :
     *   - le tir est en statut MISFIRE
     *   - le raté n'est pas encore resolu (misfireResolvedAt == null)
     *   - l'utilisateur a la permission BLAST_ADMIN
     */
    resolveMisfire: boolean;
    edit: boolean;
    evacReport: boolean;
}

export interface BlastActionsInput {
    status: BlastStatus;
    misfireResolvedAt: string | null | undefined;
    canPlan: boolean;
    canConfirm: boolean;
    canAdmin: boolean;
}

export const computeAvailableActions = (
    input: BlastActionsInput,
): BlastAvailableActions => {
    const { status: s, misfireResolvedAt, canPlan, canConfirm, canAdmin } = input;
    const canConfirmAct = canConfirm && (s === 'DRAFT' || s === 'PLANNED');
    const canReschedule =
        (canPlan || canAdmin) && (s === 'PLANNED' || s === 'CONFIRMED');
    const canCancelAct =
        (canPlan || canAdmin) &&
        s !== 'FIRED' &&
        s !== 'ALL_CLEAR' &&
        s !== 'CANCELLED';
    const canFired = canConfirm && (s === 'CONFIRMED' || s === 'IMMINENT');
    const canMisfire = canConfirm && s === 'FIRED';

    // P2.1 — logique "site degage" :
    //   - FIRED                              → bouton actionnable
    //   - MISFIRE + misfireResolvedAt != null → actionnable
    //   - MISFIRE + misfireResolvedAt == null → visible mais disabled
    const inInspectionPhase = s === 'FIRED' || s === 'MISFIRE';
    const allClearVisible = canConfirm && inInspectionPhase;
    const allClearActionable =
        s === 'FIRED' || (s === 'MISFIRE' && misfireResolvedAt != null);

    // P5 — bouton "Resoudre raté" : seul BLAST_ADMIN peut lever le verrou
    // misfire, et uniquement tant qu'il n'est pas deja resolu.
    const canResolveMisfire =
        canAdmin && s === 'MISFIRE' && misfireResolvedAt == null;

    return {
        confirm: canConfirmAct,
        reschedule: canReschedule,
        cancel: canCancelAct,
        fired: canFired,
        misfire: canMisfire,
        allClear: allClearVisible,
        allClearActionable,
        resolveMisfire: canResolveMisfire,
        edit: canPlan,
        evacReport: s === 'ALL_CLEAR',
    };
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : entete de section
// ─────────────────────────────────────────────────────────────────────────────

interface DetailRowProps {
    label: string;
    value: React.ReactNode;
}

const DetailRow = ({ label, value }: DetailRowProps) => (
    <div className="grid grid-cols-[180px_1fr] gap-3 py-1.5 border-b border-slate-100 last:border-0">
        <div className="text-[12px] text-slate-500 font-medium">{label}</div>
        <div className="text-[12.5px] text-slate-800">{value}</div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const BlastDetailPage = () => {
    const { t, i18n } = useTranslation('blast');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const user = useAppSelector((state: any) => state.user);

    const canPlan = hasBlastPermission(user, 'BLAST_PLAN');
    const canConfirm = hasBlastPermission(user, 'BLAST_CONFIRM');
    const canAdmin = hasBlastPermission(user, 'BLAST_ADMIN');

    const [detail, setDetail] = useState<BlastDetailDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Modales d'action
    const [modal, setModal] = useState<
        | null
        | 'confirm'
        | 'reschedule'
        | 'cancel'
        | 'fired'
        | 'misfire'
        | 'allClear'
        | 'resolveMisfire'
    >(null);
    const [reason, setReason] = useState('');
    /**
     * Notes de resolution du raté (P5). Volontairement separe de `reason`
     * pour ne pas melanger les semantiques entre les modales en cours.
     */
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [newScheduledAt, setNewScheduledAt] = useState<Date | null>(null);

    const refresh = () => {
        if (!id) return;
        setLoading(true);
        getBlastDetail(id)
            .then((d) => {
                setDetail(d);
                setLoadError(null);
            })
            .catch(() => {
                setDetail(null);
                setLoadError(t('detail.loadError'));
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Actions disponibles selon le statut. P2.1 : logique extraite dans
    // computeAvailableActions() pour pouvoir etre couverte par des tests
    // unitaires deterministes.
    const availableActions = useMemo<BlastAvailableActions>(() => {
        if (!detail) {
            return {
                confirm: false,
                reschedule: false,
                cancel: false,
                fired: false,
                misfire: false,
                allClear: false,
                allClearActionable: false,
                resolveMisfire: false,
                edit: false,
                evacReport: false,
            };
        }
        return computeAvailableActions({
            status: detail.status as BlastStatus,
            misfireResolvedAt: detail.misfireResolvedAt,
            canPlan,
            canConfirm,
            canAdmin,
        });
    }, [detail, canPlan, canConfirm, canAdmin]);

    // Executeurs d'action
    const closeModal = () => {
        setModal(null);
        setReason('');
        setResolutionNotes('');
        setNewScheduledAt(null);
        setActionError(null);
    };

    const handleConfirm = async () => {
        if (!detail) return;
        setActionLoading(true);
        try {
            await confirmBlast(detail.id);
            closeModal();
            refresh();
        } catch {
            setActionError(t('detail.actionError'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReschedule = async () => {
        if (!detail || !newScheduledAt || !reason.trim()) {
            setActionError(t('form.validation.reasonRequired'));
            return;
        }
        setActionLoading(true);
        try {
            await rescheduleBlast(detail.id, isoLocal(newScheduledAt), reason);
            closeModal();
            refresh();
        } catch {
            setActionError(t('detail.actionError'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!detail || !reason.trim()) {
            setActionError(t('form.validation.reasonRequired'));
            return;
        }
        setActionLoading(true);
        try {
            await cancelBlast(detail.id, reason);
            closeModal();
            refresh();
        } catch {
            setActionError(t('detail.actionError'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleFired = async () => {
        if (!detail) return;
        setActionLoading(true);
        try {
            await declareFired(detail.id);
            closeModal();
            refresh();
        } catch {
            setActionError(t('detail.actionError'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleMisfire = async () => {
        if (!detail || !reason.trim()) {
            setActionError(t('form.validation.reasonRequired'));
            return;
        }
        setActionLoading(true);
        try {
            await declareMisfire(detail.id, reason);
            closeModal();
            refresh();
        } catch {
            setActionError(t('detail.actionError'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleAllClear = async () => {
        if (!detail) return;
        setActionLoading(true);
        try {
            await allClear(detail.id);
            closeModal();
            refresh();
        } catch {
            setActionError(t('detail.actionError'));
        } finally {
            setActionLoading(false);
        }
    };

    /**
     * P5 — Resoudre un raté (BLAST_ADMIN seul). Les notes de resolution sont
     * obligatoires : on les remonte dans le DTO {@code resolutionNotes}.
     */
    const handleResolveMisfire = async () => {
        if (!detail || !resolutionNotes.trim()) {
            setActionError(t('form.validation.reasonRequired'));
            return;
        }
        setActionLoading(true);
        try {
            await resolveMisfire(detail.id, resolutionNotes);
            closeModal();
            refresh();
        } catch {
            setActionError(t('detail.actionError'));
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Render ───
    if (loading && !detail) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-12 text-center text-slate-500 text-[13px]">
                    <span className="inline-block w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin mr-2 align-middle" />
                    {t('detail.loading')}
                </div>
            </div>
        );
    }

    if (loadError || !detail) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
                <div className="bg-white border border-red-200 rounded-xl shadow-sm px-4 py-8 text-center text-red-700 text-[13px]">
                    <IconAlertOctagon
                        size={22}
                        stroke={1.8}
                        className="inline-block mr-2 align-middle"
                    />
                    {loadError ?? t('detail.loadError')}
                    <div className="mt-3">
                        <Button
                            variant="subtle"
                            color="gray"
                            leftSection={<IconArrowLeft size={14} />}
                            onClick={() => navigate('/blast/registry')}
                        >
                            {t('common.back')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full max-w-6xl mx-auto">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/blast/registry')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-amber-700 hover:underline transition"
                    >
                        {t('registry.breadcrumbCurrent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('detail.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Header ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${STATUS_CONFIG[detail.status].bg} ${STATUS_CONFIG[detail.status].border} border`}
                                >
                                    <IconBolt
                                        size={22}
                                        stroke={1.8}
                                        className={STATUS_CONFIG[detail.status].text}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h1
                                            className="text-slate-900 leading-tight font-mono"
                                            style={{
                                                fontWeight: 700,
                                                fontSize: 'clamp(20px, 2.2vw, 26px)',
                                                letterSpacing: '-0.01em',
                                            }}
                                        >
                                            {detail.reference}
                                        </h1>
                                        <StatusBadge status={detail.status} />
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap text-[12.5px] text-slate-600 mt-1">
                                        <span className="inline-flex items-center gap-1">
                                            <IconUser size={12} stroke={1.8} />
                                            {t('detail.header.blasterLabel')} :{' '}
                                            <span className="font-medium">
                                                {detail.blasterId
                                                    ? `#${detail.blasterId}`
                                                    : '—'}
                                            </span>
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <IconClock size={12} stroke={1.8} />
                                            {t('detail.header.scheduledLabel')} :{' '}
                                            <span className="font-medium tabular-nums">
                                                {formatDateTime(
                                                    detail.scheduledAt,
                                                    i18n.language,
                                                )}
                                            </span>
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <IconMapPin size={12} stroke={1.8} />
                                            {detail.pit ?? '—'}
                                            {detail.bench && (
                                                <span className="text-slate-400">
                                                    / {detail.bench}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="subtle"
                                color="gray"
                                size="sm"
                                leftSection={<IconArrowLeft size={14} stroke={1.8} />}
                                onClick={() => navigate('/blast/registry')}
                            >
                                {t('common.back')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ─── Actions barre ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 mb-4 flex flex-wrap gap-2">
                    {availableActions.confirm && (
                        <Button
                            color="amber"
                            leftSection={<IconCheck size={14} />}
                            onClick={() => setModal('confirm')}
                        >
                            {t('detail.actions.confirm')}
                        </Button>
                    )}
                    {availableActions.reschedule && (
                        <Button
                            variant="light"
                            color="cyan"
                            leftSection={<IconCalendarTime size={14} />}
                            onClick={() => setModal('reschedule')}
                        >
                            {t('detail.actions.reschedule')}
                        </Button>
                    )}
                    {availableActions.cancel && (
                        <Button
                            variant="light"
                            color="gray"
                            leftSection={<IconX size={14} />}
                            onClick={() => setModal('cancel')}
                        >
                            {t('detail.actions.cancel')}
                        </Button>
                    )}
                    {availableActions.fired && (
                        <Button
                            color="orange"
                            leftSection={<IconFlame size={14} />}
                            onClick={() => setModal('fired')}
                        >
                            {t('detail.actions.declareFired')}
                        </Button>
                    )}
                    {availableActions.misfire && (
                        <Button
                            color="red"
                            variant="light"
                            leftSection={<IconAlertOctagon size={14} />}
                            onClick={() => setModal('misfire')}
                        >
                            {t('detail.actions.declareMisfire')}
                        </Button>
                    )}
                    {availableActions.resolveMisfire && (
                        <Button
                            color="violet"
                            leftSection={<IconShieldCheck size={14} />}
                            onClick={() => setModal('resolveMisfire')}
                            data-testid="resolve-misfire-button"
                        >
                            {t('detail.actions.resolveMisfire')}
                        </Button>
                    )}
                    {availableActions.allClear && (
                        availableActions.allClearActionable ? (
                            <Button
                                color="green"
                                leftSection={<IconShieldCheck size={14} />}
                                onClick={() => setModal('allClear')}
                            >
                                {t('detail.actions.allClear')}
                            </Button>
                        ) : (
                            <Tooltip
                                label={t('detail.actions.allClearBlockedTooltip')}
                                position="top"
                                withArrow
                                multiline
                                w={260}
                            >
                                {/* span pour porter le tooltip sur un Button disabled. */}
                                <span>
                                    <Button
                                        color="green"
                                        leftSection={<IconShieldCheck size={14} />}
                                        disabled
                                        aria-disabled
                                        data-testid="all-clear-button-disabled"
                                    >
                                        {t('detail.actions.allClear')}
                                    </Button>
                                </span>
                            </Tooltip>
                        )
                    )}
                    {availableActions.edit && (
                        <Button
                            variant="default"
                            leftSection={<IconPencil size={14} />}
                            onClick={() => navigate(`/blast/edit/${detail.id}`)}
                        >
                            {t('detail.actions.edit')}
                        </Button>
                    )}
                    {availableActions.evacReport && (
                        <Button
                            variant="light"
                            color="green"
                            leftSection={<IconFileText size={14} />}
                            // P6 : la page de rapport est branchee sur la route dediee.
                            onClick={() =>
                                navigate(`/blast/evacuation-report/${detail.id}`)
                            }
                            className="ml-auto"
                        >
                            {t('detail.actions.openEvacReport')}
                        </Button>
                    )}
                </div>

                {actionError && (
                    <div
                        className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[12.5px]"
                        role="alert"
                    >
                        <IconAlertOctagon
                            size={14}
                            stroke={1.8}
                            className="mt-0.5 flex-shrink-0"
                        />
                        <span>{actionError}</span>
                    </div>
                )}

                {/* ─── Tabs ─── */}
                <Paper p="md" radius="md" withBorder className="bg-white">
                    <Tabs defaultValue="plan" color="amber">
                        <Tabs.List>
                            <Tabs.Tab
                                value="plan"
                                leftSection={<IconClipboardList size={14} />}
                            >
                                {t('detail.tabs.plan')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="team"
                                leftSection={<IconUsers size={14} />}
                            >
                                {t('detail.tabs.team')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="announcement"
                                leftSection={<IconMail size={14} />}
                            >
                                {t('detail.tabs.announcement')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="reminders"
                                leftSection={<IconClock size={14} />}
                            >
                                {t('detail.tabs.reminders')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="history"
                                leftSection={<IconHistory size={14} />}
                            >
                                {t('detail.tabs.history')}
                            </Tabs.Tab>
                        </Tabs.List>

                        {/* TAB Plan */}
                        <Tabs.Panel value="plan" pt="md">
                            <h3 className="text-[14px] font-semibold text-slate-800 mb-2">
                                {t('detail.plan.title')}
                            </h3>
                            {detail.plan ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                    <DetailRow
                                        label={t('detail.plan.holesLabel')}
                                        value={detail.plan.holeCount ?? '—'}
                                    />
                                    <DetailRow
                                        label={t('detail.plan.diameterLabel')}
                                        value={
                                            detail.plan.holeDiameterMm != null
                                                ? `${detail.plan.holeDiameterMm} mm`
                                                : '—'
                                        }
                                    />
                                    <DetailRow
                                        label={t('detail.plan.depthLabel')}
                                        value={
                                            detail.plan.depthM != null
                                                ? `${detail.plan.depthM} m`
                                                : '—'
                                        }
                                    />
                                    <DetailRow
                                        label={t('detail.plan.burdenLabel')}
                                        value={
                                            detail.plan.burdenM != null
                                                ? `${detail.plan.burdenM} m`
                                                : '—'
                                        }
                                    />
                                    <DetailRow
                                        label={t('detail.plan.spacingLabel')}
                                        value={
                                            detail.plan.spacingM != null
                                                ? `${detail.plan.spacingM} m`
                                                : '—'
                                        }
                                    />
                                    <DetailRow
                                        label={t('detail.plan.stemmingLabel')}
                                        value={
                                            detail.plan.stemmingM != null
                                                ? `${detail.plan.stemmingM} m`
                                                : '—'
                                        }
                                    />
                                    <DetailRow
                                        label={t('detail.plan.explosiveLabel')}
                                        value={detail.plan.explosiveType ?? '—'}
                                    />
                                    <DetailRow
                                        label={t('detail.plan.qtyLabel')}
                                        value={
                                            detail.plan.explosiveQtyKg != null
                                                ? `${detail.plan.explosiveQtyKg} kg`
                                                : '—'
                                        }
                                    />
                                    <DetailRow
                                        label={t('detail.plan.powderFactorLabel')}
                                        value={
                                            detail.plan.powderFactor != null
                                                ? `${detail.plan.powderFactor} kg/m3`
                                                : '—'
                                        }
                                    />
                                    <DetailRow
                                        label={t('detail.plan.initiationLabel')}
                                        value={detail.plan.initiationSystem ?? '—'}
                                    />
                                    <DetailRow
                                        label={t('detail.plan.delayLabel')}
                                        value={detail.plan.delaySequence ?? '—'}
                                    />
                                </div>
                            ) : (
                                <Text size="sm" c="dimmed">
                                    {t('detail.plan.empty')}
                                </Text>
                            )}
                        </Tabs.Panel>

                        {/* TAB Team */}
                        <Tabs.Panel value="team" pt="md">
                            <h3 className="text-[14px] font-semibold text-slate-800 mb-2">
                                {t('detail.team.title')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                <DetailRow
                                    label={t('detail.team.blasterLabel')}
                                    value={
                                        detail.blasterId
                                            ? `#${detail.blasterId}`
                                            : '—'
                                    }
                                />
                                <DetailRow
                                    label={t('detail.team.hseLeadLabel')}
                                    value={
                                        detail.hseLeadId
                                            ? `#${detail.hseLeadId}`
                                            : '—'
                                    }
                                />
                            </div>
                            <div className="mt-4">
                                <h4 className="text-[13px] font-semibold text-slate-700 mb-2">
                                    {t('detail.team.guardsLabel')}
                                </h4>
                                {detail.guards && detail.guards.length > 0 ? (
                                    <ul className="flex flex-col gap-1.5">
                                        {detail.guards.map((g, i) => (
                                            <li
                                                key={i}
                                                className="flex items-center gap-3 text-[12.5px] bg-slate-50 border border-slate-200 rounded px-3 py-1.5"
                                            >
                                                <IconUser size={12} stroke={1.8} />
                                                <span className="font-mono text-slate-700">
                                                    #{g.employeeId}
                                                </span>
                                                <span className="text-slate-500">
                                                    {g.position ?? '—'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <Text size="sm" c="dimmed">
                                        {t('detail.team.empty')}
                                    </Text>
                                )}
                            </div>
                        </Tabs.Panel>

                        {/* TAB Announcement */}
                        <Tabs.Panel value="announcement" pt="md">
                            <h3 className="text-[14px] font-semibold text-slate-800 mb-2">
                                {t('detail.announcement.title')}
                            </h3>
                            <DetailRow
                                label={t('detail.announcement.alarmZoneLabel')}
                                value={detail.alarmZoneScope ?? '—'}
                            />
                            <div className="mt-4">
                                <h4 className="text-[13px] font-semibold text-slate-700 mb-2">
                                    {t('detail.announcement.recipientsLabel')}
                                </h4>
                                {detail.recipients &&
                                detail.recipients.length > 0 ? (
                                    <ul className="flex flex-col gap-1.5">
                                        {detail.recipients.map((r, i) => (
                                            <li
                                                key={i}
                                                className="flex items-center gap-3 text-[12.5px] bg-slate-50 border border-slate-200 rounded px-3 py-1.5"
                                            >
                                                <IconMail size={12} stroke={1.8} />
                                                <span className="text-slate-700">
                                                    {r.externalEmail ??
                                                        `#${r.employeeId}`}
                                                </span>
                                                <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[10.5px] text-slate-600 font-medium">
                                                    {r.preferredLanguage ?? 'FR'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <Text size="sm" c="dimmed">
                                        {t('detail.announcement.empty')}
                                    </Text>
                                )}
                            </div>
                        </Tabs.Panel>

                        {/* TAB Reminders */}
                        <Tabs.Panel value="reminders" pt="md">
                            <h3 className="text-[14px] font-semibold text-slate-800 mb-1">
                                {t('detail.reminders.title')}
                            </h3>
                            <Text size="xs" c="dimmed" className="mb-3">
                                {t('detail.reminders.subtitle')}
                            </Text>
                            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[12.5px] text-slate-600 leading-relaxed">
                                {detail.status === 'DRAFT' ||
                                detail.status === 'PLANNED'
                                    ? t('detail.reminders.notStarted')
                                    : t('detail.reminders.phase3')}
                            </div>
                        </Tabs.Panel>

                        {/* TAB History */}
                        <Tabs.Panel value="history" pt="md">
                            <h3 className="text-[14px] font-semibold text-slate-800 mb-1">
                                {t('detail.history.title')}
                            </h3>
                            <Text size="xs" c="dimmed" className="mb-3">
                                {t('detail.history.subtitle')}
                            </Text>
                            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[12.5px] text-slate-600 leading-relaxed">
                                {t('detail.history.phase3')}
                            </div>
                        </Tabs.Panel>
                    </Tabs>
                </Paper>
            </div>

            {/* ─── Modales d'action ─── */}
            <Modal
                opened={modal === 'confirm'}
                onClose={closeModal}
                title={
                    <Text fw={600} size="md">
                        {t('form.confirmModal.title')}
                    </Text>
                }
                centered
            >
                <Text size="sm" className="text-slate-700 mb-4">
                    {t('form.confirmModal.body')}
                </Text>
                <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={closeModal}>
                        {t('detail.modals.cancel')}
                    </Button>
                    <Button
                        color="amber"
                        loading={actionLoading}
                        onClick={handleConfirm}
                    >
                        {t('detail.modals.validate')}
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={modal === 'reschedule'}
                onClose={closeModal}
                title={
                    <Text fw={600} size="md">
                        {t('detail.modals.rescheduleTitle')}
                    </Text>
                }
                centered
            >
                <DateTimePicker
                    label={t('detail.modals.rescheduleNewDate')}
                    value={newScheduledAt}
                    onChange={(v: any) =>
                        setNewScheduledAt(
                            v instanceof Date ? v : v ? new Date(v) : null,
                        )
                    }
                    valueFormat="DD/MM/YYYY HH:mm"
                    className="mb-3"
                />
                <Textarea
                    label={t('detail.modals.rescheduleReason')}
                    value={reason}
                    onChange={(e) => setReason(e.currentTarget.value)}
                    autosize
                    minRows={2}
                    className="mb-3"
                />
                <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={closeModal}>
                        {t('detail.modals.cancel')}
                    </Button>
                    <Button
                        color="cyan"
                        loading={actionLoading}
                        onClick={handleReschedule}
                    >
                        {t('detail.modals.validate')}
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={modal === 'cancel'}
                onClose={closeModal}
                title={
                    <Text fw={600} size="md">
                        {t('detail.modals.cancelTitle')}
                    </Text>
                }
                centered
            >
                <Textarea
                    label={t('detail.modals.cancelReason')}
                    value={reason}
                    onChange={(e) => setReason(e.currentTarget.value)}
                    autosize
                    minRows={2}
                    className="mb-3"
                />
                <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={closeModal}>
                        {t('detail.modals.cancel')}
                    </Button>
                    <Button
                        color="gray"
                        loading={actionLoading}
                        onClick={handleCancel}
                    >
                        {t('detail.modals.validate')}
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={modal === 'fired'}
                onClose={closeModal}
                title={
                    <Text fw={600} size="md">
                        {t('detail.modals.firedTitle')}
                    </Text>
                }
                centered
            >
                <Text size="sm" className="text-slate-700 mb-4">
                    {t('detail.modals.firedBody')}
                </Text>
                <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={closeModal}>
                        {t('detail.modals.cancel')}
                    </Button>
                    <Button
                        color="orange"
                        loading={actionLoading}
                        onClick={handleFired}
                    >
                        {t('detail.modals.validate')}
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={modal === 'misfire'}
                onClose={closeModal}
                title={
                    <Text fw={600} size="md">
                        {t('detail.modals.misfireTitle')}
                    </Text>
                }
                centered
            >
                <Text size="sm" className="text-red-700 mb-3 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {t('detail.modals.misfireHint')}
                </Text>
                <Textarea
                    label={t('detail.modals.misfireReason')}
                    value={reason}
                    onChange={(e) => setReason(e.currentTarget.value)}
                    autosize
                    minRows={2}
                    className="mb-3"
                />
                <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={closeModal}>
                        {t('detail.modals.cancel')}
                    </Button>
                    <Button
                        color="red"
                        loading={actionLoading}
                        onClick={handleMisfire}
                    >
                        {t('detail.modals.validate')}
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={modal === 'allClear'}
                onClose={closeModal}
                title={
                    <Text fw={600} size="md">
                        {t('detail.modals.allClearTitle')}
                    </Text>
                }
                centered
            >
                <Text size="sm" className="text-slate-700 mb-4">
                    {t('detail.modals.allClearBody')}
                </Text>
                <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={closeModal}>
                        {t('detail.modals.cancel')}
                    </Button>
                    <Button
                        color="green"
                        loading={actionLoading}
                        onClick={handleAllClear}
                    >
                        {t('detail.modals.validate')}
                    </Button>
                </Group>
            </Modal>

            {/* P5 — Resoudre un raté (BLAST_ADMIN seul) */}
            <Modal
                opened={modal === 'resolveMisfire'}
                onClose={closeModal}
                title={
                    <Text fw={600} size="md">
                        {t('detail.modals.resolveMisfireTitle')}
                    </Text>
                }
                centered
            >
                <Text
                    size="sm"
                    className="text-violet-700 mb-3 bg-violet-50 border border-violet-200 rounded px-3 py-2"
                >
                    {t('detail.modals.resolveMisfireHint')}
                </Text>
                <Textarea
                    label={t('detail.modals.resolveMisfireNotes')}
                    description={t('detail.modals.resolveMisfireNotesHint')}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.currentTarget.value)}
                    autosize
                    minRows={3}
                    className="mb-3"
                    data-testid="resolve-misfire-notes"
                />
                <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={closeModal}>
                        {t('detail.modals.cancel')}
                    </Button>
                    <Button
                        color="violet"
                        loading={actionLoading}
                        onClick={handleResolveMisfire}
                    >
                        {t('detail.modals.validate')}
                    </Button>
                </Group>
            </Modal>
        </div>
    );
};

export default BlastDetailPage;
