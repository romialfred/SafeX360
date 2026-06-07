/**
 * DoseTrendChart — Tendances dosimetriques 12 mois (Phase 8 Frontend).
 *
 * <p>Recharts {@code LineChart} mensuel avec 3 series :
 *   - dose moyenne annuelle (bleu)
 *   - dose mediane (violet)
 *   - dose max (rouge)
 *
 * <p>Lignes de reference horizontales : 50% / 75% / 100% de la limite CIPR de la
 * categorie selectionnee. Toolbox tooltip enrichi + legende cliquable.
 *
 * <p>Donnees : {@code DosimetryTrendPointDTO[]} (1 entree par metrique x mois).
 * Le composant pivote les donnees pour produire la forme attendue par Recharts.
 */

import { memo, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RTooltip,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import type { DosimetryTrendPointDTO } from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DoseTrendChartProps {
    /** Serie temporelle pour chacune des 3 metriques (avg, median, max). */
    avg: DosimetryTrendPointDTO[];
    median: DosimetryTrendPointDTO[];
    max: DosimetryTrendPointDTO[];
    /** Limite reglementaire CIPR (mSv) pour la categorie selectionnee. */
    regulatoryLimit?: number | null;
    /** Hauteur du chart (default 320). */
    height?: number;
    /** Etat de chargement. */
    loading?: boolean;
    /** Libelles i18n des series (3 cles). */
    labels?: { avg?: string; median?: string; max?: string };
    /** Libelles i18n des lignes de reference. */
    refLabels?: { p50?: string; p75?: string; p100?: string };
    /** Unite affichee (default "mSv"). */
    unit?: string;
}

interface ChartRow {
    period: string;
    avgValue: number | null;
    medianValue: number | null;
    maxValue: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
    avg: '#2563eb',      // blue-600
    median: '#7c3aed',   // violet-600
    max: '#dc2626',      // red-600
    refP50: '#16a34a',   // green-600
    refP75: '#d97706',   // amber-600
    refP100: '#dc2626',  // red-600
};

const formatPeriodLabel = (period: string): string => {
    // "2026-03" -> "Mar 26"
    const [year, month] = period.split('-');
    if (!year || !month) return period;
    const monthIdx = parseInt(month, 10) - 1;
    if (monthIdx < 0 || monthIdx > 11) return period;
    const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[monthIdx]} ${year.slice(2)}`;
};

const toNumber = (v: number | null | undefined): number | null => {
    if (v == null) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Tooltip custom
// ─────────────────────────────────────────────────────────────────────────────

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number | null; color: string; name: string }>;
    label?: string;
    unit: string;
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-[12px]">
            <p className="font-semibold text-slate-800 mb-1">{label ? formatPeriodLabel(label) : '—'}</p>
            <div className="space-y-0.5">
                {payload.map((entry) => (
                    <div key={entry.dataKey} className="flex items-center gap-2">
                        <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                            aria-hidden="true"
                        />
                        <span className="text-slate-700">{entry.name}</span>
                        <span className="ml-auto font-mono font-semibold text-slate-900 tabular-nums">
                            {entry.value != null ? Number(entry.value).toFixed(2) : '—'} {unit}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

function DoseTrendChartImpl({
    avg,
    median,
    max,
    regulatoryLimit = null,
    height = 320,
    loading = false,
    labels,
    refLabels,
    unit = 'mSv',
}: DoseTrendChartProps) {
    // Pivot vers ChartRow[] : pour chaque period, on regroupe avg/median/max.
    const rows: ChartRow[] = useMemo(() => {
        const periods = new Set<string>();
        avg.forEach((p) => periods.add(p.period));
        median.forEach((p) => periods.add(p.period));
        max.forEach((p) => periods.add(p.period));
        const sorted = Array.from(periods).sort();
        const avgMap = new Map<string, number | null>(avg.map((p) => [p.period, toNumber(p.value)]));
        const medianMap = new Map<string, number | null>(median.map((p) => [p.period, toNumber(p.value)]));
        const maxMap = new Map<string, number | null>(max.map((p) => [p.period, toNumber(p.value)]));
        return sorted.map((period) => ({
            period,
            avgValue: avgMap.get(period) ?? null,
            medianValue: medianMap.get(period) ?? null,
            maxValue: maxMap.get(period) ?? null,
        }));
    }, [avg, median, max]);

    const labelAvg = labels?.avg ?? 'Dose moyenne';
    const labelMedian = labels?.median ?? 'Dose mediane';
    const labelMax = labels?.max ?? 'Dose max';
    const labelP50 = refLabels?.p50 ?? '50% limite';
    const labelP75 = refLabels?.p75 ?? '75% limite';
    const labelP100 = refLabels?.p100 ?? 'Limite CIPR';

    // Loading state
    if (loading) {
        return (
            <div
                className="w-full bg-slate-50 rounded-lg flex items-center justify-center animate-pulse"
                style={{ height }}
            >
                <span className="text-slate-400 text-[12px]">Chargement de la tendance…</span>
            </div>
        );
    }

    // Empty state
    if (rows.length === 0 || rows.every((r) => r.avgValue == null && r.medianValue == null && r.maxValue == null)) {
        return (
            <div
                className="w-full bg-slate-50 rounded-lg flex flex-col items-center justify-center gap-1"
                style={{ height }}
            >
                <span className="text-slate-500 text-[13px] font-medium">Aucune donnee de tendance disponible</span>
                <span className="text-slate-400 text-[11px]">
                    Les KPI mensuels apparaitront ici des qu'un snapshot sera produit.
                </span>
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="period"
                        tickFormatter={formatPeriodLabel}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                        unit={` ${unit}`}
                    />
                    <RTooltip content={<CustomTooltip unit={unit} />} />
                    <Legend
                        verticalAlign="top"
                        height={28}
                        iconType="line"
                        wrapperStyle={{ fontSize: 12, paddingBottom: 4 }}
                    />
                    {/* Lignes de reference */}
                    {regulatoryLimit != null && regulatoryLimit > 0 && (
                        <>
                            <ReferenceLine
                                y={regulatoryLimit * 0.5}
                                stroke={COLORS.refP50}
                                strokeDasharray="4 4"
                                strokeWidth={1}
                                label={{
                                    value: labelP50,
                                    position: 'right',
                                    fill: COLORS.refP50,
                                    fontSize: 10,
                                    fontWeight: 600,
                                }}
                                ifOverflow="extendDomain"
                            />
                            <ReferenceLine
                                y={regulatoryLimit * 0.75}
                                stroke={COLORS.refP75}
                                strokeDasharray="4 4"
                                strokeWidth={1}
                                label={{
                                    value: labelP75,
                                    position: 'right',
                                    fill: COLORS.refP75,
                                    fontSize: 10,
                                    fontWeight: 600,
                                }}
                                ifOverflow="extendDomain"
                            />
                            <ReferenceLine
                                y={regulatoryLimit}
                                stroke={COLORS.refP100}
                                strokeDasharray="0"
                                strokeWidth={1.5}
                                label={{
                                    value: labelP100,
                                    position: 'right',
                                    fill: COLORS.refP100,
                                    fontSize: 10,
                                    fontWeight: 700,
                                }}
                                ifOverflow="extendDomain"
                            />
                        </>
                    )}
                    {/* Series */}
                    <Line
                        type="monotone"
                        dataKey="avgValue"
                        name={labelAvg}
                        stroke={COLORS.avg}
                        strokeWidth={2.2}
                        dot={{ r: 3, fill: COLORS.avg }}
                        activeDot={{ r: 5 }}
                        connectNulls
                    />
                    <Line
                        type="monotone"
                        dataKey="medianValue"
                        name={labelMedian}
                        stroke={COLORS.median}
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={{ r: 2.5, fill: COLORS.median }}
                        activeDot={{ r: 4.5 }}
                        connectNulls
                    />
                    <Line
                        type="monotone"
                        dataKey="maxValue"
                        name={labelMax}
                        stroke={COLORS.max}
                        strokeWidth={2}
                        dot={{ r: 2.5, fill: COLORS.max }}
                        activeDot={{ r: 4.5 }}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// 2026-06-07 perf : memoization pour eviter les re-renders quand
// le DashboardPage parent change d'etat (filtres, periode) sans toucher
// aux props du chart.
const DoseTrendChart = memo(DoseTrendChartImpl);
export default DoseTrendChart;
