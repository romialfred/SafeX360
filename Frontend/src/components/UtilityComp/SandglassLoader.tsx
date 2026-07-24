import { useEffect, useState } from 'react';

import SafeXBrandMark from './SafeXBrandMark';

/**
 * SandglassLoader — sablier d'attente raffiné de la plateforme.
 *
 * Trois exports :
 *   - SandglassIcon   : le sablier SVG animé seul (cadre laiton, sable ambre
 *                       qui s'écoule puis retournement à 180°, boucle 2.8 s).
 *   - SandglassLoader : sablier + libellé, avec apparition différée (anti-flash
 *                       sur les chargements < delay ms) et fondu d'entrée.
 *   - PageLoader      : variante pleine zone pour les fallbacks Suspense et les
 *                       attentes de chargement de page (fond crème plateforme).
 *
 * Respecte prefers-reduced-motion : sablier statique à moitié plein.
 */

const SIZES = { sm: 28, md: 44, lg: 64 } as const;
type SandglassSize = keyof typeof SIZES;

/* Le retournement à 180° d'un cadre symétrique est visuellement identique à
   l'état initial (sable en haut) : la boucle est donc parfaitement continue. */
const SANDGLASS_KEYFRAMES = `
@keyframes sx-sand-flip {
    0%, 74% { transform: rotate(0deg); }
    88%, 100% { transform: rotate(180deg); }
}
@keyframes sx-sand-top {
    0% { transform: scaleY(1); }
    70%, 100% { transform: scaleY(0); }
}
@keyframes sx-sand-bottom {
    0% { transform: scaleY(0.06); }
    70%, 100% { transform: scaleY(1); }
}
@keyframes sx-sand-stream {
    0%, 2% { opacity: 0; }
    6%, 64% { opacity: 1; }
    70%, 100% { opacity: 0; }
}
@keyframes sx-sand-drip {
    from { stroke-dashoffset: 12; }
    to { stroke-dashoffset: 0; }
}
@keyframes sx-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
    .sx-sand-anim { animation: none !important; }
}
`;

export const SandglassIcon = ({ size = 'md' as SandglassSize, className = '' }: {
    size?: SandglassSize;
    className?: string;
}) => {
    const px = SIZES[size];
    return (
        <span className={`inline-flex ${className}`} role="status" aria-label="Chargement en cours">
            <style>{SANDGLASS_KEYFRAMES}</style>
            <svg
                width={px}
                height={px}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="sx-sand-anim"
                style={{ animation: 'sx-sand-flip 2.8s cubic-bezier(0.65, 0, 0.35, 1) infinite', transformOrigin: '32px 32px' }}
            >
                {/* Verre : deux cônes adossés */}
                <path
                    d="M18 13.5 H46 V17 C46 24 37.5 28.5 35 31 C34.3 31.7 34.3 32.3 35 33 C37.5 35.5 46 40 46 47 V50.5 H18 V47 C18 40 26.5 35.5 29 33 C29.7 32.3 29.7 31.7 29 31 C26.5 28.5 18 24 18 17 Z"
                    stroke="#CBD5E1"
                    strokeWidth="1.6"
                    fill="rgba(241, 245, 249, 0.45)"
                />
                {/* Sable supérieur — se vide vers le col */}
                <g
                    className="sx-sand-anim"
                    style={{ animation: 'sx-sand-top 2.8s linear infinite', transformOrigin: '32px 30.5px' }}
                >
                    <path d="M22.5 20 H41.5 C40 25 35.5 28 32.6 30.4 H31.4 C28.5 28 24 25 22.5 20 Z" fill="#F59E0B" />
                </g>
                {/* Filet de sable au col */}
                <line
                    x1="32" y1="32" x2="32" y2="45.5"
                    stroke="#F59E0B"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeDasharray="2.4 1.6"
                    className="sx-sand-anim"
                    style={{ animation: 'sx-sand-stream 2.8s linear infinite, sx-sand-drip 0.5s linear infinite' }}
                />
                {/* Sable inférieur — tas qui monte */}
                <g
                    className="sx-sand-anim"
                    style={{ animation: 'sx-sand-bottom 2.8s linear infinite', transformOrigin: '32px 47.5px' }}
                >
                    <path d="M32 36.5 C35 41 40.5 43.5 42.5 47.5 H21.5 C23.5 43.5 29 41 32 36.5 Z" fill="#F59E0B" />
                </g>
                {/* Cadre : traverses haut/bas + montants */}
                <rect x="13" y="9" width="38" height="5" rx="2.5" fill="#475569" />
                <rect x="13" y="50" width="38" height="5" rx="2.5" fill="#475569" />
                <rect x="15.2" y="13" width="2.6" height="38" rx="1.3" fill="#64748B" />
                <rect x="46.2" y="13" width="2.6" height="38" rx="1.3" fill="#64748B" />
            </svg>
        </span>
    );
};

export const SandglassLoader = ({ size = 'md' as SandglassSize, label, sublabel, delay = 150, className = '' }: {
    size?: SandglassSize;
    /** Libellé principal sous le sablier (ex. « Chargement de la page… »). */
    label?: string;
    /** Ligne secondaire discrète (ex. nom du module). */
    sublabel?: string;
    /** Délai d'apparition en ms — évite le flash sur les chargements rapides. */
    delay?: number;
    className?: string;
}) => {
    const [visible, setVisible] = useState(delay <= 0);

    useEffect(() => {
        if (delay <= 0) return;
        const t = window.setTimeout(() => setVisible(true), delay);
        return () => window.clearTimeout(t);
    }, [delay]);

    if (!visible) return null;

    return (
        <div
            className={`flex flex-col items-center gap-3 ${className}`}
            style={{ animation: 'sx-fade-in 0.35s ease-out both' }}
        >
            <SandglassIcon size={size} />
            {label && (
                <p className="text-[13px] text-slate-600 tracking-wide" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    {label}
                </p>
            )}
            {sublabel && <p className="text-[11px] text-slate-400 tracking-wide -mt-2">{sublabel}</p>}
        </div>
    );
};

/**
 * PageLoader — attente pleine zone (fallback Suspense, chargement de page).
 *
 * Porte la MARQUE : sans repere visuel, une zone vide le temps du chargement se
 * lit comme une panne. Le bouclier SafeX au-dessus du sablier dit « l'application
 * travaille », pas « l'application a disparu ».
 *
 * `delay` est expose : sur un fallback de ROUTE on veut zero attente avant
 * d'afficher quelque chose (c'est precisement la que l'ecran blanc se voyait),
 * alors qu'un chargement inline supporte un court delai anti-clignotement.
 */
export const PageLoader = ({ label = 'Chargement de la page…', sublabel, minHeight = '60vh', delay = 0 }: {
    label?: string;
    sublabel?: string;
    minHeight?: string;
    delay?: number;
}) => (
    <div className="flex items-center justify-center bg-[#FAF8F3] w-full" style={{ minHeight }}>
        <div className="flex flex-col items-center gap-5" style={{ animation: 'sx-fade-in 0.3s ease-out both' }}>
            <SafeXBrandMark variant="stack" tone="dark" size={38} />
            <SandglassLoader size="lg" label={label} sublabel={sublabel} delay={delay} />
        </div>
    </div>
);

export default SandglassLoader;
