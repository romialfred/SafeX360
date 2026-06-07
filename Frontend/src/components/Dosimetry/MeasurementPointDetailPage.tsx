/**
 * MeasurementPointDetailPage — Phase 6 Frontend-A (LOT Dosimetrie & Expositions).
 *
 * Vue 360 d'un point de mesure d'ambiance :
 *   - Header avec badge zone + boutons activer / desactiver (RBAC DOSIMETRY_WRITE)
 *   - Section "Infos generales" (edition inline minimaliste)
 *   - Section "Statistiques 30j" : min/max/avg/median + nb depassements
 *   - Section "Historique des mesures" :
 *       * DataTable PrimeReact des 100 dernieres mesures
 *       * Recharts LineChart sur 6 mois avec ReferenceLine = referenceLevel
 *   - Bouton "+ Enregistrer mesure" -> modal AmbientMeasurementForm
 *
 * Route : /dosimetry/measurement-points/detail/:id
 *
 * Sources :
 *   GET  /hns/dosimetry/measurement-point/detail/{id}
 *   GET  /hns/dosimetry/ambient-measurement/by-point?measurementPointId={id}
 *   GET  /hns/dosimetry/ambient-measurement/stats?measurementPointId={id}&from=...&to=...
 *   POST /hns/dosimetry/ambient-measurement/record
 *   POST /hns/dosimetry/measurement-point/activate|deactivate
 *
 * i18n : namespace `dosimetry` -> bloc `ambient.detail`
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Paper,
    Group,
    Button,
    Badge,
    Modal,
    Select,
    NumberInput,
    Textarea,
    TextInput,
    Text,
    Tooltip,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
    IconBroadcast,
    IconChevronRight,
    IconArrowLeft,
    IconPencil,
    IconDeviceFloppy,
    IconCircleCheck,
    IconCircleX,
    IconAlertOctagon,
    IconAlertCircle,
    IconInfoCircle,
    IconHistory,
    IconPlus,
    IconMapPin,
    IconRulerMeasure,
    IconChartLine,
    IconShieldCheck,
    IconActivity,
    IconArrowUpRight,
    IconArrowDownRight,
} from '@tabler/icons-react';
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
import { useAppDispatch, useAppSelector } from '../../slices/hooks';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import {
    getMeasurementPoint,
    updateMeasurementPoint,
    activateMeasurementPoint,
    deactivateMeasurementPoint,
    listAmbientMeasurementsByPoint,
    getAmbientMeasurementStats,
    recordAmbientMeasurement,
    type MeasurementPointDTO,
    type AmbientMeasurementDTO,
    type AmbientMeasurementStatsDTO,
    type MeasurementContext,
    type ZoneClass,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ZONE_CONFIG: Record<ZoneClass, { color: string; labelKey: string }> = {
    NONE: { color: 'gray', labelKey: 'ambient.zoneClass.NONE' },
    SURVEILLED: { color: 'yellow', labelKey: 'ambient.zoneClass.SURVEILLED' },
    CONTROLLED: { color: 'red', labelKey: 'ambient.zoneClass.CONTROLLED' },
};

const formatUsvH = (v: number | null | undefined): string => {
    if (v == null || Number.isNaN(Number(v))) return '—';
    return Number(v).toFixed(2);
};

const formatDateTimeFr = (s: string | null | undefined): string => {
    if (!s) return '—';
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
};

const monthKey = (s: string): string => {
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    } catch {
        return s;
    }
};

function hasDosimetryPermission(user: any, permission: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    const candidates: string[] = [];
    if (Array.isArray(user.permissions)) candidates.push(...user.permissions);
    if (Array.isArray(user.authorities)) candidates.push(...user.authorities.map((a: any) => a?.authority ?? a));
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (typeof user.role === 'string') candidates.push(user.role);
    return candidates.includes(permission);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const MeasurementPointDetailPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const params = useParams();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector((state: any) => state.companySelection?.selectedCompanyId);

    const canWrite = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');
    const mineId: number = Number(selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1);

    const pointId = params?.id ? Number(params.id) : null;

    const [point, setPoint] = useState<MeasurementPointDTO | null>(null);
    const [measurements, setMeasurements] = useState<AmbientMeasurementDTO[]>([]);
    const [stats, setStats] = useState<AmbientMeasurementStatsDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [recordModalOpen, setRecordModalOpen] = useState(false);
    const [recordSubmitting, setRecordSubmitting] = useState(false);

    // Inline edition (infos generales)
    const [editing, setEditing] = useState(false);
    const [draftLabel, setDraftLabel] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [draftLocation, setDraftLocation] = useState('');
    const [draftReference, setDraftReference] = useState<number | ''>('');

    // ───── Chargement ─────
    const reload = useCallback(async () => {
        if (pointId == null || Number.isNaN(pointId)) return;
        setLoading(true);
        setLoadError(null);
        try {
            const now = new Date();
            const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
            const fromIso = from.toISOString();
            const toIso = now.toISOString();
            const [p, ms, st] = await Promise.all([
                getMeasurementPoint(pointId),
                listAmbientMeasurementsByPoint(pointId),
                getAmbientMeasurementStats(pointId, fromIso, toIso).catch(() => null),
            ]);
            setPoint(p);
            // Tri DESC sur measuredAt
            const sorted = [...ms].sort((a, b) => {
                const ta = new Date(a.measuredAt).getTime();
                const tb = new Date(b.measuredAt).getTime();
                return tb - ta;
            });
            setMeasurements(sorted);
            setStats(st);
            // Synchronise les drafts edition
            setDraftLabel(p.label ?? '');
            setDraftDescription(p.description ?? '');
            setDraftLocation(p.location ?? '');
            setDraftReference(p.referenceLevel != null ? Number(p.referenceLevel) : '');
        } catch (err: any) {
            setLoadError(err?.response?.data?.message ?? err?.message ?? t('ambient.detail.loadError'));
        } finally {
            setLoading(false);
        }
    }, [pointId, t]);

    useEffect(() => {
        reload();
    }, [reload]);

    // ───── Donnees graphique 6 mois (agregat mensuel: moyenne) ─────
    const chartData = useMemo(() => {
        if (!measurements || measurements.length === 0) return [];
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recent = measurements.filter((m) => {
            try {
                return new Date(m.measuredAt).getTime() >= sixMonthsAgo.getTime();
            } catch {
                return false;
            }
        });
        const byMonth = new Map<string, number[]>();
        recent.forEach((m) => {
            const k = monthKey(m.measuredAt);
            const arr = byMonth.get(k) ?? [];
            arr.push(Number(m.value));
            byMonth.set(k, arr);
        });
        const out: { period: string; avg: number; max: number; min: number }[] = [];
        Array.from(byMonth.keys()).sort().forEach((k) => {
            const values = byMonth.get(k) ?? [];
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            out.push({
                period: k,
                avg: Number(avg.toFixed(3)),
                max: Number(Math.max(...values).toFixed(3)),
                min: Number(Math.min(...values).toFixed(3)),
            });
        });
        return out;
    }, [measurements]);

    // ───── Actions ─────
    const handleActivateToggle = async () => {
        if (!point || pointId == null) return;
        dispatch(showOverlay());
        try {
            if (point.active) {
                await deactivateMeasurementPoint(pointId);
                successNotification(t('ambient.detail.toggleDeactivated'));
            } else {
                await activateMeasurementPoint(pointId);
                successNotification(t('ambient.detail.toggleActivated'));
            }
            await reload();
        } catch (err: any) {
            errorNotification(err?.response?.data?.message ?? err?.message ?? t('ambient.detail.toggleError'));
        } finally {
            dispatch(hideOverlay());
        }
    };

    const handleSaveEdit = async () => {
        if (!point || pointId == null) return;
        if (!draftLabel.trim()) {
            errorNotification(t('ambient.detail.errors.labelRequired'));
            return;
        }
        if (draftReference !== '' && draftReference != null) {
            const n = Number(draftReference);
            if (Number.isNaN(n) || n <= 0) {
                errorNotification(t('ambient.detail.errors.referencePositive'));
                return;
            }
        }
        dispatch(showOverlay());
        try {
            const payload: MeasurementPointDTO = {
                ...point,
                label: draftLabel.trim(),
                description: draftDescription.trim() || null,
                location: draftLocation.trim() || null,
                referenceLevel: draftReference !== '' && draftReference != null ? Number(draftReference) : null,
            };
            await updateMeasurementPoint(pointId, payload);
            successNotification(t('ambient.detail.saveSuccess'));
            setEditing(false);
            await reload();
        } catch (err: any) {
            errorNotification(err?.response?.data?.message ?? err?.message ?? t('ambient.detail.saveError'));
        } finally {
            dispatch(hideOverlay());
        }
    };

    // ───── Render ─────
    if (loading && !point) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
                <div className="w-full">
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-[13px]">
                        <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                        {t('ambient.detail.loading')}
                    </div>
                </div>
            </div>
        );
    }

    if (loadError && !point) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
                <div className="max-w-[900px] mx-auto bg-white border border-red-200 rounded-xl p-8 text-center">
                    <IconAlertOctagon size={28} className="text-red-500 mx-auto mb-2" />
                    <p className="text-slate-700 text-[14px] mb-3">{loadError}</p>
                    <Button variant="default" leftSection={<IconArrowLeft size={13} />}
                        onClick={() => navigate('/dosimetry/measurement-points')}>
                        {t('ambient.detail.backToList')}
                    </Button>
                </div>
            </div>
        );
    }

    if (!point) return null;
    const zoneCfg = ZONE_CONFIG[(point.zoneClassification ?? 'NONE') as ZoneClass];

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">

                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">{t('ambient.points.breadcrumbRoot')}</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/measurement-points')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-600 transition"
                    >
                        {t('ambient.points.breadcrumbCurrent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {point.code}
                    </span>
                </div>

                {/* ─── Header ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                <IconBroadcast size={22} stroke={1.8} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center flex-wrap gap-2">
                                    <h1
                                        className="text-slate-900 leading-tight"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 'clamp(20px, 2.2vw, 26px)',
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        {point.label}
                                    </h1>
                                    <Badge color={zoneCfg.color} variant="light" size="sm">
                                        {t(zoneCfg.labelKey)}
                                    </Badge>
                                    {point.active ? (
                                        <Badge color="green" variant="light" leftSection={<IconCircleCheck size={11} />}>
                                            {t('ambient.points.statusActive')}
                                        </Badge>
                                    ) : (
                                        <Badge color="gray" variant="light" leftSection={<IconCircleX size={11} />}>
                                            {t('ambient.points.statusInactive')}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    <span className="font-mono text-slate-700 mr-2">{point.code}</span>
                                    {point.location && (
                                        <span className="inline-flex items-center gap-1">
                                            <IconMapPin size={11} stroke={1.6} />
                                            {point.location}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <Group gap="xs">
                            <Button
                                variant="default"
                                size="xs"
                                leftSection={<IconArrowLeft size={13} stroke={1.8} />}
                                onClick={() => navigate('/dosimetry/measurement-points')}
                            >
                                {t('ambient.detail.backToList')}
                            </Button>
                            {canWrite && (
                                <>
                                    <Button
                                        variant="default"
                                        size="xs"
                                        leftSection={point.active ? <IconCircleX size={13} /> : <IconCircleCheck size={13} />}
                                        color={point.active ? 'red' : 'green'}
                                        onClick={handleActivateToggle}
                                    >
                                        {point.active ? t('ambient.detail.deactivate') : t('ambient.detail.activate')}
                                    </Button>
                                    <Button
                                        size="xs"
                                        color="indigo"
                                        leftSection={<IconPlus size={13} />}
                                        onClick={() => setRecordModalOpen(true)}
                                    >
                                        {t('ambient.detail.recordMeasurement')}
                                    </Button>
                                </>
                            )}
                        </Group>
                    </div>
                </div>

                {/* ─── Section Infos generales ─── */}
                <Paper p="md" radius="md" withBorder className="bg-white mb-4">
                    <Group justify="space-between" mb="sm">
                        <div className="flex items-center gap-2">
                            <IconInfoCircle size={16} className="text-indigo-600" />
                            <Text fw={600} size="sm">{t('ambient.detail.generalInfo')}</Text>
                        </div>
                        {canWrite && !editing && (
                            <Button
                                size="xs"
                                variant="subtle"
                                color="indigo"
                                leftSection={<IconPencil size={12} />}
                                onClick={() => setEditing(true)}
                            >
                                {t('ambient.detail.edit')}
                            </Button>
                        )}
                        {editing && (
                            <Group gap="xs">
                                <Button
                                    size="xs"
                                    variant="default"
                                    onClick={() => {
                                        setEditing(false);
                                        setDraftLabel(point.label ?? '');
                                        setDraftDescription(point.description ?? '');
                                        setDraftLocation(point.location ?? '');
                                        setDraftReference(point.referenceLevel != null ? Number(point.referenceLevel) : '');
                                    }}
                                >
                                    {t('ambient.detail.cancel')}
                                </Button>
                                <Button
                                    size="xs"
                                    color="indigo"
                                    leftSection={<IconDeviceFloppy size={12} />}
                                    onClick={handleSaveEdit}
                                >
                                    {t('ambient.detail.save')}
                                </Button>
                            </Group>
                        )}
                    </Group>
                    {!editing ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12.5px]">
                            <DetailField label={t('ambient.detail.fields.code')} value={point.code} mono />
                            <DetailField label={t('ambient.detail.fields.label')} value={point.label} />
                            <DetailField
                                label={t('ambient.detail.fields.zone')}
                                value={t(zoneCfg.labelKey)}
                            />
                            <DetailField label={t('ambient.detail.fields.location')} value={point.location || '—'} />
                            <DetailField
                                label={t('ambient.detail.fields.coordinates')}
                                value={
                                    point.latitude != null && point.longitude != null
                                        ? `${Number(point.latitude).toFixed(5)}, ${Number(point.longitude).toFixed(5)}`
                                        : '—'
                                }
                                mono
                            />
                            <DetailField
                                label={t('ambient.detail.fields.referenceLevel')}
                                value={
                                    point.referenceLevel != null
                                        ? `${formatUsvH(Number(point.referenceLevel))} µSv/h`
                                        : '—'
                                }
                                mono
                            />
                            {point.description && (
                                <div className="md:col-span-3">
                                    <DetailField label={t('ambient.detail.fields.description')} value={point.description} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput
                                label={t('ambient.detail.fields.label')}
                                value={draftLabel}
                                onChange={(e) => setDraftLabel(e.currentTarget.value)}
                                required
                            />
                            <TextInput
                                label={t('ambient.detail.fields.location')}
                                value={draftLocation}
                                onChange={(e) => setDraftLocation(e.currentTarget.value)}
                            />
                            <NumberInput
                                label={t('ambient.detail.fields.referenceLevel')}
                                value={draftReference}
                                onChange={(v) => setDraftReference(typeof v === 'number' ? v : '')}
                                decimalScale={3}
                                step={0.1}
                                min={0}
                                suffix=" µSv/h"
                            />
                            <div className="md:col-span-2">
                                <Textarea
                                    label={t('ambient.detail.fields.description')}
                                    value={draftDescription}
                                    onChange={(e) => setDraftDescription(e.currentTarget.value)}
                                    autosize
                                    minRows={2}
                                    maxRows={4}
                                />
                            </div>
                        </div>
                    )}
                </Paper>

                {/* ─── Section Statistiques 30j ─── */}
                <Paper p="md" radius="md" withBorder className="bg-white mb-4">
                    <Group mb="sm">
                        <IconActivity size={16} className="text-indigo-600" />
                        <Text fw={600} size="sm">{t('ambient.detail.stats30dTitle')}</Text>
                    </Group>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-[12.5px]">
                        <StatTile
                            label={t('ambient.detail.stats.count')}
                            value={stats?.count ?? 0}
                            accent="indigo"
                        />
                        <StatTile
                            label={t('ambient.detail.stats.min')}
                            value={formatUsvH(stats?.min)}
                            suffix="µSv/h"
                            accent="emerald"
                        />
                        <StatTile
                            label={t('ambient.detail.stats.avg')}
                            value={formatUsvH(stats?.avg)}
                            suffix="µSv/h"
                            accent="indigo"
                        />
                        <StatTile
                            label={t('ambient.detail.stats.median')}
                            value={formatUsvH(stats?.median)}
                            suffix="µSv/h"
                            accent="violet"
                        />
                        <StatTile
                            label={t('ambient.detail.stats.max')}
                            value={formatUsvH(stats?.max)}
                            suffix="µSv/h"
                            accent={
                                stats?.max != null && point.referenceLevel != null
                                    && Number(stats.max) > Number(point.referenceLevel)
                                    ? 'red' : 'amber'
                            }
                        />
                        <StatTile
                            label={t('ambient.detail.stats.overReference')}
                            value={stats?.overReferenceCount ?? 0}
                            accent={Number(stats?.overReferenceCount ?? 0) > 0 ? 'red' : 'slate'}
                            icon={<IconAlertOctagon size={12} />}
                        />
                        <StatTile
                            label={t('ambient.detail.stats.reference')}
                            value={formatUsvH(point.referenceLevel)}
                            suffix="µSv/h"
                            accent="slate"
                            icon={<IconRulerMeasure size={12} />}
                        />
                    </div>
                </Paper>

                {/* ─── Section Historique : Graphique + Table ─── */}
                <Paper p="md" radius="md" withBorder className="bg-white mb-4">
                    <Group mb="sm">
                        <IconChartLine size={16} className="text-indigo-600" />
                        <Text fw={600} size="sm">{t('ambient.detail.chart.title')}</Text>
                        <Text size="xs" c="dimmed">{t('ambient.detail.chart.subtitle')}</Text>
                    </Group>
                    {chartData.length < 2 ? (
                        <div className="px-4 py-10 text-center text-slate-500 text-[12.5px]">
                            {t('ambient.detail.chart.empty')}
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: 280 }}>
                            <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={11}
                                        label={{
                                            value: 'µSv/h',
                                            angle: -90,
                                            position: 'insideLeft',
                                            style: { fontSize: 11, fill: '#64748b' },
                                        }}
                                    />
                                    <RTooltip
                                        contentStyle={{
                                            fontSize: 12,
                                            borderRadius: 6,
                                            border: '1px solid #e2e8f0',
                                        }}
                                    />
                                    {point.referenceLevel != null && (
                                        <ReferenceLine
                                            y={Number(point.referenceLevel)}
                                            stroke="#ef4444"
                                            strokeDasharray="4 4"
                                            label={{
                                                value: t('ambient.detail.chart.referenceLabel'),
                                                position: 'right',
                                                fontSize: 10,
                                                fill: '#ef4444',
                                            }}
                                        />
                                    )}
                                    <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name={t('ambient.detail.chart.avg')} />
                                    <Line type="monotone" dataKey="max" stroke="#f97316" strokeWidth={1.2} strokeDasharray="3 3" dot={false} name={t('ambient.detail.chart.max')} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Paper>

                <Paper p="md" radius="md" withBorder className="bg-white mb-4">
                    <Group mb="sm">
                        <IconHistory size={16} className="text-indigo-600" />
                        <Text fw={600} size="sm">{t('ambient.detail.table.title')}</Text>
                        <Text size="xs" c="dimmed">
                            {t('ambient.detail.table.subtitle', { count: Math.min(measurements.length, 100) })}
                        </Text>
                    </Group>
                    <DataTable
                        value={measurements.slice(0, 100)}
                        dataKey="id"
                        size="small"
                        stripedRows
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        rowHover
                        responsiveLayout="scroll"
                        emptyMessage={
                            <div className="px-4 py-8 text-center text-slate-500 text-[12.5px]">
                                {t('ambient.detail.table.empty')}
                            </div>
                        }
                        className="text-[12.5px]"
                    >
                        <Column
                            field="measuredAt"
                            header={t('ambient.detail.table.cols.measuredAt')}
                            sortable
                            style={{ minWidth: 150 }}
                            body={(row: AmbientMeasurementDTO) => (
                                <span className="text-slate-700">{formatDateTimeFr(row.measuredAt)}</span>
                            )}
                        />
                        <Column
                            field="value"
                            header={t('ambient.detail.table.cols.value')}
                            sortable
                            style={{ width: 130 }}
                            body={(row: AmbientMeasurementDTO) => {
                                const above = Boolean(row.aboveReferenceLevel);
                                return (
                                    <span className={`font-mono tabular-nums font-semibold ${above ? 'text-red-700' : 'text-slate-800'}`}>
                                        {formatUsvH(Number(row.value))}
                                        <span className="text-slate-400 text-[10px] ml-0.5 font-normal">µSv/h</span>
                                    </span>
                                );
                            }}
                        />
                        <Column
                            field="uncertainty"
                            header={t('ambient.detail.table.cols.uncertainty')}
                            style={{ width: 120 }}
                            body={(row: AmbientMeasurementDTO) =>
                                row.uncertainty != null ? (
                                    <span className="font-mono text-slate-600">± {formatUsvH(Number(row.uncertainty))}</span>
                                ) : <span className="text-slate-400">—</span>
                            }
                        />
                        <Column
                            field="context"
                            header={t('ambient.detail.table.cols.context')}
                            sortable
                            style={{ minWidth: 140 }}
                            body={(row: AmbientMeasurementDTO) => (
                                <Badge color="indigo" variant="light" size="xs">
                                    {t(`ambient.context.${row.context}`)}
                                </Badge>
                            )}
                        />
                        <Column
                            field="instrumentSerial"
                            header={t('ambient.detail.table.cols.instrument')}
                            style={{ minWidth: 130 }}
                            body={(row: AmbientMeasurementDTO) =>
                                row.instrumentSerial
                                    ? <span className="font-mono text-[11.5px] text-slate-700">{row.instrumentSerial}</span>
                                    : <span className="text-slate-400">—</span>
                            }
                        />
                        <Column
                            field="trendVsPrevious"
                            header={t('ambient.detail.table.cols.trend')}
                            style={{ width: 110 }}
                            body={(row: AmbientMeasurementDTO) => {
                                if (row.trendVsPrevious == null) return <span className="text-slate-400 text-[10px]">—</span>;
                                const n = Number(row.trendVsPrevious);
                                if (Number.isNaN(n)) return <span className="text-slate-400 text-[10px]">—</span>;
                                const isUp = n > 0;
                                const pct = (n * 100).toFixed(1);
                                return (
                                    <span className={`inline-flex items-center gap-0.5 text-[11.5px] font-mono ${isUp ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {isUp ? <IconArrowUpRight size={11} /> : <IconArrowDownRight size={11} />}
                                        {pct}%
                                    </span>
                                );
                            }}
                        />
                        <Column
                            field="notes"
                            header={t('ambient.detail.table.cols.notes')}
                            style={{ minWidth: 200 }}
                            body={(row: AmbientMeasurementDTO) =>
                                row.notes
                                    ? <Tooltip label={row.notes} multiline w={260}>
                                        <span className="text-slate-700 truncate inline-block max-w-[180px]">{row.notes}</span>
                                      </Tooltip>
                                    : <span className="text-slate-400">—</span>
                            }
                        />
                    </DataTable>
                </Paper>

                {/* ─── Footer ─── */}
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                        <IconShieldCheck size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5">{t('ambient.detail.footer.title')}</p>
                        <p>{t('ambient.detail.footer.note')}</p>
                    </div>
                </div>
            </div>

            {/* ─── Modal "Enregistrer mesure" ─── */}
            <AmbientMeasurementForm
                opened={recordModalOpen}
                onClose={() => setRecordModalOpen(false)}
                pointId={pointId ?? 0}
                mineId={mineId}
                submitting={recordSubmitting}
                onSubmit={async (payload) => {
                    setRecordSubmitting(true);
                    try {
                        await recordAmbientMeasurement(payload);
                        successNotification(t('ambient.detail.recordSuccess'));
                        setRecordModalOpen(false);
                        await reload();
                    } catch (err: any) {
                        errorNotification(err?.response?.data?.message ?? err?.message ?? t('ambient.detail.recordError'));
                    } finally {
                        setRecordSubmitting(false);
                    }
                }}
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function DetailField({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-semibold leading-none">{label}</p>
            <p className={`mt-1 text-slate-800 ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</p>
        </div>
    );
}

const STAT_ACCENT: Record<string, { bg: string; border: string; text: string }> = {
    indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700' },
    violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700' },
    red:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700' },
    slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-700' },
};

function StatTile({
    label, value, suffix, accent, icon,
}: {
    label: string;
    value: number | string;
    suffix?: string;
    accent: keyof typeof STAT_ACCENT;
    icon?: React.ReactNode;
}) {
    const tone = STAT_ACCENT[accent];
    return (
        <div className={`rounded-lg border px-3 py-2 ${tone.bg} ${tone.border}`}>
            <div className={`flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-semibold ${tone.text}`}>
                {icon}
                {label}
            </div>
            <p className="text-[15px] text-slate-900 font-mono font-bold leading-tight mt-1 tabular-nums">
                {value}
                {suffix && <span className="text-[10px] text-slate-500 ml-1 font-normal">{suffix}</span>}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Modal AmbientMeasurementForm (defini dans le meme fichier — usage interne)
// ─────────────────────────────────────────────────────────────────────────────

interface AmbientMeasurementFormProps {
    opened: boolean;
    onClose: () => void;
    pointId: number;
    mineId: number;
    submitting: boolean;
    onSubmit: (payload: AmbientMeasurementDTO) => Promise<void>;
}

function AmbientMeasurementForm({
    opened, onClose, pointId, mineId, submitting, onSubmit,
}: AmbientMeasurementFormProps) {
    const { t } = useTranslation('dosimetry');
    const user = useAppSelector((state: any) => state.user);
    const userId = Number(user?.id ?? user?.userId ?? 0);

    const [value, setValue] = useState<number | ''>('');
    const [uncertainty, setUncertainty] = useState<number | ''>('');
    const [instrumentSerial, setInstrumentSerial] = useState('');
    const [context, setContext] = useState<MeasurementContext>('ROUTINE');
    const [notes, setNotes] = useState('');
    const [measuredAt, setMeasuredAt] = useState<Date | null>(new Date());

    useEffect(() => {
        if (opened) {
            setValue('');
            setUncertainty('');
            setInstrumentSerial('');
            setContext('ROUTINE');
            setNotes('');
            setMeasuredAt(new Date());
        }
    }, [opened]);

    const handleSubmit = async () => {
        if (value === '' || value == null) {
            errorNotification(t('ambient.detail.errors.valueRequired'));
            return;
        }
        const n = Number(value);
        if (Number.isNaN(n) || n <= 0) {
            errorNotification(t('ambient.detail.errors.valuePositive'));
            return;
        }
        if (!measuredAt) {
            errorNotification(t('ambient.detail.errors.measuredAtRequired'));
            return;
        }
        const payload: AmbientMeasurementDTO = {
            mineId,
            measurementPointId: pointId,
            measuredAt: measuredAt.toISOString(),
            measuredBy: userId || 0,
            value: n,
            uncertainty: uncertainty !== '' && uncertainty != null ? Number(uncertainty) : null,
            instrumentSerial: instrumentSerial.trim() || null,
            context,
            notes: notes.trim() || null,
        };
        await onSubmit(payload);
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <IconPlus size={16} className="text-indigo-600" />
                    <span className="font-semibold">{t('ambient.detail.recordMeasurement')}</span>
                </div>
            }
            size="lg"
            centered
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <NumberInput
                    label={t('ambient.detail.form.value')}
                    description={t('ambient.detail.form.valueDesc')}
                    placeholder="2.50"
                    value={value}
                    onChange={(v) => setValue(typeof v === 'number' ? v : '')}
                    decimalScale={3}
                    step={0.1}
                    min={0}
                    suffix=" µSv/h"
                    required
                    withAsterisk
                />
                <NumberInput
                    label={t('ambient.detail.form.uncertainty')}
                    description={t('ambient.detail.form.uncertaintyDesc')}
                    placeholder="0.05"
                    value={uncertainty}
                    onChange={(v) => setUncertainty(typeof v === 'number' ? v : '')}
                    decimalScale={3}
                    step={0.01}
                    min={0}
                />
                <DateTimePicker
                    label={t('ambient.detail.form.measuredAt')}
                    value={measuredAt}
                    onChange={(d) => setMeasuredAt(d as Date | null)}
                    required
                    withAsterisk
                    valueFormat="DD/MM/YYYY HH:mm"
                />
                <Select
                    label={t('ambient.detail.form.context')}
                    value={context}
                    onChange={(v) => setContext((v ?? 'ROUTINE') as MeasurementContext)}
                    data={[
                        { value: 'ROUTINE', label: t('ambient.context.ROUTINE') },
                        { value: 'CAMPAIGN', label: t('ambient.context.CAMPAIGN') },
                        { value: 'INCIDENT_RESPONSE', label: t('ambient.context.INCIDENT_RESPONSE') },
                        { value: 'COMMISSIONING', label: t('ambient.context.COMMISSIONING') },
                    ]}
                    required
                    withAsterisk
                />
                <TextInput
                    label={t('ambient.detail.form.instrument')}
                    description={t('ambient.detail.form.instrumentDesc')}
                    placeholder="SN-XXXX"
                    value={instrumentSerial}
                    onChange={(e) => setInstrumentSerial(e.currentTarget.value)}
                />
                <div className="md:col-span-2">
                    <Textarea
                        label={t('ambient.detail.form.notes')}
                        placeholder={t('ambient.detail.form.notesPlaceholder')}
                        value={notes}
                        onChange={(e) => setNotes(e.currentTarget.value)}
                        autosize
                        minRows={2}
                        maxRows={5}
                    />
                </div>
            </div>
            <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={onClose} disabled={submitting}>
                    {t('ambient.detail.cancel')}
                </Button>
                <Button
                    color="indigo"
                    leftSection={<IconDeviceFloppy size={14} />}
                    onClick={handleSubmit}
                    loading={submitting}
                >
                    {t('ambient.detail.form.submit')}
                </Button>
            </Group>
        </Modal>
    );
}

export default MeasurementPointDetailPage;
