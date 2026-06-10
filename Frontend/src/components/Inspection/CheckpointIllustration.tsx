/**
 * CheckpointIllustration — Visuel contextuel d'un point de contrôle.
 *
 * Chaque carte de la page d'exécution affiche à droite une illustration
 * SVG flat duo-ton (charte slate + teal) représentant la partie inspectée :
 * pneu, klaxon, extincteur, vérin hydraulique, consignation LOTO, etc.
 * La famille visuelle est déduite du libellé du checkpoint (insensible aux
 * accents), avec un visuel générique en repli — aucun asset externe.
 */

const S = {
    s300: '#CBD5E1',
    s400: '#94A3B8',
    s500: '#64748B',
    s600: '#475569',
    s700: '#334155',
    teal: '#0D9488',
    tealL: '#99F6E4',
    amber: '#F59E0B',
    amberL: '#FDE68A',
    rose: '#E11D48',
    roseL: '#FECDD3',
    emerald: '#059669',
    white: '#FFFFFF',
};

type Kind =
    | 'TIRE' | 'HORN' | 'BEACON' | 'LIGHT' | 'SEATBELT' | 'EXTINGUISHER'
    | 'CAMERA' | 'NOTES' | 'MECHANICAL' | 'GAUGE' | 'THERMO' | 'LOCK'
    | 'WINDSHIELD' | 'FIRSTAID' | 'ESTOP' | 'ELECTRIC' | 'CONVEYOR'
    | 'SOUND' | 'SIGNAGE' | 'AREA' | 'CABLE' | 'FILTER' | 'VESSEL'
    | 'TOOLS' | 'FLUID' | 'DEFAULT';

/** Règles ordonnées : la première qui matche l'emporte. */
const RULES: Array<[Kind, string[]]> = [
    ['CAMERA', ['photo']],
    ['TIRE', ['pneu', 'chenille']],
    ['HORN', ['klaxon', 'avertisseur']],
    ['BEACON', ['gyrophare']],
    ['SEATBELT', ['ceinture']],
    ['FIRSTAID', ['trousse', 'oculaire']],
    ['LOCK', ['consignation', 'cadenas', 'loto', 'verrouillage', 'permis', 'etiquette']],
    ['WINDSHIELD', ['vitre', 'essuie', 'pare-brise']],
    ['CONVEYOR', ['bande', 'tambour', 'rouleau', 'tunnel', 'grillage', 'carter']],
    ['SOUND', ['sonore', 'bruit']],
    ['ESTOP', ['arret', 'tirette', 'capteur', 'fin de course']],
    ['ELECTRIC', ['electri', 'terre', 'tension', 'isolation', 'paratonnerre', 'intrusion', 'detecteur']],
    ['EXTINGUISHER', ['extincteur']],
    ['SIGNAGE', ['pictogramme', 'affichage', 'plaque', 'signaletique', 'fds', 'consigne', 'registre', 'atex', 'detonateur', 'explosif', 'stocks']],
    ['THERMO', ['temperature']],
    ['GAUGE', ['pression', 'manometre', 'debit', 'vitesse', 'soupape']],
    ['SOUND', ['decibel']],
    ['FLUID', ['huile', 'refroidissement', 'humidite', 'niveau', 'injection']],
    ['CABLE', ['cable']],
    ['FILTER', ['filtre']],
    ['VESSEL', ['cuve', 'reservoir', 'comprime']],
    ['TOOLS', ['outil', 'arrime']],
    ['MECHANICAL', ['hydraulique', 'verin', 'bras', 'mat ', 'stabilite', 'alignement', 'vibration', 'verticalite', 'godet']],
    ['LIGHT', ['feux', 'eclairage', 'phare', 'lumiere']],
    ['AREA', ['sol', '5s', 'stockage', 'etagere', 'cloture', 'issue', 'degage', 'zone', 'porte']],
    ['NOTES', ['observation', 'note', 'constat', 'commentaire', 'correctives', 'anomalie', 'procedure', 'conducteur', 'auditeur']],
];

function classify(label?: string): Kind {
    if (!label) return 'DEFAULT';
    const n = ` ${label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')} `;
    for (const [kind, keys] of RULES) {
        if (keys.some((k) => n.includes(k))) return kind;
    }
    return 'DEFAULT';
}

/* ── Illustrations (viewBox 0 0 96 96, flat duo-ton) ───────────────────── */

const ART: Record<Kind, React.ReactNode> = {
    TIRE: (
        <g>
            <ellipse cx="48" cy="78" rx="30" ry="5" fill={S.s300} opacity="0.5" />
            <circle cx="48" cy="46" r="30" fill={S.s700} />
            {Array.from({ length: 12 }).map((_, i) => {
                const a = (i * Math.PI) / 6;
                return (
                    <rect key={i} x="-2.4" y="-31" width="4.8" height="8" rx="1.6" fill={S.s600}
                        transform={`translate(48 46) rotate(${(a * 180) / Math.PI})`} />
                );
            })}
            <circle cx="48" cy="46" r="19" fill={S.s400} />
            <circle cx="48" cy="46" r="12" fill={S.s300} />
            <circle cx="48" cy="46" r="4.5" fill={S.s600} />
            {Array.from({ length: 5 }).map((_, i) => {
                const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                return <circle key={i} cx={48 + 8 * Math.cos(a)} cy={46 + 8 * Math.sin(a)} r="1.8" fill={S.s500} />;
            })}
            <path d="M30 32 a24 24 0 0 1 14 -9" stroke={S.white} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
        </g>
    ),
    HORN: (
        <g>
            <path d="M22 40 L46 30 L46 62 L22 52 Z" fill={S.teal} />
            <rect x="14" y="40" width="10" height="12" rx="3" fill={S.s600} />
            <ellipse cx="46" cy="46" rx="5" ry="16" fill={S.tealL} />
            <path d="M58 36 a14 14 0 0 1 0 20" stroke={S.amber} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M66 30 a22 22 0 0 1 0 32" stroke={S.amber} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M74 24 a30 30 0 0 1 0 44" stroke={S.amber} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />
        </g>
    ),
    BEACON: (
        <g>
            <rect x="30" y="62" width="36" height="10" rx="3" fill={S.s600} />
            <path d="M34 62 a14 18 0 0 1 28 0 Z" fill={S.amber} />
            <path d="M40 60 a8 12 0 0 1 16 0" fill={S.amberL} opacity="0.8" />
            <line x1="48" y1="30" x2="48" y2="20" stroke={S.amber} strokeWidth="4" strokeLinecap="round" />
            <line x1="30" y1="38" x2="22" y2="32" stroke={S.amber} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            <line x1="66" y1="38" x2="74" y2="32" stroke={S.amber} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        </g>
    ),
    LIGHT: (
        <g>
            <circle cx="34" cy="48" r="16" fill={S.s600} />
            <circle cx="34" cy="48" r="11" fill={S.tealL} />
            <circle cx="31" cy="45" r="4" fill={S.white} opacity="0.8" />
            <path d="M52 38 L84 30 L84 36 L54 42 Z" fill={S.amberL} opacity="0.9" />
            <path d="M54 46 L88 46 L88 52 L54 52 Z" fill={S.amberL} opacity="0.7" />
            <path d="M52 56 L84 64 L84 70 L54 60 Z" fill={S.amberL} opacity="0.5" />
        </g>
    ),
    SEATBELT: (
        <g>
            <path d="M30 22 h18 a6 6 0 0 1 6 6 v18 a6 6 0 0 1 -6 6 h-18 Z" fill={S.s400} />
            <path d="M30 56 h26 a6 6 0 0 1 6 6 v10 a4 4 0 0 1 -4 4 H30 Z" fill={S.s500} />
            <path d="M26 22 L66 70 L56 74 L20 30 Z" fill={S.teal} />
            <rect x="50" y="56" width="14" height="10" rx="2" fill={S.s700} />
            <circle cx="57" cy="61" r="2.2" fill={S.amber} />
        </g>
    ),
    EXTINGUISHER: (
        <g>
            <rect x="36" y="34" width="22" height="42" rx="8" fill={S.rose} />
            <rect x="36" y="44" width="22" height="8" fill={S.roseL} opacity="0.6" />
            <rect x="43" y="24" width="8" height="10" fill={S.s600} />
            <path d="M40 22 h14 v5 h-14 Z" fill={S.s700} />
            <path d="M40 24 q-12 2 -14 12" stroke={S.s600} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M24 36 l-4 8 6 0 Z" fill={S.s600} />
            <circle cx="47" cy="40" r="3.4" fill={S.white} />
            <path d="M47 40 l2.5 -2" stroke={S.rose} strokeWidth="1.4" strokeLinecap="round" />
        </g>
    ),
    CAMERA: (
        <g>
            <rect x="18" y="34" width="60" height="38" rx="7" fill={S.s600} />
            <path d="M38 34 l4 -8 h12 l4 8 Z" fill={S.s700} />
            <circle cx="48" cy="53" r="13" fill={S.s300} />
            <circle cx="48" cy="53" r="9" fill={S.teal} />
            <circle cx="44.5" cy="49.5" r="3" fill={S.white} opacity="0.7" />
            <rect x="64" y="40" width="8" height="5" rx="2" fill={S.amber} />
        </g>
    ),
    NOTES: (
        <g>
            <rect x="26" y="22" width="40" height="52" rx="5" fill={S.s300} />
            <rect x="30" y="26" width="32" height="44" rx="3" fill={S.white} />
            <rect x="38" y="18" width="16" height="9" rx="3" fill={S.s600} />
            <line x1="35" y1="38" x2="57" y2="38" stroke={S.s400} strokeWidth="3" strokeLinecap="round" />
            <line x1="35" y1="46" x2="57" y2="46" stroke={S.s400} strokeWidth="3" strokeLinecap="round" />
            <line x1="35" y1="54" x2="49" y2="54" stroke={S.s400} strokeWidth="3" strokeLinecap="round" />
            <path d="M58 70 L74 50 L80 54 L64 74 L57 76 Z" fill={S.teal} />
            <path d="M74 50 L80 54 L77 58 L71 54 Z" fill={S.tealL} />
        </g>
    ),
    MECHANICAL: (
        <g>
            <rect x="18" y="40" width="34" height="18" rx="4" fill={S.s600} />
            <rect x="22" y="44" width="26" height="10" rx="2" fill={S.s400} />
            <rect x="52" y="45" width="22" height="8" rx="2" fill={S.s500} />
            <rect x="72" y="40" width="8" height="18" rx="2" fill={S.teal} />
            <circle cx="26" cy="49" r="2.2" fill={S.s700} />
            <circle cx="44" cy="49" r="2.2" fill={S.s700} />
            <path d="M28 32 l8 8 M36 32 l-8 8" stroke={S.amber} strokeWidth="3" strokeLinecap="round" opacity="0" />
            <path d="M22 64 h52" stroke={S.s300} strokeWidth="4" strokeLinecap="round" />
        </g>
    ),
    GAUGE: (
        <g>
            <path d="M20 62 a28 28 0 0 1 56 0 Z" fill={S.s300} />
            <path d="M26 62 a22 22 0 0 1 44 0 Z" fill={S.white} />
            {[-60, -30, 0, 30, 60].map((deg) => (
                <line key={deg} x1="48" y1="42" x2="48" y2="46"
                    stroke={S.s500} strokeWidth="2.4" strokeLinecap="round"
                    transform={`rotate(${deg} 48 62)`} />
            ))}
            <path d="M68 46 a22 22 0 0 1 2 16 l-6 0 a16 16 0 0 0 -1 -12 Z" fill={S.roseL} />
            <line x1="48" y1="62" x2="62" y2="48" stroke={S.teal} strokeWidth="4" strokeLinecap="round" />
            <circle cx="48" cy="62" r="5" fill={S.s700} />
            <rect x="30" y="66" width="36" height="8" rx="3" fill={S.s600} />
        </g>
    ),
    THERMO: (
        <g>
            <rect x="42" y="18" width="12" height="42" rx="6" fill={S.s300} />
            <rect x="45.5" y="30" width="5" height="32" rx="2.5" fill={S.rose} />
            <circle cx="48" cy="66" r="11" fill={S.rose} />
            <circle cx="48" cy="66" r="6" fill={S.roseL} opacity="0.5" />
            {[24, 32, 40, 48].map((y) => (
                <line key={y} x1="56" y1={y} x2="62" y2={y} stroke={S.s500} strokeWidth="2.4" strokeLinecap="round" />
            ))}
            <path d="M70 28 a16 16 0 0 1 0 0" fill="none" />
        </g>
    ),
    LOCK: (
        <g>
            <path d="M36 42 v-8 a12 12 0 0 1 24 0 v8" stroke={S.s500} strokeWidth="7" fill="none" strokeLinecap="round" />
            <rect x="28" y="42" width="40" height="32" rx="7" fill={S.teal} />
            <circle cx="48" cy="55" r="5" fill={S.white} />
            <rect x="45.6" y="57" width="4.8" height="9" rx="2.4" fill={S.white} />
            <rect x="62" y="60" width="18" height="12" rx="2" fill={S.amberL} transform="rotate(18 71 66)" />
            <circle cx="66" cy="63" r="1.6" fill={S.s600} transform="rotate(18 71 66)" />
        </g>
    ),
    WINDSHIELD: (
        <g>
            <path d="M22 30 h52 l8 34 H14 Z" fill={S.tealL} opacity="0.65" />
            <path d="M22 30 h52 l8 34 H14 Z" fill="none" stroke={S.s500} strokeWidth="3" />
            <path d="M34 64 a34 34 0 0 1 18 -28" stroke={S.s600} strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <line x1="34" y1="64" x2="58" y2="48" stroke={S.s700} strokeWidth="4" strokeLinecap="round" />
            <path d="M64 36 l3 -3 M70 44 l4 -2 M58 32 l1 -4" stroke={S.teal} strokeWidth="2.6" strokeLinecap="round" />
            <rect x="10" y="64" width="76" height="6" rx="3" fill={S.s400} />
        </g>
    ),
    FIRSTAID: (
        <g>
            <rect x="20" y="32" width="56" height="40" rx="7" fill={S.emerald} />
            <rect x="40" y="24" width="16" height="10" rx="4" fill={S.s600} />
            <rect x="42" y="44" width="12" height="20" rx="2" fill={S.white} />
            <rect x="38" y="48" width="20" height="12" rx="2" fill={S.white} />
            <rect x="20" y="46" width="56" height="3" fill={S.white} opacity="0.25" />
        </g>
    ),
    ESTOP: (
        <g>
            <rect x="26" y="40" width="44" height="34" rx="6" fill={S.amber} />
            <rect x="26" y="40" width="44" height="34" rx="6" fill="none" stroke={S.amberL} strokeWidth="2" strokeDasharray="6 4" />
            <ellipse cx="48" cy="42" rx="17" ry="7" fill={S.s700} opacity="0.25" />
            <rect x="38" y="28" width="20" height="14" fill={S.rose} />
            <ellipse cx="48" cy="28" rx="10" ry="6.5" fill={S.rose} />
            <ellipse cx="48" cy="28" rx="10" ry="6.5" fill={S.white} opacity="0.25" />
            <ellipse cx="48" cy="42" rx="10" ry="5" fill={S.roseL} opacity="0.5" />
        </g>
    ),
    ELECTRIC: (
        <g>
            <circle cx="48" cy="48" r="28" fill={S.amberL} opacity="0.5" />
            <path d="M52 22 L36 52 h10 L42 74 L62 42 h-11 Z" fill={S.amber} />
            <path d="M52 22 L47 40 l-5 2 Z" fill={S.white} opacity="0.4" />
            <path d="M22 64 h10 M64 26 h10" stroke={S.s400} strokeWidth="3" strokeLinecap="round" opacity="0" />
        </g>
    ),
    CONVEYOR: (
        <g>
            <rect x="14" y="46" width="68" height="10" rx="5" fill={S.s600} />
            <circle cx="26" cy="51" r="9" fill={S.s400} />
            <circle cx="26" cy="51" r="4" fill={S.s700} />
            <circle cx="70" cy="51" r="9" fill={S.s400} />
            <circle cx="70" cy="51" r="4" fill={S.s700} />
            <rect x="30" y="34" width="14" height="9" rx="2" fill={S.teal} />
            <rect x="48" y="32" width="12" height="11" rx="2" fill={S.tealL} />
            <path d="M30 68 h28 m0 0 l-6 -5 m6 5 l-6 5" stroke={S.amber} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
    ),
    SOUND: (
        <g>
            <path d="M24 40 h10 l14 -12 v40 l-14 -12 h-10 Z" fill={S.s600} />
            <path d="M56 38 a12 12 0 0 1 0 20" stroke={S.teal} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M63 32 a20 20 0 0 1 0 32" stroke={S.teal} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.65" />
            <path d="M70 26 a28 28 0 0 1 0 44" stroke={S.teal} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.35" />
        </g>
    ),
    SIGNAGE: (
        <g>
            <rect x="44" y="52" width="6" height="26" rx="2" fill={S.s500} />
            <path d="M47 16 L74 60 H20 Z" fill={S.amber} />
            <path d="M47 24 L67 56 H27 Z" fill={S.amberL} />
            <rect x="44.5" y="32" width="5" height="13" rx="2.5" fill={S.s700} />
            <circle cx="47" cy="50" r="3" fill={S.s700} />
        </g>
    ),
    AREA: (
        <g>
            <path d="M16 70 L48 56 L80 70 L48 84 Z" fill={S.s300} />
            <path d="M16 70 L48 56 L80 70" fill="none" stroke={S.s400} strokeWidth="2" />
            <rect x="24" y="30" width="20" height="32" rx="2" fill={S.s500} />
            <rect x="27" y="34" width="14" height="6" fill={S.s300} />
            <rect x="27" y="44" width="14" height="6" fill={S.s300} />
            <rect x="27" y="54" width="14" height="5" fill={S.s300} />
            <circle cx="62" cy="46" r="10" fill={S.emerald} />
            <path d="M57.5 46 l3.4 3.6 6 -7" stroke={S.white} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
    ),
    CABLE: (
        <g>
            <rect x="42" y="14" width="12" height="10" rx="3" fill={S.s600} />
            <path d="M48 24 v10" stroke={S.s500} strokeWidth="5" strokeLinecap="round" />
            <path d="M48 34 a12 12 0 1 0 12 12" stroke={S.teal} strokeWidth="7" fill="none" strokeLinecap="round" />
            <circle cx="48" cy="68" r="14" fill="none" stroke={S.s400} strokeWidth="6" />
            <circle cx="48" cy="68" r="7" fill="none" stroke={S.s300} strokeWidth="4" />
        </g>
    ),
    FILTER: (
        <g>
            <ellipse cx="48" cy="28" rx="22" ry="8" fill={S.s500} />
            <rect x="26" y="28" width="44" height="38" fill={S.s300} />
            {[32, 40, 48, 56, 64].map((x) => (
                <line key={x} x1={x} y1="30" x2={x} y2="64" stroke={S.s400} strokeWidth="3" />
            ))}
            <ellipse cx="48" cy="66" rx="22" ry="8" fill={S.s400} />
            <ellipse cx="48" cy="28" rx="13" ry="4.5" fill={S.teal} />
        </g>
    ),
    VESSEL: (
        <g>
            <rect x="30" y="28" width="36" height="46" rx="12" fill={S.s400} />
            <rect x="30" y="40" width="36" height="22" fill={S.s300} />
            <rect x="42" y="18" width="12" height="10" fill={S.s600} />
            <circle cx="48" cy="16" r="5" fill={S.teal} />
            <path d="M48 16 h10" stroke={S.teal} strokeWidth="3.4" strokeLinecap="round" />
            <circle cx="48" cy="51" r="7" fill={S.white} />
            <line x1="48" y1="51" x2="52" y2="47" stroke={S.rose} strokeWidth="2.4" strokeLinecap="round" />
        </g>
    ),
    TOOLS: (
        <g>
            <path d="M30 22 a11 11 0 0 0 -8 13 l-2 2 8 8 2 -2 a11 11 0 0 0 13 -8 l28 28 -7 7 -28 -28 a11 11 0 0 0 -6 -20 Z"
                fill={S.s500} transform="rotate(0 48 48)" />
            <rect x="56" y="20" width="9" height="34" rx="3" fill={S.teal} transform="rotate(45 60 37)" />
            <rect x="70" y="14" width="11" height="12" rx="3" fill={S.s700} transform="rotate(45 75 20)" />
        </g>
    ),
    FLUID: (
        <g>
            <path d="M48 18 C58 34 68 44 68 56 a20 20 0 1 1 -40 0 C28 44 38 34 48 18 Z" fill={S.teal} />
            <path d="M40 58 a8 10 0 0 0 6 10" stroke={S.tealL} strokeWidth="4" fill="none" strokeLinecap="round" />
            <rect x="64" y="58" width="18" height="16" rx="3" fill={S.s500} opacity="0" />
            <path d="M70 30 l6 -6 M76 38 l8 -3" stroke={S.tealL} strokeWidth="0" />
        </g>
    ),
    DEFAULT: (
        <g>
            <rect x="22" y="20" width="38" height="50" rx="5" fill={S.s300} />
            <rect x="26" y="24" width="30" height="42" rx="3" fill={S.white} />
            <line x1="31" y1="34" x2="51" y2="34" stroke={S.s400} strokeWidth="3" strokeLinecap="round" />
            <line x1="31" y1="42" x2="51" y2="42" stroke={S.s400} strokeWidth="3" strokeLinecap="round" />
            <line x1="31" y1="50" x2="45" y2="50" stroke={S.s400} strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="56" r="13" fill="none" stroke={S.teal} strokeWidth="5" />
            <line x1="69" y1="65" x2="78" y2="74" stroke={S.teal} strokeWidth="6" strokeLinecap="round" />
        </g>
    ),
};

export default function CheckpointIllustration({
    label,
    className = '',
}: {
    label?: string;
    className?: string;
}) {
    const kind = classify(label);
    return (
        <svg
            viewBox="0 0 96 96"
            className={className}
            aria-hidden="true"
            role="presentation"
        >
            {ART[kind]}
        </svg>
    );
}
