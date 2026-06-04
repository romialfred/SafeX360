import { ReactNode } from 'react';
import {
    IconTrendingUp,
    IconTrendingDown,
    IconMinus,
} from '@tabler/icons-react';

/**
 * KpiTile — Tuile KPI moderne avec variation + comparaison.
 *
 * LOT 41 : remplace les tuiles trop rudimentaires (juste un gros chiffre)
 * par un design enrichi avec :
 *   - Icône colorée à gauche
 *   - Valeur principale (gros chiffre, serif)
 *   - Label de la métrique
 *   - Mini sparkline ou comparaison période-sur-période
 *   - Delta avec flèche colorée (vert = améliore, rouge = détériore)
 *   - Sous-texte avec valeur de référence (mois précédent / année dernière)
 *
 * Usage :
 *   <KpiTile
 *     label="Non-conformités ouvertes"
 *     value={47}
 *     unit=""
 *     delta={-12}
 *     deltaLabel="vs mois dernier"
 *     deltaDirection="down-is-good"
 *     tone="amber"
 *     icon={<IconAlertTriangle size={18} />}
 *   />
 */

type Tone = 'red' | 'amber' | 'green' | 'blue' | 'teal' | 'violet' | 'slate' | 'rose';

interface Props {
    label: string;
    value: number | string;
    unit?: string;
    /** Variation depuis la période de comparaison (en %). Peut être négatif. */
    delta?: number;
    /** Texte court qui décrit la comparaison (ex: "vs mois dernier") */
    deltaLabel?: string;
    /** Sémantique du delta. Détermine la couleur de la flèche.
     *  - "up-is-good"   : delta positif = vert (croissance)
     *  - "down-is-good" : delta positif = rouge (les baisses sont préférables)
     *  - "neutral"      : flèche grise quel que soit le signe
     */
    deltaDirection?: 'up-is-good' | 'down-is-good' | 'neutral';
    /** Référence absolue affichée en sous-texte (ex: "vs 53 le mois dernier") */
    referenceValue?: string;
    icon?: ReactNode;
    /** Tonalité couleur. Détermine la teinte du fond, de la bordure et de l'icône. */
    tone?: Tone;
    /** Optionnel : sparkline 7-12 points pour mini-tendance */
    sparkline?: number[];
    /** Action en bas (lien "voir tout") */
    actionLabel?: string;
    onAction?: () => void;
}

const TONE_CONFIG: Record<Tone, {
    border: string;
    bg: string;
    iconBg: string;
    iconText: string;
    accent: string; // pour la barre verticale gauche
}> = {
    red:    { border: 'border-red-200/60',     bg: 'bg-gradient-to-br from-red-50 via-white to-white',     iconBg: 'bg-red-100/80',     iconText: 'text-red-700',     accent: 'bg-red-500' },
    rose:   { border: 'border-rose-200/60',    bg: 'bg-gradient-to-br from-rose-50 via-white to-white',    iconBg: 'bg-rose-100/80',    iconText: 'text-rose-700',    accent: 'bg-rose-500' },
    amber:  { border: 'border-amber-200/60',   bg: 'bg-gradient-to-br from-amber-50 via-white to-white',   iconBg: 'bg-amber-100/80',   iconText: 'text-amber-700',   accent: 'bg-amber-500' },
    green:  { border: 'border-emerald-200/60', bg: 'bg-gradient-to-br from-emerald-50 via-white to-white', iconBg: 'bg-emerald-100/80', iconText: 'text-emerald-700', accent: 'bg-emerald-500' },
    blue:   { border: 'border-sky-200/60',     bg: 'bg-gradient-to-br from-sky-50 via-white to-white',     iconBg: 'bg-sky-100/80',     iconText: 'text-sky-700',     accent: 'bg-sky-500' },
    teal:   { border: 'border-teal-200/60',    bg: 'bg-gradient-to-br from-teal-50 via-white to-white',    iconBg: 'bg-teal-100/80',    iconText: 'text-teal-700',    accent: 'bg-teal-500' },
    violet: { border: 'border-violet-200/60',  bg: 'bg-gradient-to-br from-violet-50 via-white to-white',  iconBg: 'bg-violet-100/80',  iconText: 'text-violet-700',  accent: 'bg-violet-500' },
    slate:  { border: 'border-slate-200/60',   bg: 'bg-gradient-to-br from-slate-50 via-white to-white',   iconBg: 'bg-slate-100/80',   iconText: 'text-slate-700',   accent: 'bg-slate-500' },
};

function getDeltaColor(delta: number, direction: 'up-is-good' | 'down-is-good' | 'neutral'): {
    text: string;
    bg: string;
    Icon: typeof IconTrendingUp;
} {
    if (direction === 'neutral' || delta === 0) {
        return { text: 'text-slate-600', bg: 'bg-slate-100', Icon: IconMinus };
    }
    const isUp = delta > 0;
    const isGood = (direction === 'up-is-good' && isUp) || (direction === 'down-is-good' && !isUp);
    if (isGood) {
        return { text: 'text-emerald-700', bg: 'bg-emerald-50', Icon: isUp ? IconTrendingUp : IconTrendingDown };
    }
    return { text: 'text-red-700', bg: 'bg-red-50', Icon: isUp ? IconTrendingUp : IconTrendingDown };
}

function Sparkline({ data, color = '#0F766E' }: { data: number[]; color?: string }) {
    if (!data.length) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 80, h = 28;
    const step = data.length > 1 ? w / (data.length - 1) : w;
    const points = data
        .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
        .join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
            {/* Dernier point en évidence */}
            <circle
                cx={(data.length - 1) * step}
                cy={h - ((data[data.length - 1] - min) / range) * h}
                r="2.5"
                fill={color}
            />
        </svg>
    );
}

export default function KpiTile({
    label,
    value,
    unit,
    delta,
    deltaLabel,
    deltaDirection = 'up-is-good',
    referenceValue,
    icon,
    tone = 'slate',
    sparkline,
    actionLabel,
    onAction,
}: Props) {
    const config = TONE_CONFIG[tone];
    const deltaInfo = delta !== undefined ? getDeltaColor(delta, deltaDirection) : null;

    return (
        <div
            className={`relative rounded-xl border ${config.border} ${config.bg} p-4 overflow-hidden hover:shadow-md transition-shadow`}
        >
            {/* Barre d'accent gauche */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent}`} aria-hidden="true" />

            {/* Ligne 1 : Icône + Label */}
            <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-2">
                    {icon && (
                        <div className={`p-1.5 rounded-md ${config.iconBg} ${config.iconText} flex-shrink-0`}>
                            {icon}
                        </div>
                    )}
                    <p className="text-[12px] uppercase tracking-[0.12em] text-slate-600 font-medium">
                        {label}
                    </p>
                </div>
                {sparkline && sparkline.length > 0 && (
                    <Sparkline data={sparkline} color={config.iconText.replace('text-', '').includes('red') ? '#DC2626' : '#0F766E'} />
                )}
            </div>

            {/* Ligne 2 : Valeur principale + unité */}
            <div className="flex items-baseline gap-1.5">
                <p
                    className="text-slate-900 leading-none"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: 'clamp(28px, 3.4vw, 36px)',
                        letterSpacing: '-0.02em',
                    }}
                >
                    {value}
                </p>
                {unit && (
                    <span className="text-[14px] text-slate-500 font-medium">
                        {unit}
                    </span>
                )}
            </div>

            {/* Ligne 3 : Delta + comparaison */}
            {deltaInfo && delta !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                    <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium ${deltaInfo.bg} ${deltaInfo.text}`}
                    >
                        <deltaInfo.Icon size={11} aria-hidden="true" />
                        {delta > 0 ? '+' : ''}{delta}%
                    </span>
                    {deltaLabel && (
                        <span className="text-[11px] text-slate-500">
                            {deltaLabel}
                        </span>
                    )}
                </div>
            )}

            {/* Ligne 4 : Référence absolue */}
            {referenceValue && (
                <p className="text-[11px] text-slate-500 mt-1">
                    {referenceValue}
                </p>
            )}

            {/* Lien d'action */}
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className={`mt-2.5 text-[11.5px] ${config.iconText} hover:underline transition-colors`}
                >
                    {actionLabel} →
                </button>
            )}
        </div>
    );
}
