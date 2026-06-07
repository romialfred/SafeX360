/**
 * DoseDistributionChart — Histogramme de la distribution des doses (Phase 8 Frontend).
 *
 * <p>Recharts {@code BarChart} vertical avec 6 buckets de pourcentage vs limite CIPR :
 *   - 0-25%   : vert     (safe)
 *   - 25-50%  : vert clair
 *   - 50-75%  : jaune    (investigation)
 *   - 75-90%  : orange   (action)
 *   - 90-100% : rouge clair
 *   - 100%+   : rouge fonce (surexposition CIPR 103)
 *
 * <p>Tooltip riche avec libelles + counts. Annotation totale en haut a droite.
 */

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RTooltip,
    CartesianGrid,
    ResponsiveContainer,
    Cell,
    LabelList,
} from 'recharts';
import type { DosimetryDistributionDTO } from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DoseDistributionChartProps {
    /** Distribution renvoyee par le backend (peut etre null si pas encore charge). */
    distribution: DosimetryDistributionDTO | null;
    /** Hauteur du chart (default 320). */
    height?: number;
    /** Etat de chargement. */
    loading?: boolean;
    /** Titre du chart. */
    title?: string;
    /** Libelle "workers" pour l'axe Y. */
    workersLabel?: string;
    /** Libelle "Total". */
    totalLabel?: string;
}

interface BucketRow {
    label: string;
    count: number;
    fromPct: number;
    toPct: number;
    color: string;
    severity: 'safe' | 'low' | 'medium' | 'high' | 'critical' | 'over';
}

// ─────────────────────────────────────────────────────────────────────────────
//  Palette CIPR 103 (vert -> jaune -> orange -> rouge)
// ─────────────────────────────────────────────────────────────────────────────

const BUCKET_COLORS = {
    safe: '#10b981',     // emerald-500 (0-25%)
    low: '#84cc16',      // lime-500   (25-50%)
    medium: '#facc15',   // yellow-400 (50-75%)
    high: '#f97316',     // orange-500 (75-90%)
    critical: '#ef4444', // red-500    (90-100%)
    over: '#991b1b',     // red-800    (100%+)
};

const severityForPct = (fromPct: number): BucketRow['severity'] => {
    if (fromPct >= 100) return 'over';
    if (fromPct >= 90) return 'critical';
    if (fromPct >= 75) return 'high';
    if (fromPct >= 50) return 'medium';
    if (fromPct >= 25) return 'low';
    return 'safe';
};

// ─────────────────────────────────────────────────────────────────────────────
//  Tooltip custom
// ─────────────────────────────────────────────────────────────────────────────

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number; payload: BucketRow }>;
    workersLabel: string;
}

function CustomTooltip({ active, payload, workersLabel }: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;
    const row = payload[0].payload;
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-[12px]">
            <div className="flex items-center gap-2 mb-1">
                <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ backgroundColor: row.color }}
                    aria-hidden="true"
                />
                <span className="font-semibold text-slate-800">{row.label}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-700">
                <span className="font-mono font-bold text-slate-900 tabular-nums">{row.count}</span>
                <span>{workersLabel}</span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1 leading-tight">
                Dose annuelle entre {row.fromPct}% et {row.toPct === Infinity || row.toPct >= 9999 ? '∞' : `${row.toPct}%`} de la limite reglementaire
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export default function DoseDistributionChart({
    distribution,
    height = 320,
    loading = false,
    title,
    workersLabel = 'travailleur(s)',
    totalLabel = 'Total',
}: DoseDistributionChartProps) {
    const rows: BucketRow[] = useMemo(() => {
        if (!distribution || !distribution.buckets) return [];
        return distribution.buckets.map((b) => {
            const sev = severityForPct(b.fromPct);
            return {
                label: b.label || `${b.fromPct}-${b.toPct}%`,
                count: Number(b.count || 0),
                fromPct: b.fromPct,
                toPct: b.toPct,
                severity: sev,
                color: BUCKET_COLORS[sev],
            };
        });
    }, [distribution]);

    const total = useMemo(() => rows.reduce((acc, r) => acc + r.count, 0), [rows]);

    // Loading
    if (loading) {
        return (
            <div
                className="w-full bg-slate-50 rounded-lg flex items-center justify-center animate-pulse"
                style={{ height }}
            >
                <span className="text-slate-400 text-[12px]">Chargement de la distribution…</span>
            </div>
        );
    }

    // Empty
    if (rows.length === 0 || total === 0) {
        return (
            <div
                className="w-full bg-slate-50 rounded-lg flex flex-col items-center justify-center gap-1"
                style={{ height }}
            >
                <span className="text-slate-500 text-[13px] font-medium">Aucune distribution disponible</span>
                <span className="text-slate-400 text-[11px]">Aucun travailleur expose enregistre pour cette periode.</span>
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height }}>
            {title && (
                <div className="flex items-center justify-between mb-2 px-1">
                    <h4 className="text-[13px] font-semibold text-slate-700">{title}</h4>
                    <span className="text-[11px] text-slate-500">
                        {totalLabel}{' '}
                        <span className="font-mono font-semibold text-slate-800 tabular-nums">{total}</span> {workersLabel}
                    </span>
                </div>
            )}
            <ResponsiveContainer width="100%" height={title ? height - 30 : height}>
                <BarChart data={rows} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="label"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                        allowDecimals={false}
                    />
                    <RTooltip content={<CustomTooltip workersLabel={workersLabel} />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {rows.map((row, idx) => (
                            <Cell key={`cell-${idx}`} fill={row.color} />
                        ))}
                        <LabelList
                            dataKey="count"
                            position="top"
                            style={{ fontSize: 11, fontWeight: 700, fill: '#334155' }}
                            formatter={(v: number) => (v > 0 ? v : '')}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
