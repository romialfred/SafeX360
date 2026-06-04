import { CSSProperties } from 'react';

/**
 * SafeXLogoColor — Logo SafeX 360 coloré (identité unifiée plateforme).
 *
 * Créé LOT 41 pour aligner sidebar / login / 404 sur la même identité :
 *   - Bouclier dégradé teal → rouge
 *   - Coche blanche au centre
 *   - Wordmark "Safe[X]360" avec X teal et 360 rouge
 *
 * Variants :
 *   - "stack" : bouclier au-dessus, wordmark dessous (login, 404)
 *   - "full"  : bouclier à gauche, wordmark à droite (sidebar, header)
 *   - "icon"  : bouclier seul (favicon, ProfileMenu compact)
 */

interface Props {
    variant?: 'stack' | 'full' | 'icon';
    /** Hauteur en px du bouclier */
    size?: number;
    /** Si tone='light', le texte "Safe" et "360" sont blancs (sur fond sombre) ;
     *  si tone='dark', ils sont slate-900 (sur fond clair) */
    tone?: 'light' | 'dark';
    /** Afficher le slogan court sous le wordmark */
    showTagline?: boolean;
    className?: string;
    style?: CSSProperties;
}

export default function SafeXLogoColor({
    variant = 'full',
    size = 32,
    tone = 'light',
    showTagline = false,
    className = '',
    style,
}: Props) {
    const baseColor = tone === 'light' ? '#FFFFFF' : '#0F172A';
    const subColor = tone === 'light' ? 'rgba(255,255,255,0.72)' : '#475569';
    // Pour rendre le X plus lumineux sur fond clair, on garde teal vif
    const xColor = '#2DD4BF';
    // Rouge accent pour "360"
    const accentColor = '#EF4444';

    // Hauteur de typographie ~ size * 0.65
    const fontSize = Math.round(size * 0.62);

    const Shield = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            fill="none"
            width={size}
            height={size}
            style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(20,184,166,0.35))' }}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={`shieldG-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5EEAD4" />
                    <stop offset="55%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
                <linearGradient id={`shieldH-${size}`} x1="0%" y1="0%" x2="0%" y2="60%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
            </defs>
            <path
                d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 44, 36 60, 32.7 61.6 C32.3 61.8, 31.7 61.8, 31.3 61.6 C28 60, 7 44, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                fill={`url(#shieldG-${size})`}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.5"
            />
            <path
                d="M32 3 L56 11 C56.5 11.2, 57 11.6, 57 12.3 L57 30 C57 38, 50 42, 32 42 C14 42, 7 38, 7 30 L7 12.3 C7 11.6, 7.5 11.2, 8 11 Z"
                fill={`url(#shieldH-${size})`}
            />
            <path
                d="M 20 31 L 29 40 L 45 21"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );

    if (variant === 'icon') {
        return (
            <div className={`inline-flex items-center justify-center ${className}`} style={style}>
                {Shield}
            </div>
        );
    }

    const Wordmark = (
        <div className="flex flex-col leading-none">
            <h1
                className="flex items-baseline gap-0.5"
                style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontWeight: 600,
                    fontSize: `${fontSize}px`,
                    letterSpacing: '-0.018em',
                    lineHeight: 1,
                    color: baseColor,
                }}
            >
                <span>Safe</span>
                <span style={{ color: xColor }}>X</span>
                <span style={{ marginLeft: '0.18em', color: accentColor }}>360</span>
            </h1>
            {showTagline && (
                <p
                    className="mt-1"
                    style={{
                        color: subColor,
                        fontSize: `${Math.max(10, Math.round(fontSize * 0.34))}px`,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                    }}
                >
                    HSE · Industrie minière
                </p>
            )}
        </div>
    );

    if (variant === 'stack') {
        return (
            <div className={`inline-flex flex-col items-center gap-2 ${className}`} style={style}>
                {Shield}
                {Wordmark}
            </div>
        );
    }

    // full
    return (
        <div className={`inline-flex items-center gap-2.5 ${className}`} style={style}>
            {Shield}
            {Wordmark}
        </div>
    );
}
