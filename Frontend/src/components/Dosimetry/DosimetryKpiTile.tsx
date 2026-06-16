/**
 * DosimetryKpiTile — Tuile KPI premium reutilisable (Phase 8 Frontend).
 *
 * <p>Composant atomique des dashboards Dosimetrie. Aligne sur la charte SafeX 360
 * (Source Serif 4 + palette neutre/violet/red, fond #FAF8F3, cards blanches).
 *
 * <p>Affiche :
 *   - icone (Tabler) + label uppercase tracking
 *   - grande valeur (nombre ou texte)
 *   - sub-text descriptive
 *   - trend arrow optionnel (delta % vs N-1)
 *   - sparkline optionnel (6 points)
 *   - badge pulse / urgent
 *   - skeleton loading state
 *
 * <p>Color theming : neutral / info / warning / alert / critical / success.
 *
 * <p>Interaction : onClick optionnel — la tuile devient bouton focusable.
 */

import { Tooltip } from '@mantine/core';
import {
    IconArrowUpRight,
    IconArrowDownRight,
    IconArrowRight,
    IconInfoCircle,
} from '@tabler/icons-react';
import { memo, type ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export type KpiTone = 'neutral' | 'info' | 'warning' | 'alert' | 'critical' | 'success';

export interface DosimetryKpiTileProps {
    /** Icone Tabler (ex: IconShield). */
    icon: React.ComponentType<{ size?: number; stroke?: number; className?: string }>;
    /** Label uppercase courte (1-3 mots). */
    label: string;
    /** Valeur principale — nombre ou texte. */
    value: number | string;
    /** Unite affichee a cote de la valeur (ex: "mSv"). */
    unit?: string;
    /** Sub-text descriptive sous la valeur (1 ligne). */
    sub?: string;
    /** Color theming. */
    tone?: KpiTone;
    /**
     * Variation relative par rapport a N-1 en pourcent (ex: 12 = +12%, -8 = -8%).
     * Null = pas de trend affiche.
     */
    trendPct?: number | null;
    /**
     * Direction "positive" semantique :
     *  - 'up'   : une hausse est mauvaise (ex: doses)
     *  - 'down' : une hausse est bonne (ex: aptitudes a jour)
     *  - 'neutral' : neutre, on affiche juste la fleche.
     */
    trendDirection?: 'up' | 'down' | 'neutral';
    /** Donnees pour le sparkline (6 points). Null = pas de sparkline. */
    sparkline?: number[] | null;
    /** Activer l'effet pulse rouge (ex: workers > 100%). */
    pulse?: boolean;
    /** Badge urgent (point rouge) si valeur > 0. */
    urgent?: boolean;
    /** Mode loading (skeleton). */
    loading?: boolean;
    /** Action au clic (rend la tuile focusable). */
    onClick?: () => void;
    /** Tooltip d'aide (icone info). */
    tooltip?: string;
    /** Children custom remplacant le footer (sub-text). */
    children?: ReactNode;
    /** Largeur min en px (default 200). */
    minWidth?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Palettes
// ─────────────────────────────────────────────────────────────────────────────

interface TonePalette {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    valueColor: string;
    labelColor: string;
    accent: string;
    sparklineStroke: string;
    sparklineFill: string;
}

const TONE_PALETTES: Record<KpiTone, TonePalette> = {
    neutral: {
        bg: 'bg-white',
        border: 'border-slate-200',
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-700',
        valueColor: 'text-slate-900',
        labelColor: 'text-slate-500',
        accent: 'from-slate-400 to-slate-500',
        sparklineStroke: '#475569',
        sparklineFill: 'rgba(71, 85, 105, 0.10)',
    },
    info: {
        bg: 'bg-white',
        border: 'border-blue-100',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-700',
        valueColor: 'text-blue-900',
        labelColor: 'text-blue-700',
        accent: 'from-blue-400 to-indigo-500',
        sparklineStroke: '#2563eb',
        sparklineFill: 'rgba(37, 99, 235, 0.10)',
    },
    warning: {
        bg: 'bg-white',
        border: 'border-amber-100',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-700',
        valueColor: 'text-amber-900',
        labelColor: 'text-amber-700',
        accent: 'from-amber-400 to-orange-500',
        sparklineStroke: '#d97706',
        sparklineFill: 'rgba(217, 119, 6, 0.10)',
    },
    alert: {
        bg: 'bg-white',
        border: 'border-orange-200',
        iconBg: 'bg-orange-50',
        iconColor: 'text-orange-700',
        valueColor: 'text-orange-900',
        labelColor: 'text-orange-700',
        accent: 'from-orange-500 to-red-500',
        sparklineStroke: '#ea580c',
        sparklineFill: 'rgba(234, 88, 12, 0.10)',
    },
    critical: {
        bg: 'bg-white',
        border: 'border-red-200',
        iconBg: 'bg-red-50',
        iconColor: 'text-red-700',
        valueColor: 'text-red-900',
        labelColor: 'text-red-700',
        accent: 'from-red-500 to-rose-600',
        sparklineStroke: '#dc2626',
        sparklineFill: 'rgba(220, 38, 38, 0.10)',
    },
    success: {
        bg: 'bg-white',
        border: 'border-emerald-100',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-700',
        valueColor: 'text-emerald-900',
        labelColor: 'text-emerald-700',
        accent: 'from-emerald-400 to-teal-500',
        sparklineStroke: '#059669',
        sparklineFill: 'rgba(5, 150, 105, 0.10)',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sparkline (SVG inline, pas de dependance)
// ─────────────────────────────────────────────────────────────────────────────

interface SparklineProps {
    points: number[];
    stroke: string;
    fill: string;
    width?: number;
    height?: number;
}

function Sparkline({ points, stroke, fill, width = 80, height = 24 }: SparklineProps) {
    if (!points || points.length < 2) {
        return null;
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const stepX = width / (points.length - 1);
    const coords = points.map((v, i) => {
        const x = i * stepX;
        const y = height - ((v - min) / range) * height;
        return { x, y };
    });
    const path = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const fillPath = `${path} L ${width} ${height} L 0 ${height} Z`;
    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            aria-hidden="true"
            className="overflow-visible"
        >
            <path d={fillPath} fill={fill} />
            <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Trend arrow inline
// ─────────────────────────────────────────────────────────────────────────────

interface TrendArrowProps {
    pct: number;
    direction: 'up' | 'down' | 'neutral';
}

function TrendArrow({ pct, direction }: TrendArrowProps) {
    // Semantique : pour 'up' (doses), une hausse est rouge (negative).
    // Pour 'down' (aptitudes), une hausse est verte (positive).
    let color: string;
    let Icon: typeof IconArrowUpRight;
    const abs = Math.abs(pct);
    if (abs < 0.5) {
        color = 'text-slate-500';
        Icon = IconArrowRight;
    } else if (pct > 0) {
        Icon = IconArrowUpRight;
        if (direction === 'up') color = 'text-red-600';
        else if (direction === 'down') color = 'text-emerald-600';
        else color = 'text-slate-600';
    } else {
        Icon = IconArrowDownRight;
        if (direction === 'up') color = 'text-emerald-600';
        else if (direction === 'down') color = 'text-red-600';
        else color = 'text-slate-600';
    }
    return (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${color}`}>
            <Icon size={12} stroke={2.2} />
            {abs.toFixed(1)}%
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

function DosimetryKpiTileImpl({
    icon: Icon,
    label,
    value,
    unit,
    sub,
    tone = 'neutral',
    trendPct = null,
    trendDirection = 'up',
    sparkline = null,
    pulse = false,
    urgent = false,
    loading = false,
    onClick,
    tooltip,
    children,
    minWidth = 200,
}: DosimetryKpiTileProps) {
    const palette = TONE_PALETTES[tone];

    // Skeleton state
    if (loading) {
        return (
            <div
                className={`relative flex flex-col gap-2 h-full px-4 py-3.5 rounded-xl border ${palette.bg} ${palette.border} animate-pulse`}
                style={{ minWidth }}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-100" />
                    <div className="flex-1">
                        <div className="h-2 w-16 bg-slate-100 rounded mb-1.5" />
                        <div className="h-1.5 w-24 bg-slate-100 rounded" />
                    </div>
                </div>
                <div className="h-7 w-20 bg-slate-100 rounded" />
                <div className="h-2 w-32 bg-slate-100 rounded" />
            </div>
        );
    }

    const isInteractive = typeof onClick === 'function';

    const tileContent = (
        <>
            {/* Accent top stripe */}
            <span
                className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-gradient-to-r ${palette.accent}`}
                aria-hidden="true"
            />
            {/* Urgent badge */}
            {urgent && Number(value) > 0 && (
                <span
                    className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold animate-pulse shadow-md"
                    aria-label="Urgent"
                >
                    !
                </span>
            )}

            {/* Header : icone + label + tooltip */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className={`w-9 h-9 rounded-lg ${palette.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                        <Icon size={18} stroke={1.8} className={palette.iconColor} />
                    </div>
                    <div className="min-w-0">
                        <p
                            className={`text-[10px] uppercase tracking-[0.12em] leading-[1.3] font-semibold ${palette.labelColor} line-clamp-2 min-h-[26px] flex items-center`}
                            title={label}
                        >
                            {label}
                        </p>
                    </div>
                </div>
                {tooltip && (
                    <Tooltip label={tooltip} withArrow position="top" multiline w={240}>
                        <span className="text-slate-400 hover:text-slate-600 transition cursor-help">
                            <IconInfoCircle size={13} stroke={1.7} />
                        </span>
                    </Tooltip>
                )}
            </div>

            {/* Valeur + unite + sparkline */}
            <div className="flex items-end justify-between gap-3 mb-1">
                <div className="flex items-baseline gap-1.5 min-w-0">
                    <span
                        className={`text-[26px] leading-none font-bold ${palette.valueColor} tracking-tight tabular-nums`}
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                        {value}
                    </span>
                    {unit && (
                        <span className={`text-[11px] font-medium ${palette.labelColor}`}>{unit}</span>
                    )}
                </div>
                {sparkline && sparkline.length >= 2 && (
                    <div className="flex-shrink-0 opacity-90">
                        <Sparkline
                            points={sparkline}
                            stroke={palette.sparklineStroke}
                            fill={palette.sparklineFill}
                        />
                    </div>
                )}
            </div>

            {/* Footer : sub-text + trend OU children custom */}
            {children ? (
                <div className="text-[11px] text-slate-600 leading-tight">{children}</div>
            ) : (
                <div className="flex items-center justify-between gap-2 min-h-[14px]">
                    {sub ? (
                        <span className="text-[11px] text-slate-600 leading-tight line-clamp-2">{sub}</span>
                    ) : (
                        <span />
                    )}
                    {trendPct != null && Number.isFinite(trendPct) && (
                        <TrendArrow pct={trendPct} direction={trendDirection} />
                    )}
                </div>
            )}
        </>
    );

    const baseClass = `relative flex flex-col h-full px-4 py-3.5 pt-4 rounded-xl border shadow-sm ${palette.bg} ${palette.border} ${
        pulse ? 'ring-2 ring-red-300 ring-offset-1 animate-pulse' : ''
    } ${
        isInteractive
            ? 'cursor-pointer hover:shadow-md hover:border-slate-300 transition text-left focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-1'
            : ''
    }`;

    if (isInteractive) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={baseClass}
                style={{ minWidth }}
            >
                {tileContent}
            </button>
        );
    }
    return (
        <div className={baseClass} style={{ minWidth }}>
            {tileContent}
        </div>
    );
}

// 2026-06-07 perf : memoization — KPI tiles ne changent que sur props change
const DosimetryKpiTile = memo(DosimetryKpiTileImpl);
export default DosimetryKpiTile;
