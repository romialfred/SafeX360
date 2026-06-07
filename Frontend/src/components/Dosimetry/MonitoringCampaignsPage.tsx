/**
 * MonitoringCampaignsPage — Phase 6 Frontend-B (LOT Dosimetrie & Expositions).
 *
 * Liste premium des campagnes de surveillance d'ambiance H*(10) pour une mine.
 *
 * Route : /dosimetry/campaigns
 *
 * Layout :
 *   - Breadcrumb premium
 *   - Hero card gradient indigo/violet/fuchsia + 4 KPI tiles
 *       Total / ONGOING / COMPLETED / DRAFT
 *   - Filtres : status + mine (read-only au tenant courant) + responsable
 *   - DataTable PrimeReact :
 *       Code | Label | Status (badge) | Periode | Responsable | Points couverts |
 *       Progress (mesures realisees / nb points * jours) | Actions
 *   - Bouton "+ Nouvelle campagne"
 *   - Click row -> /dosimetry/campaigns/:id
 *
 * Sources :
 *   - listMonitoringCampaigns(mineId)
 *   - listMeasurementsByCampaign(id) (par campagne pour la progression)
 *   - getEmployeeDropdown() pour la resolution responsable
 *
 * i18n : namespace `dosimetry` -> bloc `campaigns.list`
 *
 * Contraintes : tsc strict + vite EXIT 0.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconClipboardList,
    IconChevronRight,
    IconSearch,
    IconPlus,
    IconEye,
    IconInfoCircle,
    IconFilter,
    IconCircleCheck,
    IconClock,
    IconAlertOctagon,
    IconPencil,
    IconUserCircle,
    IconCalendarTime,
    IconBroadcast,
} from '@tabler/icons-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppSelector } from '../../slices/hooks';
import {
    listMonitoringCampaigns,
    listMeasurementsByCampaign,
    type MonitoringCampaignDTO,
    type CampaignStatus,
} from '../../services/DosimetryService';
import { getEmployeeDropdown } from '../../services/EmployeeService';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC tolerant — aligne sur les autres pages Dosimetry
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
//  Types
// ─────────────────────────────────────────────────────────────────────────────

interface CampaignRow {
    id: number;
    code: string;
    label: string;
    status: CampaignStatus;
    startDate: string | null;
    endDate: string | null;
    responsibleId: number | null;
    responsibleName: string;
    pointsCount: number;
    measurementsCount: number;
    progress: number;
}

interface FiltersState {
    query: string;
    status: CampaignStatus | 'all';
    responsibleId: string;
}

interface EmployeeOption {
    id: number;
    label: string;
}

const STATUS_CONFIG: Record<
    CampaignStatus,
    { bg: string; border: string; text: string; dot: string; labelKey: string; icon: typeof IconCircleCheck }
> = {
    DRAFT: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-700',
        dot: 'bg-slate-400',
        labelKey: 'campaigns.status.DRAFT',
        icon: IconPencil,
    },
    ONGOING: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        dot: 'bg-amber-500',
        labelKey: 'campaigns.status.ONGOING',
        icon: IconClock,
    },
    COMPLETED: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        dot: 'bg-emerald-500',
        labelKey: 'campaigns.status.COMPLETED',
        icon: IconCircleCheck,
    },
    CANCELLED: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        dot: 'bg-red-500',
        labelKey: 'campaigns.status.CANCELLED',
        icon: IconAlertOctagon,
    },
};

const formatDateFr = (s: string | null | undefined): string => {
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

const computeProgress = (
    measurementsCount: number,
    pointsCount: number,
    status: CampaignStatus,
): number => {
    if (status === 'COMPLETED') return 100;
    if (status === 'DRAFT' || status === 'CANCELLED') return 0;
    if (pointsCount <= 0) return 0;
    // Heuristique : 1 mesure attendue par point sur la duree de la campagne
    // (le backend renverra une stat plus precise plus tard).
    const ratio = Math.min(1, measurementsCount / Math.max(1, pointsCount));
    return Math.round(ratio * 100);
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const MonitoringCampaignsPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector(
        (state: any) => state.companySelection?.selectedCompanyId,
    );

    const canPcr = hasDosimetryPermission(user, 'DOSIMETRY_PCR_RPO');

    const mineId: number = Number(
        selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1,
    );

    const [rows, setRows] = useState<CampaignRow[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FiltersState>({
        query: '',
        status: 'all',
        responsibleId: '',
    });

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);

        const employeesPromise = getEmployeeDropdown()
            .then((list: any) => {
                const arr: any[] = Array.isArray(list) ? list : (list?.content ?? []);
                return arr
                    .map((e) => ({
                        id: Number(e?.id ?? e?.employeeId ?? 0),
                        label: String(
                            e?.firstName && e?.lastName
                                ? `${e.firstName} ${e.lastName}`
                                : e?.fullName ?? e?.name ?? `#${e?.id ?? ''}`,
                        ),
                    }))
                    .filter((o) => o.id > 0);
            })
            .catch(() => [] as EmployeeOption[]);

        const campaignsPromise = listMonitoringCampaigns(mineId);

        Promise.all([campaignsPromise, employeesPromise])
            .then(async ([campaigns, emps]) => {
                if (cancelled) return;
                setEmployees(emps);
                const empMap = new Map<number, string>();
                emps.forEach((e) => empMap.set(e.id, e.label));

                const enriched: CampaignRow[] = await Promise.all(
                    campaigns.map(async (c: MonitoringCampaignDTO) => {
                        let measurementsCount = 0;
                        try {
                            if (c.id != null) {
                                const measurements = await listMeasurementsByCampaign(c.id);
                                measurementsCount = Array.isArray(measurements)
                                    ? measurements.length
                                    : 0;
                            }
                        } catch {
                            // ignore — progression reste a 0
                        }
                        const status: CampaignStatus = (c.status ?? 'DRAFT') as CampaignStatus;
                        const pts = Array.isArray(c.measurementPointIds)
                            ? c.measurementPointIds.length
                            : 0;
                        return {
                            id: Number(c.id ?? 0),
                            code: c.code ?? '',
                            label: c.label ?? '',
                            status,
                            startDate: c.startDate ?? null,
                            endDate: c.endDate ?? null,
                            responsibleId: c.responsibleId ?? null,
                            responsibleName:
                                c.responsibleId != null
                                    ? empMap.get(Number(c.responsibleId))
                                        ?? `#${c.responsibleId}`
                                    : '—',
                            pointsCount: pts,
                            measurementsCount,
                            progress: computeProgress(measurementsCount, pts, status),
                        };
                    }),
                );
                if (!cancelled) setRows(enriched);
            })
            .catch(() => {
                if (cancelled) return;
                setRows([]);
                setLoadError(t('campaigns.list.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [mineId, t]);

    // ─── KPI ───
    const kpi = useMemo(() => {
        const total = rows.length;
        const ongoing = rows.filter((r) => r.status === 'ONGOING').length;
        const completed = rows.filter((r) => r.status === 'COMPLETED').length;
        const draft = rows.filter((r) => r.status === 'DRAFT').length;
        return { total, ongoing, completed, draft };
    }, [rows]);

    // ─── Filtrage ───
    const filteredRows = useMemo(() => {
        const q = filters.query.trim().toLowerCase();
        return rows.filter((r) => {
            if (q) {
                const hay = `${r.code} ${r.label} ${r.responsibleName}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (filters.status !== 'all' && r.status !== filters.status) return false;
            if (
                filters.responsibleId
                && String(r.responsibleId ?? '') !== filters.responsibleId
            ) {
                return false;
            }
            return true;
        });
    }, [rows, filters]);

    // ─── Templates ───
    const renderStatus = (row: CampaignRow) => {
        const cfg = STATUS_CONFIG[row.status];
        const Icon = cfg.icon;
        return (
            <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.border} ${cfg.text} text-[10.5px] font-medium`}
                aria-label={t(cfg.labelKey)}
            >
                <Icon size={11} stroke={2} />
                {t(cfg.labelKey)}
            </span>
        );
    };

    const renderPeriod = (row: CampaignRow) => (
        <div className="flex flex-col leading-tight">
            <span className="text-[11.5px] text-slate-700 inline-flex items-center gap-1">
                <IconCalendarTime size={10} stroke={1.6} />
                {formatDateFr(row.startDate)}
            </span>
            {row.endDate && (
                <span className="text-[10px] text-slate-500">
                    {t('campaigns.list.toLabel')} {formatDateFr(row.endDate)}
                </span>
            )}
        </div>
    );

    const renderResponsible = (row: CampaignRow) => (
        <span className="inline-flex items-center gap-1 text-[12px] text-slate-700">
            <IconUserCircle size={12} stroke={1.6} className="text-slate-400" />
            {row.responsibleName}
        </span>
    );

    const renderPoints = (row: CampaignRow) => (
        <span className="font-mono text-[12px] text-slate-700 tabular-nums">
            {row.pointsCount}
        </span>
    );

    const renderProgress = (row: CampaignRow) => {
        const pct = Math.max(0, Math.min(100, row.progress));
        const color =
            row.status === 'COMPLETED'
                ? 'bg-emerald-500'
                : row.status === 'ONGOING'
                ? 'bg-amber-500'
                : 'bg-slate-300';
        return (
            <div className="flex flex-col gap-0.5 min-w-[100px]">
                <div className="w-full h-1.5 rounded bg-slate-100 overflow-hidden">
                    <div
                        className={`h-full ${color} transition-all`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className="text-[10.5px] text-slate-500 tabular-nums">
                    {pct}% — {row.measurementsCount}/{row.pointsCount || 0}
                </span>
            </div>
        );
    };

    const renderActions = (row: CampaignRow) => (
        <div
            className="inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                onClick={() => navigate(`/dosimetry/campaigns/${row.id}`)}
                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title={t('campaigns.list.actions.view')}
                aria-label={t('campaigns.list.actions.view')}
            >
                <IconEye size={13} stroke={1.8} />
            </button>
        </div>
    );

    const emptyTemplate = (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center mb-4 shadow-sm">
                <IconClipboardList size={28} className="text-indigo-500" stroke={1.6} />
            </div>
            <p className="text-[14px] text-slate-800 font-semibold mb-1">
                {t('campaigns.list.empty.title')}
            </p>
            <p className="text-[12.5px] text-slate-500 max-w-md mb-4 leading-relaxed">
                {t('campaigns.list.empty.subtitle')}
            </p>
            {canPcr && (
                <button
                    type="button"
                    onClick={() => navigate('/dosimetry/campaigns/new')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm font-medium"
                >
                    <IconPlus size={14} stroke={2} />
                    {t('campaigns.list.empty.cta')}
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">

                {/* ─── Breadcrumb premium ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('campaigns.list.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('campaigns.list.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('campaigns.list.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero card ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                <IconClipboardList size={22} stroke={1.8} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-slate-900 leading-tight"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(22px, 2.4vw, 28px)',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {t('campaigns.list.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('campaigns.list.subtitle')}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-stretch gap-2">
                            <HeroKpi
                                label={t('campaigns.list.kpi.total')}
                                value={kpi.total}
                                accent="indigo"
                                icon={<IconClipboardList size={13} stroke={1.8} />}
                            />
                            <HeroKpi
                                label={t('campaigns.list.kpi.ongoing')}
                                value={kpi.ongoing}
                                accent="amber"
                                icon={<IconClock size={13} stroke={1.8} />}
                                pulse={kpi.ongoing > 0}
                            />
                            <HeroKpi
                                label={t('campaigns.list.kpi.completed')}
                                value={kpi.completed}
                                accent="emerald"
                                icon={<IconCircleCheck size={13} stroke={1.8} />}
                            />
                            <HeroKpi
                                label={t('campaigns.list.kpi.draft')}
                                value={kpi.draft}
                                accent="slate"
                                icon={<IconPencil size={13} stroke={1.8} />}
                            />
                        </div>
                    </div>
                </div>

                {/* ─── Banner erreur ─── */}
                {loadError && (
                    <div
                        className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]"
                        role="alert"
                    >
                        <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Toolbar ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
                            <IconSearch
                                size={13}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                stroke={1.8}
                            />
                            <input
                                type="search"
                                value={filters.query}
                                onChange={(e) =>
                                    setFilters((f) => ({ ...f, query: e.target.value }))
                                }
                                placeholder={t('campaigns.list.toolbar.searchPlaceholder')}
                                aria-label={t('campaigns.list.toolbar.searchAria')}
                                className="w-full pl-8 pr-3 py-1.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            />
                        </div>

                        <FilterSelect
                            ariaLabel={t('campaigns.list.toolbar.filterStatus')}
                            value={filters.status}
                            onChange={(v) =>
                                setFilters((f) => ({
                                    ...f,
                                    status: v as FiltersState['status'],
                                }))
                            }
                            options={[
                                { value: 'all', label: t('campaigns.list.toolbar.allStatuses') },
                                { value: 'DRAFT', label: t('campaigns.status.DRAFT') },
                                { value: 'ONGOING', label: t('campaigns.status.ONGOING') },
                                { value: 'COMPLETED', label: t('campaigns.status.COMPLETED') },
                                { value: 'CANCELLED', label: t('campaigns.status.CANCELLED') },
                            ]}
                        />

                        <FilterSelect
                            ariaLabel={t('campaigns.list.toolbar.filterResponsible')}
                            value={filters.responsibleId}
                            onChange={(v) =>
                                setFilters((f) => ({ ...f, responsibleId: v }))
                            }
                            options={[
                                { value: '', label: t('campaigns.list.toolbar.allResponsibles') },
                                ...employees.map((e) => ({
                                    value: String(e.id),
                                    label: e.label,
                                })),
                            ]}
                        />

                        <div className="ml-auto flex items-center gap-2">
                            {canPcr && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/dosimetry/campaigns/new')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                                >
                                    <IconPlus size={13} stroke={2} />
                                    {t('campaigns.list.toolbar.addCampaign')}
                                </button>
                            )}
                        </div>
                    </div>

                    {(filters.query
                        || filters.status !== 'all'
                        || filters.responsibleId) && (
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                            <IconFilter size={11} stroke={1.8} />
                            <span>
                                {t('campaigns.list.toolbar.activeFilters', {
                                    count: filteredRows.length,
                                    total: rows.length,
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setFilters({ query: '', status: 'all', responsibleId: '' })
                                }
                                className="ml-1 underline hover:text-indigo-600"
                            >
                                {t('campaigns.list.toolbar.clearFilters')}
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── DataTable ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="px-4 py-12 text-center text-slate-500 text-[13px]">
                            <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                            {t('campaigns.list.loading')}
                        </div>
                    ) : (
                        <DataTable
                            value={filteredRows}
                            dataKey="id"
                            size="small"
                            stripedRows
                            paginator
                            rows={15}
                            rowsPerPageOptions={[10, 15, 25, 50]}
                            rowHover
                            responsiveLayout="scroll"
                            emptyMessage={emptyTemplate}
                            onRowClick={(e) =>
                                navigate(
                                    `/dosimetry/campaigns/${(e.data as CampaignRow).id}`,
                                )
                            }
                            rowClassName={() => 'cursor-pointer'}
                            className="text-[12.5px]"
                        >
                            <Column
                                field="code"
                                header={t('campaigns.list.columns.code')}
                                sortable
                                style={{ minWidth: 130 }}
                                body={(row: CampaignRow) => (
                                    <span className="font-mono text-[12px] text-slate-800 font-medium">
                                        {row.code}
                                    </span>
                                )}
                            />
                            <Column
                                field="label"
                                header={t('campaigns.list.columns.label')}
                                sortable
                                style={{ minWidth: 220 }}
                                body={(row: CampaignRow) => (
                                    <span className="text-slate-800 font-medium">{row.label}</span>
                                )}
                            />
                            <Column
                                field="status"
                                header={t('campaigns.list.columns.status')}
                                sortable
                                style={{ minWidth: 140 }}
                                body={renderStatus}
                            />
                            <Column
                                field="startDate"
                                header={t('campaigns.list.columns.period')}
                                sortable
                                style={{ minWidth: 150 }}
                                body={renderPeriod}
                            />
                            <Column
                                field="responsibleName"
                                header={t('campaigns.list.columns.responsible')}
                                sortable
                                style={{ minWidth: 170 }}
                                body={renderResponsible}
                            />
                            <Column
                                field="pointsCount"
                                header={t('campaigns.list.columns.points')}
                                sortable
                                style={{ width: 110 }}
                                body={renderPoints}
                                align="right"
                            />
                            <Column
                                field="progress"
                                header={t('campaigns.list.columns.progress')}
                                sortable
                                style={{ width: 160 }}
                                body={renderProgress}
                            />
                            <Column
                                header={t('campaigns.list.columns.actions')}
                                style={{ width: 80 }}
                                body={renderActions}
                                align="right"
                            />
                        </DataTable>
                    )}
                </div>

                {/* ─── Footer ─── */}
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                        <IconInfoCircle size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5">
                            {t('campaigns.list.footer.title')}
                        </p>
                        <p>{t('campaigns.list.footer.note')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

const KPI_ACCENT: Record<
    string,
    { bg: string; text: string; ring: string; iconBg: string }
> = {
    indigo: { bg: 'bg-indigo-50/70', text: 'text-indigo-700', ring: 'border-indigo-200', iconBg: 'bg-white border-indigo-200 text-indigo-700' },
    amber:   { bg: 'bg-amber-50/70',   text: 'text-amber-700',   ring: 'border-amber-200',   iconBg: 'bg-white border-amber-200 text-amber-700' },
    emerald: { bg: 'bg-emerald-50/70', text: 'text-emerald-700', ring: 'border-emerald-200', iconBg: 'bg-white border-emerald-200 text-emerald-700' },
    slate:   { bg: 'bg-slate-50/70',   text: 'text-slate-700',   ring: 'border-slate-200',   iconBg: 'bg-white border-slate-200 text-slate-700' },
};

function HeroKpi({
    label, value, accent, icon, pulse,
}: {
    label: string;
    value: number | string;
    accent: keyof typeof KPI_ACCENT;
    icon?: React.ReactNode;
    pulse?: boolean;
}) {
    const tone = KPI_ACCENT[accent];
    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${tone.bg} ${tone.ring} ${
                pulse ? 'animate-[pulse_2.4s_ease-in-out_infinite]' : ''
            }`}
        >
            {icon && (
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${tone.iconBg}`}>
                    {icon}
                </div>
            )}
            <div>
                <p className={`text-[10px] uppercase tracking-[0.14em] ${tone.text} leading-none font-semibold`}>
                    {label}
                </p>
                <p className="text-[15px] text-slate-800 font-mono font-bold leading-tight mt-0.5">
                    {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                </p>
            </div>
        </div>
    );
}

function FilterSelect({
    ariaLabel, value, onChange, options,
}: {
    ariaLabel: string;
    value: string;
    onChange: (next: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            aria-label={ariaLabel}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-2 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

export default MonitoringCampaignsPage;
