import { CSSProperties } from 'react';

/**
 * SafeX 360 — Marque & wordmark unifiés.
 *
 * Le bouclier-chevron est défini en SVG inline (donc colorable via currentColor
 * et toujours net peu importe la résolution).
 *
 * Variants :
 *  - "full"    : bouclier + wordmark "SafeX 360" + tagline optionnelle
 *  - "stack"   : bouclier au-dessus + wordmark en dessous (pour login, pages vitrine)
 *  - "icon"    : bouclier seul (favicon, ProfileMenu, header compact)
 *  - "wordmark": texte seul (cas rares, pied de page)
 *
 * `tone` ajuste la couleur du bouclier et du texte sans changer la structure.
 */

type Variant = 'full' | 'stack' | 'icon' | 'wordmark';
type Tone = 'dark' | 'light' | 'teal' | 'auto';

interface Props {
    variant?: Variant;
    tone?: Tone;
    size?: number;          // hauteur du bouclier en px
    showTagline?: boolean;
    className?: string;
    style?: CSSProperties;
}

const TONE_COLOR: Record<Exclude<Tone, 'auto'>, { mark: string; text: string; subText: string }> = {
    dark:  { mark: '#0F172A', text: '#0F172A', subText: '#475569' },  // slate-900 + slate-600
    light: { mark: '#FFFFFF', text: '#FFFFFF', subText: 'rgba(255,255,255,0.72)' },
    teal:  { mark: '#0F766E', text: '#0F172A', subText: '#475569' },  // teal-700
};

export default function SafeXBrandMark({
    variant = 'full',
    tone = 'dark',
    size = 32,
    showTagline = false,
    className = '',
    style,
}: Props) {
    const colors = tone === 'auto' ? TONE_COLOR.dark : TONE_COLOR[tone];

    const Shield = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            fill="none"
            width={size}
            height={size}
            style={{ color: colors.mark, flexShrink: 0 }}
            aria-hidden="true"
        >
            <path
                d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 44, 36 60, 32.7 61.6 C32.3 61.8, 31.7 61.8, 31.3 61.6 C28 60, 7 44, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                fill="currentColor"
            />
            <path
                d="M19 33 L32 20 L45 33"
                stroke="#FFFFFF"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <path
                d="M22 43 L32 33 L42 43"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.6"
            />
        </svg>
    );

    // Calcul des tailles de texte proportionnelles à la marque
    const wordSize = Math.round(size * 0.58);   // "SafeX 360"
    const tagSize = Math.max(10, Math.round(size * 0.28));

    const Wordmark = (
        <div className="flex flex-col leading-none select-none">
            <span
                style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontWeight: 500,
                    fontSize: `${wordSize}px`,
                    letterSpacing: '-0.015em',
                    color: colors.text,
                    lineHeight: 1,
                }}
            >
                SafeX 360
            </span>
            {showTagline && (
                <span
                    style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontWeight: 400,
                        fontSize: `${tagSize}px`,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: colors.subText,
                        marginTop: '6px',
                    }}
                >
                    Health · Safety · Environment
                </span>
            )}
        </div>
    );

    if (variant === 'icon') {
        return (
            <span className={className} style={style} aria-label="SafeX 360">
                {Shield}
            </span>
        );
    }

    if (variant === 'wordmark') {
        return (
            <span className={className} style={style}>
                {Wordmark}
            </span>
        );
    }

    if (variant === 'stack') {
        return (
            <div
                className={`flex flex-col items-center gap-3 ${className}`}
                style={style}
                aria-label="SafeX 360"
            >
                {Shield}
                {Wordmark}
            </div>
        );
    }

    // variant === 'full'
    return (
        <div
            className={`flex items-center gap-3 ${className}`}
            style={style}
            aria-label="SafeX 360"
        >
            {Shield}
            {Wordmark}
        </div>
    );
}
