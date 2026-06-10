import { ReactNode, useRef, useState } from 'react';
import {
    IconTrendingUp,
    IconTrendingDown,
    IconMinus,
} from '@tabler/icons-react';

/**
 * KpiTile — Tuile KPI premium compacte (LOT 42 refonte).
 *
 * Design final :
 *   ┌──────────────────────────────────────┐
 *   │  [icon] LABEL …………………… [+12% ↗]    │ ← delta top-right
 *   │                                      │
 *   │  42.7 %                              │ ← valeur (Source Serif 4)
 *   │  Cible : ≥85%                        │ ← reference value
 *   │  ────────────────────────── ╱╲╱╲╱╲   │ ← sparkline mini en bas
 *   └──────────────────────────────────────┘
 *
 * Caractéristiques :
 *   - Hauteur réduite (suppression du badge bg et de l'espace inutile)
 *   - Delta en haut à droite (chip discret coloré)
 *   - Sparkline en bas, full-width, intégrée
 *   - Hover : élévation + glow subtle
 */

type Tone = 'red' | 'amber' | 'green' | 'blue' | 'teal' | 'violet' | 'slate' | 'rose';

interface Props {
    label: string;
    value: number | string;
    unit?: string;
    /** Variation en % depuis la période de comparaison */
    delta?: number;
    /** Sémantique du delta : croissance positive = bon, ou inverse */
    deltaDirection?: 'up-is-good' | 'down-is-good' | 'neutral';
    /** Court texte sous la valeur (ex: "Cible : ≥85%" ou "vs N-1") */
    referenceValue?: string;
    icon?: ReactNode;
    tone?: Tone;
    /** Mini-graphique sparkline (5-12 points typiquement) */
    sparkline?: number[];
}

const TONE_CONFIG: Record<Tone, {
    border: string;
    bg: string;
    iconBg: string;
    iconText: string;
    sparkColor: string;
    glow: string;
}> = {
    red:     { border: 'border-red-200/70',     bg: 'bg-gradient-to-br from-red-50/60 to-white',         iconBg: 'bg-red-100/80',     iconText: 'text-red-700',     sparkColor: '#DC2626', glow: 'shadow-red-200/40' },
    rose:    { border: 'border-rose-200/70',    bg: 'bg-gradient-to-br from-rose-50/60 to-white',        iconBg: 'bg-rose-100/80',    iconText: 'text-rose-700',    sparkColor: '#E11D48', glow: 'shadow-rose-200/40' },
    amber:   { border: 'border-amber-200/70',   bg: 'bg-gradient-to-br from-amber-50/60 to-white',       iconBg: 'bg-amber-100/80',   iconText: 'text-amber-700',   sparkColor: '#D97706', glow: 'shadow-amber-200/40' },
    green:   { border: 'border-emerald-200/70', bg: 'bg-gradient-to-br from-emerald-50/60 to-white',     iconBg: 'bg-emerald-100/80', iconText: 'text-emerald-700', sparkColor: '#059669', glow: 'shadow-emerald-200/40' },
    blue:    { border: 'border-sky-200/70',     bg: 'bg-gradient-to-br from-sky-50/60 to-white',         iconBg: 'bg-sky-100/80',     iconText: 'text-sky-700',     sparkColor: '#0284C7', glow: 'shadow-sky-200/40' },
    teal:    { border: 'border-teal-200/70',    bg: 'bg-gradient-to-br from-teal-50/60 to-white',        iconBg: 'bg-teal-100/80',    iconText: 'text-teal-700',    sparkColor: '#0F766E', glow: 'shadow-teal-200/40' },
    violet:  { border: 'border-violet-200/70',  bg: 'bg-gradient-to-br from-violet-50/60 to-white',      iconBg: 'bg-violet-100/80',  iconText: 'text-violet-700',  sparkColor: '#7C3AED', glow: 'shadow-violet-200/40' },
    slate:   { border: 'border-slate-200/70',   bg: 'bg-gradient-to-br from-slate-50/60 to-white',       iconBg: 'bg-slate-100/80',   iconText: 'text-slate-700',   sparkColor: '#475569', glow: 'shadow-slate-200/40' },
};

function getDeltaDisplay(delta: number, direction: 'up-is-good' | 'down-is-good' | 'neutral') {
    if (direction === 'neutral' || delta === 0) {
        return { text: 'text-slate-600', bg: 'bg-slate-100/70', Icon: IconMinus };
    }
    const isUp = delta > 0;
    const isGood = (direction === 'up-is-good' && isUp) || (direction === 'down-is-good' && !isUp);
    if (isGood) {
        return { text: 'text-emerald-700', bg: 'bg-emerald-50', Icon: isUp ? IconTrendingUp : IconTrendingDown };
    }
    return { text: 'text-red-700', bg: 'bg-red-50', Icon: isUp ? IconTrendingUp : IconTrendingDown };
}

/**
 * Sparkline compacte avec :
 *   • gradient sous la courbe
 *   • points cliquables/survolables avec tooltip natif (value + month)
 *   • dernier point mis en évidence (cercle blanc + dot couleur)
 *
 * Les mois sont calculés en rétro-projection depuis le mois courant.
 *   ex : 7 points → "J-6 mois" → "Mois courant"
 */
const MONTHS_FR_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function getMonthLabel(monthsAgo: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    return `${MONTHS_FR_SHORT[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
}

function Sparkline({ data, color = '#0F766E' }: { data: number[]; color?: string }) {
    // LOT 43 v9 : on tracke la souris au niveau du SVG entier.
    // → le tooltip reste affiché tant que la souris est dans la zone graphique
    //   (pas seulement sur un disque de 6px). Plus de scintillement.
    const [hovered, setHovered] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    if (!data.length) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 100;
    const h = 32;
    const padY = 4;
    const step = data.length > 1 ? w / (data.length - 1) : w;
    const points = data.map((v, i) => ({
        x: i * step,
        y: h - ((v - min) / range) * (h - padY * 2) - padY,
        value: v,
        monthsAgo: data.length - 1 - i,
    }));
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;
    const gradientId = `sparkGrad-${color.replace('#', '')}`;

    // Convertit la position de la souris (px sur l'écran) en coordonnée SVG (0..w),
    // puis trouve l'index du point le plus proche horizontalement.
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        if (rect.width === 0) return;
        const xPx = e.clientX - rect.left;
        const xSvg = (xPx / rect.width) * w;
        // Trouve l'index du point dont x est le plus proche
        let nearest = 0;
        let bestDist = Infinity;
        for (let i = 0; i < points.length; i++) {
            const d = Math.abs(points[i].x - xSvg);
            if (d < bestDist) {
                bestDist = d;
                nearest = i;
            }
        }
        setHovered(nearest);
    };

    return (
        <div className="relative w-full" style={{ height: h }}>
            <svg
                ref={svgRef}
                width="100%"
                height={h}
                viewBox={`0 0 ${w} ${h}`}
                preserveAspectRatio="none"
                className="block overflow-visible cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHovered(null)}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Zone hit-area large couvrant tout le SVG (transparente).
                    Permet à onMouseMove de capter la souris partout. */}
                <rect x={0} y={0} width={w} height={h} fill="transparent" />

                {/* Aire sous la courbe */}
                <path d={areaPath} fill={`url(#${gradientId})`} />

                {/* Courbe */}
                <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Ligne verticale au survol */}
                {hovered !== null && (
                    <line
                        x1={points[hovered].x}
                        y1={padY}
                        x2={points[hovered].x}
                        y2={h}
                        stroke={color}
                        strokeOpacity="0.3"
                        strokeWidth="0.8"
                        strokeDasharray="1.5 1.5"
                    />
                )}

                {/* Points statiques */}
                {points.map((p, i) => {
                    const isLast = i === points.length - 1;
                    const isHovered = hovered === i;
                    return (
                        <g key={i}>
                            {isLast || isHovered ? (
                                <>
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={isHovered ? 3.5 : 2.5}
                                        fill="#fff"
                                        stroke={color}
                                        strokeWidth={isHovered ? 1.8 : 1.2}
                                    />
                                    <circle cx={p.x} cy={p.y} r={isHovered ? 1.5 : 1.2} fill={color} />
                                </>
                            ) : (
                                <circle cx={p.x} cy={p.y} r={1.4} fill={color} opacity="0.85" />
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Tooltip stylé HTML — persistant tant que la souris est dans la zone */}
            {hovered !== null && (
                <div
                    className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full transition-all duration-100"
                    style={{
                        left: `${(points[hovered].x / w) * 100}%`,
                        top: `${(points[hovered].y / h) * 100}%`,
                        marginTop: '-6px',
                    }}
                >
                    <div className="bg-slate-900 text-white rounded-md px-2 py-1 shadow-lg shadow-slate-900/20 whitespace-nowrap">
                        <p className="text-[9.5px] uppercase tracking-[0.08em] text-slate-400 leading-tight">
                            {getMonthLabel(points[hovered].monthsAgo)}
                        </p>
                        <p
                            className="text-[12px] leading-tight"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}
                        >
                            {points[hovered].value}
                        </p>
                    </div>
                    {/* Flèche pointe vers le bas */}
                    <div
                        className="mx-auto w-0 h-0"
                        style={{
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '4px solid #0F172A',
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default function KpiTile({
    label,
    value,
    unit,
    delta,
    deltaDirection = 'up-is-good',
    referenceValue,
    icon,
    tone = 'slate',
    sparkline,
}: Props) {
    const cfg = TONE_CONFIG[tone];
    const deltaInfo = delta !== undefined ? getDeltaDisplay(delta, deltaDirection) : null;

    return (
        <div
            className={`relative rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-[box-shadow] duration-200 hover:shadow-md group`}
        >
            <div className="px-4 pt-3 pb-2">
                {/* Ligne 1 : icône + label à gauche · delta à droite */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {icon && (
                            <div className={`p-1.5 rounded-md ${cfg.iconBg} ${cfg.iconText} flex-shrink-0`}>
                                {icon}
                            </div>
                        )}
                        <p className="text-[10.5px] uppercase tracking-[0.12em] text-slate-600 font-medium truncate">
                            {label}
                        </p>
                    </div>
                    {deltaInfo && delta !== undefined && (
                        <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10.5px] font-medium ${deltaInfo.bg} ${deltaInfo.text} flex-shrink-0`}
                        >
                            <deltaInfo.Icon size={10} stroke={2.4} aria-hidden="true" />
                            {delta > 0 ? '+' : ''}{delta}%
                        </span>
                    )}
                </div>

                {/* Ligne 2 : valeur + unit */}
                <div className="flex items-baseline gap-1.5 leading-none">
                    <span
                        className="text-slate-900"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: 'clamp(24px, 2.6vw, 30px)',
                            letterSpacing: '-0.02em',
                            lineHeight: 1,
                        }}
                    >
                        {value}
                    </span>
                    {unit && (
                        <span className="text-[12.5px] text-slate-500 font-medium">{unit}</span>
                    )}
                </div>

                {/* Ligne 3 : référence */}
                {referenceValue && (
                    <p className="text-[10.5px] text-slate-500 mt-1">
                        {referenceValue}
                    </p>
                )}
            </div>

            {/* Sparkline en bas, full-width, intégrée */}
            {sparkline && sparkline.length > 1 && (
                <div className="-mt-1">
                    <Sparkline data={sparkline} color={cfg.sparkColor} />
                </div>
            )}
        </div>
    );
}
