/**
 * AmbientMonitoringMapPage — Phase 6 Frontend-A (LOT Dosimetrie & Expositions).
 *
 * Vue cartographique synthetique des points de mesure d'ambiance d'une mine.
 * Comme aucune librairie cartographique n'est embarquee, l'implementation
 * fallback est une **grid heatmap** stylisee : chaque point devient une cellule
 * coloree selon le dernier debit de dose mesure.
 *
 * Echelle de couleur (uSv/h) :
 *   vert    < 0.5
 *   jaune   0.5 - 1.0
 *   orange  1.0 - 2.0
 *   rouge   > 2.0
 *
 * Si latitude/longitude sont definies pour les points, on dispose les cellules
 * sur une grille pseudo-geographique (normalisee min/max). Sinon, repli sur une
 * grille reguliere.
 *
 * Route : /dosimetry/ambient-map
 *
 * Filtres : zone classification + periode d'agregation (24h / 7j / 30j) +
 *           recherche par code/label.
 *
 * i18n : namespace `dosimetry` -> bloc `ambient.map`
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconBroadcast,
    IconChevronRight,
    IconSearch,
    IconAlertOctagon,
    IconAlertTriangle,
    IconBell,
    IconCheck,
    IconHelpCircle,
    IconInfoCircle,
    IconMap2,
    IconRadar,
    IconRulerMeasure,
    IconFilter,
    IconArrowsMaximize,
    IconList,
} from '@tabler/icons-react';
import type { Icon as TablerIcon } from '@tabler/icons-react';
import { Badge } from '@mantine/core';
import { useAppSelector } from '../../slices/hooks';
import {
    listMeasurementPoints,
    listAmbientMeasurementsByPoint,
    type MeasurementPointDTO,
    type AmbientMeasurementDTO,
    type ZoneClass,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Types & helpers
// ─────────────────────────────────────────────────────────────────────────────

type HeatBand = 'green' | 'yellow' | 'orange' | 'red' | 'gray';

interface HeatCell {
    id: number;
    code: string;
    label: string;
    location: string;
    zoneClassification: ZoneClass;
    referenceLevel: number | null;
    latitude: number | null;
    longitude: number | null;
    lastValue: number | null;
    avgValue: number | null;
    maxValue: number | null;
    sampleCount: number;
    lastMeasuredAt: string | null;
    band: HeatBand;
    aboveReference: boolean;
}

interface FiltersState {
    query: string;
    zoneClass: ZoneClass | 'all';
    period: '24h' | '7d' | '30d';
}

const PERIOD_MS: Record<FiltersState['period'], number> = {
    '24h': 24 * 3600 * 1000,
    '7d': 7 * 24 * 3600 * 1000,
    '30d': 30 * 24 * 3600 * 1000,
};

const BAND_COLOR: Record<HeatBand, { bg: string; border: string; text: string; chip: string }> = {
    green:  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900', chip: 'bg-emerald-500' },
    yellow: { bg: 'bg-amber-100',   border: 'border-amber-300',   text: 'text-amber-900',   chip: 'bg-amber-500' },
    orange: { bg: 'bg-orange-200',  border: 'border-orange-400',  text: 'text-orange-900',  chip: 'bg-orange-500' },
    red:    { bg: 'bg-red-200',     border: 'border-red-400',     text: 'text-red-900',     chip: 'bg-red-600' },
    gray:   { bg: 'bg-slate-100',   border: 'border-slate-300',   text: 'text-slate-700',   chip: 'bg-slate-400' },
};

/**
 * WCAG 1.4.1 (use of color) — chaque bande est associee a une icone distincte ET
 * une cle semantique. La couleur ne doit jamais etre le SEUL canal d'information.
 *   red    -> IconAlertOctagon  (critical)
 *   orange -> IconAlertTriangle (alert)
 *   yellow -> IconBell          (warning)
 *   green  -> IconCheck         (nominal)
 *   gray   -> IconHelpCircle    (no-data)
 */
const BAND_ICON: Record<HeatBand, TablerIcon> = {
    green:  IconCheck,
    yellow: IconBell,
    orange: IconAlertTriangle,
    red:    IconAlertOctagon,
    gray:   IconHelpCircle,
};

const BAND_SEMANTIC: Record<HeatBand, 'nominal' | 'warning' | 'alert' | 'critical' | 'no-data'> = {
    green:  'nominal',
    yellow: 'warning',
    orange: 'alert',
    red:    'critical',
    gray:   'no-data',
};

const computeBand = (value: number | null): HeatBand => {
    if (value == null || Number.isNaN(value)) return 'gray';
    if (value < 0.5) return 'green';
    if (value < 1.0) return 'yellow';
    if (value < 2.0) return 'orange';
    return 'red';
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
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return '—';
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const AmbientMonitoringMapPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector((state: any) => state.companySelection?.selectedCompanyId);
    const mineId: number = Number(selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1);

    const [cells, setCells] = useState<HeatCell[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FiltersState>({
        query: '',
        zoneClass: 'all',
        period: '7d',
    });
    const [hoverId, setHoverId] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        const since = new Date(Date.now() - PERIOD_MS[filters.period]);

        listMeasurementPoints(mineId)
            .then(async (points: MeasurementPointDTO[]) => {
                if (cancelled) return;
                const heatCells: HeatCell[] = await Promise.all(
                    points.map(async (p) => {
                        let lastValue: number | null = null;
                        let lastMeasuredAt: string | null = null;
                        let avgValue: number | null = null;
                        let maxValue: number | null = null;
                        let sampleCount = 0;
                        try {
                            const list: AmbientMeasurementDTO[] = await listAmbientMeasurementsByPoint(
                                p.id ?? 0,
                                since.toISOString(),
                                new Date().toISOString(),
                            );
                            if (list && list.length > 0) {
                                const sortedDesc = [...list].sort((a, b) => {
                                    const ta = new Date(a.measuredAt).getTime();
                                    const tb = new Date(b.measuredAt).getTime();
                                    return tb - ta;
                                });
                                lastValue = Number(sortedDesc[0].value);
                                lastMeasuredAt = sortedDesc[0].measuredAt;
                                const values = list.map((m) => Number(m.value)).filter((v) => !Number.isNaN(v));
                                if (values.length > 0) {
                                    avgValue = values.reduce((a, b) => a + b, 0) / values.length;
                                    maxValue = Math.max(...values);
                                    sampleCount = values.length;
                                }
                            }
                        } catch {
                            // ignore
                        }
                        const band = computeBand(lastValue);
                        const above = lastValue != null
                            && p.referenceLevel != null
                            && lastValue > Number(p.referenceLevel);
                        return {
                            id: p.id ?? 0,
                            code: p.code ?? '',
                            label: p.label ?? '',
                            location: p.location ?? '',
                            zoneClassification: (p.zoneClassification ?? 'NONE') as ZoneClass,
                            referenceLevel: p.referenceLevel != null ? Number(p.referenceLevel) : null,
                            latitude: p.latitude != null ? Number(p.latitude) : null,
                            longitude: p.longitude != null ? Number(p.longitude) : null,
                            lastValue,
                            avgValue,
                            maxValue,
                            sampleCount,
                            lastMeasuredAt,
                            band,
                            aboveReference: Boolean(above),
                        };
                    }),
                );
                if (!cancelled) setCells(heatCells);
            })
            .catch(() => {
                if (cancelled) return;
                setCells([]);
                setLoadError(t('ambient.map.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [mineId, filters.period, t]);

    // ───── Filtrage ─────
    const filteredCells = useMemo(() => {
        const q = filters.query.trim().toLowerCase();
        return cells.filter((c) => {
            if (q) {
                const hay = `${c.code} ${c.label} ${c.location}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (filters.zoneClass !== 'all' && c.zoneClassification !== filters.zoneClass) return false;
            return true;
        });
    }, [cells, filters]);

    // ───── Pseudo-coordonnees geo si lat/lon disponibles ─────
    const positions = useMemo(() => {
        const withGeo = filteredCells.filter((c) => c.latitude != null && c.longitude != null);
        if (withGeo.length < 2) {
            // Pas assez de geo : grille reguliere
            return null;
        }
        const lats = withGeo.map((c) => c.latitude as number);
        const lons = withGeo.map((c) => c.longitude as number);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const dLat = (maxLat - minLat) || 1;
        const dLon = (maxLon - minLon) || 1;
        const map = new Map<number, { x: number; y: number }>();
        withGeo.forEach((c) => {
            const x = ((c.longitude as number) - minLon) / dLon;
            const y = 1 - ((c.latitude as number) - minLat) / dLat; // inverser : nord = haut
            map.set(c.id, { x, y });
        });
        return { map, minLat, maxLat, minLon, maxLon };
    }, [filteredCells]);

    // ───── KPI ─────
    const kpi = useMemo(() => {
        const total = cells.length;
        const red = cells.filter((c) => c.band === 'red').length;
        const orange = cells.filter((c) => c.band === 'orange').length;
        const above = cells.filter((c) => c.aboveReference).length;
        return { total, red, orange, above };
    }, [cells]);

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1500px] mx-auto">

                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">{t('ambient.map.breadcrumbRoot')}</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">{t('ambient.map.breadcrumbParent')}</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('ambient.map.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                <IconRadar size={22} stroke={1.8} className="text-white" />
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
                                    {t('ambient.map.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('ambient.map.subtitle')}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-stretch gap-2">
                            <MiniTile label={t('ambient.map.kpi.total')} value={kpi.total} tone="indigo" />
                            <MiniTile label={t('ambient.map.kpi.orange')} value={kpi.orange} tone="orange" />
                            <MiniTile label={t('ambient.map.kpi.red')} value={kpi.red} tone="red" pulse={kpi.red > 0} />
                            <MiniTile label={t('ambient.map.kpi.aboveReference')} value={kpi.above} tone="violet" />
                        </div>
                    </div>
                </div>

                {/* ─── Erreur ─── */}
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
                                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                                placeholder={t('ambient.map.toolbar.searchPlaceholder')}
                                aria-label={t('ambient.map.toolbar.searchAria')}
                                className="w-full pl-8 pr-3 py-1.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            />
                        </div>

                        <FilterSelect
                            ariaLabel={t('ambient.map.toolbar.filterZone')}
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
                            ariaLabel={t('ambient.map.toolbar.filterPeriod')}
                            value={filters.period}
                            onChange={(v) => setFilters((f) => ({ ...f, period: v as FiltersState['period'] }))}
                            options={[
                                { value: '24h', label: t('ambient.map.period.h24') },
                                { value: '7d', label: t('ambient.map.period.d7') },
                                { value: '30d', label: t('ambient.map.period.d30') },
                            ]}
                        />

                        <div className="ml-auto flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/dosimetry/measurement-points')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                            >
                                <IconList size={13} stroke={1.8} />
                                {t('ambient.map.toolbar.openRegistry')}
                            </button>
                        </div>
                    </div>

                    {(filters.query || filters.zoneClass !== 'all') && (
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                            <IconFilter size={11} stroke={1.8} />
                            <span>
                                {t('ambient.map.toolbar.activeFilters', {
                                    count: filteredCells.length,
                                    total: cells.length,
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={() => setFilters({ query: '', zoneClass: 'all', period: filters.period })}
                                className="ml-1 underline hover:text-indigo-600"
                            >
                                {t('ambient.map.toolbar.clearFilters')}
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── Carte / Heatmap ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-4">
                    {loading ? (
                        <div className="px-4 py-16 text-center text-slate-500 text-[13px]">
                            <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                            {t('ambient.map.loading')}
                        </div>
                    ) : filteredCells.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <IconMap2 size={36} className="text-indigo-300 mb-3" stroke={1.4} />
                            <p className="text-[14px] text-slate-700 font-semibold mb-1">
                                {t('ambient.map.empty.title')}
                            </p>
                            <p className="text-[12.5px] text-slate-500 max-w-md">
                                {t('ambient.map.empty.subtitle')}
                            </p>
                        </div>
                    ) : positions ? (
                        <GeoHeatmap
                            cells={filteredCells}
                            positions={positions.map}
                            onClick={(id) => navigate(`/dosimetry/measurement-points/detail/${id}`)}
                            hoverId={hoverId}
                            setHoverId={setHoverId}
                        />
                    ) : (
                        <GridHeatmap
                            cells={filteredCells}
                            onClick={(id) => navigate(`/dosimetry/measurement-points/detail/${id}`)}
                            hoverId={hoverId}
                            setHoverId={setHoverId}
                        />
                    )}
                </div>

                {/* ─── Legende ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <IconRulerMeasure size={14} className="text-indigo-600" />
                        <span className="text-[12.5px] font-semibold text-slate-700">
                            {t('ambient.map.legend.title')}
                        </span>
                        <span className="text-[11px] text-slate-500">{t('ambient.map.legend.subtitle')}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <LegendItem band="green" label={t('ambient.map.legend.green')} />
                        <LegendItem band="yellow" label={t('ambient.map.legend.yellow')} />
                        <LegendItem band="orange" label={t('ambient.map.legend.orange')} />
                        <LegendItem band="red" label={t('ambient.map.legend.red')} />
                        <LegendItem band="gray" label={t('ambient.map.legend.gray')} />
                    </div>
                </div>

                {/* ─── Footer ─── */}
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                        <IconInfoCircle size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5">{t('ambient.map.footer.title')}</p>
                        <p>{t('ambient.map.footer.note')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

const MINI_TONE: Record<string, { bg: string; text: string; border: string }> = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

function MiniTile({ label, value, tone, pulse }: { label: string; value: number; tone: keyof typeof MINI_TONE; pulse?: boolean }) {
    const cls = MINI_TONE[tone];
    return (
        <div
            className={`px-3 py-2 rounded-xl border ${cls.bg} ${cls.border} ${pulse ? 'motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]' : ''}`}
        >
            <p className={`text-[10px] uppercase tracking-[0.14em] font-semibold ${cls.text} leading-none`}>{label}</p>
            <p className="text-[15px] text-slate-800 font-mono font-bold leading-tight mt-0.5">
                {value.toLocaleString('fr-FR')}
            </p>
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
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    );
}

function LegendItem({ band, label }: { band: HeatBand; label: string }) {
    const cls = BAND_COLOR[band];
    const Icon = BAND_ICON[band];
    const semantic = BAND_SEMANTIC[band];
    return (
        <span
            className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-700"
            data-band={semantic}
        >
            <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded ${cls.chip} border border-white shadow-sm text-white`}
                aria-hidden="true"
            >
                <Icon size={11} stroke={2.2} />
            </span>
            <span>{label}</span>
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Geo heatmap : layout pseudo-cartographique base sur lat/lon
// ─────────────────────────────────────────────────────────────────────────────

function GeoHeatmap({
    cells, positions, onClick, hoverId, setHoverId,
}: {
    cells: HeatCell[];
    positions: Map<number, { x: number; y: number }>;
    onClick: (id: number) => void;
    hoverId: number | null;
    setHoverId: (id: number | null) => void;
}) {
    const { t } = useTranslation('dosimetry');
    return (
        <div
            className="relative w-full rounded-lg border border-slate-200 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"
            style={{ aspectRatio: '16 / 9', minHeight: 360 }}
        >
            {/* Grille de fond */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden="true"
            >
                <defs>
                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>

            {/* Points */}
            {cells.map((c) => {
                const pos = positions.get(c.id);
                if (!pos) return null;
                const cls = BAND_COLOR[c.band];
                const Icon = BAND_ICON[c.band];
                const semantic = BAND_SEMANTIC[c.band];
                const isHover = hoverId === c.id;
                const size = c.band === 'red' ? 28 : c.band === 'orange' ? 24 : 20;
                const iconSize = c.band === 'red' ? 16 : c.band === 'orange' ? 14 : 12;
                return (
                    <button
                        type="button"
                        key={c.id}
                        onClick={() => onClick(c.id)}
                        onMouseEnter={() => setHoverId(c.id)}
                        onMouseLeave={() => setHoverId(null)}
                        onFocus={() => setHoverId(c.id)}
                        onBlur={() => setHoverId(null)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition-transform flex items-center justify-center text-white ${cls.chip} ${
                            c.band === 'red' ? 'motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]' : ''
                        } ${isHover ? 'scale-125 ring-2 ring-indigo-400 ring-offset-2' : ''}`}
                        style={{
                            left: `${pos.x * 100}%`,
                            top: `${pos.y * 100}%`,
                            width: size,
                            height: size,
                        }}
                        data-band={semantic}
                        aria-label={`${c.code} ${c.label} - ${formatUsvH(c.lastValue)} µSv/h - ${semantic}`}
                    >
                        <Icon size={iconSize} stroke={2.2} aria-hidden="true" />
                        <span className="sr-only">{c.code}</span>
                    </button>
                );
            })}

            {/* Popup hover */}
            {hoverId != null && (() => {
                const c = cells.find((x) => x.id === hoverId);
                const pos = positions.get(hoverId);
                if (!c || !pos) return null;
                const cls = BAND_COLOR[c.band];
                return (
                    <div
                        className="absolute z-10 pointer-events-none"
                        style={{
                            left: `${pos.x * 100}%`,
                            top: `${pos.y * 100}%`,
                            transform: `translate(-50%, calc(-100% - 18px))`,
                        }}
                    >
                        <div className={`min-w-[200px] max-w-[260px] rounded-lg border ${cls.border} bg-white shadow-lg p-2.5 text-[11.5px]`}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className={`w-2.5 h-2.5 rounded-full ${cls.chip}`} />
                                <span className="font-mono font-semibold text-slate-800">{c.code}</span>
                            </div>
                            <p className="text-slate-700 font-medium mb-1 truncate">{c.label}</p>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600">
                                <span className="text-slate-500">{t('ambient.map.popup.last')}</span>
                                <span className="font-mono text-right">{formatUsvH(c.lastValue)} µSv/h</span>
                                <span className="text-slate-500">{t('ambient.map.popup.avg')}</span>
                                <span className="font-mono text-right">{formatUsvH(c.avgValue)} µSv/h</span>
                                <span className="text-slate-500">{t('ambient.map.popup.max')}</span>
                                <span className="font-mono text-right">{formatUsvH(c.maxValue)} µSv/h</span>
                                <span className="text-slate-500">{t('ambient.map.popup.samples')}</span>
                                <span className="font-mono text-right">{c.sampleCount}</span>
                            </div>
                            <p className="text-[10.5px] text-slate-400 mt-1 truncate">
                                {formatDateTimeFr(c.lastMeasuredAt)}
                            </p>
                            {c.aboveReference && (
                                <Badge color="red" size="xs" mt={4} variant="light" leftSection={<IconAlertOctagon size={9} />}>
                                    {t('ambient.map.popup.aboveReference')}
                                </Badge>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Hint */}
            <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[10.5px] text-slate-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-200">
                <IconArrowsMaximize size={10} />
                {t('ambient.map.hint.geo')}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Grid heatmap : grille reguliere quand pas de coordonnees
// ─────────────────────────────────────────────────────────────────────────────

function GridHeatmap({
    cells, onClick, hoverId, setHoverId,
}: {
    cells: HeatCell[];
    onClick: (id: number) => void;
    hoverId: number | null;
    setHoverId: (id: number | null) => void;
}) {
    const { t } = useTranslation('dosimetry');
    return (
        <div>
            <div className="grid gap-2"
                style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                }}
            >
                {cells.map((c) => {
                    const cls = BAND_COLOR[c.band];
                    const Icon = BAND_ICON[c.band];
                    const semantic = BAND_SEMANTIC[c.band];
                    const isHover = hoverId === c.id;
                    return (
                        <button
                            type="button"
                            key={c.id}
                            onClick={() => onClick(c.id)}
                            onMouseEnter={() => setHoverId(c.id)}
                            onMouseLeave={() => setHoverId(null)}
                            onFocus={() => setHoverId(c.id)}
                            onBlur={() => setHoverId(null)}
                            className={`text-left p-3 rounded-lg border-2 ${cls.bg} ${cls.border} ${cls.text} transition-transform motion-safe:hover:-translate-y-0.5 hover:shadow-md ${
                                c.band === 'red' ? 'motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]' : ''
                            } ${isHover ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
                            data-band={semantic}
                            aria-label={`${c.code} ${c.label} - ${formatUsvH(c.lastValue)} µSv/h - ${semantic}`}
                        >
                            <div className="flex items-start justify-between gap-1 mb-1">
                                <span className="font-mono text-[11.5px] font-semibold">{c.code}</span>
                                <span
                                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${cls.chip} border border-white text-white`}
                                    aria-hidden="true"
                                >
                                    <Icon size={11} stroke={2.2} />
                                </span>
                            </div>
                            <p className="text-[11.5px] font-medium leading-tight truncate">{c.label}</p>
                            <p className="font-mono text-[15px] font-bold leading-tight mt-1 tabular-nums">
                                {formatUsvH(c.lastValue)}
                                <span className="text-[10px] font-normal opacity-70 ml-0.5">µSv/h</span>
                            </p>
                            <p className="text-[10px] mt-0.5 opacity-70 truncate">
                                {c.sampleCount > 0
                                    ? t('ambient.map.cell.samples', { count: c.sampleCount })
                                    : t('ambient.map.cell.noData')}
                            </p>
                            {c.aboveReference && (
                                <span className="inline-flex items-center gap-0.5 text-[9.5px] mt-1 font-semibold">
                                    <IconAlertOctagon size={10} />
                                    {t('ambient.map.cell.aboveReference')}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-[10.5px] text-slate-500">
                <IconBroadcast size={10} />
                {t('ambient.map.hint.grid')}
            </div>
        </div>
    );
}

export default AmbientMonitoringMapPage;
