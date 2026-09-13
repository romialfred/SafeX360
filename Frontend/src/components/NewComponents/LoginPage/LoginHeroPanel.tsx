import { useId } from 'react';
import type { LoginCopy } from './loginCopy';

/**
 * Zone visuelle gauche de la page de connexion.
 *
 * Photo minière réelle (`public/login-mine-team.png`) laissée lumineuse — seul
 * un dégradé de pied assure la lisibilité de l'accroche — plus une surcouche
 * vectorielle légère : drone d'inspection, trajectoire de télémétrie et
 * pastille d'analyse. La surcouche est décorative (`aria-hidden`) : aucune
 * information n'existe uniquement là.
 *
 * Toutes les animations sont neutralisées sous `prefers-reduced-motion`.
 */

const HERO_IMAGE = '/login-mine-team.png';

type Props = { t: LoginCopy };

/**
 * Bloc de marque « e-SafeX 360 ».
 * Ton « light » : texte blanc, posé sur la photo.
 * Ton « dark »  : texte bleu nuit, pour le panneau clair — affiché sous
 * 1024 px, là où la zone photo n'est pas rendue.
 */
export function BrandLockup({ t, tone = 'light', size = 42 }: Props & { tone?: 'light' | 'dark'; size?: number }) {
    // Identifiant unique par instance : deux dégradés portant le même id dans
    // le document se télescopent et le bouclier se rend alors sans remplissage.
    const gradientId = `${useId()}-shield`;
    return (
        <div className="flex items-center gap-3">
            <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" className="shrink-0">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#5FE3D2" />
                        <stop offset="100%" stopColor="#0E9E93" />
                    </linearGradient>
                </defs>
                <path
                    d="M32 4 L55 12 C55.5 12.2, 56 12.6, 56 13.3 L56 30 C56 43, 36 58, 32.7 59.5 C32.3 59.7, 31.7 59.7, 31.3 59.5 C28 58, 8 43, 8 30 L8 13.3 C8 12.6, 8.5 12.2, 9 12 Z"
                    fill={`url(#${gradientId})`}
                />
                <path d="M21 31 L29 39 L44 21" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <p
                className="flex items-baseline gap-1.5 font-semibold"
                style={{
                    fontSize: size * 0.72,
                    letterSpacing: '-0.02em',
                    color: tone === 'dark' ? '#0B2A38' : '#FFFFFF',
                    textShadow: tone === 'dark' ? 'none' : '0 2px 16px rgba(0,0,0,0.45)',
                }}
            >
                <span>{`${t.brandPrefix}${t.brandName}`}</span>
                <span style={{ color: '#F2604C' }}>{t.brandSuffix}</span>
            </p>
        </div>
    );
}

export default function LoginHeroPanel({ t }: Props) {
    return (
        <section className="sx-hero relative h-full w-full overflow-hidden bg-[#0B2432]" aria-label={`${t.brandPrefix}${t.brandName} ${t.brandSuffix}`}>
            <style>{`
                @keyframes sxDroneFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                @keyframes sxTrace { from { stroke-dashoffset: 320; } to { stroke-dashoffset: 0; } }
                .sx-drone { animation: sxDroneFloat 7s ease-in-out infinite; }
                .sx-trace { stroke-dasharray: 6 7; animation: sxTrace 26s linear infinite; }
                @media (prefers-reduced-motion: reduce) {
                    .sx-drone, .sx-trace { animation: none !important; }
                }
            `}</style>

            {/* Photo — jamais déformée : object-cover, cadrée sur les deux
                professionnels et la fosse. `fetchPriority=high` : élément LCP.
                Dimensions natives déclarées pour figer le ratio (pas de saut). */}
            <img
                src={HERO_IMAGE}
                alt={t.heroImageAlt}
                width={1672}
                height={941}
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: '64% center' }}
            />

            {/* Dégradé de pied uniquement : la scène reste lumineuse, l'accroche
                reste lisible. */}
            <div
                className="absolute inset-0"
                aria-hidden="true"
                style={{
                    background:
                        'linear-gradient(to top, rgba(6,28,38,0.92) 0%, rgba(6,28,38,0.72) 18%, rgba(6,28,38,0.18) 40%, rgba(6,28,38,0) 58%),'
                        + 'linear-gradient(to bottom, rgba(6,28,38,0.42) 0%, rgba(6,28,38,0) 26%)',
                }}
            />

            {/* ── Surcouche analytique : trajectoire + pastille d'analyse ──── */}
            <svg
                className="absolute inset-0 h-full w-full pointer-events-none hidden sm:block"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    className="sx-trace"
                    d="M30 22 C 34 30, 26 34, 22 40 C 18 46, 22 50, 26 52"
                    stroke="#7FF0E2"
                    strokeWidth="0.22"
                    fill="none"
                    opacity="0.85"
                />
            </svg>

            {/* Drone d'inspection */}
            <div className="absolute hidden sm:block" style={{ left: '18%', top: '17%', width: '17%' }} aria-hidden="true">
                <svg
                    className="sx-drone w-full"
                    viewBox="0 0 200 96"
                    aria-hidden="true"
                    focusable="false"
                    style={{ filter: 'drop-shadow(0 12px 22px rgba(0,0,0,0.45))' }}
                >
                    {/* Bras */}
                    <g stroke="#22404F" strokeWidth="7" strokeLinecap="round">
                        <path d="M72 42 L 36 26" />
                        <path d="M128 42 L 164 26" />
                        <path d="M76 52 L 42 62" />
                        <path d="M124 52 L 158 62" />
                    </g>
                    {/* Hélices */}
                    <g fill="none" stroke="#E8EFF1" strokeOpacity="0.9" strokeWidth="2.6">
                        <ellipse cx="32" cy="24" rx="25" ry="4" />
                        <ellipse cx="168" cy="24" rx="25" ry="4" />
                        <ellipse cx="38" cy="64" rx="23" ry="4" />
                        <ellipse cx="162" cy="64" rx="23" ry="4" />
                    </g>
                    {/* Fuselage */}
                    <rect x="64" y="32" width="72" height="28" rx="13" fill="#2C4A59" stroke="#42697A" strokeWidth="2" />
                    <rect x="74" y="38" width="28" height="7" rx="3.5" fill="#42697A" />
                    <circle cx="124" cy="42" r="3" fill="#5FE3D2" />
                    {/* Nacelle + caméra stabilisée */}
                    <path d="M92 60 L 92 68 M110 60 L 110 68" stroke="#42697A" strokeWidth="4" strokeLinecap="round" />
                    <rect x="86" y="66" width="30" height="19" rx="8" fill="#22404F" stroke="#42697A" strokeWidth="2" />
                    <circle cx="101" cy="75" r="7" fill="#0B2432" stroke="#5FE3D2" strokeWidth="2" />
                    <circle cx="101" cy="75" r="2.6" fill="#5FE3D2" fillOpacity="0.8" />
                </svg>
            </div>

            {/* ── Marque, en haut à gauche ─────────────────────────────────── */}
            <div className="absolute left-7 top-6 max-w-[70%] xl:left-12 xl:top-9">
                <BrandLockup t={t} />
                <p
                    className="mt-2 max-w-[24ch] text-[13.5px] leading-snug"
                    style={{ color: 'rgba(255,255,255,0.88)', textShadow: '0 2px 12px rgba(0,0,0,0.55)' }}
                >
                    {t.tagline}
                </p>
            </div>

            {/* ── Accroche, en bas à gauche ────────────────────────────────── */}
            <div className="absolute bottom-10 left-7 right-8 xl:bottom-14 xl:left-12">
                <h2
                    style={{
                        // Couleur posée en ligne : une règle globale de App.css
                        // impose sinon un titre bleu nuit, illisible sur la photo.
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 'clamp(28px, 3.1vw, 46px)',
                        lineHeight: 1.14,
                        letterSpacing: '-0.022em',
                        textShadow: '0 4px 24px rgba(0,0,0,0.55)',
                    }}
                >
                    {t.heroLine1}
                    <br />
                    {/* UN SEUL nœud texte par fragment : des nœuds frères mis à
                        jour après le montage cassent Google Translate. */}
                    {`${t.heroLine2} `}
                    <span style={{ color: '#3BD6C6' }}>{t.heroHighlight}</span>
                </h2>
                <p
                    className="mt-4 max-w-[48ch]"
                    style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: 'clamp(13px, 1.05vw, 16px)',
                        textShadow: '0 2px 14px rgba(0,0,0,0.6)',
                    }}
                >
                    {t.heroSubtitle}
                </p>
                <div className="mt-5 h-[3px] w-16 rounded-full" style={{ background: '#3BD6C6' }} aria-hidden="true" />
            </div>
        </section>
    );
}
