/**
 * MeasurementPointsPage — Phase 6 Frontend-A (LOT Dosimetrie & Expositions).
 *
 * Registre des points fixes de mesure d'ambiance H*(10) pour une mine.
 *
 * Route : /dosimetry/measurement-points
 *
 * Layout :
 *   - Breadcrumb premium
 *   - Hero card gradient indigo/violet/fuchsia + 4 KPI tiles
 *       Total points / Surveilles (SURVEILLED) / Controles (CONTROLLED) / Inactifs
 *   - Toolbar : recherche live + filtres (mine, zone classification, etat actif/inactif)
 *   - DataTable PrimeReact : Code | Label | Zone classification (badge) |
 *                            Reference (uSv/h) | Derniere mesure | Tendance (sparkline) | Actions
 *   - Bouton "+ Nouveau point"
 *   - Click row -> /dosimetry/measurement-points/detail/:id
 *
 * Source de donnees :
 *   GET /hns/dosimetry/measurement-point/search?mineId=X
 *   GET /hns/dosimetry/ambient-measurement/by-point?measurementPointId=X (par point pour sparkline)
 *
 * i18n : namespace `dosimetry` -> bloc `ambient.points`
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconBroadcast,
    IconChevronRight,
    IconSearch,
    IconPlus,
    IconEye,
    IconPencil,
    IconCircleCheck,
    IconAlertCircle,
    IconAlertOctagon,
    IconInfoCircle,
    IconFilter,
    IconMapPin,
    IconCircleX,
    IconMap,
    IconTable,
    IconLayoutGrid,
} from '@tabler/icons-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppSelector } from '../../slices/hooks';
import {
    listMeasurementPoints,
    listAmbientMeasurementsByPoint,
    type MeasurementPointDTO,
    type ZoneClass,
    type AmbientMeasurementDTO,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Types & helpers
// ─────────────────────────────────────────────────────────────────────────────

interface PointRow {
    id: number;
    code: string;
    label: string;
    zoneClassification: ZoneClass;
    referenceLevel: number | null;
    location: string;
    active: boolean;
    lastValue: number | null;
    lastMeasuredAt: string | null;
    aboveReference: boolean;
    spark: number[];
}

interface FiltersState {
    query: string;
    zoneClass: ZoneClass | 'all';
    status: 'all' | 'active' | 'inactive';
}

type ViewMode = 'table' | 'tiles';
const VIEW_MODE_STORAGE = 'safex.dosimetry.measurementPoints.viewMode';

const ZONE_CONFIG: Record<
    ZoneClass,
    {
        bg: string;
        border: string;
        text: string;
        dot: string;
        labelKey: string;
        icon: typeof IconCircleCheck;
    }
> = {
    NONE: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-700',
        dot: 'bg-slate-400',
        labelKey: 'ambient.zoneClass.NONE',
        icon: IconCircleCheck,
    },
    SURVEILLED: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        labelKey: 'ambient.zoneClass.SURVEILLED',
        icon: IconAlertCircle,
    },
    CONTROLLED: {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-800',
        dot: 'bg-red-600',
        labelKey: 'ambient.zoneClass.CONTROLLED',
        icon: IconAlertOctagon,
    },
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

// RBAC tolerant (aligne sur ExposedWorkersRegistryPage)
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
//  Sparkline SVG inline — pas de dependance externe
// ─────────────────────────────────────────────────────────────────────────────

function Sparkline({ values, color = '#6366f1' }: { values: number[]; color?: string }) {
    if (!values || values.length < 2) {
        return <span className="text-[10px] text-slate-400">—</span>;
    }
    const w = 80;
    const h = 24;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = w / (values.length - 1);
    const points = values
        .map((v, i) => {
            const x = i * stepX;
            const y = h - ((v - min) / range) * h;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    return (
        <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            className="block"
        >
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const MeasurementPointsPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector((state: any) => state.companySelection?.selectedCompanyId);

    const canWrite = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');

    const mineId: number = Number(selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1);

    const [rows, setRows] = useState<PointRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FiltersState>({
        query: '',
        zoneClass: 'all',
        status: 'all',
    });
    // Vue table OU tuiles, persiste en localStorage (preference user).
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        try {
            const v = localStorage.getItem(VIEW_MODE_STORAGE);
            return v === 'tiles' ? 'tiles' : 'table';
        } catch { return 'table'; }
    });
    useEffect(() => {
        try { localStorage.setItem(VIEW_MODE_STORAGE, viewMode); } catch { /* noop */ }
    }, [viewMode]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        listMeasurementPoints(mineId)
            .then(async (points: MeasurementPointDTO[]) => {
                if (cancelled) return;
                // Charger les dernieres mesures pour sparkline + derniere valeur.
                // Pour limiter le nombre d'appels, on parallelise mais avec un cap.
                const enriched: PointRow[] = await Promise.all(
                    points.map(async (p) => {
                        let lastValue: number | null = null;
                        let lastMeasuredAt: string | null = null;
                        let above = false;
                        let spark: number[] = [];
                        try {
                            const list: AmbientMeasurementDTO[] = await listAmbientMeasurementsByPoint(p.id ?? 0);
                            // backend renvoie generalement DESC sur measuredAt — on prend les 10 plus recentes.
                            const sortedDesc = [...list].sort((a, b) => {
                                const ta = new Date(a.measuredAt).getTime();
                                const tb = new Date(b.measuredAt).getTime();
                                return tb - ta;
                            });
                            const last10 = sortedDesc.slice(0, 10);
                            const first = last10[0];
                            if (first) {
                                lastValue = Number(first.value);
                                lastMeasuredAt = first.measuredAt;
                                above = Boolean(first.aboveReferenceLevel)
                                    || (p.referenceLevel != null && Number(first.value) > Number(p.referenceLevel));
                            }
                            // Ordre chronologique pour la sparkline.
                            spark = last10
                                .slice()
                                .reverse()
                                .map((m) => Number(m.value))
                                .filter((v) => !Number.isNaN(v));
                        } catch {
                            // ignore — la sparkline reste vide
                        }
                        return {
                            id: p.id ?? 0,
                            code: p.code ?? '',
                            label: p.label ?? '',
                            zoneClassification: (p.zoneClassification ?? 'NONE') as ZoneClass,
                            referenceLevel: p.referenceLevel != null ? Number(p.referenceLevel) : null,
                            location: p.location ?? '',
                            active: Boolean(p.active),
                            lastValue,
                            lastMeasuredAt,
                            aboveReference: above,
                            spark,
                        };
                    }),
                );
                if (!cancelled) setRows(enriched);
            })
            .catch(() => {
                if (cancelled) return;
                setRows([]);
                setLoadError(t('ambient.points.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [mineId, t]);

    // ───── KPI tiles ─────
    const kpi = useMemo(() => {
        const total = rows.length;
        const surveilled = rows.filter((r) => r.zoneClassification === 'SURVEILLED').length;
        const controlled = rows.filter((r) => r.zoneClassification === 'CONTROLLED').length;
        const inactive = rows.filter((r) => !r.active).length;
        return { total, surveilled, controlled, inactive };
    }, [rows]);

    // ───── Filtrage cote client ─────
    const filteredRows = useMemo(() => {
        const q = filters.query.trim().toLowerCase();
        return rows.filter((r) => {
            if (q) {
                const hay = `${r.code} ${r.label} ${r.location}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (filters.zoneClass !== 'all' && r.zoneClassification !== filters.zoneClass) {
                return false;
            }
            if (filters.status === 'active' && !r.active) return false;
            if (filters.status === 'inactive' && r.active) return false;
            return true;
        });
    }, [rows, filters]);

    // ───── Templates colonnes ─────
    const renderZone = (row: PointRow) => {
        const cfg = ZONE_CONFIG[row.zoneClassification];
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

    const renderReference = (row: PointRow) => (
        <span className="font-mono text-[12px] text-slate-700 tabular-nums">
            {formatUsvH(row.referenceLevel)}
            {row.referenceLevel != null && <span className="text-slate-400 text-[10px] ml-0.5">µSv/h</span>}
        </span>
    );

    const renderLastValue = (row: PointRow) => {
        if (row.lastValue == null) {
            return (
                <div className="flex flex-col">
                    <span className="text-[12px] text-slate-400 italic">{t('ambient.points.noMeasure')}</span>
                </div>
            );
        }
        return (
            <div className="flex flex-col leading-tight">
                <span
                    className={`font-mono text-[12.5px] tabular-nums font-semibold ${
                        row.aboveReference ? 'text-red-700' : 'text-slate-800'
                    }`}
                >
                    {formatUsvH(row.lastValue)}
                    <span className="text-slate-400 text-[10px] ml-0.5 font-normal">µSv/h</span>
                </span>
                <span className="text-[10px] text-slate-500">{formatDateTimeFr(row.lastMeasuredAt)}</span>
            </div>
        );
    };

    const renderSpark = (row: PointRow) => {
        if (!row.spark || row.spark.length < 2) {
            return <span className="text-[10px] text-slate-400">—</span>;
        }
        return (
            <Sparkline
                values={row.spark}
                color={row.aboveReference ? '#dc2626' : '#6366f1'}
            />
        );
    };

    const renderStatus = (row: PointRow) =>
        row.active ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-green-50 text-green-700 border border-green-200">
                <IconCircleCheck size={10} stroke={2} />
                {t('ambient.points.statusActive')}
            </span>
        ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <IconCircleX size={10} stroke={2} />
                {t('ambient.points.statusInactive')}
            </span>
        );

    const renderActions = (row: PointRow) => (
        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => navigate(`/dosimetry/measurement-points/detail/${row.id}`)}
                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title={t('ambient.points.actions.view')}
                aria-label={t('ambient.points.actions.view')}
            >
                <IconEye size={13} stroke={1.8} />
            </button>
            {canWrite && (
                <button
                    type="button"
                    onClick={() => navigate(`/dosimetry/measurement-points/edit/${row.id}`)}
                    className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    title={t('ambient.points.actions.edit')}
                    aria-label={t('ambient.points.actions.edit')}
                >
                    <IconPencil size={13} stroke={1.8} />
                </button>
            )}
        </div>
    );

    const emptyTemplate = (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center mb-4 shadow-sm">
                <IconBroadcast size={28} className="text-indigo-500" stroke={1.6} />
            </div>
            <p className="text-[14px] text-slate-800 font-semibold mb-1">
                {t('ambient.points.empty.title')}
            </p>
            <p className="text-[12.5px] text-slate-500 max-w-md mb-4 leading-relaxed">
                {t('ambient.points.empty.subtitle')}
            </p>
            {canWrite && (
                <button
                    type="button"
                    onClick={() => navigate('/dosimetry/measurement-points/new')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm font-medium"
                >
                    <IconPlus size={14} stroke={2} />
                    {t('ambient.points.empty.cta')}
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
                        {t('ambient.points.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('ambient.points.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('ambient.points.breadcrumbCurrent')}
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
                                <IconBroadcast size={22} stroke={1.8} className="text-white" />
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
                                    {t('ambient.points.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('ambient.points.subtitle')}
                                </p>
                            </div>
                        </div>

                        {/* KPI tiles */}
                        <div className="flex flex-wrap items-stretch gap-2">
                            <HeroKpi
                                label={t('ambient.points.kpi.total')}
                                value={kpi.total}
                                accent="indigo"
                                icon={<IconBroadcast size={13} stroke={1.8} />}
                            />
                            <HeroKpi
                                label={t('ambient.points.kpi.surveilled')}
                                value={kpi.surveilled}
                                accent="amber"
                                icon={<IconAlertCircle size={13} stroke={1.8} />}
                            />
                            <HeroKpi
                                label={t('ambient.points.kpi.controlled')}
                                value={kpi.controlled}
                                accent="red"
                                icon={<IconAlertOctagon size={13} stroke={1.8} />}
                                pulse={kpi.controlled > 0}
                            />
                            <HeroKpi
                                label={t('ambient.points.kpi.inactive')}
                                value={kpi.inactive}
                                accent="slate"
                                icon={<IconCircleX size={13} stroke={1.8} />}
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
                        {/* Recherche */}
                        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
                            <IconSearch
                                size={13}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                stroke={1.8}
                            />
                            <input
                                type="search"
                                value={filters.query}
                                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                                placeholder={t('ambient.points.toolbar.searchPlaceholder')}
                                aria-label={t('ambient.points.toolbar.searchAria')}
                                className="w-full pl-8 pr-3 py-1.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            />
                        </div>

                        <FilterSelect
                            ariaLabel={t('ambient.points.toolbar.filterZone')}
                            value={filters.zoneClass}
                            onChange={(v) => setFilters((f) => ({ ...f, zoneClass: v as FiltersState['zoneClass'] }))}
                            options={[
                                { value: 'all', label: t('ambient.points.toolbar.allZones') },
                                { value: 'SURVEILLED', label: t('ambient.zoneClass.SURVEILLED') },
                                { value: 'CONTROLLED', label: t('ambient.zoneClass.CONTROLLED') },
                                { value: 'NONE', label: t('ambient.zoneClass.NONE') },
                            ]}
                        />

                        <FilterSelect
                            ariaLabel={t('ambient.points.toolbar.filterStatus')}
                            value={filters.status}
                            onChange={(v) => setFilters((f) => ({ ...f, status: v as FiltersState['status'] }))}
                            options={[
                                { value: 'all', label: t('ambient.points.toolbar.allStatuses') },
                                { value: 'active', label: t('ambient.points.statusActive') },
                                { value: 'inactive', label: t('ambient.points.statusInactive') },
                            ]}
                        />

                        <div className="ml-auto flex items-center gap-2">
                            {/* Switch vue Tableau / Tuiles */}
                            <div className="inline-flex border border-slate-200 rounded-md overflow-hidden bg-white" role="tablist" aria-label="Mode d'affichage">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    aria-pressed={viewMode === 'table'}
                                    title="Vue tableau"
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] transition ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <IconTable size={13} stroke={1.8} />
                                    <span className="hidden sm:inline">Tableau</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('tiles')}
                                    aria-pressed={viewMode === 'tiles'}
                                    title="Vue tuiles"
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] transition border-l border-slate-200 ${viewMode === 'tiles' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <IconLayoutGrid size={13} stroke={1.8} />
                                    <span className="hidden sm:inline">Tuiles</span>
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/dosimetry/ambient-map')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 transition"
                                title={t('ambient.points.toolbar.openMap')}
                            >
                                <IconMap size={13} stroke={1.8} />
                                {t('ambient.points.toolbar.openMap')}
                            </button>
                            {canWrite && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/dosimetry/measurement-points/new')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                                >
                                    <IconPlus size={13} stroke={2} />
                                    {t('ambient.points.toolbar.addPoint')}
                                </button>
                            )}
                        </div>
                    </div>

                    {(filters.query || filters.zoneClass !== 'all' || filters.status !== 'all') && (
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                            <IconFilter size={11} stroke={1.8} />
                            <span>
                                {t('ambient.points.toolbar.activeFilters', {
                                    count: filteredRows.length,
                                    total: rows.length,
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setFilters({ query: '', zoneClass: 'all', status: 'all' })
                                }
                                className="ml-1 underline hover:text-indigo-600"
                            >
                                {t('ambient.points.toolbar.clearFilters')}
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── Vue Tuiles (alternative au tableau) ─── */}
                {viewMode === 'tiles' && !loading && (
                    <div className="mb-4">
                        {filteredRows.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
                                {emptyTemplate}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {filteredRows.map((row) => {
                                    const zone = ZONE_CONFIG[row.zoneClassification];
                                    return (
                                        <button
                                            key={row.id}
                                            type="button"
                                            onClick={() => navigate(`/dosimetry/measurement-points/detail/${row.id}`)}
                                            className={`group text-left bg-white border ${zone.border} rounded-xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all overflow-hidden`}
                                        >
                                            {/* Header colore selon zone */}
                                            <div className={`px-3 py-2 ${zone.bg} border-b ${zone.border} flex items-center justify-between gap-2`}>
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.10em] ${zone.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${zone.dot}`} />
                                                    {t(zone.labelKey)}
                                                </span>
                                                {row.active ? (
                                                    <IconCircleCheck size={13} className="text-emerald-600" stroke={2} />
                                                ) : (
                                                    <IconCircleX size={13} className="text-slate-400" stroke={2} />
                                                )}
                                            </div>
                                            {/* Corps tuile */}
                                            <div className="p-3 space-y-2">
                                                <div className="min-w-0">
                                                    <p className="font-mono text-[10.5px] text-slate-500 truncate">{row.code}</p>
                                                    <p className="text-[13px] text-slate-900 font-semibold leading-tight truncate" title={row.label}>{row.label}</p>
                                                    {row.location && (
                                                        <p className="text-[10.5px] text-slate-500 inline-flex items-center gap-1 truncate">
                                                            <IconMapPin size={9} stroke={1.6} />
                                                            {row.location}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-end justify-between gap-2">
                                                    <div className="leading-tight">
                                                        <p className="text-[9px] uppercase tracking-wider text-slate-500">{t('ambient.points.columns.lastMeasure')}</p>
                                                        {row.lastValue == null ? (
                                                            <p className="text-[12px] text-slate-400 italic">{t('ambient.points.noMeasure')}</p>
                                                        ) : (
                                                            <p className={`font-mono text-[15px] tabular-nums font-bold ${row.aboveReference ? 'text-red-700' : 'text-slate-800'}`}>
                                                                {formatUsvH(row.lastValue)}
                                                                <span className="text-[9px] text-slate-400 font-normal ml-0.5">µSv/h</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <Sparkline
                                                            values={row.spark}
                                                            color={row.aboveReference ? '#dc2626' : '#6366f1'}
                                                        />
                                                    </div>
                                                </div>
                                                {row.referenceLevel != null && (
                                                    <p className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
                                                        Réf. <span className="font-mono text-slate-700">{formatUsvH(row.referenceLevel)}</span> µSv/h
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── DataTable (vue par defaut) ─── */}
                {viewMode === 'table' && (
                <div className="safex-dosimetry-table bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="px-4 py-12 text-center text-slate-500 text-[13px]">
                            <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                            {t('ambient.points.loading')}
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
                            onRowClick={(e) => navigate(`/dosimetry/measurement-points/detail/${(e.data as PointRow).id}`)}
                            rowClassName={() => 'cursor-pointer'}
                            className="text-[12.5px]"
                        >
                            <Column
                                field="code"
                                header={t('ambient.points.columns.code')}
                                sortable
                                style={{ minWidth: 110 }}
                                body={(row: PointRow) => (
                                    <span className="font-mono text-[12px] text-slate-800 font-medium">{row.code}</span>
                                )}
                            />
                            <Column
                                field="label"
                                header={t('ambient.points.columns.label')}
                                sortable
                                style={{ minWidth: 200 }}
                                body={(row: PointRow) => (
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-slate-800 font-medium">{row.label}</span>
                                        {row.location && (
                                            <span className="text-[10.5px] text-slate-500 inline-flex items-center gap-1">
                                                <IconMapPin size={9} stroke={1.6} />
                                                {row.location}
                                            </span>
                                        )}
                                    </div>
                                )}
                            />
                            <Column
                                field="zoneClassification"
                                header={t('ambient.points.columns.zone')}
                                sortable
                                style={{ minWidth: 140 }}
                                body={renderZone}
                            />
                            <Column
                                field="referenceLevel"
                                header={t('ambient.points.columns.reference')}
                                sortable
                                style={{ width: 130 }}
                                body={renderReference}
                                align="right"
                            />
                            <Column
                                field="lastValue"
                                header={t('ambient.points.columns.lastMeasure')}
                                sortable
                                style={{ minWidth: 150 }}
                                body={renderLastValue}
                            />
                            <Column
                                header={t('ambient.points.columns.trend')}
                                style={{ width: 110 }}
                                body={renderSpark}
                            />
                            <Column
                                field="active"
                                header={t('ambient.points.columns.status')}
                                sortable
                                style={{ width: 110 }}
                                body={renderStatus}
                            />
                            <Column
                                header={t('ambient.points.columns.actions')}
                                style={{ width: 90 }}
                                body={renderActions}
                                align="right"
                            />
                        </DataTable>
                    )}
                </div>
                )}

                {/* Loading hors-vue tuile/table */}
                {viewMode === 'tiles' && loading && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-12 text-center text-slate-500 text-[13px] mb-4">
                        <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                        {t('ambient.points.loading')}
                    </div>
                )}

                {/* ─── Footer ISO/AIEA ─── */}
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                        <IconInfoCircle size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5">{t('ambient.points.footer.title')}</p>
                        <p>{t('ambient.points.footer.note')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

const KPI_ACCENT: Record<string, { bg: string; text: string; ring: string; iconBg: string }> = {
    indigo: { bg: 'bg-indigo-50/70', text: 'text-indigo-700', ring: 'border-indigo-200', iconBg: 'bg-white border-indigo-200 text-indigo-700' },
    violet: { bg: 'bg-violet-50/70', text: 'text-violet-700', ring: 'border-violet-200', iconBg: 'bg-white border-violet-200 text-violet-700' },
    amber:  { bg: 'bg-amber-50/70',  text: 'text-amber-700',  ring: 'border-amber-200',  iconBg: 'bg-white border-amber-200 text-amber-700' },
    red:    { bg: 'bg-red-50/70',    text: 'text-red-700',    ring: 'border-red-200',    iconBg: 'bg-white border-red-200 text-red-700' },
    slate:  { bg: 'bg-slate-50/70',  text: 'text-slate-700',  ring: 'border-slate-200',  iconBg: 'bg-white border-slate-200 text-slate-700' },
};

function HeroKpi({
    label, value, sub, accent, icon, pulse,
}: {
    label: string;
    value: number | string;
    sub?: string;
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
                {sub && <p className="text-[10px] text-slate-500 leading-none">{sub}</p>}
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

export default MeasurementPointsPage;
