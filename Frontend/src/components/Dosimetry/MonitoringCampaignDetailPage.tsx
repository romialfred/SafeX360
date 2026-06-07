/**
 * MonitoringCampaignDetailPage — Phase 6 Frontend-B (LOT Dosimetrie & Expositions).
 *
 * Fiche detail premium d'une campagne de surveillance d'ambiance.
 *
 * Route : /dosimetry/campaigns/:id
 *
 * Layout :
 *   - Breadcrumb premium
 *   - Hero header avec status badge + boutons workflow (Demarrer / Completer /
 *     Annuler) selon le statut courant et la permission DOSIMETRY_PCR_RPO.
 *   - Tabs Mantine :
 *       1. Vue d'ensemble       : infos generales + progression (mesures / prevues)
 *       2. Points couverts      : liste des points + nb mesures par point + bouton "+ Mesure"
 *       3. Mesures collectees   : DataTable + LineChart par point
 *       4. Rapport              : bouton "Generer rapport" (placeholder PDF -> texte backend)
 *       5. Timeline d'audit     : evenements de cycle de vie de la campagne
 *
 * Donnees :
 *   - getMonitoringCampaign(id)
 *   - listMeasurementsByCampaign(id)
 *   - listMeasurementPoints(mineId) (filtre sur perimetre campagne)
 *   - getEmployeeDropdown() (resolution responsable)
 *   - getAllAuditLogs() + filtre client entityType=MonitoringCampaign
 *   - generateMonitoringCampaignReport(id)
 *
 * RBAC UI :
 *   - Boutons workflow : DOSIMETRY_PCR_RPO
 *   - Bouton "Mesure" : DOSIMETRY_WRITE
 *
 * Contraintes : tsc strict + vite EXIT 0.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Tabs,
    Button,
    Badge,
    Modal,
    Alert,
} from '@mantine/core';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RTooltip,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
} from 'recharts';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
    IconArrowLeft,
    IconChevronRight,
    IconClipboardList,
    IconInfoCircle,
    IconBroadcast,
    IconChartLine,
    IconFileText,
    IconHistory,
    IconPlayerPlay,
    IconCircleCheck,
    IconAlertOctagon,
    IconPlus,
    IconCalendarTime,
    IconUserCircle,
    IconPencil,
    IconClock,
    IconDeviceFloppy,
    IconShieldCheck,
    IconActivity,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import {
    getMonitoringCampaign,
    listMeasurementsByCampaign,
    listMeasurementPoints,
    startMonitoringCampaign,
    completeMonitoringCampaign,
    cancelMonitoringCampaign,
    generateMonitoringCampaignReport,
    getAllAuditLogs,
    type MonitoringCampaignDTO,
    type CampaignStatus,
    type AmbientMeasurementDTO,
    type MeasurementPointDTO,
    type DosimetryAuditLogDTO,
} from '../../services/DosimetryService';
import { getEmployeeDropdown } from '../../services/EmployeeService';
import AmbientMeasurementForm from './AmbientMeasurementForm';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC
// ─────────────────────────────────────────────────────────────────────────────

function hasDosimetryPermission(user: any, permission: string): boolean {
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

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<CampaignStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 border border-slate-200',
    ONGOING: 'bg-amber-100 text-amber-800 border border-amber-200',
    COMPLETED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    CANCELLED: 'bg-red-100 text-red-800 border border-red-200',
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
        return s as string;
    }
};

const formatDateTime = (s?: string | null): string => {
    if (!s) return '—';
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return s as string;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const MonitoringCampaignDetailPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const params = useParams<{ id: string }>();
    const campaignId = params.id;

    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector(
        (state: any) => state.companySelection?.selectedCompanyId,
    );

    const canPcr = hasDosimetryPermission(user, 'DOSIMETRY_PCR_RPO');
    const canWrite = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');

    const mineId: number = Number(
        selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1,
    );

    const [campaign, setCampaign] = useState<MonitoringCampaignDTO | null>(null);
    const [measurements, setMeasurements] = useState<AmbientMeasurementDTO[]>([]);
    const [points, setPoints] = useState<MeasurementPointDTO[]>([]);
    const [responsibleLabel, setResponsibleLabel] = useState<string>('—');
    const [auditLogs, setAuditLogs] = useState<DosimetryAuditLogDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('overview');

    // Workflow transitions
    const [actionLoading, setActionLoading] = useState<
        'start' | 'complete' | 'cancel' | null
    >(null);

    // Modal: confirmation transitions
    const [confirmModal, setConfirmModal] = useState<
        null | { kind: 'start' | 'complete' | 'cancel' }
    >(null);

    // Modal: mesure
    const [measureModalOpen, setMeasureModalOpen] = useState(false);

    // Rapport
    const [reportLoading, setReportLoading] = useState(false);
    const [reportText, setReportText] = useState<string | null>(null);

    // ─── Fetch ───
    const fetchAll = useCallback(async () => {
        if (!campaignId) return;
        setLoading(true);
        setLoadError(null);

        const [campRes, measRes, pointsRes, empsRes, auditRes] = await Promise.allSettled([
            getMonitoringCampaign(campaignId),
            listMeasurementsByCampaign(campaignId),
            listMeasurementPoints(mineId),
            getEmployeeDropdown(),
            getAllAuditLogs(),
        ]);

        if (campRes.status === 'fulfilled') {
            setCampaign(campRes.value);
        } else {
            setLoadError(t('campaigns.detail.loadError'));
        }

        if (measRes.status === 'fulfilled') {
            const arr: AmbientMeasurementDTO[] = Array.isArray(measRes.value)
                ? measRes.value
                : [];
            setMeasurements(arr);
        } else {
            setMeasurements([]);
        }

        if (pointsRes.status === 'fulfilled') {
            const arr: MeasurementPointDTO[] = Array.isArray(pointsRes.value)
                ? pointsRes.value
                : [];
            setPoints(arr);
        }

        if (empsRes.status === 'fulfilled' && campRes.status === 'fulfilled') {
            const list: any = empsRes.value;
            const arr: any[] = Array.isArray(list) ? list : (list?.content ?? []);
            const respId = campRes.value.responsibleId;
            if (respId != null) {
                const e = arr.find(
                    (x) => Number(x?.id ?? x?.employeeId ?? 0) === Number(respId),
                );
                if (e) {
                    setResponsibleLabel(
                        String(
                            e?.firstName && e?.lastName
                                ? `${e.firstName} ${e.lastName}`
                                : e?.fullName ?? e?.name ?? `#${respId}`,
                        ),
                    );
                } else {
                    setResponsibleLabel(`#${respId}`);
                }
            } else {
                setResponsibleLabel('—');
            }
        }

        if (auditRes.status === 'fulfilled') {
            const arr: DosimetryAuditLogDTO[] = Array.isArray(auditRes.value)
                ? auditRes.value
                : [];
            const filtered = arr.filter(
                (a) =>
                    a.entityType === 'MonitoringCampaign'
                    && String(a.entityId) === String(campaignId),
            );
            filtered.sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''));
            setAuditLogs(filtered);
        }

        setLoading(false);
    }, [campaignId, mineId, t]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ─── Helpers calcules ───
    const coveredPoints = useMemo(() => {
        if (!campaign) return [] as MeasurementPointDTO[];
        const ids = new Set(
            (campaign.measurementPointIds ?? []).map((id) => Number(id)),
        );
        return points.filter((p) => p.id != null && ids.has(Number(p.id)));
    }, [campaign, points]);

    const measurementsByPoint = useMemo(() => {
        const map = new Map<number, AmbientMeasurementDTO[]>();
        measurements.forEach((m) => {
            const id = Number(m.measurementPointId);
            if (!map.has(id)) map.set(id, []);
            map.get(id)!.push(m);
        });
        return map;
    }, [measurements]);

    const progress = useMemo(() => {
        const expected = coveredPoints.length;
        const realized = measurements.length;
        if (campaign?.status === 'COMPLETED') {
            return { pct: 100, realized, expected };
        }
        if (expected <= 0) return { pct: 0, realized: 0, expected: 0 };
        const pct = Math.min(100, Math.round((realized / Math.max(1, expected)) * 100));
        return { pct, realized, expected };
    }, [coveredPoints.length, measurements.length, campaign?.status]);

    // ─── Actions workflow ───
    const performTransition = async (kind: 'start' | 'complete' | 'cancel') => {
        if (!campaignId) return;
        setActionLoading(kind);
        try {
            if (kind === 'start') {
                await startMonitoringCampaign(campaignId);
                successNotification(t('campaigns.detail.actions.startSuccess'));
            } else if (kind === 'complete') {
                await completeMonitoringCampaign(campaignId);
                successNotification(t('campaigns.detail.actions.completeSuccess'));
            } else {
                await cancelMonitoringCampaign(campaignId);
                successNotification(t('campaigns.detail.actions.cancelSuccess'));
            }
            setConfirmModal(null);
            await fetchAll();
        } catch (err: any) {
            const msg =
                err?.response?.data?.message
                ?? err?.message
                ?? t('campaigns.detail.actions.error');
            errorNotification(msg);
        } finally {
            setActionLoading(null);
        }
    };

    // ─── Action rapport ───
    const handleGenerateReport = async () => {
        if (!campaignId) return;
        setReportLoading(true);
        try {
            const txt = await generateMonitoringCampaignReport(campaignId);
            setReportText(txt);
            successNotification(t('campaigns.detail.report.success'));
        } catch {
            errorNotification(t('campaigns.detail.report.error'));
        } finally {
            setReportLoading(false);
        }
    };

    // ─── Rendering early states ───
    if (loading && !campaign) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
                <div className="w-full">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center text-slate-500">
                        <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                        {t('campaigns.detail.loading')}
                    </div>
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
                <div className="w-full">
                    <div className="bg-white border border-amber-200 rounded-xl shadow-sm p-8 text-center text-amber-700">
                        <IconAlertOctagon size={28} className="mx-auto mb-2" />
                        {loadError ?? t('campaigns.detail.notFound')}
                        <div className="mt-4">
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<IconArrowLeft size={13} />}
                                onClick={() => navigate('/dosimetry/campaigns')}
                            >
                                {t('campaigns.detail.back')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const status: CampaignStatus = (campaign.status ?? 'DRAFT') as CampaignStatus;
    const canStart = canPcr && status === 'DRAFT';
    const canComplete = canPcr && status === 'ONGOING';
    const canCancel = canPcr && (status === 'DRAFT' || status === 'ONGOING');
    const canRecord = canWrite && status === 'ONGOING';

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">

                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('campaigns.list.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/campaigns')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('campaigns.list.breadcrumbCurrent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        #{campaign.id}
                    </span>
                </div>

                {/* ─── Hero card ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className={`absolute top-0 left-0 right-0 h-1 ${
                                status === 'DRAFT'
                                    ? 'bg-gradient-to-r from-slate-300 to-slate-500'
                                    : status === 'ONGOING'
                                    ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500'
                                    : status === 'COMPLETED'
                                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'
                                    : 'bg-gradient-to-r from-red-500 via-red-400 to-orange-500'
                            }`}
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                                type="button"
                                onClick={() => navigate('/dosimetry/campaigns')}
                                className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition flex-shrink-0"
                                aria-label={t('campaigns.detail.back')}
                            >
                                <IconArrowLeft size={16} stroke={1.8} className="text-slate-600" />
                            </button>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                <IconClipboardList size={22} stroke={1.8} className="text-white" />
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
                                    {campaign.label}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    <span className="font-mono text-[11.5px] text-slate-700">
                                        {campaign.code}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_BADGE[status]}`}
                                    >
                                        {t(`campaigns.status.${status}`, { defaultValue: status })}
                                    </span>
                                    {campaign.startDate && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                            <IconCalendarTime size={12} />
                                            {formatDate(campaign.startDate)}
                                            {campaign.endDate && ` → ${formatDate(campaign.endDate)}`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 ml-auto">
                            {canRecord && (
                                <Button
                                    color="indigo"
                                    size="sm"
                                    leftSection={<IconPlus size={14} />}
                                    onClick={() => setMeasureModalOpen(true)}
                                >
                                    {t('campaigns.detail.actions.recordMeasurement')}
                                </Button>
                            )}
                            {canStart && (
                                <Button
                                    color="amber"
                                    size="sm"
                                    leftSection={<IconPlayerPlay size={14} />}
                                    onClick={() => setConfirmModal({ kind: 'start' })}
                                    loading={actionLoading === 'start'}
                                >
                                    {t('campaigns.detail.actions.start')}
                                </Button>
                            )}
                            {canComplete && (
                                <Button
                                    color="emerald"
                                    size="sm"
                                    leftSection={<IconCircleCheck size={14} />}
                                    onClick={() => setConfirmModal({ kind: 'complete' })}
                                    loading={actionLoading === 'complete'}
                                >
                                    {t('campaigns.detail.actions.complete')}
                                </Button>
                            )}
                            {canCancel && (
                                <Button
                                    color="red"
                                    variant="light"
                                    size="sm"
                                    leftSection={<IconAlertOctagon size={14} />}
                                    onClick={() => setConfirmModal({ kind: 'cancel' })}
                                    loading={actionLoading === 'cancel'}
                                >
                                    {t('campaigns.detail.actions.cancel')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Progression banner */}
                    {(status === 'ONGOING' || status === 'COMPLETED') && (
                        <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100">
                            <div className="flex items-center justify-between gap-3 mb-1">
                                <span className="text-[11.5px] text-slate-600 uppercase tracking-wider font-semibold">
                                    {t('campaigns.detail.progress.label')}
                                </span>
                                <span className="text-[12px] text-slate-700 font-mono">
                                    {progress.pct}% — {progress.realized}/{progress.expected}{' '}
                                    {t('campaigns.detail.progress.measurements')}
                                </span>
                            </div>
                            <div className="w-full h-2 rounded bg-slate-200 overflow-hidden">
                                <div
                                    className={`h-full transition-all ${
                                        status === 'COMPLETED'
                                            ? 'bg-emerald-500'
                                            : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${progress.pct}%` }}
                                />
                            </div>
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
                                value="overview"
                                leftSection={<IconInfoCircle size={13} />}
                            >
                                {t('campaigns.detail.tabs.overview')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="points"
                                leftSection={<IconBroadcast size={13} />}
                            >
                                {t('campaigns.detail.tabs.points')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="measurements"
                                leftSection={<IconChartLine size={13} />}
                            >
                                {t('campaigns.detail.tabs.measurements')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="report"
                                leftSection={<IconFileText size={13} />}
                            >
                                {t('campaigns.detail.tabs.report')}
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="audit"
                                leftSection={<IconHistory size={13} />}
                            >
                                {t('campaigns.detail.tabs.audit')}
                            </Tabs.Tab>
                        </Tabs.List>

                        {/* === Overview === */}
                        <Tabs.Panel value="overview" p="md">
                            <h2 className="text-[13px] font-semibold text-slate-800 mb-3">
                                {t('campaigns.detail.overview.title')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                                <InfoRow
                                    label={t('campaigns.form.fields.code')}
                                    value={
                                        <span className="font-mono text-[12px] text-slate-800">
                                            {campaign.code}
                                        </span>
                                    }
                                />
                                <InfoRow
                                    label={t('campaigns.form.fields.label')}
                                    value={campaign.label}
                                />
                                <InfoRow
                                    label={t('campaigns.form.fields.startDate')}
                                    value={formatDate(campaign.startDate)}
                                />
                                <InfoRow
                                    label={t('campaigns.form.fields.endDate')}
                                    value={
                                        campaign.endDate
                                            ? formatDate(campaign.endDate)
                                            : t('campaigns.form.fields.endDateOpen')
                                    }
                                />
                                <InfoRow
                                    label={t('campaigns.form.fields.responsible')}
                                    value={
                                        <span className="inline-flex items-center gap-1">
                                            <IconUserCircle size={12} className="text-slate-400" />
                                            {responsibleLabel}
                                        </span>
                                    }
                                />
                                <InfoRow
                                    label={t('campaigns.form.fields.measurementPoints')}
                                    value={`${coveredPoints.length} ${t('campaigns.detail.overview.pointsCovered')}`}
                                />
                                <div className="md:col-span-2">
                                    <InfoRow
                                        label={t('campaigns.form.fields.objective')}
                                        value={campaign.objective || '—'}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <InfoRow
                                        label={t('campaigns.form.fields.protocol')}
                                        value={
                                            campaign.protocol ? (
                                                <pre className="whitespace-pre-wrap font-sans text-[12.5px] text-slate-700 leading-relaxed">
                                                    {campaign.protocol}
                                                </pre>
                                            ) : (
                                                '—'
                                            )
                                        }
                                    />
                                </div>
                                <InfoRow
                                    label={t('campaigns.detail.overview.createdAt')}
                                    value={formatDateTime(campaign.createdAt)}
                                />
                                <InfoRow
                                    label={t('campaigns.detail.overview.completedAt')}
                                    value={
                                        campaign.completedAt
                                            ? formatDateTime(campaign.completedAt)
                                            : '—'
                                    }
                                />
                            </div>
                        </Tabs.Panel>

                        {/* === Points couverts === */}
                        <Tabs.Panel value="points" p="md">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <h2 className="text-[13px] font-semibold text-slate-800">
                                    {t('campaigns.detail.points.title', {
                                        count: coveredPoints.length,
                                    })}
                                </h2>
                                {canRecord && (
                                    <Button
                                        size="xs"
                                        color="indigo"
                                        leftSection={<IconPlus size={12} />}
                                        onClick={() => setMeasureModalOpen(true)}
                                    >
                                        {t('campaigns.detail.actions.recordMeasurement')}
                                    </Button>
                                )}
                            </div>
                            {coveredPoints.length === 0 ? (
                                <Alert
                                    color="amber"
                                    variant="light"
                                    icon={<IconInfoCircle size={14} />}
                                >
                                    {t('campaigns.detail.points.empty')}
                                </Alert>
                            ) : (
                                <DataTable
                                    value={coveredPoints.map((p) => ({
                                        ...p,
                                        nbMeasurements:
                                            measurementsByPoint.get(Number(p.id ?? 0))?.length ?? 0,
                                    }))}
                                    size="small"
                                    stripedRows
                                    responsiveLayout="scroll"
                                    className="text-[12.5px]"
                                >
                                    <Column
                                        field="code"
                                        header={t('campaigns.detail.points.cols.code')}
                                        body={(row: any) => (
                                            <span className="font-mono text-[12px]">{row.code}</span>
                                        )}
                                    />
                                    <Column
                                        field="label"
                                        header={t('campaigns.detail.points.cols.label')}
                                    />
                                    <Column
                                        field="zoneClassification"
                                        header={t('campaigns.detail.points.cols.zone')}
                                        body={(row: any) => (
                                            <span className="text-[11px] text-slate-600">
                                                {t(`ambient.zoneClass.${row.zoneClassification}`, {
                                                    defaultValue: row.zoneClassification,
                                                })}
                                            </span>
                                        )}
                                    />
                                    <Column
                                        field="referenceLevel"
                                        header={t('campaigns.detail.points.cols.reference')}
                                        align="right"
                                        body={(row: any) => (
                                            <span className="font-mono text-[12px] text-slate-700">
                                                {row.referenceLevel != null
                                                    ? Number(row.referenceLevel).toFixed(2)
                                                    : '—'}
                                            </span>
                                        )}
                                    />
                                    <Column
                                        field="nbMeasurements"
                                        header={t('campaigns.detail.points.cols.nbMeasurements')}
                                        align="right"
                                        body={(row: any) => (
                                            <Badge
                                                variant="light"
                                                color={row.nbMeasurements > 0 ? 'indigo' : 'gray'}
                                                radius="sm"
                                                size="sm"
                                            >
                                                {row.nbMeasurements}
                                            </Badge>
                                        )}
                                    />
                                    <Column
                                        header={t('campaigns.detail.points.cols.actions')}
                                        align="right"
                                        body={(row: any) => (
                                            <Button
                                                variant="subtle"
                                                size="xs"
                                                onClick={() =>
                                                    navigate(
                                                        `/dosimetry/measurement-points/detail/${row.id}`,
                                                    )
                                                }
                                            >
                                                {t('campaigns.detail.points.cols.open')}
                                            </Button>
                                        )}
                                    />
                                </DataTable>
                            )}
                        </Tabs.Panel>

                        {/* === Mesures collectees === */}
                        <Tabs.Panel value="measurements" p="md">
                            <h2 className="text-[13px] font-semibold text-slate-800 mb-3">
                                {t('campaigns.detail.measurements.title', {
                                    count: measurements.length,
                                })}
                            </h2>
                            {measurements.length === 0 ? (
                                <Alert
                                    color="slate"
                                    variant="light"
                                    icon={<IconInfoCircle size={14} />}
                                >
                                    {t('campaigns.detail.measurements.empty')}
                                </Alert>
                            ) : (
                                <>
                                    <DataTable
                                        value={measurements
                                            .slice()
                                            .sort((a, b) =>
                                                (b.measuredAt ?? '').localeCompare(
                                                    a.measuredAt ?? '',
                                                ),
                                            )}
                                        size="small"
                                        stripedRows
                                        responsiveLayout="scroll"
                                        paginator
                                        rows={10}
                                        rowsPerPageOptions={[10, 25, 50]}
                                        className="text-[12.5px]"
                                    >
                                        <Column
                                            field="measuredAt"
                                            header={t('campaigns.detail.measurements.cols.measuredAt')}
                                            sortable
                                            body={(row: AmbientMeasurementDTO) =>
                                                formatDateTime(row.measuredAt)
                                            }
                                        />
                                        <Column
                                            field="measurementPointId"
                                            header={t('campaigns.detail.measurements.cols.point')}
                                            body={(row: AmbientMeasurementDTO) => {
                                                const p = coveredPoints.find(
                                                    (cp) => Number(cp.id) === Number(row.measurementPointId),
                                                );
                                                return (
                                                    <span className="font-mono text-[11.5px]">
                                                        {p ? `${p.code} — ${p.label}` : `#${row.measurementPointId}`}
                                                    </span>
                                                );
                                            }}
                                        />
                                        <Column
                                            field="value"
                                            header={t('campaigns.detail.measurements.cols.value')}
                                            sortable
                                            align="right"
                                            body={(row: AmbientMeasurementDTO) => (
                                                <span
                                                    className={`font-mono text-[12px] tabular-nums ${
                                                        row.aboveReferenceLevel
                                                            ? 'text-red-700 font-semibold'
                                                            : 'text-slate-800'
                                                    }`}
                                                >
                                                    {Number(row.value).toFixed(2)}
                                                </span>
                                            )}
                                        />
                                        <Column
                                            field="context"
                                            header={t('campaigns.detail.measurements.cols.context')}
                                            body={(row: AmbientMeasurementDTO) =>
                                                t(`ambient.context.${row.context}`, {
                                                    defaultValue: row.context,
                                                })
                                            }
                                        />
                                        <Column
                                            field="instrumentSerial"
                                            header={t('campaigns.detail.measurements.cols.instrument')}
                                            body={(row: AmbientMeasurementDTO) =>
                                                row.instrumentSerial ?? '—'
                                            }
                                        />
                                    </DataTable>

                                    {/* Mini-chart par point */}
                                    <div className="mt-6 space-y-4">
                                        {coveredPoints.map((p) => {
                                            const list = (measurementsByPoint.get(Number(p.id ?? 0)) ?? [])
                                                .slice()
                                                .sort((a, b) =>
                                                    (a.measuredAt ?? '').localeCompare(
                                                        b.measuredAt ?? '',
                                                    ),
                                                );
                                            if (list.length < 2) return null;
                                            const data = list.map((m) => ({
                                                t: formatDateTime(m.measuredAt),
                                                value: Number(m.value),
                                            }));
                                            return (
                                                <div
                                                    key={p.id}
                                                    className="bg-slate-50 rounded-lg p-3 border border-slate-100"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[12px] font-semibold text-slate-700">
                                                            <span className="font-mono mr-1">{p.code}</span>
                                                            — {p.label}
                                                        </span>
                                                        {p.referenceLevel != null && (
                                                            <span className="text-[10.5px] text-slate-500">
                                                                {t('campaigns.detail.measurements.refLabel')}{' '}
                                                                {Number(p.referenceLevel).toFixed(2)} µSv/h
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ width: '100%', height: 180 }}>
                                                        <ResponsiveContainer>
                                                            <LineChart data={data} margin={{ left: 4, right: 4 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                                <XAxis
                                                                    dataKey="t"
                                                                    tick={{ fontSize: 9 }}
                                                                    hide
                                                                />
                                                                <YAxis tick={{ fontSize: 10 }} />
                                                                <RTooltip
                                                                    contentStyle={{ fontSize: 11 }}
                                                                    formatter={(v: number) =>
                                                                        `${Number(v).toFixed(2)} µSv/h`
                                                                    }
                                                                />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="value"
                                                                    stroke="#6366f1"
                                                                    strokeWidth={1.6}
                                                                    dot={false}
                                                                />
                                                                {p.referenceLevel != null && (
                                                                    <ReferenceLine
                                                                        y={Number(p.referenceLevel)}
                                                                        stroke="#dc2626"
                                                                        strokeDasharray="3 3"
                                                                        ifOverflow="extendDomain"
                                                                    />
                                                                )}
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </Tabs.Panel>

                        {/* === Rapport === */}
                        <Tabs.Panel value="report" p="md">
                            <h2 className="text-[13px] font-semibold text-slate-800 mb-3">
                                {t('campaigns.detail.report.title')}
                            </h2>
                            <p className="text-[12.5px] text-slate-600 leading-relaxed mb-4 max-w-2xl">
                                {t('campaigns.detail.report.description')}
                            </p>
                            <div className="flex items-center gap-2 mb-3">
                                <Button
                                    color="indigo"
                                    leftSection={<IconFileText size={14} />}
                                    onClick={handleGenerateReport}
                                    loading={reportLoading}
                                >
                                    {t('campaigns.detail.report.generate')}
                                </Button>
                                {reportText && (
                                    <Button
                                        variant="default"
                                        leftSection={<IconDeviceFloppy size={14} />}
                                        onClick={() => {
                                            const blob = new Blob([reportText], {
                                                type: 'text/plain;charset=utf-8',
                                            });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `campaign-${campaign.code ?? campaign.id}-report.txt`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                    >
                                        {t('campaigns.detail.report.download')}
                                    </Button>
                                )}
                            </div>
                            {reportText ? (
                                <pre className="bg-slate-50 border border-slate-200 rounded p-3 text-[11.5px] text-slate-700 leading-relaxed font-mono max-h-[500px] overflow-auto">
                                    {reportText}
                                </pre>
                            ) : (
                                <Alert
                                    color="slate"
                                    variant="light"
                                    icon={<IconInfoCircle size={14} />}
                                >
                                    {t('campaigns.detail.report.empty')}
                                </Alert>
                            )}
                        </Tabs.Panel>

                        {/* === Timeline audit === */}
                        <Tabs.Panel value="audit" p="md">
                            <h2 className="text-[13px] font-semibold text-slate-800 mb-3">
                                {t('campaigns.detail.audit.title', { count: auditLogs.length })}
                            </h2>
                            {auditLogs.length === 0 ? (
                                <Alert
                                    color="slate"
                                    variant="light"
                                    icon={<IconInfoCircle size={14} />}
                                >
                                    {t('campaigns.detail.audit.empty')}
                                </Alert>
                            ) : (
                                <ol className="relative border-l border-slate-200 ml-3 space-y-3">
                                    {auditLogs.map((log) => (
                                        <li key={log.id ?? `${log.action}-${log.timestamp}`} className="ml-5">
                                            <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                                            <div className="bg-slate-50 border border-slate-100 rounded px-3 py-2">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-[12px] font-semibold text-slate-800">
                                                        {log.action}
                                                    </span>
                                                    <span className="text-[10.5px] text-slate-500 inline-flex items-center gap-1">
                                                        <IconClock size={10} />
                                                        {formatDateTime(log.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-[11.5px] text-slate-600 leading-snug">
                                                    {log.details ?? '—'}
                                                </p>
                                                <p className="text-[10.5px] text-slate-400 mt-1">
                                                    {t('campaigns.detail.audit.user')} #{log.userId}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </Tabs.Panel>
                    </Tabs>
                </div>

                {/* ─── Footer ─── */}
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                        <IconShieldCheck size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5">
                            {t('campaigns.detail.footer.title')}
                        </p>
                        <p>{t('campaigns.detail.footer.note')}</p>
                    </div>
                </div>
            </div>

            {/* ─── Modal mesure ─── */}
            <AmbientMeasurementForm
                opened={measureModalOpen}
                onClose={() => setMeasureModalOpen(false)}
                mineId={mineId}
                lockedCampaignId={Number(campaignId)}
                pointIdAllowList={
                    coveredPoints
                        .map((p) => Number(p.id ?? 0))
                        .filter((n) => n > 0)
                }
                pointsOverride={coveredPoints}
                onSuccess={() => {
                    void fetchAll();
                }}
            />

            {/* ─── Modal confirmation transition ─── */}
            <Modal
                opened={confirmModal != null}
                onClose={() => setConfirmModal(null)}
                title={
                    confirmModal != null
                        ? t(`campaigns.detail.confirm.${confirmModal.kind}.title`)
                        : ''
                }
                size="md"
                centered
            >
                {confirmModal != null && (
                    <>
                        <Alert
                            color={
                                confirmModal.kind === 'cancel'
                                    ? 'red'
                                    : confirmModal.kind === 'complete'
                                    ? 'emerald'
                                    : 'amber'
                            }
                            variant="light"
                            icon={
                                confirmModal.kind === 'cancel' ? (
                                    <IconAlertOctagon size={14} />
                                ) : confirmModal.kind === 'complete' ? (
                                    <IconCircleCheck size={14} />
                                ) : (
                                    <IconActivity size={14} />
                                )
                            }
                            mb="sm"
                        >
                            {t(`campaigns.detail.confirm.${confirmModal.kind}.message`)}
                        </Alert>
                        <div className="flex justify-end gap-2">
                            <Button variant="default" onClick={() => setConfirmModal(null)}>
                                {t('campaigns.detail.confirm.cancel')}
                            </Button>
                            <Button
                                color={
                                    confirmModal.kind === 'cancel'
                                        ? 'red'
                                        : confirmModal.kind === 'complete'
                                        ? 'emerald'
                                        : 'amber'
                                }
                                onClick={() => void performTransition(confirmModal.kind)}
                                loading={actionLoading === confirmModal.kind}
                            >
                                {t(`campaigns.detail.confirm.${confirmModal.kind}.confirm`)}
                            </Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-component : InfoRow
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 border-b border-slate-50 py-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 min-w-[140px]">
                {label}
            </span>
            <span className="text-[12.5px] text-slate-800 flex-1">{value}</span>
        </div>
    );
}

export default MonitoringCampaignDetailPage;
