import SafeXLogoColor from '../../UtilityComp/SafeXLogoColor';
import type { LoginCopy } from './loginCopy';

/**
 * Zone visuelle gauche de la page de connexion.
 *
 * Photo minière réelle (`public/login-mine-team.png`) + surcouche vectorielle
 * légère : drone d'inspection, faisceau d'analyse dirigé vers la fosse, lignes
 * télémétriques et carte « Niveau de risque ». La surcouche est purement
 * décorative (`aria-hidden`) : aucune information n'existe uniquement là.
 *
 * Toutes les animations sont neutralisées sous `prefers-reduced-motion`.
 */

const HERO_IMAGE = '/login-mine-team.png';

type Props = { t: LoginCopy };

export default function LoginHeroPanel({ t }: Props) {
    return (
        <section
            className="sx-hero relative h-full w-full overflow-hidden bg-[#04141B]"
            aria-label="SafeX 360"
        >
            <style>{`
                @keyframes sxDroneFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
                @keyframes sxBeamPulse { 0%,100% { opacity: .28; } 50% { opacity: .5; } }
                @keyframes sxTelemetry { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -240; } }
                .sx-drone { animation: sxDroneFloat 7s ease-in-out infinite; }
                .sx-beam { animation: sxBeamPulse 6s ease-in-out infinite; }
                .sx-telemetry { animation: sxTelemetry 34s linear infinite; }
                @media (prefers-reduced-motion: reduce) {
                    .sx-drone, .sx-beam, .sx-telemetry { animation: none !important; }
                }
            `}</style>

            {/* Photo — jamais déformée : object-cover + cadrage sur les deux
                professionnels, le drone et la fosse. `fetchPriority=high` :
                c'est l'élément LCP de la page. Dimensions natives déclarées
                pour figer le ratio et éviter tout layout shift. */}
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

            {/* Dégradé de lisibilité — assombrit le bas et le bord droit sans
                masquer les professionnels ni la fosse. */}
            <div
                className="absolute inset-0"
                aria-hidden="true"
                style={{
                    background:
                        'linear-gradient(to top, rgba(4,20,27,0.98) 0%, rgba(4,20,27,0.96) 38%, rgba(4,20,27,0.72) 52%, rgba(4,20,27,0.24) 68%, rgba(4,20,27,0.40) 100%),'
                        + 'linear-gradient(to right, rgba(4,20,27,0.50) 0%, rgba(4,20,27,0) 34%, rgba(6,26,34,0.55) 100%)',
                }}
            />

            {/* ── Surcouche analytique : drone, faisceau, télémétrie ───────── */}
            <svg
                className="absolute inset-0 h-full w-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
            >
                {/* Lignes télémétriques discrètes vers la fosse */}
                <g
                    className="sx-telemetry"
                    stroke="#19C7B5"
                    strokeWidth="0.12"
                    fill="none"
                    opacity="0.32"
                    strokeDasharray="2 3"
                >
                    <path d="M8 58 C 26 52, 44 61, 62 49" />
                    <path d="M4 68 C 24 64, 40 71, 58 60" />
                    <path d="M12 47 C 28 43, 42 50, 56 41" />
                </g>
            </svg>

            {/* Drone + faisceau — positionnés en pourcentage du panneau pour
                rester devant les professionnels quel que soit le recadrage. */}
            <div
                className="absolute pointer-events-none hidden sm:block"
                style={{ left: '26%', top: '13%', width: '21%' }}
                aria-hidden="true"
            >
                {/* Faisceau d'analyse cyan dirigé vers la fosse (bas-gauche) */}
                <svg
                    className="sx-beam absolute"
                    style={{ left: '-72%', top: '52%', width: '190%' }}
                    viewBox="0 0 200 150"
                    aria-hidden="true"
                    focusable="false"
                >
                    <defs>
                        <linearGradient id="sxBeamGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#19C7B5" stopOpacity="0.55" />
                            <stop offset="100%" stopColor="#19C7B5" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d="M176 6 L 34 132 L 92 140 Z" fill="url(#sxBeamGrad)" />
                    <ellipse cx="60" cy="134" rx="34" ry="7" fill="none" stroke="#19C7B5" strokeOpacity="0.45" strokeWidth="1.2" />
                </svg>

                {/* Drone professionnel quadrirotor + caméra stabilisée sous la nacelle */}
                <svg
                    className="sx-drone relative w-full"
                    viewBox="0 0 200 110"
                    aria-hidden="true"
                    focusable="false"
                    style={{ filter: 'drop-shadow(0 10px 26px rgba(0,0,0,0.55))' }}
                >
                    {/* Bras */}
                    <g stroke="#0E2A33" strokeWidth="7" strokeLinecap="round">
                        <path d="M70 46 L 34 30" />
                        <path d="M130 46 L 166 30" />
                        <path d="M74 56 L 40 66" />
                        <path d="M126 56 L 160 66" />
                    </g>
                    {/* Hélices */}
                    <g fill="none" stroke="#CBD5E1" strokeOpacity="0.75" strokeWidth="2.4">
                        <ellipse cx="30" cy="28" rx="24" ry="4" />
                        <ellipse cx="170" cy="28" rx="24" ry="4" />
                        <ellipse cx="36" cy="68" rx="22" ry="4" />
                        <ellipse cx="164" cy="68" rx="22" ry="4" />
                    </g>
                    {/* Fuselage */}
                    <rect x="62" y="36" width="76" height="30" rx="13" fill="#12313B" stroke="#1E4A57" strokeWidth="2" />
                    <rect x="72" y="42" width="30" height="8" rx="4" fill="#1E4A57" />
                    <circle cx="126" cy="46" r="3" fill="#21D98B" />
                    {/* Nacelle + caméra stabilisée */}
                    <path d="M92 66 L 92 74 M112 66 L 112 74" stroke="#1E4A57" strokeWidth="4" strokeLinecap="round" />
                    <rect x="86" y="72" width="30" height="20" rx="8" fill="#0E2A33" stroke="#1E4A57" strokeWidth="2" />
                    <circle cx="101" cy="82" r="7.5" fill="#04141B" stroke="#19C7B5" strokeWidth="2" />
                    <circle cx="101" cy="82" r="3" fill="#19C7B5" fillOpacity="0.65" />
                </svg>
            </div>

            {/* ── Carte translucide « Niveau de risque » ───────────────────── */}
            <div
                className="absolute hidden lg:block rounded-xl px-4 py-3"
                style={{
                    left: '51%',
                    top: '11%',
                    background: 'rgba(6,26,34,0.62)',
                    border: '1px solid rgba(25,199,181,0.30)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
                }}
            >
                <div className="flex items-start gap-3">
                    {/* Pictogramme casque — décoratif */}
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
                        <path d="M4 16a8 8 0 0 1 16 0" stroke="#19C7B5" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M9.5 8.6V5.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2.8" stroke="#19C7B5" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M2.8 16h18.4a.8.8 0 0 1 .8.8v.9a.8.8 0 0 1-.8.8H2.8a.8.8 0 0 1-.8-.8v-.9a.8.8 0 0 1 .8-.8Z" stroke="#19C7B5" strokeWidth="1.6" />
                    </svg>
                    <div className="min-w-0">
                        <p className="text-[11.5px] tracking-[0.02em] text-[#9EB2B8]">{t.riskCardTitle}</p>
                        <p className="flex items-center gap-2 text-[19px] font-semibold leading-tight text-[#21D98B]">
                            {t.riskCardValue}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#9EB2B8]">{t.riskCardScope}</p>
                    </div>
                    <span
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#21D98B]"
                        style={{ boxShadow: '0 0 10px rgba(33,217,139,0.75)' }}
                        aria-hidden="true"
                    />
                </div>
            </div>

            {/* ── Marque, en haut à gauche ─────────────────────────────────── */}
            <div className="absolute left-7 top-6 flex items-center gap-3 xl:left-10 xl:top-8">
                <SafeXLogoColor variant="full" tone="light" size={44} />
            </div>
            <p
                className="absolute left-7 top-[74px] max-w-[22ch] text-[12.5px] xl:left-10 xl:top-[86px]"
                style={{ color: '#C6D6DA', textShadow: '0 2px 12px rgba(0,0,0,0.65)' }}
            >
                {t.tagline}
            </p>

            {/* ── Message principal, en bas à gauche ───────────────────────── */}
            <div className="absolute bottom-10 left-7 right-8 xl:bottom-14 xl:left-10">
                <h2
                    className="font-semibold"
                    style={{
                        // Couleur posée en ligne : une règle globale de App.css
                        // impose sinon un titre bleu nuit, illisible sur la photo.
                        color: '#F4F7F6',
                        fontWeight: 650,
                        fontSize: 'clamp(28px, 3.1vw, 46px)',
                        lineHeight: 1.12,
                        letterSpacing: '-0.02em',
                        textShadow: '0 4px 26px rgba(0,0,0,0.62)',
                    }}
                >
                    {t.heroLine1}
                    <br />
                    {/* UN SEUL nœud texte par fragment : des nœuds frères
                        mis à jour après le montage cassent Google Translate. */}
                    {`${t.heroLine2} `}
                    <span style={{ color: '#19C7B5' }}>{t.heroHighlight}</span>
                </h2>
                <p
                    className="mt-4 max-w-[46ch]"
                    style={{ color: '#C6D6DA', fontSize: 'clamp(13px, 1.1vw, 16px)', textShadow: '0 2px 14px rgba(0,0,0,0.7)' }}
                >
                    {t.heroSubtitle}
                </p>
                <div className="mt-5 h-[3px] w-16 rounded-full bg-[#19C7B5]" aria-hidden="true" />
            </div>
        </section>
    );
}
